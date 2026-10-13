import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { CmsContent } from "@/components/cms-content";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { StudioCta } from "@/components/studio/cta";
import { studioAssets } from "@/lib/studio-assets";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";
import { JsonLd } from "@/components/json-ld";
import { projectMetadata, projectSchema, PRIVATE_ROBOTS } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return project
    ? projectMetadata(project)
    : { title: "Project Not Found", robots: PRIVATE_ROBOTS };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const related = (await getPublishedProjects())
    .filter((p) => p.id !== project.id)
    .slice(0, 3);
  return (
    <StudioMotion>
      <main id="top">
        <JsonLd data={projectSchema(project)} />
        <Navigation />
        <section className="studio-detail-hero" data-nav-theme="dark">
          <img
            className="detail-cover"
            src={project.cover_image || studioAssets.projectVisuals[0]}
            alt={project.cover_image ? project.title : ""}
            fetchPriority="high"
          />
          <div className="detail-actions">
            {project.live_url ? (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-pill"
              >
                View live ↗
              </a>
            ) : (
              <Link href="/projects" className="glass-pill">
                All projects ↗
              </Link>
            )}
            {project.github_url ? (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-pill"
              >
                Source code ↗
              </a>
            ) : null}
            <a href="#project-info" className="glass-pill">
              Project info ↓
            </a>
          </div>
        </section>
        <article
          id="project-info"
          className="detail-body"
          data-nav-theme="light"
        >
          <Link href="/projects" className="eyebrow">
            ← Back to projects
          </Link>
          {project.featured ? (
            <span className="eyebrow">Featured project</span>
          ) : null}
          <h1>
            <SplitText text={project.title} />
          </h1>
          {project.description ? (
            <p className="detail-description">{project.description}</p>
          ) : null}
          <div className="detail-tags">
            {project.tech_stack?.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          {project.content ? <CmsContent html={project.content} /> : null}
          {related.length ? (
            <section className="studio-related">
              <h2>More work from the studio.</h2>
              {related.map((p) => (
                <Link
                  className="related-link"
                  href={`/projects/${p.slug}`}
                  key={p.id}
                >
                  <span>{p.title}</span>
                  <span>↗</span>
                </Link>
              ))}
            </section>
          ) : null}
        </article>
        <StudioCta meeting={false} />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
