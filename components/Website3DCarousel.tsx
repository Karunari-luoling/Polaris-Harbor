import React, { useState, useEffect, useCallback } from 'react';
import { Website } from '../types';
import WebsiteCard from './WebsiteCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Website3DCarouselProps {
  websites: Website[];
}

const Website3DCarousel: React.FC<Website3DCarouselProps> = ({ websites }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 监听窗口大小，在移动端降级为单卡堆叠效果
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 使用 useCallback 避免定时器重复创建
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % websites.length);
  }, [websites.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + websites.length) % websites.length);
  };

  useEffect(() => {
    if (isPaused) return;
    // 鼠标悬停时暂停，离开后恢复自动轮播
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // 计算每张卡片的 3D 位置、透明度和缩放，使其围绕中心堆叠
  const getCardStyle = (index: number) => {
    const total = websites.length;

    let offset = (index - currentIndex) % total;
    if (offset < 0) offset += total;
    if (offset > total / 2) offset -= total;

    const absOffset = Math.abs(offset);
    const isActive = offset === 0;
    
    const MAX_VISIBLE_CARDS = isMobile ? 1 : 2;

    let style = {
      transform: '',
      zIndex: 50 - absOffset,
      opacity: 0,
      filter: 'none',
      pointerEvents: 'none' as 'none' | 'auto',
      transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
    };

    if (absOffset > MAX_VISIBLE_CARDS) {
      style.opacity = 0;
      style.transform = `translateX(0) scale(0)`;
    } else {
      style.pointerEvents = 'auto';

      if (isActive) {
        style.opacity = 1;
        style.filter = 'none';
        style.zIndex = 100;

        const activeScale = isMobile ? 1.0 : 1.3;
        const translateZ = isMobile ? 0 : 100;
        
        style.transform = `translateX(0) translateZ(${translateZ}px) rotateY(0deg) scale(${activeScale})`;
      } else {
        const sign = Math.sign(offset);

        const baseOffset = isMobile ? 22 : 55; // 控制左右位移基础距离

        const stackOffset = isMobile ? 0 : 15; // 在桌面端增加层级感
        
        const xPos = baseOffset + (absOffset * stackOffset);

        const scale = Math.max(0.5, 0.9 - (absOffset * 0.1));

        style.opacity = Math.max(0.5, 1 - absOffset * 0.15);
        style.filter = `blur(${absOffset * 1}px) brightness(${1 - absOffset * 0.05})`;
        
        const rotation = isMobile ? 0 : -10;
        const zDepth = isMobile ? 30 : 50;
        
        style.transform = `translateX(${sign * xPos}%) translateZ(-${absOffset * zDepth}px) rotateY(${sign * rotation}deg) scale(${scale})`;
      }
    }

    return style;
  };

  if (websites.length === 0) return null;

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto h-[550px] sm:h-[600px] md:h-[650px] lg:h-[804px] flex items-center justify-center perspective-[1200px] py-12 md:py-16 group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/10 dark:bg-blue-500/5 blur-[60px] md:blur-[120px] rounded-full -z-10 pointer-events-none" />

      {websites.map((site, index) => {
        const style = getCardStyle(index);
        const isActive = index === currentIndex;
        
        return (
          <div
            key={site.id}
            onClick={() => setCurrentIndex(index)}
            className="absolute w-[78vw] sm:w-[400px] md:w-[500px] lg:w-[600px] aspect-[3/4] md:aspect-[16/12] cursor-pointer"
            style={{
              transform: style.transform,
              zIndex: style.zIndex,
              opacity: style.opacity,
              filter: style.filter,
              transition: style.transition,
            }}
          >
            <div className={`relative h-full w-full rounded-2xl shadow-2xl transition-all duration-500 ${isActive ? 'shadow-blue-900/30' : 'shadow-black/20'}`}>
                {!isActive && (
                  <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40 z-50 rounded-2xl transition-colors duration-500" />
                )}
                <WebsiteCard website={site} disableHoverEffects={true} forceActionIcon />
            </div>

            <div 
              className={`hidden sm:block absolute top-full left-0 w-full h-full mt-4 md:mt-6 pointer-events-none transform scale-y-[-1] blur-[2px] transition-opacity duration-500 ${isActive ? 'opacity-40' : 'opacity-20'}`}
              style={{ 
                maskImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)',
                WebkitMaskImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)'
              }}
              aria-hidden="true"
            >
               <WebsiteCard website={site} disableHoverEffects={true} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent z-10" />
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-8 md:bottom-6 left-0 right-0 flex justify-center items-center gap-2 md:gap-3 z-50">
        {websites.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-500 rounded-full ${
              idx === currentIndex 
                ? 'w-8 md:w-12 h-1.5 bg-blue-600 shadow-lg shadow-blue-500/30' 
                : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

       <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-4 md:px-8 pointer-events-none z-[120] max-w-7xl mx-auto opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 ease-in-out">
         <button 
           onClick={(e) => { e.stopPropagation(); prevSlide(); }}
           className="pointer-events-auto p-3 md:p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-90 duration-300 hover:-translate-x-1"
           aria-label="Previous slide"
         >
           <ChevronLeft size={24} className="md:w-7 md:h-7" />
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); nextSlide(); }}
           className="pointer-events-auto p-3 md:p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg hover:shadow-xl active:scale-90 duration-300 hover:translate-x-1"
           aria-label="Next slide"
         >
           <ChevronRight size={24} className="md:w-7 md:h-7" />
         </button>
       </div>
    </div>
  );
};

export default Website3DCarousel;
