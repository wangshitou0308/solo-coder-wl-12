import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  opacityDir: number;
  vx: number;
  vy: number;
  twinkleSpeed: number;
}

const COLORS = ['#FFD700', '#C0C0C0', '#00CED1', '#8B5CF6'];
const STAR_COUNT = 180;

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef(0);

  const initStars = useCallback((width: number, height: number) => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.6 + 0.2,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      twinkleSpeed: Math.random() * 0.008 + 0.003,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      if (starsRef.current.length === 0) initStars(width, height);
    };

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { x: mx, y: my } = mouseRef.current;

      for (const s of starsRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        s.opacity += s.opacityDir * s.twinkleSpeed;
        if (s.opacity >= 0.9) { s.opacity = 0.9; s.opacityDir = -1; }
        if (s.opacity <= 0.15) { s.opacity = 0.15; s.opacityDir = 1; }

        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = dist < 150 ? (1 - dist / 150) * 0.6 : 0;
        const finalOpacity = Math.min(s.opacity + glow, 1);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius + glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = finalOpacity;
        ctx.fill();

        if (glow > 0.1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius + glow * 8, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = glow * 0.25;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      cancelAnimationFrame(frameRef.current);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
