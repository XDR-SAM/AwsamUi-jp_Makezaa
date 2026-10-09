import type { Metadata } from 'next';
import { PRIVATE_ROBOTS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Admin', robots: PRIVATE_ROBOTS,
  openGraph: null, twitter: null, alternates: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
