import React, { createContext, useContext } from 'react';
import { CopyConfig } from '../types';

// 内置文案就是这些字符串原先硬编码在组件里的值，config.yml 的 copy 段只需覆盖想改的项。
export const DEFAULT_COPY: CopyConfig = {
  hero: {
    greeting: "Hello, I'm",
  },
  nav: {
    home: '主页',
    projects: '项目',
    websites: '网站',
    articles: '文章',
  },
  projects: {
    title: '我的项目',
    description: '这里放了一些最近我在捣鼓的项目，都非常的有趣，欢迎常来逛逛！',
    viewAll: 'View all projects',
    action: 'View Project',
  },
  websites: {
    title: '我的网站',
    description: '这些是我部署的网站，各种功能应有尽有，欢迎来试试！总有一个能帮到你！',
    viewAll: 'View all websites',
    action: 'Visit Site',
  },
  articles: {
    title: '最新文章',
    description: '除了敲代码，我还喜欢写关于生活和技术的文章。这里有我最近的一些文章，欢迎阅读！',
    readMore: 'Read more articles',
    action: 'Read',
    loading: 'Loading articles...',
    empty: 'No articles found.',
    noFeed: 'No RSS feed configured.',
    uncategorized: 'Uncategorized',
    dateLocale: 'en-US',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  filters: {
    search: '搜索',
    all: '全部',
    clear: '清空筛选',
    noResults: '没有匹配的内容，换个条件试试。',
    showing: '显示 {n} / 共 {total}',
    prev: '上一页',
    next: '下一页',
    pageLabel: '第 {page} / {pages} 页',
    more: '更多 ({n})',
    less: '收起',
  },
  reader: {
    loading: '正文加载中…',
    original: '阅读原文',
    close: '关闭',
    notFound: '这篇文章已经找不到了。',
  },
  states: {
    notFoundTitle: '这个地址没有对应的页面',
    notFoundDescription: '链接可能写错了，或者这一页已经搬走。',
    backHome: '回到主页',
    errorTitle: '信号中断',
    errorDescription: '这一页没能正常展开，重新加载通常就能恢复。',
    reload: '重新加载',
  },
};

// copy 只有两层，逐段浅合并即可让未写的字段继续继承内置值；未知段直接忽略，
// 避免写错 key 时把垃圾字段混进渲染。
type CopySection = Record<string, string>;

export const resolveCopy = (override?: Partial<CopyConfig>): CopyConfig => {
  if (!override) return DEFAULT_COPY;

  const base = DEFAULT_COPY as unknown as Record<string, CopySection>;
  const source = override as unknown as Record<string, CopySection | undefined>;
  const merged: Record<string, CopySection> = {};

  for (const section of Object.keys(base)) {
    merged[section] = { ...base[section], ...(source[section] ?? {}) };
  }
  return merged as unknown as CopyConfig;
};

const CopyContext = createContext<CopyConfig>(DEFAULT_COPY);

export const CopyProvider = CopyContext.Provider;

export const useCopy = (): CopyConfig => useContext(CopyContext);
