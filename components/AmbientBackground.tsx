import React, { useEffect, useRef } from 'react';
import type { MeteorEffectsConfig } from '../types';

// 环境层刻意做得很轻：一颗 canvas 同时画星尘、雨丝与流星，DPR 封顶 1.35，
// 页面不可见时停掉 rAF，prefers-reduced-motion 下只画一帧静态星图。
interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkle: number;
  phase: number;
  vx: number;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  length: number;
  width: number;
  warmth: boolean;
}

const DEFAULT_METEOR_FREQUENCY = 7;

interface AmbientBackgroundProps {
  /** config.yml 中的 effects.meteors；未传时回退到内置默认值。 */
  meteors?: MeteorEffectsConfig;
}

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ meteors }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meteorConfigRef = useRef(meteors);

  useEffect(() => {
    meteorConfigRef.current = meteors;
  }, [meteors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isDark = () => document.documentElement.classList.contains('dark');

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let drops: Drop[] = [];
    let meteorField: Meteor[] = [];
    let meteorTimer = Number.POSITIVE_INFINITY;
    let raf = 0;
    let running = false;
    let last = 0;
    let time = 0;

    const buildScene = () => {
      const starCount = Math.min(150, Math.max(42, Math.round((width * height) / 16000)));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random(),
        // 星点向上聚集，让页面顶部更像夜空，底部让位给内容
        y: Math.pow(Math.random(), 1.35) * 0.82,
        r: Math.random() * 1.05 + 0.25,
        alpha: Math.random() * 0.5 + 0.16,
        twinkle: 0.35 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.0016,
      }));

      const dropCount = Math.min(150, Math.max(30, Math.round(width / 11)));
      drops = Array.from({ length: dropCount }, () => ({
        x: Math.random() * width * 1.06 - width * 0.03,
        y: Math.random() * height,
        len: 10 + Math.random() * 26,
        speed: 520 + Math.random() * 640,
        alpha: 0.10 + Math.random() * 0.16,
      }));
    };

    const readMeteorSettings = () => {
      const config = meteorConfigRef.current;
      const rawFrequency = Number(config?.frequency);
      const frequency = Number.isFinite(rawFrequency)
        ? Math.min(60, Math.max(0, rawFrequency))
        : DEFAULT_METEOR_FREQUENCY;
      return {
        enabled: config?.enabled !== false && frequency > 0,
        frequency,
      };
    };

    const scheduleMeteor = (initial = false) => {
      const { enabled, frequency } = readMeteorSettings();
      if (!enabled) {
        meteorTimer = Number.POSITIVE_INFINITY;
        return;
      }

      const meanInterval = 60 / frequency;
      // 指数分布让间隔保持随机而不机械；首颗流星稍微提前，别让人等太久。
      const wait = -Math.log(1 - Math.random()) * meanInterval;
      meteorTimer = initial
        ? Math.min(3.2, Math.max(0.8, wait))
        : Math.min(meanInterval * 4, Math.max(0.6, wait));
    };

    const spawnMeteor = () => {
      const leftward = Math.random() < 0.6;
      const lateral = (leftward ? -1 : 1) * (0.55 + Math.random() * 0.5);
      const downward = 0.72 + Math.random() * 0.55;
      const norm = Math.hypot(lateral, downward);
      const speed = 640 + Math.random() * 380;
      const startX = leftward
        ? width * (0.3 + Math.random() * 0.78)
        : width * (-0.08 + Math.random() * 0.78);

      meteorField.push({
        x: startX,
        y: -30 - Math.random() * Math.min(180, height * 0.18),
        vx: (lateral / norm) * speed,
        vy: (downward / norm) * speed,
        age: 0,
        life: 0.95 + Math.random() * 0.55,
        length: Math.min(width * 0.42, 120 + Math.random() * 150),
        width: 0.85 + Math.random() * 0.9,
        warmth: Math.random() < 0.7,
      });
    };

    const drawMeteors = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const meteor of meteorField) {
        const progress = Math.min(1, meteor.age / meteor.life);
        const fade = Math.pow(Math.sin(Math.PI * progress), 0.72);
        if (fade <= 0.01) continue;

        const speed = Math.hypot(meteor.vx, meteor.vy) || 1;
        const headX = meteor.x;
        const headY = meteor.y;
        const tailX = headX - (meteor.vx / speed) * meteor.length;
        const tailY = headY - (meteor.vy / speed) * meteor.length;
        const headColor = meteor.warmth ? '255, 245, 216' : '222, 247, 255';
        const tailColor = meteor.warmth ? '255, 184, 96' : '116, 203, 255';

        const trail = ctx.createLinearGradient(tailX, tailY, headX, headY);
        trail.addColorStop(0, `rgba(${tailColor}, 0)`);
        trail.addColorStop(0.55, `rgba(${tailColor}, ${0.18 * fade})`);
        trail.addColorStop(0.86, `rgba(${headColor}, ${0.55 * fade})`);
        trail.addColorStop(1, `rgba(255, 255, 255, ${0.92 * fade})`);

        // 一笔虚的光晕 + 一笔实的芯，流星才有“烧穿夜空”的通透感。
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = trail;
        ctx.lineWidth = meteor.width * 4.4;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.lineWidth = meteor.width;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        const radius = meteor.width * 9;
        const glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, radius);
        glow.addColorStop(0, `rgba(255, 252, 240, ${0.88 * fade})`);
        glow.addColorStop(0.35, `rgba(${headColor}, ${0.42 * fade})`);
        glow.addColorStop(1, `rgba(${tailColor}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(headX, headY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
      draw(0, false);
    };

    const draw = (dt: number, animate: boolean) => {
      if (!width || !height) return;
      if (animate) time += dt;

      ctx.clearRect(0, 0, width, height);
      const dark = isDark();

      for (const star of stars) {
        if (animate) {
          star.x += star.vx * dt;
          if (star.x > 1.02) star.x = -0.02;
          if (star.x < -0.02) star.x = 1.02;
        }
        const twinkle = animate ? 0.55 + 0.45 * Math.sin(time * star.twinkle + star.phase) : 0.72;
        const alpha = star.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(224, 242, 255, ${alpha})`
          : `rgba(28, 76, 96, ${alpha * 0.5})`;
        ctx.fill();
      }

      if (!dark) {
        meteorField = [];
        meteorTimer = Number.POSITIVE_INFINITY;
        return;
      }

      for (const drop of drops) {
        if (animate) {
          drop.y += drop.speed * dt;
          drop.x += 24 * dt;
          if (drop.y - drop.len > height) {
            drop.y = -20;
            drop.x = Math.random() * width * 1.06 - width * 0.03;
          }
        }
        ctx.beginPath();
        ctx.moveTo(drop.x - 1.6, drop.y - drop.len);
        ctx.lineTo(drop.x, drop.y);
        ctx.strokeStyle = `rgba(178, 216, 242, ${drop.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const meteorSettings = readMeteorSettings();
      if (!meteorSettings.enabled) {
        meteorField = [];
        meteorTimer = Number.POSITIVE_INFINITY;
        return;
      }

      if (animate) {
        if (!Number.isFinite(meteorTimer)) scheduleMeteor(true);
        meteorTimer -= dt;

        if (meteorTimer <= 0) {
          spawnMeteor();
          scheduleMeteor();
        }

        meteorField = meteorField.filter(meteor => {
          meteor.age += dt;
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          return meteor.age < meteor.life;
        });
      }

      if (meteorField.length) drawMeteors();
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      draw(dt, true);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduceQuery.matches) start();
    };

    const onReduceChange = () => {
      if (reduceQuery.matches) {
        meteorField = [];
        meteorTimer = Number.POSITIVE_INFINITY;
        stop();
        draw(0, false);
      } else {
        start();
      }
    };

    // 主题切换时重新着色；不需要重跑动画，只补一帧即可。
    const themeObserver = new MutationObserver(() => draw(0, false));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    resize();
    if (!reduceQuery.matches) start();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    reduceQuery.addEventListener('change', onReduceChange);

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceQuery.removeEventListener('change', onReduceChange);
    };
  }, []);

  return (
    <div aria-hidden="true" className="ambient-layer">
      <div className="ambient-glow ambient-glow--teal" />
      <div className="ambient-glow ambient-glow--amber" />
      <div className="ambient-glow ambient-glow--violet" />
      <div className="ambient-grid" />
      <canvas ref={canvasRef} className="ambient-stars" />
      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
};

export default AmbientBackground;
