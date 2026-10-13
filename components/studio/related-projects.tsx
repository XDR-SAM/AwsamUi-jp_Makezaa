"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectCard, type ProjectPreview } from "./projects";
import { SplitText } from "./motion";

export function RelatedProjects({ projects }: { projects: ProjectPreview[] }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 810px) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          gsap.fromTo(
            ".related-column:first-child",
            { y: 80 },
            {
              y: -80,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            },
          );
          gsap.fromTo(
            ".related-column:last-child",
            { y: 160 },
            {
              y: -40,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            },
          );
        }, element);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, []);
  if (!projects.length) return null;
  return (
    <section ref={root} className="project-more" data-nav-theme="light">
      <h2>
        <SplitText text="Explore More Projects" />
      </h2>
      <div className="related-project-columns">
        {[0, 1].map((column) => (
          <div className="related-column" key={column}>
            {projects
              .filter((_, index) => index % 2 === column)
              .map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  related
                />
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
