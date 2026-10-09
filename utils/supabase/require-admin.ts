import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from './server';
import { isAdmin } from './authorization';
import { cache } from 'react';
import { redirect } from 'next/navigation';

export const assertAdmin = cache(async () => {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isAdmin(user)) throw new Error('Unauthorized');
  return { supabase, user: user! };
});

export async function requireAdminPage() {
  try {
    return await assertAdmin();
  } catch {
    redirect('/admin/login');
  }
}
