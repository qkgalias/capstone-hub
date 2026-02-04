"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const PARTICLE_COUNT = 400;
const DRIFT_SPEED_MIN = 0.018;
const DRIFT_SPEED_MAX = 0.045;
const ATTRACTION_RADIUS = 200;
const ATTRACTION_FORCE = 0.006;
const LINK_RADIUS = 50;

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cursorRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let lastTime = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * window.devicePixelRatio);
      canvas.height = Math.floor(height * window.devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
      );
    };

    const createParticle = (x: number, y: number) => {
      const speed =
        DRIFT_SPEED_MIN +
        Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN);
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * speed,
        vy: -speed
      };
    };

    const tick = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(229, 231, 235, 0.7)";

      const cursor = cursorRef.current;
      const attractionRadiusSq = ATTRACTION_RADIUS * ATTRACTION_RADIUS;
      const linkRadiusSq = LINK_RADIUS * LINK_RADIUS;
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        if (cursor.active) {
          const dx = cursor.x - p.x;
          const dy = cursor.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < attractionRadiusSq) {
            const dist = Math.sqrt(distSq) || 1;
            const pull = (1 - dist / ATTRACTION_RADIUS) * ATTRACTION_FORCE;
            p.vx += (dx / dist) * pull;
            p.vy += (dy / dist) * pull;
          }
        }

        p.vx += (Math.random() - 0.5) * 0.001;
        p.vy += (Math.random() - 0.5) * 0.0004;
        p.x += p.vx * (delta / 16);
        p.y += p.vy * (delta / 16);

        if (cursor.active) {
          p.vx *= 0.985;
          p.vy *= 0.985;
        } else {
          p.vx *= 0.992;
          p.vy *= 0.992;
        }

        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
      }

      context.globalAlpha = 1;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        context.beginPath();
        context.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
        context.fill();
      }

      context.strokeStyle = "rgba(156, 163, 175, 0.18)";
      context.lineWidth = 1;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkRadiusSq) {
            const alpha = 1 - distSq / linkRadiusSq;
            context.globalAlpha = alpha * 0.5;
            context.beginPath();
            context.moveTo(particles[i].x, particles[i].y);
            context.lineTo(particles[j].x, particles[j].y);
            context.stroke();
          }
        }
      }
      context.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      cursorRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true
      };
    };

    const handleLeave = () => {
      cursorRef.current.active = false;
    };

    resize();
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(Math.random() * width, Math.random() * height)
    );

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerdown", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" />;
}
