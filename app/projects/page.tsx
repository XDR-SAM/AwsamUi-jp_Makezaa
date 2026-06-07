import Link from 'next/link';
import { Navigation } from '@/components/landing/navigation';
import { FooterSection } from '@/components/landing/footer-section';
import { getPublishedProjects, getFeaturedProjects } from '@/lib/projects';
import { ExternalLink, Github, Star, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projects | Makezaa',
  description: 'Selected work — websites, apps, and digital products built by Makezaa.',
};

export default async function ProjectsPage() {
  const [allProjects, featured] = await Promise.all([
    getPublishedProjects(),
    getFeaturedProjects(),
  ]);

  const featuredIds = new Set(featured.map(p => p.id));
  const rest = allProjects.filter(p => !featuredIds.has(p.id));

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl">
              Real work for real clients — shipped on time, built to last.
            </p>
            {allProjects.length > 0 && (
              <p className="text-sm text-muted-foreground/70 mt-2">{allProjects.length} published {allProjects.length === 1 ? 'project' : 'projects'}</p>
            )}
          </div>

          {allProjects.length === 0 ? (
            <div className="border border-border rounded-2xl p-12 text-center bg-card/40">
              <p className="text-muted-foreground">No projects published yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Publish a project from the admin dashboard to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {featured.length > 0 && (
                <section>
                  <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Star size={14} className="text-amber-400 fill-amber-400" /> Featured
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featured.map(project => (
                      <ProjectCard key={project.id} project={project} featured />
                    ))}
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section>
                  {featured.length > 0 && (
                    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6">All Projects</h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

function ProjectCard({
  project,
  featured = false,
}: {
  project: Awaited<ReturnType<typeof getPublishedProjects>>[number];
  featured?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group border border-border rounded-2xl overflow-hidden bg-card/40 hover:border-foreground/20 hover:bg-card/60 transition-all duration-300 flex flex-col"
    >
      {project.cover_image ? (
        <div className="relative">
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {featured && (
            <span className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Star size={10} className="fill-amber-400" /> Featured
            </span>
          )}
        </div>
      ) : null}
      <div className="p-6 flex flex-col flex-1">
        <h2 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors">
          {project.title}
        </h2>
        {project.description && (
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2 flex-1">{project.description}</p>
        )}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {project.tech_stack.map(tech => (
              <span key={tech} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono">
                {tech}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          {project.live_url && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink size={12} /> Live
            </span>
          )}
          {project.github_url && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Github size={12} /> Source
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
