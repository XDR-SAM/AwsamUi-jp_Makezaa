"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircularShowcase } from "./circular-showcase";
import type { Project } from "@/lib/types";
import { studioAssets } from "@/lib/studio-assets";
import { SplitText } from "./motion";
export type ProjectPreview = Pick<
  Project,
  "id" | "title" | "slug" | "cover_image" | "tech_stack" | "featured"
> & { preview_image?: string };

export function ProjectVisual({
  project,
  index = 0,
}: {
  project: ProjectPreview;
  index?: number;
}) {
  return (
    <div className="project-art">
      <img
        src={project.cover_image || studioAssets.projectVisuals[index % 5]}
        alt={project.cover_image ? project.title : ""}
        loading={index < 3 ? "eager" : "lazy"}
      />
      {project.preview_image ? (
        <img
          className="project-art-secondary"
          src={project.preview_image}
          alt=""
          loading="lazy"
        />
      ) : null}
      <span className="project-hover" aria-hidden="true">
        View project ↗
      </span>
    </div>
  );
}

export function StudioProjects({ projects }: { projects: ProjectPreview[] }) {
  if (!projects.length)
    return (
      <section id="projects" className="studio-section studio-empty">
        <h2>Your next project belongs here.</h2>
        <Link href="/contact" className="glass-pill">
          Start a project ↗
        </Link>
      </section>
    );
  return (
    <CircularShowcase
      id="projects"
      title="Selected Projects"
      allHref="/projects"
      allLabel="View all projects"
      items={projects.map((project, index) => ({
        id: project.id,
        title: project.title,
        href: `/projects/${project.slug}`,
        image: project.cover_image || studioAssets.projectVisuals[index % 5],
        meta:
          project.tech_stack?.slice(0, 2).join(" / ") || "Digital experience",
      }))}
    />
  );
}
export function ProjectCard({
  project,
  index = 0,
  related = false,
}: {
  project: ProjectPreview;
  index?: number;
  related?: boolean;
}) {
  const Heading = related ? "h3" : "h2";
  return (
    <Link className="catalog-card" href={`/projects/${project.slug}`}>
      <ProjectVisual project={project} index={index} />
      <div className="catalog-caption">
        <Heading>
          {project.title} <span>/ {project.tech_stack?.[0] || "Digital"}</span>
        </Heading>
      </div>
    </Link>
  );
}
export function ProjectGrid({ projects }: { projects: ProjectPreview[] }) {
  const [filter, setFilter] = useState("all");
  const grid = useRef<HTMLDivElement>(null);
  const shown =
    filter === "featured" ? projects.filter((p) => p.featured) : projects;
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.from(".catalog-card", {
          opacity: 0,
          y: 24,
          duration: 1.25,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "opacity,transform",
        });
      }, element);
      return () => context.revert();
    });
    return () => media.revert();
  }, [filter, projects.length]);
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
      <div className="studio-catalog" ref={grid}>
        {shown.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
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
