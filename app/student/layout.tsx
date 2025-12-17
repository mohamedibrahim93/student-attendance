import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { NavBar } from '@/components/nav-bar';

export default async function StudentLayout({
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

  if (!profile || profile.role !== 'student') {
    redirect('/');
  }

  const navItems = [
    { href: '/student', label: 'Check In', icon: 'clipboard-check' },
    { href: '/student/attendance', label: 'My Attendance', icon: 'calendar' },
    { href: '/student/schedule', label: 'Schedule', icon: 'clock' },
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
