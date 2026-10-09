import { redirect } from 'next/navigation';
import { PasswordRecoveryForm } from '@/components/admin/password-recovery-form';
import { assertAdmin } from '@/utils/supabase/require-admin';

export default async function ResetPasswordPage() {
  try {
    await assertAdmin();
  } catch {
    redirect('/admin/forgot-password?error=invalid-link');
  }
  return <PasswordRecoveryForm reset />;
}
