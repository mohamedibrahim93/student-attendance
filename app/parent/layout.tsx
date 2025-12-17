import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { NavBar } from '@/components/nav-bar';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const locale = await getLocale();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    redirect('/');
  }

  // Check if parent is approved
  if (!profile.is_approved) {
    // Parent needs approval, show pending page
  }

  // Count unread notifications
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  const navItems = [
    { href: '/parent', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/parent/attendance', label: 'Attendance', icon: 'clipboard-check' },
    { href: '/parent/requests', label: 'Absence Requests', icon: 'send' },
    { href: '/parent/evaluations', label: 'Evaluations', icon: 'bar-chart-3' },
    { href: '/parent/notifications', label: 'Notifications', icon: 'bell', badge: unreadCount || 0 },
    { href: '/parent/reports', label: 'Reports', icon: 'file-text' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar user={profile} navItems={navItems} schoolName={profile.school?.name} locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
