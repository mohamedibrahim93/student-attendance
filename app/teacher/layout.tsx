import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavBar } from '@/components/nav-bar';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user.id)
    .single();

  if (!profile || !['teacher', 'supervisor'].includes(profile.role)) {
    redirect('/');
  }

  const navItems = [
    { href: '/teacher', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/teacher/attendance', label: 'Attendance', icon: 'clipboard-check' },
    { href: '/teacher/students', label: 'Students', icon: 'users' },
    { href: '/teacher/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/teacher/notes', label: 'Notes', icon: 'file-text' },
    { href: '/teacher/leave', label: 'Leave Requests', icon: 'clock' },
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
