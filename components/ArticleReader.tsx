import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Calendar, Folder, Tag, X } from 'lucide-react';
import type { DOMPurify as Purify } from 'dompurify';
import { Article } from '../types';
import { useCopy } from '../context/CopyContext';

const READ_PARAM = 'read';

// 正文来自别人家的 feed，只有经过 DOMPurify 的输出才允许进 dangerouslySetInnerHTML，
// 这条线不能省：模板会被别人拿去指向任意 RSS 源。
const FORBID_TAGS = ['iframe', 'form', 'input', 'button', 'textarea', 'select', 'object', 'embed', 'base'];

let purifyPromise: Promise<Purify> | null = null;
let hookInstalled = false;

const loadPurify = () => {
  if (!purifyPromise) {
    purifyPromise = import('dompurify').then(({ default: purify }) => {
      // addHook 挂在单例上，重复注册会越叠越多，所以只装一次
      if (!hookInstalled) {
        hookInstalled = true;
        purify.addHook('afterSanitizeAttributes', node => {
          if (node.nodeName === 'A' && node.getAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });
      }
      return purify;
    });
  }
  return purifyPromise;
};

export const useOpenReader = () => {
  const [, setParams] = useSearchParams();
  return useCallback(
    (guid: string) => {
      setParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set(READ_PARAM, guid);
          return next;
        },
        { replace: false }
      );
    },
    [setParams]
  );
};

const useCloseReader = () => {
  const [, setParams] = useSearchParams();
  return useCallback(
    () =>
      setParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete(READ_PARAM);
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );
};

interface ArticleReaderProps {
  articles: Article[];
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ articles }) => {
  const { reader: copy, articles: articlesCopy } = useCopy();
  const [params] = useSearchParams();
  const guid = params.get(READ_PARAM);
  const close = useCloseReader();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [html, setHtml] = useState<string | null>(null);

  const article = useMemo(() => (guid ? articles.find(item => item.guid === guid) ?? null : null), [articles, guid]);

  useEffect(() => {
    if (!article) {
      setHtml(null);
      return;
    }
    let cancelled = false;
    setHtml(null);
    loadPurify().then(purify => {
      if (cancelled) return;
      setHtml(purify.sanitize(article.description, { FORBID_TAGS }));
    });
    return () => {
      cancelled = true;
    };
  }, [article]);

  useEffect(() => {
    if (!guid) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    // 阅读层自己有滚动条，背景页面跟着滚会让人以为整站卡住
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [guid, close]);

  if (!guid) return null;

  const formattedDate = article
    ? new Date(article.pubDate).toLocaleDateString(articlesCopy.dateLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="reader-backdrop" onClick={close}>
      <div
        aria-labelledby="article-reader-title"
        aria-modal="true"
        className="reader-panel"
        onClick={event => event.stopPropagation()}
        role="dialog"
      >
        <header className="reader-head">
          <div className="min-w-0 flex-1">
            <h2 id="article-reader-title" className="font-display text-[1.5rem] font-semibold leading-snug tracking-wide text-ink md:text-[1.9rem]">
              {article ? article.title : copy.notFound}
            </h2>
            {article && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={10} /> {formattedDate}
                </span>
                {/* feed 里分类和标签混在同一个 <category> 序列里，只能按 Hexo 的
                    固定顺序区分：第一项是分类，其余是标签。与文章卡片同口径。 */}
                {(article.categories ?? []).slice(0, 3).map((term, idx) => (
                  <span key={term} className="inline-flex items-center gap-1.5">
                    {idx === 0 ? <Folder size={10} /> : <Tag size={10} />} {term}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {article && (
              <a
                className="link-arrow !tracking-[0.14em]"
                href={article.link}
                rel="noreferrer"
                target="_blank"
              >
                {copy.original} <ArrowUpRight size={13} />
              </a>
            )}
            <button aria-label={copy.close} className="reader-close" onClick={close} ref={closeRef} type="button">
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="reader-body">
          {!article ? (
            <p className="font-display text-lg text-muted">{copy.notFound}</p>
          ) : html === null ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">{copy.loading}</p>
          ) : (
            <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
};
