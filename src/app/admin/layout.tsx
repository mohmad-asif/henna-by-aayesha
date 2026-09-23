import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-nav';

export const metadata: Metadata = {
  title: 'Admin Control Panel | Henna by Aayesha',
  description: 'Manage mehndi designs, services, gallery, testimonials, and site settings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
