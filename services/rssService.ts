import { Article } from '../types';

// 兼容带命名空间的 RSS/Atom 标签，通过 localName 查找元素
const getElementsByLocalName = (root: Document | Element, localName: string): Element[] =>
  Array.from(root.getElementsByTagName('*')).filter(
    el => el.localName?.toLowerCase() === localName.toLowerCase()
  );

const firstText = (node: Element, candidates: string[]): string => {
  // 按候选标签顺序取出第一个非空文本
  for (const name of candidates) {
    const byTag = node.getElementsByTagName(name)[0];
    if (byTag?.textContent?.trim()) return byTag.textContent.trim();

    const byLocal = getElementsByLocalName(node, name)[0];
    if (byLocal?.textContent?.trim()) return byLocal.textContent.trim();
  }
  return '';
};

const extractLink = (item: Element, isAtom: boolean): string => {
  // Atom 优先读取 rel="alternate" 的链接，RSS 则直接取 <link>
  if (isAtom) {
    const altLink = item.querySelector("link[rel='alternate']") as Element | null;
    if (altLink?.getAttribute('href')) return altLink.getAttribute('href') as string;

    const linkEl = item.querySelector('link') as Element | null;
    if (linkEl?.getAttribute('href')) return linkEl.getAttribute('href') as string;
  }

  const linkText = firstText(item, ['link']);
  return linkText;
};

const extractThumbnail = (item: Element, description: string): string | undefined => {
  // 依次尝试媒体扩展、enclosure、image 节点及正文中的 <img>，取到就返回
  const mediaNames = ['media:content', 'media:thumbnail'];
  for (const name of mediaNames) {
    const mediaEl = item.getElementsByTagName(name)[0];
    const url = mediaEl?.getAttribute('url');
    if (url) return url;
  }

  const enclosureEl = getElementsByLocalName(item, 'enclosure')[0] || item.getElementsByTagName('enclosure')[0];
  if (enclosureEl) {
    const type = enclosureEl.getAttribute('type') || '';
    if (!type || type.startsWith('image')) {
      const url = enclosureEl.getAttribute('url');
      if (url) return url;
    }
  }

  const imageEl = getElementsByLocalName(item, 'image')[0];
  if (imageEl) {
    const url = firstText(imageEl, ['url']);
    if (url) return url;
    const attrUrl = imageEl.getAttribute('href');
    if (attrUrl) return attrUrl;
  }

  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
};

const extractCategories = (item: Element): string[] => {
  // 汇总 category 与 Dublin Core subject，去重后返回
  const cats = getElementsByLocalName(item, 'category')
    .map(el => (el.getAttribute('term') || el.textContent || '').trim())
    .filter(Boolean);

  const subjects = Array.from(item.getElementsByTagName('dc:subject'))
    .map(el => el.textContent?.trim() || '')
    .filter(Boolean);

  return Array.from(new Set([...cats, ...subjects]));
};

const parseFeed = (xmlText: string, sourceUrl: string): Article[] => {
  // 统一解析 RSS 与 Atom 格式，生成 Article 对象列表
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  if (xmlDoc.querySelector('parsererror')) {
    throw new Error('Invalid XML feed');
  }

  const rootName = xmlDoc.documentElement.nodeName.toLowerCase();
  const atomEntries = getElementsByLocalName(xmlDoc, 'entry');
  const rssItems = getElementsByLocalName(xmlDoc, 'item');
  const isAtomLike = atomEntries.length > 0 || rootName.includes('feed') || rootName.includes('atom');
  const items = atomEntries.length > 0 ? atomEntries : rssItems;

  return items.map((item, index) => {
    const title = firstText(item, ['title']) || 'Untitled';
    const link = extractLink(item, isAtomLike) || sourceUrl;

    const pubDate = firstText(item, ['pubDate', 'published', 'updated', 'dc:date']) || new Date().toISOString();
    const description = firstText(item, ['content:encoded', 'content', 'description', 'summary']);
    const guid = firstText(item, ['guid', 'id']) || link || `${sourceUrl}#${index}`;
    const categories = extractCategories(item);
    const thumbnail = extractThumbnail(item, description);

    return { guid, title, link, pubDate, description, thumbnail, categories };
  });
};

export const fetchArticles = async (rssUrl: string): Promise<Article[]> => {
  if (!rssUrl) return [];

  try {
    const response = await fetch(rssUrl);
    if (!response.ok) throw new Error('RSS fetch failed');

    const xmlText = await response.text();
    return parseFeed(xmlText, rssUrl);
  } catch (error) {
    console.error('RSS load error:', error);
    return [];
  }
};
