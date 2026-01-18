import React from 'react';
import { Article } from '../types';
import { Calendar, ArrowRight, Tag, Folder } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const formattedDate = new Date(article.pubDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const categories = article.categories ?? [];

  // 去掉富文本标签，仅保留纯文本摘要，避免列表页出现混排
  const textContent = article.description.replace(/<[^>]+>/g, '');
  const primaryCategory = categories[0] ?? 'Uncategorized';
  const secondaryCategories = categories.slice(1, 4);

  return (
    <article className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-900/30 hover:border-blue-500/30 dark:hover:border-blue-400/30 h-full flex flex-col overflow-hidden">
      
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <a 
        href={article.link} 
        target="_blank" 
        rel="noreferrer" 
        className="relative z-10 flex flex-col sm:flex-row gap-6 items-start flex-grow"
      >
        
        <div className="flex-1 min-w-0 flex flex-col h-full order-2 sm:order-1">
          <div className="flex items-center flex-wrap gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 px-1 text-slate-500 dark:text-slate-400">
              <Folder size={12} />
              <span>{primaryCategory}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
            {article.title}
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5 line-clamp-3">
            {textContent}
          </p>

          <div className="mt-auto flex items-center justify-between w-full pt-1">
            <div className="flex flex-wrap gap-2">
              {secondaryCategories.map((cat, i) => (
                <span key={i} className="inline-flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                  <Tag size={10} className="mr-1.5 opacity-40"/> 
                  {cat}
                </span>
              ))}
            </div>
            
            <span className="hidden sm:flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Read <ArrowRight size={16} className="ml-1.5" />
            </span>
          </div>
        </div>

        {article.thumbnail && (
          <div className="w-full sm:w-40 md:w-48 aspect-[16/9] sm:aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 order-1 sm:order-2 relative group-hover:ring-2 ring-blue-50 dark:ring-blue-900/30 transition-all">
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 dark:group-hover:bg-slate-900/20 transition-colors duration-300 z-10" />
            <img 
              src={article.thumbnail} 
              alt="" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
          </div>
        )}
      </a>
    </article>
  );
};

export default ArticleCard;
