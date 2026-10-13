"use client";
import { useLayoutEffect, useRef } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import { studioAssets } from "@/lib/studio-assets";

// Values captured from KOTA's Intro-1 through Intro-8 and exit variants.
const entrances = [600, -550, 500, -450, 400, -350, 300, -250];
const delays = [0.5, 0.65, 0.8, 0.95, 1.1, 1.25, 1.4, 1.5];
const spring = { type: "spring" as const, stiffness: 400, damping: 100, mass: 1 };

export function StudioLoader() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("is-loaded");
      return;
    }
    const animations: AnimationPlaybackControls[] = [];
    const tablet = window.innerWidth >= 810 && window.innerWidth < 1200;
    element.querySelectorAll<HTMLElement>(".loader-card-motion").forEach((card, index) => {
      const quickSpring = tablet && (index === 5 || index === 7);
      animations.push(animate(card, { x: [entrances[index], 0], y: [1000, 0], opacity: [quickSpring ? 0.001 : 1, 1] }, {
        ...(quickSpring ? { type: "spring" as const, bounce: 0.2, duration: 0.4 } : spring),
        delay: delays[index],
      }));
    });
    if (window.innerWidth >= 810) element.querySelectorAll<HTMLElement>(".loader-label span").forEach((letter, index) => {
      animations.push(animate(letter, { filter: ["blur(8px)", "blur(0px)"], opacity: [0.001, 1] }, {
        delay: 0.05 * index, duration: 1, ease: [0.3, 0, 0.2, 1],
      }));
    });
    const count = element.querySelector<HTMLElement>(".loader-progress")!;
    animations.push(animate(0, 100, {
      ...spring, delay: 0.5,
      onUpdate: (value) => { count.textContent = `${Math.round(value)}%`; },
    }));
    animations.push(animate(-1, 100, {
      ...spring, delay: 3.25,
      onUpdate: (value) => {
        const mask = `linear-gradient(0deg, transparent ${value}%, black ${value + 1}%)`;
        element.style.maskImage = mask;
        element.style.webkitMaskImage = mask;
      },
      onComplete: () => element.classList.add("is-loaded"),
    }));
    return () => animations.forEach((animation) => animation.stop());
  }, []);
  return (
    <div ref={root} className="studio-loader" aria-hidden="true">
      <span className="loader-label">{[..."Makezaa Studio"].map((letter, index) => <span key={index}>{letter}</span>)}</span>
      <div className="loader-cards">
        {studioAssets.loaderImages.map((src, index) => (
          <div className="loader-card" key={src}>
            <div className="loader-card-motion" style={{ transform: `translate(${entrances[index]}px, 1000px)` }}>
              <picture>
                <source media="(max-width: 809px)" srcSet={studioAssets.loaderMobileImages[index]} />
                <img src={src} alt="" loading="eager" />
              </picture>
            </div>
          </div>
        ))}
      </div>
      <span className="loader-progress">0%</span>
    </div>
  );
}
