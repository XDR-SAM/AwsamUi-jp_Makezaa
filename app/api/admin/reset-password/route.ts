import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/utils/supabase/require-admin';

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await assertAdmin();
  } catch {
    return NextResponse.json({ error: 'Your reset link has expired. Request a new link.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.password !== 'string' || body.password.length < 12 || body.password.length > 128) {
    return NextResponse.json({ error: 'Use a password between 12 and 128 characters.' }, { status: 400 });
  }
  const { error } = await session.supabase.auth.updateUser({ password: body.password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: signOutError } = await session.supabase.auth.signOut({ scope: 'global' });
  if (signOutError) return NextResponse.json({ error: 'Password updated, but sign-out failed. Please sign out from your other devices.' }, { status: 500 });
  return NextResponse.json({ message: 'Password updated. Sign in with your new password.' });
}
