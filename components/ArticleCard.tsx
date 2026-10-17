import React from 'react';
import { Article } from '../types';
import { Calendar, ArrowRight, Folder } from 'lucide-react';
import { useCopy } from '../context/CopyContext';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const { articles: copy } = useCopy();

  const formattedDate = new Date(article.pubDate).toLocaleDateString(copy.dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const categories = article.categories ?? [];

  // 去掉富文本标签，仅保留纯文本摘要，避免列表页出现混排
  const textContent = article.description.replace(/<[^>]+>/g, '');
  const primaryCategory = categories[0] ?? copy.uncategorized;
  const secondaryCategories = categories.slice(1, 4);

  return (
    <article className="group card-surface card-lift flex h-full flex-col p-6 md:p-7">
      <a
        href={article.link}
        target="_blank"
        rel="noreferrer"
        className="relative z-10 flex flex-grow flex-col items-start gap-6 sm:flex-row"
      >
        <div className="order-2 flex h-full min-w-0 flex-1 flex-col sm:order-1">
          <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em]">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--lamp)]/25 bg-[var(--lamp-soft)] px-2.5 py-1 text-lamp">
              <Calendar size={10} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-faint">
              <Folder size={10} />
              <span>{primaryCategory}</span>
            </div>
          </div>

          <h3 className="mb-3 font-display text-[1.4rem] font-semibold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-lamp md:text-[1.55rem]">
            {article.title}
          </h3>

          <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted">{textContent}</p>

          <div className="mt-auto flex w-full items-center justify-between pt-1">
            <div className="flex flex-wrap gap-2">
              {secondaryCategories.map((cat, i) => (
                <span key={i} className="tag-chip">
                  {cat}
                </span>
              ))}
            </div>

            <span className="hidden items-center font-mono text-[10px] uppercase tracking-[0.18em] text-lamp opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 sm:flex sm:-translate-x-2">
              {copy.action} <ArrowRight size={14} className="ml-1.5" />
            </span>
          </div>
        </div>

        {article.thumbnail && (
          <div className="relative order-1 aspect-[16/9] w-full flex-shrink-0 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--bg-1)] transition-all duration-500 group-hover:border-[var(--lamp)]/30 sm:order-2 sm:aspect-[4/3] sm:w-40 md:w-48">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#04080f]/25 via-transparent to-transparent" />
            <img
              src={article.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
            />
          </div>
        )}
      </a>
    </article>
  );
};

export default ArticleCard;
