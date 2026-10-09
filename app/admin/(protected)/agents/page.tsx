import { requireAdminPage } from '@/utils/supabase/require-admin';
import { AgentConsole } from '@/components/admin/agent-console';
export const dynamic = 'force-dynamic';
export default async function AgentsPage() {
  await requireAdminPage();
  return <AgentConsole />;
}
