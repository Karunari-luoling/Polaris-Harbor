export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  link: string;
  // Optional repository/source URL (GitHub/GitLab/Gitee/Gitea/GitCode/etc.)
  repo?: string;
}

export interface Website {
  id: string;
  title: string;
  url: string;
  status: 'Live' | 'Maintenance' | 'Beta';
  description: string;
  thumbnail: string;
}

export interface Article {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  categories: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterLink {
  text: string;
  url?: string;
}

export interface DataSourceConfig {
  type: 'local' | 'remote';
  format: 'yml' | 'json';
  path: string;
}

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export type ThemeMode = 'auto' | 'manual' | 'custom';
export interface ThemeConfig {
  mode: ThemeMode;
  default?: 'light' | 'dark';
  customSchedule?: {
    start: string;
    end: string;
  };
}

export interface CopyConfig {
  hero: {
    greeting: string;
  };
  nav: {
    home: string;
    projects: string;
    websites: string;
    articles: string;
  };
  projects: {
    title: string;
    description: string;
    viewAll: string;
    action: string;
  };
  websites: {
    title: string;
    description: string;
    viewAll: string;
    action: string;
  };
  articles: {
    title: string;
    description: string;
    readMore: string;
    action: string;
    loading: string;
    empty: string;
    noFeed: string;
    uncategorized: string;
    dateLocale: string;
  };
  footer: {
    rights: string;
  };
}

export interface AppConfig {
  seo?: SeoConfig;
  theme?: ThemeConfig;
  copy?: Partial<CopyConfig>;
  profile: {
    name: string;
    title: string;
    tagline?: string;
    description: string;
    avatar: string;
    social: SocialLink[];
  };
  site: {
    logoText?: string;
    logoImage?: string;
    brandName: string;
    favicon?: string;
    rssUrl?: string;
    iconFontUrl?: string;
    extraPreconnect?: string[];
  };
  dataSources: {
    projects: DataSourceConfig;
    websites: DataSourceConfig;
  };
  display?: {
    projectCount?: number;
    websiteCount?: number;
    articleCount?: number;
  };
  footer: {
    owner: string;
    icp?: string;
    links: FooterLink[];
  };
}
