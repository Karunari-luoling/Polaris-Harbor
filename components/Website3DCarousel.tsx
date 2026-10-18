import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Website } from '../types';
import WebsiteCard from './WebsiteCard';

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
// reflect = 湖面可见高度占卡高的比例，reflectMax = 湖面的像素上限。
const TIERS = {
  phone: {
    peek: 20,
    stack: 0,
    side: 0.75,
    falloff: 0.06,
    depthY: 1,
    rot: 0,
    visible: 1,
    imageRatio: '16/10',
    reflect: 0.32,
    reflectMax: 150,
  },
  tablet: {
    peek: 24,
    stack: 6,
    side: 0.72,
    falloff: 0.06,
    depthY: 1,
    rot: -6,
    visible: 1,
    imageRatio: '16/10',
    reflect: 0.4,
    reflectMax: 215,
  },
  desktop: {
    peek: 42,
    stack: 24,
    side: 0.7,
    falloff: 0.04,
    depthY: 0.82,
    rot: -10,
    visible: 2,
    imageRatio: '16/7',
    reflect: 0.48,
    reflectMax: 300,
  },
} as const;

type Tier = keyof typeof TIERS;
type TierSpec = (typeof TIERS)[Tier];

// 与 CSS 的 sm / lg 断点共用同一组阈值，避免 JS 档位和样式档位错配。
const tierFor = (width: number): Tier => (width < 640 ? 'phone' : width < 1024 ? 'tablet' : 'desktop');

// 触屏 / 高像素密度设备上整块湖不渲染。倒影那块画布在 dpr 3.5 下是六百万设备像素的
// 软件光栅表层（位移滤镜不在 GPU 加速白名单），纵向单靠 LAKE_EXTRA_DEPTH 就已经突破
// 移动 GPU 的纹理上限，Chrome 只能拆分重画，把整页的光栅预算吃穿——表现是连不属于湖的
// 导航栏都会一半没画出来。按主指针类型和像素密度收，不按视口宽度收：桌面窄窗照旧。
const NO_LAKE_QUERY = '(pointer: coarse), (min-resolution: 3dppx)';

// 湖在不在，布局上还有第二处依赖：文章区原本用负边距把自己抬进湖水里
// （!-mt-10 / md:!-mt-16），湖一没了那 40–64px 就直接压到卡片上。所以这个判断
// 得能被外面读到，让"抬进湖里"和"湖"绑在同一件事上，而不是各按各的断点。
export const useLakeDisabled = () => {
  const [disabled, setDisabled] = useState(() => window.matchMedia(NO_LAKE_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(NO_LAKE_QUERY);
    const sync = () => setDisabled(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return disabled;
};

// 某层侧卡的纵向缩放。transform-origin 是卡片中心，所以侧卡缩得越小，
// 它的底边离活跃卡底边越远。
const sideScaleY = (t: TierSpec, abs: number) =>
  (t.side - (abs - 1) * t.falloff) * (abs >= 2 ? t.depthY : 1);

// 湖面是一条独立的、超出内容栏宽度的大水面。上边缘是一段近似圆形的大弧：
// 中心最高、向两侧缓缓落下；下边缘和底部渐隐保持原样。整块水面在卡片后方，
// 并向文章区继续延伸。
const LAKE_EXTRA_DEPTH = {
  phone: 380,
  tablet: 460,
  desktop: 560,
} as const;

const buildLakeShape = () => {
  const start: [number, number] = [0.04, 0.1];
  // [c1x, c1y, c2x, c2y, x, y]
  const segments: number[][] = [
    // 圆形上边缘：两段大弧，中心高、两端低
    [0.14, 0.035, 0.28, 0.012, 0.5, 0.012],
    [0.72, 0.012, 0.86, 0.035, 0.96, 0.1],
    // 以下几段是原湖岸/湖底轮廓，保持不动
    [0.978, 0.26, 0.98, 0.5, 0.972, 0.7],
    [0.964, 0.85, 0.938, 0.92, 0.888, 0.96],
    [0.78, 1, 0.63, 1, 0.5, 1],
    [0.37, 1, 0.22, 1, 0.112, 0.96],
    [0.062, 0.92, 0.036, 0.85, 0.028, 0.7],
    [0.02, 0.5, 0.022, 0.26, 0.04, 0.1],
  ];

  const path =
    `M ${start[0]} ${start[1]} ` +
    segments.map(s => `C ${s[0]} ${s[1]} ${s[2]} ${s[3]} ${s[4]} ${s[5]}`).join(' ') +
    ' Z';

  // clip-path: polygon 的兼容性比 objectBoundingBox clipPath 更稳；
  // 用同一组贝塞尔曲线采样成足够密的折线，视觉上仍是圆弧。
  let px = start[0];
  let py = start[1];
  const samples: string[] = [`${(px * 100).toFixed(3)}% ${(py * 100).toFixed(3)}%`];
  for (const s of segments) {
    const [c1x, c1y, c2x, c2y, ex, ey] = s;
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const u = 1 - t;
      const x = u * u * u * px + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex;
      const y = u * u * u * py + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey;
      samples.push(`${(x * 100).toFixed(3)}% ${(y * 100).toFixed(3)}%`);
    }
    px = ex;
    py = ey;
  }

  return { path, clip: `polygon(${samples.join(', ')})` };
};

const LAKE_SHAPE = buildLakeShape();

// ---------------------------------------------------------------------------
// 月影
// ---------------------------------------------------------------------------
// 月亮的倒影跟着真实时钟走：18:00 从湖面右侧升起，午夜移到湖心（最高、最亮），
// 06:00 沉到左侧；白天保留一枚淡月，从左侧缓缓移回右侧。这样任何时段打开页面
// 都能看到月亮，且它的位置永远和当前时间对应，而不是一段无关的循环动画。
interface MoonState {
  x: number;
  y: number;
  opacity: number;
}

const DUSK_MINUTES = 18 * 60;
const DAWN_MINUTES = 6 * 60;
const NIGHT_MINUTES = 24 * 60 - DUSK_MINUTES + DAWN_MINUTES;

const computeMoon = (now: Date): MoonState => {
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const isNight = minutes >= DUSK_MINUTES || minutes < DAWN_MINUTES;

  // 0 = 刚刚升起，1 = 即将落下
  const progress = isNight
    ? (minutes >= DUSK_MINUTES ? minutes - DUSK_MINUTES : minutes + (24 * 60 - DUSK_MINUTES)) /
      NIGHT_MINUTES
    : (minutes - DAWN_MINUTES) / (DUSK_MINUTES - DAWN_MINUTES);

  // 高度角：两端贴水天线，中间最高。月影越靠近日间位置越淡。
  const altitude = Math.sin(Math.PI * progress);
  const x = isNight ? 92 - 84 * progress : 8 + 84 * progress;
  const y = isNight ? 50 + 9 * altitude : 42 + 6 * altitude;
  const opacity = isNight ? 0.5 + 0.3 * altitude : 0.14 + 0.1 * altitude;

  return { x, y, opacity };
};

// 月光在湖面上的碎屑：固定的一串横向光斑，越靠近画面底部越宽，
// 用各自的延迟闪烁，形成一条从月亮一直铺到近岸的月影。
const MOON_GLINTS = Array.from({ length: 15 }, (_, i) => {
  const t = i / 14;
  const wobble = Math.sin(i * 2.4) * 0.55 + Math.sin(i * 0.9) * 0.45;
  return {
    top: `${4 + t * 92}%`,
    left: `${50 + wobble * (7 + t * 15)}%`,
    width: `${16 + t * 54 + (i % 3) * 5}%`,
    delay: `${((i * 1.7) % 8).toFixed(2)}s`,
    duration: `${(4.2 + ((i * 5) % 9) * 0.53).toFixed(2)}s`,
    peak: (0.3 + (i % 4) * 0.11).toFixed(2),
  };
});

const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';
const AUTOPLAY_MS = 5600;
const SWIPE_MIN_PX = 40;
const MIN_CARD_W = 240;
const MAX_CARD_W = 600;
const FIT_SAFETY = 0.98;

// 宽屏会同时露出两级侧卡，灰度必须分层，否则二三层的边缘糊成一块；
// 手机/平板只有一级侧卡，沿用原来的单一灰度，观感与改动前一致。
const OVERLAY = {
  flat: 'bg-[#04080f]/40 dark:bg-black/40',
  near: 'bg-[#04080f]/15 dark:bg-black/25',
  far: 'bg-[#04080f]/35 dark:bg-black/55',
};

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
  const [stackHeight, setStackHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [moon, setMoon] = useState<MoonState>(() => computeMoon(new Date()));
  const lakeEnabled = !useLakeDisabled();
  const rootRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipedRef = useRef(false);
  const hoverable = useRef(window.matchMedia('(hover: hover)').matches);

  useEffect(() => {
    const sync = () => setTier(tierFor(window.innerWidth));
    const queries = [window.matchMedia('(min-width: 640px)'), window.matchMedia('(min-width: 1024px)')];
    queries.forEach(q => q.addEventListener('change', sync));
    return () => queries.forEach(q => q.removeEventListener('change', sync));
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
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

  // 倒影的高度必须跟着活跃卡的真实高度走，不能写死。
  // 观察的是整块堆叠区（所有卡等高），字体或图片变化时同步更新。
  useLayoutEffect(() => {
    if (!hasCards) return;
    const el = stackRef.current;
    if (!el) return;
    const measure = () => {
      const next = el.getBoundingClientRect().height;
      setStackHeight(prev => (Math.abs(prev - next) < 0.5 ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasCards, tier]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // 一分钟同步一次足够：月亮在 12 小时里横穿湖面，每分钟只移动几个像素，
  // 位置变化交给 CSS 的 left/top transition 去抹平。湖不渲染时没必要再挂着这个定时器。
  useEffect(() => {
    if (!lakeEnabled) return;
    const sync = () => setMoon(computeMoon(new Date()));
    const timer = window.setInterval(sync, 60_000);
    const onVisibility = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lakeEnabled]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(prev => (total === 0 ? prev : ((index % total) + total) % total));
    },
    [total]
  );

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (total === 0 ? prev : (prev + 1) % total));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (total === 0 ? prev : (prev - 1 + total) % total));
  }, [total]);

  useEffect(() => {
    if (isPaused || !pageVisible || total < 2 || reduceMotion) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, pageVisible, total, goNext, reduceMotion]);

  // 数据条数变少时索引可能越界，读一个安全值即可，不必再加 effect 回滚
  const active = currentIndex < total ? currentIndex : 0;
  const layout = computeLayout(TIERS[tier], availWidth);
  const t = TIERS[tier];
  const reflectHeight = Math.round(Math.min(t.reflectMax, Math.max(0, stackHeight * t.reflect)));

  // 湖面要升到第三层侧卡的底边，才能让几层卡片都像站在同一片水面上。
  const visibleSpan = Math.min(t.visible, Math.floor(total / 2));
  const outerScale = visibleSpan > 0 ? sideScaleY(t, visibleSpan) : 1;
  const outerGap = visibleSpan > 0 ? (stackHeight * (1 - outerScale)) / 2 : 0;
  // 湖面整体往上提：上边缘抬到卡片中下部，下边缘（R + extra）位置不变。
  const lakeRise = Math.max(14, Math.round(outerGap + stackHeight * 0.24 + 16));
  const lakeCanvasHeight = Math.max(1, lakeRise + reflectHeight + LAKE_EXTRA_DEPTH[tier]);
  const moonTop = lakeRise + (moon.y / 100) * reflectHeight;

  // 相对当前卡的堆叠位置；位移用百分比，天然跟随卡片实际宽度缩放
  const offsetOf = (index: number) => {
    let offset = (index - active) % total;
    if (offset < 0) offset += total;
    if (offset > total / 2) offset -= total;
    return offset;
  };

  const cardStyle = (offset: number): React.CSSProperties => {
    const shared: React.CSSProperties = {
      transition: `transform 600ms ${EASE}, opacity 600ms ${EASE}, filter 600ms ${EASE}`,
    };

    const abs = Math.abs(offset);

    if (abs > t.visible) {
      return { ...shared, opacity: 0, transform: 'translateX(0) scale(0.6)', zIndex: 0, pointerEvents: 'none' };
    }

    if (abs === 0) {
      return {
        ...shared,
        opacity: 1,
        transform: 'translateX(0) scale(1)',
        zIndex: 30,
        pointerEvents: 'auto',
        filter: 'none',
      };
    }

    const sign = Math.sign(offset);
    const x = sign * (layout.peek + (abs - 1) * t.stack);
    const sx = t.side - (abs - 1) * t.falloff;
    const sy = sx * (abs >= 2 ? t.depthY : 1);

    return {
      ...shared,
      // 主舞台的侧卡统一由外层承托不透明底衬（见 renderCards），
      // 层级淡出改由内层承担。这样轮播转动时湖水也不会从卡片背后透出来。
      opacity: 1,
      transform: `translateX(${x}%) rotateY(${sign * abs * t.rot}deg) scale(${sx}, ${sy})`,
      filter: `blur(${abs}px) brightness(${1 - abs * 0.05})`,
      zIndex: 20 - abs,
      pointerEvents: 'auto',
    };
  };

  // 侧卡绕中心缩放，卡片底边比活跃卡高 gap。倒影要围着各自卡片的底边翻转，
  // 而不是统一从活跃卡底部开始；在翻转坐标系里把卡片下移 2*gap，正好把倒影
  // 顶边抬到它自己的底边上。于是三层卡片的倒影分别落在不同的水深处。
  const reflectionCardStyle = (offset: number): React.CSSProperties => {
    const style = cardStyle(offset);
    const abs = Math.abs(offset);
    if (abs === 0 || abs > t.visible) return style;

    const sy = sideScaleY(t, abs);
    const gap = (stackHeight * (1 - sy)) / 2;
    return {
      ...style,
      // 倒影仍按原来的透明度沉在湖里；只有主舞台的最外层改用不透明底衬。
      opacity: Math.max(0.4, 0.85 - (abs - 1) * 0.2),
      transform: `translateY(${(gap * 2).toFixed(2)}px) ${style.transform ?? ''}`,
    };
  };

  // 同一套卡片同时用于主舞台和湖面：倒影不是只复制当前卡，而是把整条
  // 卡片堆叠（含两侧的 3D 侧卡、灰罩和位移）完整镜像一遍。因此轮播转动时，
  // 湖里的每一张倒影都会跟着同一组 transform 一起移动。
  const renderCards = (decorative: boolean) =>
    websites.map((site, index) => {
      const offset = offsetOf(index);
      const abs = Math.abs(offset);
      const isActive = abs === 0;
      // 所有侧卡都给整张卡加一层不透明底衬：湖水在卡片下方，但不会再从
      // 半透明的卡片里透出来。层级淡出改由内层承担，观感不变；
      // 底衬在第二层和第三层之间始终存在，轮播转动时也不会闪出湖水。
      const isSide = !decorative && abs >= 1;
      const depthOpacity = abs >= 2 ? 0.65 : abs === 1 ? 0.85 : 1;

      return (
        <div
          key={site.id}
          className={`h-full w-full [grid-area:stack] ${isSide ? 'rounded-[22px] bg-[var(--bg-0)]' : ''}`}
          style={decorative ? reflectionCardStyle(offset) : cardStyle(offset)}
          onClick={
            decorative
              ? undefined
              : () => {
                  if (swipedRef.current) return;
                  if (!isActive) goTo(index);
                }
          }
          aria-hidden={decorative || !isActive}
          aria-roledescription={decorative ? undefined : '幻灯片'}
          aria-label={decorative ? undefined : `第 ${index + 1} 张，共 ${total} 张`}
        >
          <div
            className="h-full w-full"
            style={{ opacity: decorative ? 1 : depthOpacity, transition: `opacity 600ms ${EASE}` }}
          >
            <div
              className={`relative h-full w-full rounded-[22px] transition-shadow duration-500 ${
                isActive
                  ? 'cursor-pointer shadow-[0_44px_100px_-42px_rgba(0,0,0,0.85)]'
                  : 'cursor-pointer shadow-[0_30px_70px_-46px_rgba(0,0,0,0.8)]'
              }`}
            >
              {!isActive && (
                <div
                  className={`absolute inset-0 z-50 rounded-[22px] transition-colors duration-500 ${
                    t.visible < 2 ? OVERLAY.flat : abs === 1 ? OVERLAY.near : OVERLAY.far
                  }`}
                />
              )}
              <WebsiteCard
                website={site}
                disableHoverEffects
                forceActionIcon
                imageAspectRatio={t.imageRatio}
                linkHeader={isActive}
              />
            </div>
          </div>
        </div>
      );
    });

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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  if (total === 0) return null;

  return (
    <div
      ref={rootRef}
      className="group/carousel relative isolate mx-auto flex w-full flex-col items-center"
      role="group"
      aria-roledescription="轮播"
      aria-label="网站展示"
      tabIndex={0}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        swipeStartX.current = null;
      }}
      onKeyDown={onKeyDown}
      onMouseEnter={hoverable.current ? () => setIsPaused(true) : undefined}
      onMouseLeave={hoverable.current ? () => setIsPaused(false) : undefined}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-2/3 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--glow-teal)] blur-[80px]" />

      {/* 所有卡片占同一格，格子高度取最高的一张，因此不需要写死容器高度。
          z-10 让卡片浮在湖面之上：湖面是背景平面，卡片才像站在水里。 */}
      <div
        ref={stackRef}
        className="relative z-40 grid [grid-template-areas:'stack']"
        style={{ width: layout.width }}
      >
        {renderCards(false)}
      </div>

      {/*
        湖面是一片独立的、比内容栏更宽的水面，铺在卡片后面并向文章区继续延伸。
        水面用 SVG path 填色 + 高斯模糊得到真正的软边；同一份 path 通过
        objectBoundingBox 的 clipPath 裁切倒影和波光，硬裁边会被外侧的模糊水色
        包住。顶部两侧抬高到第三层卡底边，中间凹进活跃卡底部。

        倒影把整条卡片堆叠镜像一遍，每张卡围绕自己的底边翻转：活跃卡倒影最低，
        第三层卡倒影最高，像几排卡片站在同一片湖水的不同深度里。
      */}
      {lakeEnabled && reflectHeight > 0 && (
        <div
          className="lake-zone"
          style={
            {
              height: reflectHeight,
              '--lake-h': `${reflectHeight}px`,
              '--lake-rise': `${lakeRise}px`,
            } as React.CSSProperties
          }
          aria-hidden="true"
          inert
        >
          <div className="lake-canvas" style={{ top: -lakeRise, height: lakeCanvasHeight }}>
            <svg
              className="lake-water-svg"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id="lake-water-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" className="lake-stop-top" />
                  <stop offset="0.018" className="lake-stop-top-strong" />
                  <stop offset="0.16" className="lake-stop-mid" />
                  <stop offset="0.6" className="lake-stop-mid" />
                  <stop offset="0.84" className="lake-stop-deep" />
                  <stop offset="1" className="lake-stop-end" />
                </linearGradient>
                <filter id="lake-water-soft" x="-8%" y="-8%" width="116%" height="116%">
                  <feGaussianBlur stdDeviation="0.018" />
                </filter>
              </defs>
              <path
                d={LAKE_SHAPE.path}
                fill="url(#lake-water-fill)"
                filter="url(#lake-water-soft)"
              />
            </svg>

            <div
              className="lake-content"
              style={
                {
                  clipPath: LAKE_SHAPE.clip,
                  WebkitClipPath: LAKE_SHAPE.clip,
                } as React.CSSProperties
              }
            >
              <div className="lake-depth" />

              <div className="reflection-layer">
                <div className="reflection-flip" style={{ top: lakeRise, height: stackHeight }}>
                  <div
                    className="reflection-grid"
                    style={{ width: layout.width, height: stackHeight }}
                  >
                    {renderCards(true)}
                  </div>
                </div>
              </div>

              {/* 水色把镜面般的倒影染成湖水，避免倒影像一块干净的玻璃贴纸 */}
              <div className="lake-wash" />
              {/* 越往下越浓的水色，把倒影和湖底一起压暗、融进页面 */}
              <div className="lake-veil" />

              <div className="lake-swell lake-swell--far" />
              <div className="lake-swell lake-swell--near" />

              <div
                className="lake-moon"
                style={
                  {
                    left: `${moon.x}%`,
                    top: `${moonTop}px`,
                    '--moon-opacity': moon.opacity,
                  } as React.CSSProperties
                }
              >
                <span className="lake-moon-halo" />
                <span className="lake-moon-disc" />
                <span className="lake-moon-trail">
                  {MOON_GLINTS.map((glint, idx) => (
                    <span
                      key={idx}
                      style={
                        {
                          top: glint.top,
                          left: glint.left,
                          width: glint.width,
                          '--glint-delay': glint.delay,
                          '--glint-duration': glint.duration,
                          '--glint-peak': glint.peak,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </span>
              </div>

              <div className="lake-glints" />
              <div className="lake-fade" />
            </div>
          </div>
        </div>
      )}

      {/* 水波扰动滤镜：频率在纵横方向拉开，条纹才会像被雨点打皱的水面 */}
      {lakeEnabled && (
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0">
        <defs>
          <filter
            id="harbor-water"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005 0.06"
              numOctaves="2"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* 月影的扰动要细得多，否则月盘会被撕成碎片 */}
          <filter
            id="harbor-moon"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.09"
              numOctaves="2"
              seed="7"
              result="moon-noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="moon-noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      )}
    </div>
  );
};

export default Website3DCarousel;
