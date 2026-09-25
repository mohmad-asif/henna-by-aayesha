import { redirect } from 'next/navigation';

export default function AnalyticsOverviewRedirect() {
  redirect('/admin/analytics');
}
