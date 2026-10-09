import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/mcp') || request.nextUrl.pathname.startsWith('/.well-known/') || (request.nextUrl.pathname.startsWith('/api/oauth/') && request.method === 'GET') || request.nextUrl.pathname.startsWith('/api/agent/v1/')) {
    const { NextResponse } = await import('next/server');
    return NextResponse.next();
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
