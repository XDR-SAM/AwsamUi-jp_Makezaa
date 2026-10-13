import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { StudioMotion } from "@/components/studio/motion";
import { ProjectGrid } from "@/components/studio/projects";
import { StudioCta } from "@/components/studio/cta";
import { getPublishedProjects } from "@/lib/projects";
import { pageMetadata, previewImage } from "@/lib/seo";
import { projectGallery } from "@/lib/project-gallery";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Projects",
  "Selected work — websites, apps, and digital products built by Makezaa.",
  "/projects",
  previewImage("site", "projects"),
);
export default async function ProjectsPage() {
  const all = await getPublishedProjects();
  const projects = [
    ...all.filter((p) => p.featured),
    ...all.filter((p) => !p.featured),
  ];
  return (
    <StudioMotion>
      <main id="top" className="project-index" data-nav-theme="light">
        <Navigation />
        <h1 className="sr-only">Makezaa Projects</h1>
        <ProjectGrid
          projects={projects.map((project) => ({
            id: project.id,
            title: project.title,
            slug: project.slug,
            cover_image: project.cover_image,
            tech_stack: project.tech_stack,
            featured: project.featured,
            preview_image: projectGallery(project)[1]?.src,
          }))}
        />
        <StudioCta meeting={false} />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
