"use client";

import React, { useEffect, useRef } from "react";
import { TimelineStage } from "../timeline/ProgressTimeline";

interface CloudBackgroundProps {
  currentStage: TimelineStage;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
}

export default function CloudBackground({ currentStage }: CloudBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<TimelineStage>(currentStage);

  // Sync state stage ref for canvas loop
  useEffect(() => {
    stageRef.current = currentStage;
  }, [currentStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Setup particles count based on screen size
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];

    // Check media query for prefers-reduced-motion
    let reducedMotion = false;
    if (typeof window !== "undefined") {
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Color definitions
    const isDark = () => document.documentElement.classList.contains("dark");
    const getParticleColor = () => (isDark() ? "51, 92, 181" : "37, 99, 235");

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        baseAlpha: Math.random() * 0.4 + 0.1,
        color: getParticleColor(),
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Visibility Listener to pause execution when tab is hidden
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Main animation loop
    const render = () => {
      if (!isTabVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Gradient background glow (subtle, very slow drifting center)
      const gradientX = width / 2;
      const gradientY = height / 2;
      const gradientRadius = Math.max(width, height) * 0.6;
      const radialGradient = ctx.createRadialGradient(
        gradientX,
        gradientY,
        0,
        gradientX,
        gradientY,
        gradientRadius
      );

      if (isDark()) {
        radialGradient.addColorStop(0, "rgba(15, 23, 42, 0.4)");
        radialGradient.addColorStop(1, "rgba(9, 13, 26, 0.95)");
      } else {
        radialGradient.addColorStop(0, "rgba(239, 246, 255, 0.6)");
        radialGradient.addColorStop(1, "rgba(248, 250, 252, 0.95)");
      }
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      const stage = stageRef.current;
      const colorStr = getParticleColor();

      // Dynamic variables based on current stages
      let attractX = width / 2;
      let attractY = height / 2;
      let isAttracting = false;
      let forceStrength = 0.01;

      // Map stages to attractor centers
      if (stage === "analyze") {
        // Particles move slightly toward workspace (let's assume workspace is mid-left)
        attractX = width * 0.35;
        attractY = height * 0.5;
        isAttracting = true;
        forceStrength = 0.02;
      } else if (stage === "permissions" || stage === "metadata") {
        // Slow circulation across paths
        isAttracting = true;
        attractX = width * 0.5;
        attractY = height * 0.5;
        forceStrength = 0.01;
      } else if (stage === "packaging" || stage === "compression") {
        // Converge toward the right/bottom progress timeline
        attractX = width * 0.75;
        attractY = height * 0.6;
        isAttracting = true;
        forceStrength = 0.05;
      } else if (stage === "ready") {
        // Compact cluster in center
        attractX = width * 0.5;
        attractY = height * 0.5;
        isAttracting = true;
        forceStrength = 0.12;
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.color = colorStr; // dynamically track theme change

        if (!reducedMotion) {
          if (isAttracting) {
            // Apply attractor force with soft drift
            const dx = attractX - p.x;
            const dy = attractY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (stage === "ready" && dist < 120) {
              // Once close in ready state, orbit or slowly dissolve
              p.vx = (p.vx + (dy / dist) * 0.8) * 0.9;
              p.vy = (p.vy - (dx / dist) * 0.8) * 0.9;
            } else {
              p.vx += (dx / dist) * forceStrength;
              p.vy += (dy / dist) * forceStrength;

              // Friction / Speed limit
              const maxSpeed = stage === "ready" ? 8 : 2.5;
              const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
              if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
              }
            }
          } else {
            // Idle natural drifting
            p.vx += (Math.random() - 0.5) * 0.02;
            p.vy += (Math.random() - 0.5) * 0.02;

            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
            if (speed > 0.4) {
              p.vx = (p.vx / speed) * 0.4;
              p.vy = (p.vy / speed) * 0.4;
            }
          }

          // Move particles
          p.x += p.vx;
          p.y += p.vy;

          // Soft boundary wrap
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p.color}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Pulse size / alpha
        if (!reducedMotion) {
          p.alpha = p.baseAlpha + Math.sin(Date.now() * 0.001 + i) * 0.05;
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = stage === "ready" ? 8 : 2;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-700"
    />
  );
}
