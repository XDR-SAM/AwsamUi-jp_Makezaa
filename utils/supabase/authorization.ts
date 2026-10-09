import type { User } from '@supabase/supabase-js';

// app_metadata is controlled by the Auth admin API; user_metadata is editable.
export function isAdmin(user: User | null): boolean {
  return !!user && user.app_metadata?.role === 'admin';
}
