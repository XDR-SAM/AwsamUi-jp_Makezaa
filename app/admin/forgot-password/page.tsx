import { PasswordRecoveryForm } from '@/components/admin/password-recovery-form';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <PasswordRecoveryForm invalidLink={error === 'invalid-link'} />;
}
