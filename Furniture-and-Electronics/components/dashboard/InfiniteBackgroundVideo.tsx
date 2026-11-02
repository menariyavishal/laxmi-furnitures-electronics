"use client";

import React, { useRef, useState, useEffect } from "react";

interface InfiniteBackgroundVideoProps {
  src: string;
  overlayOpacity?: number;
  crossfadeDurationMs?: number;
}

/**
 * InfiniteBackgroundVideo
 *
 * Implements a dual-layer cross-fade engine to create a truly seamless,
 * infinite loop without stutter, frame flicker, or abrupt cuts when the video restarts.
 *
 * Features:
 * - Dual-video cross-fade ping-pong (Layer A & Layer B)
 * - Hardware GPU accelerated (transform: translateZ(0))
 * - Auto-pauses when the tab is hidden to save 100% CPU/GPU resources
 * - Deep emerald atmospheric tint overlay
 */
export default function InfiniteBackgroundVideo({
  src = "/background.mp4",
  overlayOpacity = 0.4,
  crossfadeDurationMs = 1200,
}: InfiniteBackgroundVideoProps) {
  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);

  // activeLayer: 'A' | 'B' (the one currently fading in or fully visible)
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    // Start video A
    vA.play().catch(() => {
      // Browser autoplay policy fallback (muted ensures autoplay succeeds)
    });

    const checkTime = () => {
      const activeVideo = activeLayer === "A" ? vA : vB;
      const nextVideo = activeLayer === "A" ? vB : vA;

      if (!activeVideo.duration || isNaN(activeVideo.duration)) return;

      const timeLeft = activeVideo.duration - activeVideo.currentTime;
      const crossfadeTriggerSec = crossfadeDurationMs / 1000;

      // When the active video is near its end, trigger the cross-fade
      if (timeLeft <= crossfadeTriggerSec && !isTransitioningRef.current) {
        isTransitioningRef.current = true;

        // Reset and play the next video from the beginning
        nextVideo.currentTime = 0;
        nextVideo.play().catch(() => {});

        // Switch active layer (triggers CSS opacity transition)
        setActiveLayer((prev) => (prev === "A" ? "B" : "A"));

        // Reset transitioning lock after crossfade completes
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, crossfadeDurationMs);
      }
    };

    const interval = setInterval(checkTime, 100);

    // Visibility Listener: pause videos when tab is in background to save 100% CPU/GPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        vA.pause();
        vB.pause();
      } else {
        if (activeLayer === "A") vA.play().catch(() => {});
        else vB.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeLayer, crossfadeDurationMs]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
      {/* Video Layer A */}
      <video
        ref={videoRefA}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: activeLayer === "A" ? 1 : 0,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      />

      {/* Video Layer B */}
      <video
        ref={videoRefB}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: activeLayer === "B" ? 1 : 0,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      />

      {/* Frosted Glass Readability Overlay with Off-White Ambient Tint */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ backgroundColor: `rgba(245, 242, 237, ${overlayOpacity})` }}
      />
    </div>
  );
}

