import { AppConfig } from '../types';

// 根据配置动态注入 SEO 元信息，优先使用配置项，其次回退到基础资料
export const applySeoConfig = (config: AppConfig) => {
  const { seo, profile, site } = config;
  
  const title = seo?.title || `${profile.name} - ${profile.title}`;
  const description = seo?.description || profile.tagline || profile.description;
  const author = seo?.author || profile.name;
  const keywords = seo?.keywords || `${profile.title}, ${profile.name}, Portfolio, Web Developer`;
  const image = seo?.ogImage || profile.avatar;
  const url = window.location.href;

  document.title = title;

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

  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'author', author);

  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:site_name', site.brandName);
  setMetaTag('property', 'og:image', image);
};
