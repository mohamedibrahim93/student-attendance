import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/nav-bar';

export default async function MoELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is MoE admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'moe_admin') {
    redirect('/login');
  }

  const navItems = [
    { href: '/moe', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/moe/schools', label: 'Schools', icon: 'building-2' },
    { href: '/moe/teachers', label: 'Teachers', icon: 'users' },
    { href: '/moe/reports', label: 'Reports', icon: 'bar-chart-3' },
    { href: '/moe/announcements', label: 'Announcements', icon: 'megaphone' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar user={profile} navItems={navItems} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

