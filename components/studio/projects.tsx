"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/lib/types";
import { studioAssets } from "@/lib/studio-assets";
import { SplitText } from "./motion";

export function ProjectVisual({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <div className="project-art">
      <img
        src={project.cover_image || studioAssets.projectVisuals[index % 5]}
        alt={project.cover_image ? project.title : ""}
        loading="lazy"
      />
      <span className="project-hover">View project ↗</span>
    </div>
  );
}

export function StudioProjects({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sectionElement = root.current;
    const trackElement = track.current;
    if (!sectionElement || !trackElement) return;
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 810px) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          if (projects.length < 2) return;
          gsap.to(trackElement, {
            x: () =>
              -Math.max(
                0,
                trackElement.scrollWidth - sectionElement.clientWidth + 80,
              ),
            ease: "none",
            scrollTrigger: {
              trigger: sectionElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) =>
                setActive(
                  Math.min(
                    projects.length - 1,
                    Math.floor(self.progress * projects.length),
                  ),
                ),
            },
          });
        }, sectionElement);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, [projects.length]);
  return (
    <section
      id="projects"
      ref={root}
      className={`studio-projects ${projects.length < 2 ? "single-project" : ""}`}
      data-nav-theme="dark"
    >
      <div className="projects-sticky">
        <div className="work-heading">
          <div className="work-pagination" aria-label="Project progress">
            {projects.map((p, i) => (
              <span className={active === i ? "active" : ""} key={p.id}>
                {i + 1}
              </span>
            ))}
          </div>
          <Link href="/projects" className="rolling-link">
            <span data-text="View all projects">View all projects</span>↗
          </Link>
          <h2>
            <SplitText text="Selected Projects" />
          </h2>
        </div>
        <div ref={track} className="project-track">
          {projects.map((project, index) => (
            <Link
              className="project-slide"
              href={`/projects/${project.slug}`}
              key={project.id}
            >
              <ProjectVisual project={project} index={index} />
              <div className="project-caption">
                <h3>{project.title}</h3>
                <p>
                  {project.tech_stack?.slice(0, 2).join(" · ") ||
                    "Digital experience"}
                </p>
              </div>
            </Link>
          ))}
          {projects.length === 0 ? (
            <div className="work-empty">
              <h3>Your next project belongs here.</h3>
              <p>Explore what we can create for your business.</p>
              <Link href="/contact" className="glass-pill">
                Start a project ↗
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");
  const shown =
    filter === "featured" ? projects.filter((p) => p.featured) : projects;
  return (
    <>
      <div className="catalog-filters" aria-label="Project filters">
        <button
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          All ({projects.length}),
        </button>
        <button
          onClick={() => setFilter("featured")}
          aria-pressed={filter === "featured"}
        >
          Featured ({projects.filter((p) => p.featured).length}),
        </button>
      </div>
      <div className="studio-catalog">
        {shown.map((project, index) => (
          <Link
            className="catalog-card"
            key={project.id}
            href={`/projects/${project.slug}`}
          >
            <ProjectVisual project={project} index={index} />
            <div className="catalog-caption">
              <h2>
                {project.title}{" "}
                <span>/ {project.tech_stack?.[0] || "Digital"}</span>
              </h2>
              <p>{project.description}</p>
              {project.featured ? (
                <span className="catalog-featured">Featured project</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="studio-empty">
          <h2>
            {filter === "featured"
              ? "More work, coming soon."
              : "Let’s create something worth showing."}
          </h2>
          <Link href="/contact" className="glass-pill">
            Start a project ↗
          </Link>
        </div>
      ) : null}
    </>
  );
}
