import { SplitText } from "./motion";
import { studioAssets } from "@/lib/studio-assets";
export function StudioAbout() {
  return (
    <section
      id="about"
      className="studio-about studio-section"
      data-nav-theme="light"
    >
      <span className="eyebrow">About</span>
      <h2 className="about-statement">
        <SplitText
          scrub
          text="You’ve already built something great. Whether it’s just taking shape or already scaling — it deserves a website that matches the work you’ve put in. Makezaa Studio has everything you need to make that happen."
        />
      </h2>
      <div className="about-details">
        <div className="about-art">
          <img src={studioAssets.loaderImages[2]} alt="" />
          <img src={studioAssets.loaderImages[4]} alt="" />
        </div>
        <div className="about-stat">
          <span>Websites launched</span>
          <strong>
            <span data-counter="600">600</span>+
          </strong>
          <p>
            <SplitText text="We design and ship websites, commerce stores, and business systems for founders and teams around the world." />
          </p>
        </div>
      </div>
    </section>
  );
}
