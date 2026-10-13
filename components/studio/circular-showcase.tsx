"use client";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type ShowcaseItem = {
  id: string;
  title: string;
  image: string;
  href: string;
  meta: string;
};

export function CircularShowcase({
  id,
  title,
  items,
  allHref,
  allLabel,
}: {
  id: string;
  title: string;
  items: ShowcaseItem[];
  allHref: string;
  allLabel: string;
}) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    const section = root.current;
    if (!section || items.length < 2) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const backgrounds = section.querySelectorAll(".showcase-background");
        const images = section.querySelectorAll(".showcase-image");
        const captions = section.querySelectorAll(".showcase-caption");
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.45,
            onUpdate: (self) =>
              setActive(
                Math.min(
                  items.length - 1,
                  Math.floor(self.progress * (items.length - 1) + 0.35),
                ),
              ),
          },
        });
        for (let index = 1; index < items.length; index++) {
          const at = index - 0.65;
          timeline.fromTo(
            [backgrounds[index], images[index]],
            { y: 0, yPercent: 100 },
            { y: 0, yPercent: 0, duration: 0.65, ease: "none" },
            at,
          );
          timeline.fromTo(
            captions[index],
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.5, ease: "none" },
            at + 0.15,
          );
          timeline.to(
            captions[index - 1],
            { yPercent: -110, opacity: 0, duration: 0.4, ease: "none" },
            at,
          );
        }
      }, section);
      return () => context.revert();
    });
    return () => media.revert();
  }, [items.length]);

  return (
    <section
      ref={root}
      id={id}
      className="circular-showcase"
      data-nav-theme="dark"
      style={{ "--showcase-count": Math.max(1, items.length) } as CSSProperties}
    >
      {items.map((item, index) => (
        <span
          className="showcase-anchor"
          id={`showcase-${id}-${index}`}
          key={item.id}
          style={{ top: `${(index * 100) / items.length}%` }}
        />
      ))}
      <div className="showcase-sticky">
        <div className="showcase-backgrounds" aria-hidden="true">
          {items.map((item, index) => (
            <div
              className="showcase-background"
              key={item.id}
              style={{ transform: index ? "translateY(100%)" : undefined }}
            >
              <img src={item.image} alt="" loading="lazy" />
            </div>
          ))}
        </div>
        <h2 className="showcase-heading">{title}</h2>
        <div className="showcase-center">
          <div className="showcase-portal">
            {items.map((item, index) => (
              <Link
                href={item.href}
                className="showcase-image"
                key={item.id}
                style={{ transform: index ? "translateY(100%)" : undefined }}
                inert={!reduced && index !== active}
                aria-label={`View ${item.title}`}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
                <span className="showcase-open">
                  {id === "blog" ? "Read insight" : "View project"} ↗
                </span>
                <span className="showcase-static-title">{item.title}</span>
              </Link>
            ))}
          </div>
          <nav className="showcase-ring" aria-label={`${title} selection`}>
            <svg viewBox="0 0 500 500" aria-hidden="true">
              {items.map((item, index) => {
                const segment = (2 * Math.PI * 248) / items.length;
                return (
                  <circle
                    key={item.id}
                    cx="250"
                    cy="250"
                    r="248"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray={`${segment * 0.8} ${2 * Math.PI * 248 - segment * 0.8}`}
                    transform={`rotate(${-90 + (index * 360) / items.length + (360 / items.length) * 0.1} 250 250)`}
                    className={index === active ? "is-active" : ""}
                  />
                );
              })}
            </svg>
            {items.map((item, index) => {
              const angle =
                ((index + 0.5) / items.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <a
                  key={item.id}
                  href={`#showcase-${id}-${index}`}
                  className={index === active ? "is-active" : ""}
                  aria-label={`Show ${item.title}`}
                  aria-current={index === active ? "step" : undefined}
                  style={{
                    left: `${50 + Math.cos(angle) * 52}%`,
                    top: `${50 + Math.sin(angle) * 52}%`,
                  }}
                >
                  {index + 1}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="showcase-captions">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="showcase-caption"
              style={{ opacity: index ? 0 : 1 }}
              inert={index !== active}
            >
              <Link href={item.href}>
                <h3>{item.title}</h3>
              </Link>
              <p>{item.meta}</p>
            </div>
          ))}
        </div>
        <Link href={allHref} className="glass-pill showcase-all">
          {allLabel} ↗
        </Link>
      </div>
    </section>
  );
}
