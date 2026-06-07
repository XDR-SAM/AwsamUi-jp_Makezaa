import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/landing/navigation';
import { FooterSection } from '@/components/landing/footer-section';
import { CmsContent } from '@/components/cms-content';
import { getProjectBySlug, getPublishedProjects } from '@/lib/projects';
import { ArrowLeft, ArrowRight, ExternalLink, Github, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Project Not Found | Makezaa' };
  return {
    title: `${project.title} | Makezaa Projects`,
    description: project.description ?? undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const allProjects = await getPublishedProjects();
  const relatedProjects = allProjects.filter(p => p.id !== project.id).slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <article className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to projects
          </Link>

          {project.cover_image && (
            <div className="rounded-2xl overflow-hidden border border-border mb-8">
              <img src={project.cover_image} alt={project.title} className="w-full h-64 md:h-80 object-cover" />
            </div>
          )}

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              {project.featured && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Star size={10} className="fill-amber-400" /> Featured
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-foreground tracking-tight leading-tight">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-lg text-muted-foreground mt-4">{project.description}</p>
            )}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {project.tech_stack.map(tech => (
                  <span key={tech} className="text-xs px-3 py-1 rounded-md bg-secondary text-muted-foreground font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-6">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={14} /> View Live
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github size={14} /> GitHub
                </a>
              )}
            </div>
          </header>

          {project.content && <CmsContent html={project.content} />}

          {relatedProjects.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6">More projects</h2>
              <div className="space-y-4">
                {relatedProjects.map(related => (
                  <Link
                    key={related.id}
                    href={`/projects/${related.slug}`}
                    className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-card/40 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors truncate">
                        {related.title}
                      </p>
                      {related.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{related.description}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 ml-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
      <FooterSection />
    </main>
  );
}
