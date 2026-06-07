import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SecuritySection } from "@/components/landing/security-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ProjectsPreviewSection } from "@/components/landing/projects-preview-section";
import { BlogPreviewSection } from "@/components/landing/blog-preview-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { getRecentPosts } from "@/lib/blog";
import { getRecentProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, projects] = await Promise.all([
    getRecentPosts(3),
    getRecentProjects(3),
  ]);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <MetricsSection />
      <IntegrationsSection />
      <SecuritySection />
      <DevelopersSection />
      <ProjectsPreviewSection projects={projects} />
      <TestimonialsSection />
      <BlogPreviewSection posts={posts} />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
