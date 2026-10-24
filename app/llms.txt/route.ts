import { discoveryResponse, llmsText } from '@/lib/ai-discovery';

export function GET() {
  return discoveryResponse(llmsText(), 'text/plain');
}
