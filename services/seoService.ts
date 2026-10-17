import { AppConfig } from '../types';

const setMetaTag = (attribute: string, key: string, content: string) => {
  if (!content) return;

  let meta = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
};

// 构建期只能把 canonical 烧成首页地址，路由切换后必须按真实 pathname 纠正，
// 否则每个子页面都会声明首页为规范地址，反而有害。
export const applyCanonicalUrl = (config: AppConfig) => {
  const base = (config.seo?.canonicalUrl || '').replace(/\/+$/, '');
  if (!base) return;

  const url = `${base}${window.location.pathname}`;
  setMetaTag('property', 'og:url', url);

  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
};

// 根据配置动态注入 SEO 元信息，优先使用配置项，其次回退到基础资料
export const applySeoConfig = (config: AppConfig) => {
  const { seo, profile, site } = config;

  const title = seo?.title || `${profile.name} - ${profile.title}`;
  const description = seo?.description || profile.tagline || profile.description;
  const author = seo?.author || profile.name;
  const keywords = seo?.keywords || `${profile.title}, ${profile.name}, Portfolio, Web Developer`;
  const image = seo?.ogImage || profile.avatar;

  document.title = title;

  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'author', author);

  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', site.brandName);
  setMetaTag('property', 'og:image', image);

  applyCanonicalUrl(config);
};
