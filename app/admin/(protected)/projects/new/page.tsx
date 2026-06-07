import { ProjectEditor } from '@/components/admin/project-editor';

export default function NewProjectPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">New Project</h1>
        <p className="text-sm text-zinc-500 mt-1">Add a portfolio case study</p>
      </div>
      <ProjectEditor />
    </div>
  );
}
