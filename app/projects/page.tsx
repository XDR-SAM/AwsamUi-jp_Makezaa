import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { ProjectGrid } from "@/components/studio/projects";
import { StudioCta } from "@/components/studio/cta";
import { getPublishedProjects } from "@/lib/projects";
import { pageMetadata, previewImage } from "@/lib/seo";
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
      <main id="top" data-nav-theme="light">
        <Navigation />
        <header className="studio-page-header">
          <span className="eyebrow">Selected work / Makezaa Studio</span>
          <h1>
            <SplitText text="Built to make" />
            <br />
            <SplitText text="a difference." />
          </h1>
          <p>
            Real websites, applications, and digital systems. Thoughtfully
            designed, carefully built, and ready for the world.
          </p>
        </header>
        <ProjectGrid projects={projects} />
        <StudioCta meeting={false} />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
