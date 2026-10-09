import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/utils/supabase/authorization';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const supabase = createClient(await cookies());
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (isAdmin(user)) {
        const response = NextResponse.redirect(new URL('/admin/reset-password', request.url));
        response.headers.set('Cache-Control', 'private, no-store');
        response.headers.set('Referrer-Policy', 'no-referrer');
        return response;
      }
      await supabase.auth.signOut({ scope: 'local' });
    }
  }
  return NextResponse.redirect(new URL('/admin/forgot-password?error=invalid-link', request.url));
}
