import { agentText, discoveryResponse } from '@/lib/ai-discovery';

export function GET() {
  return discoveryResponse(agentText(), 'text/markdown');
}
