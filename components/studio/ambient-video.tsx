"use client";
import { useEffect, useRef } from "react";
export function AmbientVideo({
  src,
  className = "",
  poster,
  label,
  enabled = true,
}: {
  src: string;
  className?: string;
  poster?: string;
  label?: string;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const playback = () => {
      if (inView && enabled && !reducedMotion.matches && !document.hidden)
        video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        playback();
      },
      { rootMargin: "100px" },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", playback);
    reducedMotion.addEventListener("change", playback);
    return () => {
      observer.disconnect();
      video.pause();
      document.removeEventListener("visibilitychange", playback);
      reducedMotion.removeEventListener("change", playback);
    };
  }, [src, enabled]);
  return (
    <video
      ref={ref}
      src={src}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      aria-hidden={!label}
    />
  );
}
