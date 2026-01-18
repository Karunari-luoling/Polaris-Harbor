import React from 'react';
import { Website } from '../types';
import { Globe, ArrowRight, ExternalLink } from 'lucide-react';

interface WebsiteCardProps {
  website: Website;
  disableHoverEffects?: boolean;
  forceActionIcon?: boolean;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ website, disableHoverEffects = false, forceActionIcon = false }) => {
  // 各状态对应的配色，便于在卡片顶部角标复用
  const statusColors = {
    'Live': 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400',
    'Maintenance': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400',
    'Beta': 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400'
  };

  // 3D 轮播中会禁用 hover 动画，单独展示则启用
  const hoverClasses = disableHoverEffects 
    ? '' 
    : 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-900/30 hover:border-blue-500/30 dark:hover:border-blue-400/30';

  const imgHoverClasses = disableHoverEffects
    ? ''
    : 'group-hover:scale-105';

  // 轮播强制显示箭头，普通卡片则跟随 hover 状态
  const showActionIcon = !disableHoverEffects || forceActionIcon;

  return (
    <div className={`group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-out overflow-hidden ${hoverClasses}`}>
      
      {!disableHoverEffects && (
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      <div className="relative z-10 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-red-400 transition-colors duration-300"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-amber-400 transition-colors duration-300 delay-75"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-emerald-400 transition-colors duration-300 delay-150"></div>
        </div>
        <div className="flex-1 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono flex items-center px-3 truncate shadow-sm group-hover:border-blue-100 dark:group-hover:border-slate-600 transition-colors">
          <Globe size={10} className="mr-2 text-slate-300 dark:text-slate-600" />
          {website.url.replace(/^https?:\/\//, '')}
        </div>
      </div>

      <div className="relative z-10 aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-50 dark:border-slate-800">
        <img 
          src={website.thumbnail} 
          alt={website.title} 
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${imgHoverClasses}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm shadow-sm ${statusColors[website.status]}`}>
            {website.status}
          </span>
        </div>
      </div>

      <div className="relative z-10 p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {website.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
          {website.description}
        </p>
        
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center mt-auto">
           <a 
            href={website.url} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group/link transition-colors"
          >
            Visit Site
            <ExternalLink size={14} className="ml-1.5 opacity-50 group-hover/link:opacity-100 transition-opacity" />
          </a>
          {showActionIcon && (
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-[-45deg]">
               <ArrowRight size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteCard;
