import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/projects';
import { ProjectEditor } from '@/components/admin/project-editor';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Edit Project</h1>
        <p className="text-sm text-zinc-500 mt-1">{project.title}</p>
      </div>
      <ProjectEditor project={project} />
    </div>
  );
}
