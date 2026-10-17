import path from 'node:path';
import fs from 'node:fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { load as loadYaml } from 'js-yaml';

type AnyRecord = Record<string, any>;

const CONFIG_YML_PATH = path.resolve(__dirname, 'public/config.yml');

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.trim().length ? trimmed : undefined;
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtmlAttr(value: string): string {
  // Escape for attribute contexts like content="..." and href="...".
  return escapeHtmlText(value).replaceAll('"', '&quot;');
}

// Safe to embed inside an inline <script>: closes the only escaping hole that
// matters here (a value containing "</script>"), without touching JS semantics.
function toInlineScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

function loadAppConfig(): AnyRecord | null {
  try {
    const raw = fs.readFileSync(CONFIG_YML_PATH, 'utf8');
    const parsed = loadYaml(raw) as AnyRecord | undefined;
    return parsed ?? null;
  } catch {
    return null;
  }
}

function removeHeadTag(html: string, pattern: RegExp): string {
  return html.replace(pattern, '');
}

function injectAfterFirstMatch(html: string, matcher: RegExp, injection: string): string {
  const match = matcher.exec(html);
  if (!match || match.index === undefined) return html;

  const insertAt = match.index + match[0].length;
  return html.slice(0, insertAt) + injection + html.slice(insertAt);
}

// Mirrors ThemeContext's resolution order so the first paint already carries the
// right class; the async config fetch must never be what turns dark mode on.
const THEME_BOOTSTRAP = (themeConfig: string) => `<script>(function(){
var C=${themeConfig};
function inRange(start,end){
  var now=new Date(),cur=now.getHours()*60+now.getMinutes();
  var a=String(start).split(':'),b=String(end).split(':');
  var s=(parseInt(a[0],10)||0)*60+(parseInt(a[1],10)||0);
  var e=(parseInt(b[0],10)||0)*60+(parseInt(b[1],10)||0);
  return s<e?(cur>=s&&cur<e):(cur>=s||cur<e);
}
function sysDark(){return !!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);}
function pick(v){return v==='dark'||v==='light'?v:null;}
function resolve(){
  try{var o=pick(localStorage.getItem('theme_override'));if(o)return o;}catch(e){}
  if(C&&C.mode==='manual')return C.default==='dark'?'dark':'light';
  if(C&&C.mode==='custom'&&C.customSchedule&&C.customSchedule.start&&C.customSchedule.end)
    return inRange(C.customSchedule.start,C.customSchedule.end)?'dark':'light';
  if(C&&C.mode==='auto')return sysDark()?'dark':'light';
  try{var l=pick(localStorage.getItem('theme'));if(l)return l;}catch(e){}
  return sysDark()?'dark':'light';
}
if(resolve()==='dark')document.documentElement.classList.add('dark');
})();</script>`;

function injectHeadFromConfig(): Plugin {
  return {
    name: 'inject-head-from-config-yml',
    enforce: 'pre',
    transformIndexHtml(html) {
      const config = loadAppConfig();
      if (!config) return html;

      const seo = (config.seo ?? {}) as AnyRecord;
      const profile = (config.profile ?? {}) as AnyRecord;
      const site = (config.site ?? {}) as AnyRecord;

      const fallbackTitle = [asNonEmptyString(profile.name), asNonEmptyString(profile.title)]
        .filter(Boolean)
        .join(' - ');

      const title = asNonEmptyString(seo.title) ?? fallbackTitle ?? 'Personal Homepage';
      const description =
        asNonEmptyString(seo.description) ?? asNonEmptyString(profile.tagline) ?? asNonEmptyString(profile.description) ?? '';
      const keywords = asNonEmptyString(seo.keywords) ?? '';
      const author = asNonEmptyString(seo.author) ?? asNonEmptyString(profile.name) ?? '';
      const brandName = asNonEmptyString(site.brandName) ?? '';
      const favicon = asNonEmptyString(site.favicon) ?? '';
      const ogImage = asNonEmptyString(seo.ogImage) ?? asNonEmptyString(profile.avatar) ?? '';

      // Remove existing tags so we never end up with duplicates.
      let out = html;
      out = removeHeadTag(out, /<title>[\s\S]*?<\/title>\s*/gi);
      out = removeHeadTag(out, /<link\b[^>]*\brel\s*=\s*["']icon["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']keywords["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']author["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:title["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:description["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:type["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:site_name["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*>\s*/gi);

      const headLines: string[] = [THEME_BOOTSTRAP(toInlineScriptJson(config.theme ?? null))];
      if (favicon) headLines.push(`<link rel="icon" href="${escapeHtmlAttr(favicon)}" />`);
      headLines.push(`<title>${escapeHtmlText(title)}</title>`);
      if (description) headLines.push(`<meta name="description" content="${escapeHtmlAttr(description)}" />`);
      if (keywords) headLines.push(`<meta name="keywords" content="${escapeHtmlAttr(keywords)}" />`);
      if (author) headLines.push(`<meta name="author" content="${escapeHtmlAttr(author)}" />`);
      headLines.push(`<meta property="og:title" content="${escapeHtmlAttr(title)}" />`);
      if (description) headLines.push(`<meta property="og:description" content="${escapeHtmlAttr(description)}" />`);
      headLines.push(`<meta property="og:type" content="website" />`);
      if (brandName) headLines.push(`<meta property="og:site_name" content="${escapeHtmlAttr(brandName)}" />`);
      if (ogImage) headLines.push(`<meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />`);

      const injection = `\n    ${headLines.join('\n    ')}\n`;

      // Prefer inserting right after the viewport meta so the theme bootstrap runs
      // before any stylesheet or body content is parsed.
      const viewportMeta = /<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>\s*/i;
      if (viewportMeta.test(out)) {
        return injectAfterFirstMatch(out, viewportMeta, injection);
      }

      const charsetMeta = /<meta\b[^>]*\bcharset\s*=\s*["'][^"']+["'][^>]*>\s*/i;
      if (charsetMeta.test(out)) {
        return injectAfterFirstMatch(out, charsetMeta, injection);
      }

      // Fallback: inject just before </head>.
      return out.replace(/<\/head>/i, `${injection}</head>`);
    },
    configureServer(server) {
      // Ensure edits to config.yml cause the HTML (title/meta/theme) to update immediately.
      server.watcher.add(CONFIG_YML_PATH);
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === CONFIG_YML_PATH) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Local-only escape hatch for the cross-origin RSS fetch; production must
        // serve the feed same-origin or send Access-Control-Allow-Origin instead.
        '/feed.xml': { target: env.RSS_ORIGIN || 'https://blog.byer.ink', changeOrigin: true },
      },
    },
    plugins: [injectHeadFromConfig(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
