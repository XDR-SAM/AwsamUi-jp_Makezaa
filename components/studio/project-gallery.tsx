"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ProjectGallery({
  title,
  images,
  description,
  tech,
  liveUrl,
  githubUrl,
}: {
  title: string;
  images: { src: string; alt: string }[];
  description: string | null;
  tech: string[];
  liveUrl: string | null;
  githubUrl: string | null;
}) {
  const root = useRef<HTMLElement>(null);
  const info = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gallery-step").forEach((step, index) =>
        ScrollTrigger.create({
          trigger: step,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setActive(index + 1),
          onEnterBack: () => setActive(index + 1),
          onLeaveBack: () => {
            if (index === 0) setActive(0);
          },
        }),
      );
    }, element);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const animation = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".gallery-preview").forEach((image) =>
          gsap.fromTo(
            image,
            { scale: 0.8 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: image.parentElement,
                start: "top bottom",
                end: "center center",
                scrub: 0.35,
              },
            },
          ),
        );
        const first = element.querySelector(".gallery-step");
        if (first) {
          gsap.to(".gallery-cover", {
            filter: "blur(16px)",
            ease: "none",
            scrollTrigger: {
              trigger: first,
              start: "top bottom",
              end: "top 30%",
              scrub: 0.35,
            },
          });
          gsap.to(".gallery-dimmer", {
            opacity: 0.6,
            ease: "none",
            scrollTrigger: {
              trigger: first,
              start: "top bottom",
              end: "top 30%",
              scrub: 0.35,
            },
          });
        }
      }, element);
      return () => animation.revert();
    });
    return () => {
      media.revert();
      context.revert();
    };
  }, [images.length]);
  return (
    <section
      ref={root}
      id="top"
      className="project-gallery"
      data-nav-theme="dark"
      style={{ "--preview-count": images.length } as CSSProperties}
    >
      <div className="gallery-base">
        <img
          className="gallery-cover"
          data-project-preview
          src={images[0].src}
          alt={images[0].alt}
          fetchPriority="high"
        />
        <div className="gallery-dimmer" />
      </div>
      <div className="gallery-preview-rail">
        {images.slice(1).map((image, index) => (
          <div
            className="gallery-step"
            id={`project-image-${index + 1}`}
            key={image.src}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="gallery-preview"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="gallery-controls">
        <nav className="gallery-thumbnails" aria-label="Project previews">
          {images.map((image, index) => (
            <a
              href={index ? `#project-image-${index}` : "#top"}
              key={image.src}
              aria-label={`View preview ${index + 1}`}
              aria-current={active === index ? "step" : undefined}
            >
              <img src={image.src} alt="" />
              <span aria-hidden="true">—</span>
            </a>
          ))}
        </nav>
        <div className="gallery-actions">
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill"
            >
              View live ↗
            </a>
          ) : (
            <Link href="/projects" className="glass-pill">
              All projects
            </Link>
          )}
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill"
            >
              Source code ↗
            </a>
          ) : (
            <Link href="/contact#contact-form" className="glass-pill">
              Start a project
            </Link>
          )}
          <button
            className="glass-pill"
            onClick={() => info.current?.showModal()}
          >
            Project Info
          </button>
        </div>
      </div>
      <dialog
        ref={info}
        data-lenis-prevent
        className="project-info-dialog"
        aria-label="Project information"
        onClick={(event) => {
          if (event.target === info.current) info.current.close();
        }}
      >
        <button
          className="glass-pill info-close"
          aria-label="Close project information"
          onClick={() => info.current?.close()}
        >
          ×
        </button>
        <h2>{title}</h2>
        <p className="info-label">Built with</p>
        <div className="detail-tags">
          {tech.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {description ? <p className="info-description">{description}</p> : null}
        <a
          href="#project-info"
          className="glass-pill"
          onClick={() => info.current?.close()}
        >
          Read project details ↓
        </a>
      </dialog>
    </section>
  );
}
