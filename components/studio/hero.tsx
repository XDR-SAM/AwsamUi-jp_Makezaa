"use client";
import dynamic from "next/dynamic";
import { StudioClock } from "./clock";
import { SplitText } from "./motion";
import { studioAssets } from "@/lib/studio-assets";
const ChromeMark = dynamic(() => import("./chrome-mark"), {
  ssr: false,
  loading: () => (
    <span className="chrome-mark">
      <img src={studioAssets.chromeFallback} alt="" />
    </span>
  ),
});

export function StudioHero() {
  return (
    <section id="top" className="studio-hero" data-nav-theme="dark">
      <div className="hero-backdrop">
        <img
          src={studioAssets.heroBackground}
          alt=""
          fetchPriority="high"
          data-parallax
        />
        <div className="hero-shade" />
      </div>
      <div className="hero-main">
        <span className="expert-badge">
          <span>✦</span> Independent digital studio
        </span>
        <h1
          className="hero-title"
          aria-label="Turning ideas into high-impact digital experiences"
        >
          <span className="hero-line">
            <SplitText text="Turning ideas" /> <SplitText text="into" />
          </span>
          <span className="hero-line hero-line-middle">
            <span className="hero-mini-film" id="hero-film-anchor">
              <img src={studioAssets.loaderImages[0]} alt="" />
            </span>
            <SplitText text="high — impact" />
          </span>
          <span className="hero-line hero-line-last">
            <SplitText text="digital" />
            <ChromeMark />
            <SplitText text="experiences" />
          </span>
        </h1>
        <span className="available-shimmer">Available for new projects</span>
      </div>
      <div className="hero-bottom">
        <StudioClock />
        <p>
          <SplitText text="Makezaa Studio creates thoughtful, interactive websites" />
          <br />
          <SplitText text="and digital systems that move your business forward." />
        </p>
        <a className="scroll-cue" href="#showreel">
          <span>Scroll for more</span>
          <i />
        </a>
      </div>
    </section>
  );
}
