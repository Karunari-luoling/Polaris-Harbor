import React from 'react';
import { AppConfig } from '../types';

interface BrandMarkProps {
  site: AppConfig['site'];
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-base',
};

// 统一的品牌徽记：优先用配置里的 logoImage，没有图时取品牌名前两个字。
const BrandMark: React.FC<BrandMarkProps> = ({ site, size = 'md', className = '' }) => {
  const initials = (site.logoText || site.brandName || 'DS').replace(/\s+/g, '').slice(0, 2).toUpperCase();

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--panel-strong)] shadow-[0_0_30px_-8px_var(--glow-lamp)] ${sizeClasses[size]} ${className}`}
    >
      {site.logoImage ? (
        <img src={site.logoImage} alt={site.brandName} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-semibold tracking-tight text-lamp">{initials}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
    </span>
  );
};

export default BrandMark;
