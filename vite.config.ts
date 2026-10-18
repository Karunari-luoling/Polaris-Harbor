import path from 'node:path';
import fs from 'node:fs';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { load as loadYaml } from 'js-yaml';

type AnyRecord = Record<string, any>;

const CONFIG_YML_PATH = path.resolve(__dirname, 'public/config.yml');

// Routed pages, used for canonical URLs and sitemap.xml.
const SITE_ROUTES = ['/', '/projects', '/websites', '/articles'];

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
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

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// Safe to embed inside an inline <script>: closes the only escaping hole that
// matters here (a value containing "</script>"), without touching JS semantics.
function toInlineScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

// Strips any trailing slash so callers can append a route path predictably.
function normalizeCanonical(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

// Accepts a full URL or a bare host and returns its origin plus path, or null when
// the value is relative or unparseable - those need no connection warm-up.
function parseExternalUrl(value: unknown): { origin: string; pathname: string } | null {
  const raw = asNonEmptyString(value);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { origin: url.origin, pathname: url.pathname };
  } catch {
    return null;
  }
}

// Above-the-fold assets declared in config.yml, so swapping the image host there
// moves the preconnect hints with it instead of leaving a hostname baked into HTML.
function collectAssetOrigins(config: AnyRecord, canonical: string | null): string[] {
  const site = (config.site ?? {}) as AnyRecord;
  const candidates: unknown[] = [
    (config.profile as AnyRecord | undefined)?.avatar,
    site.logoImage,
    site.favicon,
    (config.seo as AnyRecord | undefined)?.ogImage,
    ...(Array.isArray(site.extraPreconnect) ? site.extraPreconnect : []),
  ];

  const origins = new Set<string>();
  for (const candidate of candidates) {
    const parsed = parseExternalUrl(candidate);
    if (!parsed || parsed.origin === canonical) continue;
    origins.add(parsed.origin);
  }
  return [...origins];
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

function buildRobotsTxt(canonical: string | null): string {
  const lines = ['User-agent: *', 'Allow: /', ''];
  if (canonical) lines.push(`Sitemap: ${canonical}/sitemap.xml`, '');
  return lines.join('\n');
}

function buildSitemapXml(canonical: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = SITE_ROUTES.map(
    route => `  <url>\n    <loc>${escapeXml(`${canonical}${route === '/' ? '/' : route}`)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Person + WebSite 结构化数据。爬虫不执行 JS 也能读到，所以和 SEO 头一样放在构建期。
function buildJsonLd(config: AnyRecord, canonical: string): AnyRecord {
  const seo = (config.seo ?? {}) as AnyRecord;
  const profile = (config.profile ?? {}) as AnyRecord;
  const site = (config.site ?? {}) as AnyRecord;

  const name = asNonEmptyString(seo.author) ?? asNonEmptyString(profile.name) ?? '';
  const description =
    asNonEmptyString(seo.description) ?? asNonEmptyString(profile.tagline) ?? asNonEmptyString(profile.description) ?? '';
  const social = Array.isArray(profile.social) ? profile.social : [];
  const sameAs = social
    .map(item => asNonEmptyString((item as AnyRecord | undefined)?.url))
    .filter((url): url is string => !!url && /^https?:\/\//.test(url));

  const graph: AnyRecord[] = [
    {
      '@type': 'WebSite',
      '@id': `${canonical}/#website`,
      url: `${canonical}/`,
      name: asNonEmptyString(site.brandName) ?? name,
      creator: { '@id': `${canonical}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${canonical}/#person`,
      name,
      url: `${canonical}/`,
    },
  ];

  if (description) graph[1].description = description;
  if (asNonEmptyString(profile.avatar)) graph[1].image = profile.avatar;
  if (sameAs.length) graph[1].sameAs = sameAs;

  return { '@context': 'https://schema.org', '@graph': graph };
}

// 订阅发现链接的类型要跟 feed 的真实格式对上，猜错时阅读器会拒收
function feedMimeType(url: string): string {
  return /atom/i.test(url) ? 'application/atom+xml' : 'application/rss+xml';
}

function injectHeadFromConfig(): Plugin {
  let resolved: ResolvedConfig | null = null;
  let canonical: string | null = null;

  return {
    name: 'inject-head-from-config-yml',
    enforce: 'pre',
    configResolved(config) {
      resolved = config;
    },
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
      const rssUrl = asNonEmptyString(site.rssUrl) ?? '';
      canonical = normalizeCanonical(asNonEmptyString(seo.canonicalUrl));

      // Remove existing tags so we never end up with duplicates.
      let out = html;
      out = removeHeadTag(out, /<title>[\s\S]*?<\/title>\s*/gi);
      out = removeHeadTag(out, /<link\b[^>]*\brel\s*=\s*["']icon["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']keywords["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bname\s*=\s*["']author["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:title["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:description["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:type["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:url["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:site_name["'][^>]*>\s*/gi);
      out = removeHeadTag(out, /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*>\s*/gi);

      const headLines: string[] = [
        ...collectAssetOrigins(config, canonical).map(origin => `<link rel="preconnect" href="${escapeHtmlAttr(origin)}" />`),
        THEME_BOOTSTRAP(toInlineScriptJson(config.theme ?? null)),
      ];
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
      // Crawlers that never run JS can only see what is baked in here.
      if (canonical) {
        headLines.push(`<link rel="canonical" href="${escapeHtmlAttr(`${canonical}/`)}" />`);
        headLines.push(`<meta property="og:url" content="${escapeHtmlAttr(`${canonical}/`)}" />`);
        headLines.push(`<meta name="twitter:card" content="summary_large_image" />`);
        // toInlineScriptJson 会把 < 转义掉，正文里出现 </script> 也提前闭合不了
        headLines.push(
          `<script type="application/ld+json">${toInlineScriptJson(buildJsonLd(config, canonical))}</script>`
        );
      }
      if (rssUrl) {
        headLines.push(
          `<link rel="alternate" type="${feedMimeType(rssUrl)}" href="${escapeHtmlAttr(rssUrl)}" title="${escapeHtmlAttr(title)}" />`
        );
      }

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
    closeBundle() {
      const cfg = resolved;
      if (!cfg || cfg.command !== 'build') return;

      const outDir = path.resolve(cfg.root, cfg.build.outDir);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'robots.txt'), buildRobotsTxt(canonical), 'utf8');

      if (canonical) {
        fs.writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemapXml(canonical), 'utf8');
      } else {
        this.warn('seo.canonicalUrl is empty - sitemap.xml was not generated.');
      }
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

export default defineConfig(() => {
  // The dev proxy follows site.rssUrl, so the feed host is declared in exactly one place.
  const rss = parseExternalUrl((loadAppConfig()?.site as AnyRecord | undefined)?.rssUrl);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: rss ? { [rss.pathname]: { target: rss.origin, changeOrigin: true } } : {},
    },
    plugins: [injectHeadFromConfig(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
