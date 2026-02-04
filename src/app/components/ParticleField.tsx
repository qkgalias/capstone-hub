"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  radius: number;
  phase: number;
  bobPhase: number;
  bobOffset: number;
};

const PARTICLE_COUNT = 600;
const DRIFT_SPEED_MIN = 0.028;
const DRIFT_SPEED_MAX = 0.065;
const REPULSION_RADIUS = 200;
const REPULSION_FORCE = 0.0045;
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

    const findSpawnPosition = (
      particles: Particle[],
      widthValue: number,
      heightValue: number
    ) => {
      if (particles.length === 0) {
        return { x: Math.random() * widthValue, y: Math.random() * heightValue };
      }

      let bestX = Math.random() * widthValue;
      let bestY = Math.random() * heightValue;
      let bestScore = -1;
      const samples = 10;

      for (let i = 0; i < samples; i += 1) {
        const candidateX = Math.random() * widthValue;
        const candidateY = Math.random() * heightValue;
        let minDistSq = Number.POSITIVE_INFINITY;

        for (let j = 0; j < particles.length; j += 1) {
          const dx = candidateX - particles[j].x;
          const dy = candidateY - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) minDistSq = distSq;
        }

        if (minDistSq > bestScore) {
          bestScore = minDistSq;
          bestX = candidateX;
          bestY = candidateY;
        }
      }

      return { x: bestX, y: bestY };
    };

    const createParticle = (x: number, y: number) => {
      const speed =
        DRIFT_SPEED_MIN +
        Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN);
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * speed,
        vy: -speed,
        ox: x,
        oy: y,
        radius: 0.9 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        bobPhase: Math.random() * Math.PI * 2,
        bobOffset: Math.random() * 6 + 2
      };
    };

    const resetParticle = (particle: Particle) => {
      const spawn = findSpawnPosition(particlesRef.current, width, height);
      const x = spawn.x;
      const y = spawn.y;
      const speed =
        DRIFT_SPEED_MIN +
        Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN);
      particle.x = x;
      particle.y = y;
      particle.ox = x;
      particle.oy = y;
      particle.vx = (Math.random() - 0.5) * speed;
      particle.vy = -speed;
      particle.radius = 0.9 + Math.random() * 0.6;
      particle.phase = Math.random() * Math.PI * 2;
      particle.bobPhase = Math.random() * Math.PI * 2;
      particle.bobOffset = Math.random() * 6 + 2;
    };

    const tick = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(229, 231, 235, 0.7)";

      const cursor = cursorRef.current;
      const repulsionRadiusSq = REPULSION_RADIUS * REPULSION_RADIUS;
      const linkRadiusSq = LINK_RADIUS * LINK_RADIUS;
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        if (cursor.active) {
          const dx = cursor.x - p.x;
          const dy = cursor.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < repulsionRadiusSq) {
            const dist = Math.sqrt(distSq) || 1;
            const push = (1 - dist / REPULSION_RADIUS) * REPULSION_FORCE;
            p.vx -= (dx / dist) * push;
            p.vy -= (dy / dist) * push;
          }
        } else {
          const dxHome = p.ox - p.x;
          const dyHome = p.oy - p.y;
          p.vx += dxHome * 0.0045;
          p.vy += dyHome * 0.0045;
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

        if (p.y < -10 || p.y > height + 10 || p.x < -10 || p.x > width + 10) {
          resetParticle(p);
        }
      }

      context.globalAlpha = 1;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const breathe = Math.sin(time * 0.0016 + p.phase) * 0.85;
        const size = Math.max(0.6, p.radius + breathe);
        const bob = Math.sin(time * 0.0012 + p.bobPhase) * p.bobOffset;
        context.beginPath();
        context.arc(p.x, p.y + bob, size, 0, Math.PI * 2);
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
    const initialParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const spawn = findSpawnPosition(initialParticles, width, height);
      initialParticles.push(createParticle(spawn.x, spawn.y));
    }
    particlesRef.current = initialParticles;

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
