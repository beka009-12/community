"use client";

import { FC, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Target {
  tx: number;
  ty: number;
  color: string;
  wordmark: boolean;
}

interface Particle extends Target {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  delay: number;
}

const SRC = "/brand/motion-logo-particles.png";
const OFFSCREEN_W = 320;
const OFFSCREEN_H = 220;

// Source PNG is 85x57. Its own wordmark row (y 42-53) clips the leading "C"
// and trailing "Y" against the canvas edges, so only the mark (y 0-34) is
// sampled from the bitmap; "COMMUNITY" is redrawn as real text instead.
const MARK_SOURCE_ROWS = 34;
const WORD_SOURCE_TOP = 42;
const WORD_SOURCE_BOTTOM = 53;

interface HeroLogoParticlesProps {
  className?: string;
  ariaLabel?: string;
}

const HeroLogoParticles: FC<HeroLogoParticlesProps> = ({
  className = "",
  ariaLabel = "Motion Community",
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = SRC;

    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let start = performance.now();
    let animationFrame: number | null = null;
    let disposed = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = stage.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (img.complete) build();
    };

    const build = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;

      const off = document.createElement("canvas");
      off.width = OFFSCREEN_W;
      off.height = OFFSCREEN_H;
      const o = off.getContext("2d");
      if (!o) return;

      const scale = Math.min(
        (OFFSCREEN_W * 0.78) / img.width,
        (OFFSCREEN_H * 0.72) / img.height,
      );
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (OFFSCREEN_W - dw) / 2;
      const dy = (OFFSCREEN_H - dh) / 2;

      o.drawImage(
        img,
        0,
        0,
        img.width,
        MARK_SOURCE_ROWS,
        dx,
        dy,
        dw,
        MARK_SOURCE_ROWS * scale,
      );

      const wordTop = dy + WORD_SOURCE_TOP * scale;
      const wordBottom = dy + WORD_SOURCE_BOTTOM * scale;
      const wordHeight = wordBottom - wordTop;
      const fontSize = Math.round(wordHeight * 1.4);
      const gradient = o.createLinearGradient(0, wordTop, 0, wordBottom);
      gradient.addColorStop(0, "#bfe6ff");
      gradient.addColorStop(1, "#4fa8e0");
      o.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = gradient;
      o.fillText("COMMUNITY", OFFSCREEN_W / 2, (wordTop + wordBottom) / 2);

      const data = o.getImageData(0, 0, OFFSCREEN_W, OFFSCREEN_H).data;
      const targets: Target[] = [];

      // Symbol (upper) stays sparse/elegant; wordmark (lower) stays dense so every letter reads clearly.
      for (let y = 0; y < OFFSCREEN_H; y++) {
        const isWordmark = y > OFFSCREEN_H * 0.57;
        const step = isWordmark ? 2 : 3;
        if (y % step !== 0) continue;
        for (let x = 0; x < OFFSCREEN_W; x += step) {
          const i = (y * OFFSCREEN_W + x) * 4;
          const a = data[i + 3];
          if (a > 55 && (isWordmark || Math.random() > 0.08)) {
            targets.push({
              tx: (x / OFFSCREEN_W) * w,
              ty: (y / OFFSCREEN_H) * h,
              color: `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${Math.min(1, a / 255)})`,
              wordmark: isWordmark,
            });
          }
        }
      }

      particles = targets.map((t) => {
        if (reduceMotion) {
          return { ...t, x: t.tx, y: t.ty, vx: 0, vy: 0, r: t.wordmark ? 1.1 : 1.2, delay: 0 };
        }
        const edge = Math.floor(Math.random() * 4);
        let x: number, y: number;
        if (edge === 0) {
          x = Math.random() * w;
          y = -30 - Math.random() * 90;
        } else if (edge === 1) {
          x = w + 30 + Math.random() * 90;
          y = Math.random() * h;
        } else if (edge === 2) {
          x = Math.random() * w;
          y = h + 30 + Math.random() * 90;
        } else {
          x = -30 - Math.random() * 90;
          y = Math.random() * h;
        }
        return {
          ...t,
          x,
          y,
          vx: 0,
          vy: 0,
          r: (t.wordmark ? 0.85 : 0.7) + Math.random() * (t.wordmark ? 0.8 : 1.25),
          delay: Math.random() * (t.wordmark ? 520 : 700),
        };
      });

      start = performance.now();
    };

    const renderStatic = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const animate = (now: number) => {
      if (disposed) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const elapsed = now - start;

      for (const p of particles) {
        if (elapsed < p.delay) continue;
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (mouse.active && md < 75) {
          const force = (1 - md / 75) * 1.8;
          p.vx += (mdx / (md || 1)) * force;
          p.vy += (mdy / (md || 1)) * force;
        }
        p.vx += dx * 0.022;
        p.vy += dy * 0.022;
        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        const twinkle =
          elapsed > 2300
            ? p.wordmark
              ? 0.9 + Math.sin(now * 0.0017 + p.tx * 0.03) * 0.08
              : 0.78 + Math.sin(now * 0.002 + p.tx * 0.04) * 0.18
            : 1;
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    };
    const handlePointerLeave = () => {
      mouse.active = false;
    };
    const handleResize = () => resize();

    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    img.onload = () => {
      if (disposed) return;
      resize();
      if (reduceMotion) {
        renderStatic();
      } else {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    return () => {
      disposed = true;
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={stageRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "relative", zIndex: 2, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
};

export default HeroLogoParticles;
