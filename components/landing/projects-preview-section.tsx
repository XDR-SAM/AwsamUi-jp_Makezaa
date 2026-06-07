"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import type { Project } from "@/lib/types";

interface ProjectsPreviewSectionProps {
  projects: Project[];
}

export function ProjectsPreviewSection({ projects }: ProjectsPreviewSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="relative py-32 lg:py-40 bg-background overflow-hidden">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-12 h-px bg-border" />
              Portfolio
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              Selected projects
              <span className="text-muted-foreground">, shipped.</span>
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            View all projects
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center bg-card/40">
            <p className="text-muted-foreground text-sm">Projects coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className={`group border border-border rounded-2xl overflow-hidden bg-card/40 hover:border-foreground/20 hover:bg-card/60 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {project.cover_image && (
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={project.cover_image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {project.featured && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                        <Star size={10} className="fill-amber-400" /> Featured
                      </span>
                    )}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{project.description}</p>
                  )}
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {project.tech_stack.slice(0, 4).map(tech => (
                        <span key={tech} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
