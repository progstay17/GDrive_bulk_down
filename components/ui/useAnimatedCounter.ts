"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Animate a counter value naturally using requestAnimationFrame with cubic ease-out.
 * Interruptible, supports increasing and decreasing.
 */
export function useAnimatedCounter(targetValue: number, duration: number = 800): number {
  const [current, setCurrent] = useState(targetValue);
  const currentValRef = useRef(targetValue);
  const startValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Start animation from whatever visual value we currently have
    startValueRef.current = currentValRef.current;
    targetValueRef.current = targetValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const progress = timestamp - startTimeRef.current;
      const timeRatio = Math.min(progress / duration, 1);

      // Cubic ease-out easing formula
      const easeOutCubic = 1 - Math.pow(1 - timeRatio, 3);
      const nextVal = startValueRef.current + (targetValueRef.current - startValueRef.current) * easeOutCubic;

      const rounded = Math.round(nextVal);
      currentValRef.current = rounded;
      setCurrent(rounded);

      if (timeRatio < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return current;
}
