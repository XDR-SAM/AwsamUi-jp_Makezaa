"use client";
import { useRef, useState, useEffect } from "react";
import { AmbientVideo } from "./ambient-video";
import { studioAssets } from "@/lib/studio-assets";

export function StudioReel() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
      <div className="reel-frame">
        <AmbientVideo
          src={studioAssets.reel}
          poster={studioAssets.heroBackground}
        />
        <div className="reel-shade" />
        <span className="reel-duration">[ 00:44 ]</span>
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
