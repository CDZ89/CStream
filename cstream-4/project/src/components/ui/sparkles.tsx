"use client";
import React, { useId, useEffect, useState, useRef, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

type SparklesProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
  responsiveDensity?: boolean;
};

interface Particle {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  vx: number;
  vy: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

const SparklesCore = memo((props: SparklesProps) => {
  const {
    id,
    className,
    background = "transparent",
    minSize = 0.8,
    maxSize = 2,
    speed = 0.3,
    particleColor = "var(--theme-primary)",
    particleDensity = 60,
    responsiveDensity = true,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  const generatedId = useId();
  const canvasId = id || generatedId;

  const calculateDensity = useCallback(() => {
    if (!responsiveDensity) return particleDensity;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    if (width < 640) return Math.floor(particleDensity * 0.4);
    if (width < 1024) return Math.floor(particleDensity * 0.6);
    return particleDensity;
  }, [particleDensity, responsiveDensity]);

  const initParticles = useCallback((width: number, height: number) => {
    const count = calculateDensity();
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const baseOpacity = 0.4 + Math.random() * 0.5;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: minSize + Math.random() * (maxSize - minSize),
        baseOpacity,
        opacity: baseOpacity,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.02,
      });
    }
    particlesRef.current = particles;
  }, [calculateDensity, maxSize, minSize, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(width, height);
    };

    setupCanvas();
    setIsReady(true);

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const twinkle = Math.sin(frame * p.twinkleSpeed + p.twinklePhase);
        p.opacity = p.baseOpacity + twinkle * 0.3;

        ctx.save();
        ctx.globalAlpha = Math.max(0.15, Math.min(1, p.opacity));
        ctx.fillStyle = particleColor;
        ctx.shadowColor = particleColor;
        ctx.shadowBlur = p.size * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles, particleColor]);

  return (
    <div
      className={cn("absolute inset-0 w-full h-full", className)}
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        id={canvasId}
        className="absolute inset-0 w-full h-full"
        style={{ background }}
      />
    </div>
  );
});

SparklesCore.displayName = "SparklesCore";

export { SparklesCore };
