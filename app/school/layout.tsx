import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/nav-bar';

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is school admin or supervisor
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user.id)
    .single();

  if (!profile || !['school_admin', 'supervisor'].includes(profile.role)) {
    redirect('/login');
  }

  const navItems = [
    { href: '/school', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/school/classes', label: 'Classes', icon: 'book-open' },
    { href: '/school/students', label: 'Students', icon: 'graduation-cap' },
    { href: '/school/teachers', label: 'Teachers', icon: 'users' },
    { href: '/school/subjects', label: 'Subjects', icon: 'clipboard-list' },
    { href: '/school/attendance', label: 'Attendance', icon: 'check-square' },
    { href: '/school/requests', label: 'Requests', icon: 'inbox' },
    { href: '/school/reports', label: 'Reports', icon: 'bar-chart-3' },
    { href: '/school/announcements', label: 'Announcements', icon: 'megaphone' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar user={profile} navItems={navItems} schoolName={profile.school?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

