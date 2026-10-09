import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/utils/supabase/authorization';

const message = 'If this email belongs to the admin, a password reset link has been sent. Check your inbox and spam folder.';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== 'string' || body.email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  const adminEmail = (process.env.MAKEZAA_ADMIN_EMAIL ?? 'tdxfarhan@gmail.com').toLowerCase();
  if (email !== adminEmail) return NextResponse.json({ message });

  try {
    const admin = createAdminClient();
    let allowed = false;
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      allowed = data.users.some(user => user.email?.toLowerCase() === email && isAdmin(user));
      if (allowed || data.users.length < 100) break;
    }
    if (!allowed) return NextResponse.json({ message });

    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/admin/auth/callback`,
    });
    if (error) {
      // Supabase enforces the email rate limit; don't reveal account details.
      const status = error.status === 429 ? 429 : 503;
      return NextResponse.json({ error: 'Unable to send a reset link right now. Please try again later.' }, { status });
    }
    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'Password recovery is unavailable. Please try again later.' }, { status: 503 });
  }
}
