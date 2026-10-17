import React from 'react';
import { Website } from '../types';
import { Globe, ArrowRight, ExternalLink } from 'lucide-react';
import { useCopy } from '../context/CopyContext';

interface WebsiteCardProps {
  website: Website;
  disableHoverEffects?: boolean;
  forceActionIcon?: boolean;
  // 轮播宽屏下把截图压矮一点，让卡片整体更矮、首屏能看到更多内容
  imageAspectRatio?: string;
  // 顶部浏览器条是否整条可点开网站。轮播里只有活跃卡需要，侧卡点击是切到中间
  linkHeader?: boolean;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({
  website,
  disableHoverEffects = false,
  forceActionIcon = false,
  imageAspectRatio,
  linkHeader = true,
}) => {
  const { websites: copy } = useCopy();

  // 状态色也走主题变量，深浅色下都不至于刺眼
  const statusColors: Record<Website['status'], string> = {
    Live: 'border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[var(--accent)]',
    Maintenance: 'border-[var(--lamp)]/35 bg-[var(--lamp-soft)] text-[var(--lamp)]',
    Beta: 'border-[#8fe6ff]/35 bg-[#8fe6ff]/10 text-[#2b8aa6] dark:text-[#8fe6ff]',
  };

  // 3D 轮播中会禁用 hover 动画，单独展示则启用
  const hoverClasses = disableHoverEffects
    ? ''
    : 'hover:-translate-y-1.5 hover:border-[var(--lamp)]/40 hover:shadow-[0_40px_90px_-50px_var(--glow-lamp)]';

  const imgHoverClasses = disableHoverEffects ? '' : 'group-hover:scale-[1.035]';

  // 轮播强制显示箭头，普通卡片则跟随 hover 状态
  const showActionIcon = !disableHoverEffects || forceActionIcon;

  const headerClass =
    'relative z-10 flex items-center gap-3 border-b border-[var(--line)] bg-black/[0.06] px-4 py-3 dark:bg-white/[0.025]';

  const headerInner = (
    <>
      <div className="flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#ff9b9b] opacity-25 transition-all duration-300 group-hover:opacity-90 group-hover:shadow-[0_0_6px_rgba(255,155,155,0.45)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--lamp)] opacity-25 transition-all delay-75 duration-300 group-hover:opacity-90 group-hover:shadow-[0_0_6px_var(--glow-lamp)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--accent)] opacity-25 transition-all delay-150 duration-300 group-hover:opacity-90 group-hover:shadow-[0_0_6px_var(--glow-teal)]" />
      </div>
      <div className="flex h-7 flex-1 items-center truncate rounded-md border border-[var(--line)] bg-[var(--bg-0)]/55 px-3 font-mono text-[10px] text-faint">
        <Globe size={10} className="mr-2 shrink-0 text-faint" />
        <span className="truncate">{website.url.replace(/^https?:\/\//, '')}</span>
      </div>
    </>
  );

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--panel-strong)] transition-all duration-500 ease-out ${hoverClasses}`}
    >
      {linkHeader ? (
        <a
          href={website.url}
          target="_blank"
          rel="noreferrer"
          className={`${headerClass} cursor-pointer transition-colors duration-300 hover:bg-black/[0.12] dark:hover:bg-white/[0.06]`}
        >
          {headerInner}
        </a>
      ) : (
        <div className={headerClass}>{headerInner}</div>
      )}

      <div
        className="relative z-10 aspect-[16/10] overflow-hidden border-b border-[var(--line)] bg-[var(--bg-1)]"
        style={imageAspectRatio ? { aspectRatio: imageAspectRatio } : undefined}
      >
        <img
          src={website.thumbnail}
          alt={website.title}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out ${imgHoverClasses}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04080f]/25 via-transparent to-transparent" />

        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em] backdrop-blur-md ${statusColors[website.status]}`}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {website.status}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-grow flex-col p-5 md:p-6">
        <h3 className="mb-2 font-display text-xl font-semibold leading-tight tracking-wide text-ink transition-colors duration-300 group-hover:text-lamp">
          {website.title}
        </h3>
        <p className="mb-5 line-clamp-2 flex-grow text-sm leading-relaxed text-muted">{website.description}</p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4">
          <a
            href={website.url}
            target="_blank"
            rel="noreferrer"
            className="group/link inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:text-lamp"
          >
            {copy.action}
            <ExternalLink size={12} className="ml-1.5 opacity-60 transition-opacity group-hover/link:opacity-100" />
          </a>
          {showActionIcon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-faint transition-all duration-500 group-hover:rotate-[-45deg] group-hover:border-[var(--lamp)] group-hover:bg-[var(--lamp-soft)] group-hover:text-lamp">
              <ArrowRight size={15} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteCard;
