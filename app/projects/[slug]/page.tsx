import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { CmsContent } from "@/components/cms-content";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { ProjectGallery } from "@/components/studio/project-gallery";
import { RelatedProjects } from "@/components/studio/related-projects";
import { projectGallery } from "@/lib/project-gallery";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";
import { JsonLd } from "@/components/json-ld";
import { projectMetadata, projectSchema, PRIVATE_ROBOTS } from "@/lib/seo";

export const revalidate = 300;
export async function generateStaticParams() {
  return (await getPublishedProjects()).map(item => ({ slug: item.slug }));
}
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
  const [project, all] = await Promise.all([
    getProjectBySlug(slug),
    getPublishedProjects(),
  ]);
  if (!project) notFound();
  const related = all
    .filter((item) => item.id !== project.id)
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      cover_image: item.cover_image,
      tech_stack: item.tech_stack,
      featured: item.featured,
      preview_image: projectGallery(item)[1]?.src,
    }));
  return (
    <StudioMotion>
      <main className="project-case-study">
        <JsonLd data={projectSchema(project)} />
        <Navigation />
        <ProjectGallery
          key={project.id}
          title={project.title}
          images={projectGallery(project)}
          description={project.description}
          tech={project.tech_stack || []}
          liveUrl={project.live_url}
          githubUrl={project.github_url}
        />
        <article
          id="project-info"
          className="project-story"
          data-nav-theme="light"
        >
          <aside className="project-story-label">
            <p>Project details</p>
            <Link href="/projects">← All projects</Link>
            {project.featured ? <span>Featured project</span> : null}
          </aside>
          <div className="project-story-content">
            <h1>
              <SplitText text={project.title} />
            </h1>
            {project.description ? (
              <p className="project-story-intro">
                <SplitText text={project.description} scrub />
              </p>
            ) : null}
            <div className="detail-tags">
              {project.tech_stack?.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
            {project.content ? <CmsContent html={project.content} /> : null}
          </div>
        </article>
        <RelatedProjects key={project.id} projects={related} />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
