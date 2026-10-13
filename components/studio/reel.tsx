"use client";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { AmbientVideo } from "./ambient-video";
import { studioAssets } from "@/lib/studio-assets";

export function StudioReel() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const destination = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    if (!mounted) return;
    const anchor = document.getElementById("hero-film-anchor");
    const target = destination.current;
    const floating = film.current;
    if (!anchor || !target || !floating) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let alive = true;
    let ready = false;
    const update = () => {
      frame = 0;
      if (!alive) return;
      const from = anchor.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const progress = reduced.matches
        ? 1
        : Math.max(0, Math.min(1, 1 - to.top / window.innerHeight));
      const mix = (a: number, b: number) => a + (b - a) * progress;
      const top = mix(from.top + (progress > 0 ? window.scrollY : 0), to.top);
      Object.assign(floating.style, {
        left: `${mix(from.left, to.left)}px`,
        top: `${top}px`,
        width: `${mix(from.width, to.width)}px`,
        height: `${mix(from.height, to.height)}px`,
        visibility:
          top > window.innerHeight || top + mix(from.height, to.height) < 0
            ? "hidden"
            : "visible",
      });
      floating.style.setProperty("--reel-reveal", String(progress));
      const next =
        progress >= 0.95 && to.bottom > 0 && to.top < window.innerHeight;
      if (ready !== next) {
        ready = next;
        setInteractive(next);
      }
      anchor.style.visibility = reduced.matches ? "visible" : "hidden";
    };
    const schedule = () => {
      if (!frame && alive) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    observer.observe(target);
    document.fonts.ready.then(schedule);
    update();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
      observer.disconnect();
      anchor.style.removeProperty("visibility");
    };
  }, [mounted]);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      video.current?.play().catch(() => {});
    } else {
      video.current?.pause();
      dialog.current?.close();
    }
  }, [open]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <section id="showreel" className="studio-reel" data-nav-theme="dark">
      <div className="reel-frame" ref={destination} />
      {mounted
        ? createPortal(
            <div className="hero-reel-film" ref={film}>
              <AmbientVideo
                src={studioAssets.heroFilm}
                poster={studioAssets.heroFilmPoster}
              />
              <div className="reel-controls" inert={!interactive}>
                <div className="reel-shade" />
                <span className="reel-duration">[ 00:24 ]</span>
                <button
                  ref={trigger}
                  className="reel-play"
                  onClick={() => setOpen(true)}
                  aria-label="Play studio showreel"
                >
                  <span>PLAY</span>
                  <span className="play-circle">↗</span>
                  <span>REEL</span>
                </button>
                <span className="reel-copyright">©2026</span>
              </div>
            </div>,
            document.body,
          )
        : null}
      <dialog
        data-lenis-prevent
        ref={dialog}
        className="reel-dialog"
        aria-label="Studio showreel"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <button
          className="glass-pill reel-close"
          aria-label="Close showreel"
          onClick={close}
        >
          ×
        </button>
        <video
          ref={video}
          src={studioAssets.reel}
          controls
          playsInline
          preload="none"
        />
      </dialog>
    </section>
  );
}
