import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Website } from '../types';
import WebsiteCard from './WebsiteCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Website3DCarouselProps {
  websites: Website[];
}

// 活跃卡恒为 scale(1)，只有侧卡缩小。堆叠区高度因此等于活跃卡的自然高度，
// 缩放不会溢出到上方标题或下方圆点带。side 对应原设计 side/active 的缩放比值
// （原桌面 0.8/1.3≈0.62、原手机 0.8/1.0=0.8），往中间取值以兼顾两档的观感。
//
// peek = 最近一张侧卡的位移（占自身宽度的百分比），stack = 再往外每级的位移增量，
// side = 侧卡缩放，falloff = 每往外一级的额外缩小量，depthY = 第三级额外的纵向压缩，
// visible = 两侧各展示几张，imageRatio = 卡内截图宽高比（宽屏压矮以省出纵向空间），
// reflect = 是否要倒影，gap = 卡片带到圆点带的间距。
const TIERS = {
  phone: { peek: 20, stack: 0, side: 0.75, falloff: 0.06, depthY: 1, rot: 0, visible: 1, imageRatio: '16/10', reflect: false, gap: 24 },
  tablet: { peek: 24, stack: 6, side: 0.72, falloff: 0.06, depthY: 1, rot: -6, visible: 1, imageRatio: '16/10', reflect: false, gap: 30 },
  desktop: { peek: 42, stack: 24, side: 0.70, falloff: 0.04, depthY: 0.82, rot: -10, visible: 2, imageRatio: '16/7', reflect: true, gap: 96 },
} as const;

type Tier = keyof typeof TIERS;
type TierSpec = (typeof TIERS)[Tier];

// 与 CSS 的 sm / lg 断点共用同一组阈值，避免 JS 档位和样式档位错配。
const tierFor = (width: number): Tier => (width < 640 ? 'phone' : width < 1024 ? 'tablet' : 'desktop');

const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';
// 倒影用 -webkit-box-reflect：只绘制、不占布局，所以卡片高度不受影响，
// 但需要靠 gap 预留出可见段的落点，否则会压在圆点上。15% 约为卡高的 1/7。
// Firefox 不支持该属性，届时只是没有倒影，不影响布局。
const REFLECT = 'below 8px linear-gradient(to bottom, rgba(0,0,0,0.42), transparent 15%)';

// 宽屏会同时露出两级侧卡，灰度必须分层，否则二三层的边缘糊成一块；
// 手机/平板只有一级侧卡，沿用原来的单一灰度，观感与改动前一致。
const OVERLAY = {
  flat: 'bg-slate-900/10 dark:bg-black/40',
  near: 'bg-slate-900/5 dark:bg-black/20',
  far: 'bg-slate-900/15 dark:bg-black/55',
};
const AUTOPLAY_MS = 5000;
const SWIPE_MIN_PX = 40;
const MIN_CARD_W = 240;
const MAX_CARD_W = 600;
const FIT_SAFETY = 0.98;

// transform 里 translateX 的百分比按元素自身宽度计算、且不随 scale 缩小，
// 所以最外侧那张卡的边缘 = cardW * (位移比例 + 缩放后的一半宽)。
// 反过来用它除可用宽度，就能得到"这一档永远不会越界"的最大卡片宽度。
// 窄到卡片触底时改为守住卡宽、把侧卡位移收回来，同样保证不被裁。
const computeLayout = (t: TierSpec, avail: number) => {
  const outerPeek = ((t.visible - 1) * t.stack) / 100;
  const outerHalf = (t.side - (t.visible - 1) * t.falloff) / 2;
  const widthFor = (peek: number) => avail / (2 * (peek / 100 + outerPeek + outerHalf));

  const fitted = widthFor(t.peek) * FIT_SAFETY;
  if (fitted >= MIN_CARD_W) {
    return { peek: t.peek, width: Math.min(MAX_CARD_W, fitted) };
  }
  return { peek: Math.max(0, (avail / (2 * MIN_CARD_W) - outerPeek - outerHalf) * 100), width: MIN_CARD_W };
};

const Website3DCarousel: React.FC<Website3DCarouselProps> = ({ websites }) => {
  const total = websites.length;
  const hasCards = total > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tier, setTier] = useState<Tier>(() => tierFor(window.innerWidth));
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden');
  const [availWidth, setAvailWidth] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipedRef = useRef(false);
  const hoverable = useRef(window.matchMedia('(hover: hover)').matches);

  useEffect(() => {
    const sync = () => setTier(tierFor(window.innerWidth));
    const queries = [window.matchMedia('(min-width: 640px)'), window.matchMedia('(min-width: 1024px)')];
    queries.forEach(q => q.addEventListener('change', sync));
    return () => queries.forEach(q => q.removeEventListener('change', sync));
  }, []);

  // 容器宽度是唯一可信的边界来源：vw 会算上父级内边距和 max-w-6xl 的收缩。
  // 数据是异步进来的，所以按 hasCards 重建观察器，否则首次挂载时元素还不存在。
  useLayoutEffect(() => {
    if (!hasCards) return;
    const el = rootRef.current;
    if (!el) return;
    const measure = (width: number) => setAvailWidth(prev => (Math.abs(prev - width) < 0.5 ? prev : width));
    measure(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => measure(entries[entries.length - 1].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasCards]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(prev => (total === 0 ? prev : ((index % total) + total) % total));
  }, [total]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (total === 0 ? prev : (prev + 1) % total));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (total === 0 ? prev : (prev - 1 + total) % total));
  }, [total]);

  useEffect(() => {
    if (isPaused || !pageVisible || total < 2) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, pageVisible, total, goNext]);

  // 数据条数变少时索引可能越界，读一个安全值即可，不必再加 effect 回滚
  const active = currentIndex < total ? currentIndex : 0;
  const layout = computeLayout(TIERS[tier], availWidth);

  // 相对当前卡的堆叠位置；位移用百分比，天然跟随卡片实际宽度缩放
  const offsetOf = (index: number) => {
    let offset = (index - active) % total;
    if (offset < 0) offset += total;
    if (offset > total / 2) offset -= total;
    return offset;
  };

  const cardStyle = (offset: number): React.CSSProperties => {
    const t = TIERS[tier];

    const shared: React.CSSProperties = {
      transition: `transform 600ms ${EASE}, opacity 600ms ${EASE}, filter 600ms ${EASE}`,
    };

    const abs = Math.abs(offset);

    if (abs > t.visible) {
      return { ...shared, opacity: 0, transform: 'translateX(0) scale(0.6)', zIndex: 0, pointerEvents: 'none' };
    }

    if (abs === 0) {
      return { ...shared, opacity: 1, transform: 'translateX(0) scale(1)', zIndex: 30, pointerEvents: 'auto', filter: 'none' };
    }

    const sign = Math.sign(offset);
    const x = sign * (layout.peek + (abs - 1) * t.stack);
    const sx = t.side - (abs - 1) * t.falloff;
    const sy = sx * (abs >= 2 ? t.depthY : 1);

    return {
      ...shared,
      opacity: Math.max(0.4, 0.85 - (abs - 1) * 0.2),
      transform: `translateX(${x}%) rotateY(${sign * abs * t.rot}deg) scale(${sx}, ${sy})`,
      filter: `blur(${abs}px) brightness(${1 - abs * 0.05})`,
      zIndex: 20 - abs,
      pointerEvents: 'auto',
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    swipeStartX.current = e.clientX;
    swipedRef.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    swipedRef.current = true;
    if (dx < 0) goNext();
    else goPrev();
  };

  if (total === 0) return null;

  const t = TIERS[tier];
  const showControls = total > 1;

  return (
    <div
      ref={rootRef}
      className="relative mx-auto grid w-full grid-rows-[auto_auto] justify-items-center overflow-x-clip pb-6 md:pb-10 group/carousel"
      role="group"
      aria-roledescription="轮播"
      aria-label="网站展示"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { swipeStartX.current = null; }}
      onMouseEnter={hoverable.current ? () => setIsPaused(true) : undefined}
      onMouseLeave={hoverable.current ? () => setIsPaused(false) : undefined}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-2/3 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/5" />

      {/* 所有卡片占同一格，格子高度取最高的一张，因此不需要写死容器高度 */}
      <div
        className="relative col-start-1 row-start-1 grid [grid-template-areas:'stack']"
        style={{ width: layout.width }}
      >
        {websites.map((site, index) => {
          const offset = offsetOf(index);
          const abs = Math.abs(offset);
          const isActive = abs === 0;
          return (
            <div
              key={site.id}
              className="h-full w-full [grid-area:stack]"
              style={cardStyle(offset)}
              onClick={() => {
                if (swipedRef.current) return;
                if (!isActive) goTo(index);
              }}
              aria-hidden={!isActive}
              aria-roledescription="幻灯片"
              aria-label={`第 ${index + 1} 张，共 ${total} 张`}
            >
              <div
                className={`relative h-full w-full rounded-2xl shadow-2xl transition-shadow duration-500 ${isActive ? 'cursor-pointer shadow-blue-900/30' : 'cursor-pointer shadow-black/20'}`}
                style={isActive && t.reflect ? { WebkitBoxReflect: REFLECT } : undefined}
              >
                {!isActive && (
                  <div className={`absolute inset-0 z-50 rounded-2xl transition-colors duration-500 ${t.visible < 2 ? OVERLAY.flat : abs === 1 ? OVERLAY.near : OVERLAY.far}`} />
                )}
                <WebsiteCard website={site} disableHoverEffects forceActionIcon imageAspectRatio={t.imageRatio} />
              </div>
            </div>
          );
        })}

        {showControls && tier !== 'phone' && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between opacity-0 transition-opacity duration-500 group-hover/carousel:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="pointer-events-auto -ml-2 rounded-full border border-slate-100 bg-white p-3 text-slate-800 shadow-lg transition-all duration-300 hover:-translate-x-1 hover:text-blue-600 hover:shadow-xl active:scale-90 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-blue-400 md:p-4"
              aria-label={`上一个：${websites[(active - 1 + total) % total]?.title ?? ''}`}
            >
              <ChevronLeft size={24} className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="pointer-events-auto -mr-2 rounded-full border border-slate-100 bg-white p-3 text-slate-800 shadow-lg transition-all duration-300 hover:translate-x-1 hover:text-blue-600 hover:shadow-xl active:scale-90 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-blue-400 md:p-4"
              aria-label={`下一个：${websites[(active + 1) % total]?.title ?? ''}`}
            >
              <ChevronRight size={24} className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>

      {/* 圆点独立成第二行，与卡片之间由间距保证，结构上不可能被卡片遮住 */}
      {showControls && (
        <div
          className="col-start-1 row-start-2 flex max-w-full flex-wrap items-center justify-center gap-2 md:gap-3"
          style={{ marginTop: t.gap }}
        >
          {websites.map((site, idx) => (
            <button
              key={site.id}
              type="button"
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === active
                  ? 'w-8 bg-blue-600 shadow-lg shadow-blue-500/30 md:w-12'
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
              }`}
              aria-label={`切换到 ${site.title}`}
              aria-current={idx === active ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Website3DCarousel;
