import { Navigation } from "@/components/landing/navigation";
import { StudioMotion } from "@/components/studio/motion";
import { StudioLoader } from "@/components/studio/loader";
import { StudioHero } from "@/components/studio/hero";
import { StudioReel } from "@/components/studio/reel";
import { StudioAbout } from "@/components/studio/about";
import { StudioServices } from "@/components/studio/services";
import { StudioProcess } from "@/components/studio/process";
import { StudioStandards } from "@/components/studio/standards";
import { StudioTestimonials } from "@/components/studio/testimonials";
import { StudioProjects } from "@/components/studio/projects";
import { StudioInsights } from "@/components/studio/editorial";
import { StudioFaq } from "@/components/studio/faq";
import { StudioCta } from "@/components/studio/cta";
import { FooterSection } from "@/components/landing/footer-section";
import { getRecentPosts } from "@/lib/blog";
import { getRecentProjects } from "@/lib/projects";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, siteSchema, SITE_DESCRIPTION } from "@/lib/seo";

export const revalidate = 300;
export const metadata = {
  ...pageMetadata("Web Development & Digital Solutions", SITE_DESCRIPTION, "/"),
  title: { absolute: "Makezaa | Web Development & Digital Solutions" },
};

export default async function Home() {
  const [posts, projects] = await Promise.all([
    getRecentPosts(3),
    getRecentProjects(5),
  ]);

  return (
    <StudioMotion>
      <main>
        <JsonLd data={siteSchema()} />
        <Navigation />
        <StudioLoader />
        <StudioHero />
        <StudioReel />
        <StudioAbout />
        <StudioServices />
        <StudioProcess />
        <StudioStandards />
        <StudioTestimonials />
        <StudioProjects projects={projects.map(({ id, title, slug, cover_image, tech_stack, featured }) => ({ id, title, slug, cover_image, tech_stack, featured }))} />
        <StudioInsights posts={posts} />
        <StudioFaq />
        <StudioCta />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
