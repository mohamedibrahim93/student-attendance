'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  BookOpen,
  Building2,
  Megaphone,
  Inbox,
  Bell,
  ClipboardList,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'building-2': Building2,
  'users': Users,
  'bar-chart-3': BarChart3,
  'megaphone': Megaphone,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'clipboard-list': ClipboardList,
  'check-square': CheckSquare,
  'inbox': Inbox,
  'clipboard-check': ClipboardCheck,
  'bell': Bell,
  'calendar': Calendar,
  'file-text': FileText,
  'clock': Clock,
  'send': Send,
};

// Navigation label keys mapping
const navLabelKeys: Record<string, string> = {
  'Dashboard': 'nav.dashboard',
  'Schools': 'nav.schools',
  'Classes': 'nav.classes',
  'Students': 'nav.students',
  'Teachers': 'nav.teachers',
  'Subjects': 'nav.subjects',
  'Attendance': 'nav.attendance',
  'Requests': 'nav.requests',
  'Reports': 'nav.reports',
  'Announcements': 'nav.announcements',
  'Notifications': 'nav.notifications',
  'Schedule': 'nav.schedule',
  'Notes': 'nav.notes',
  'Leave Requests': 'nav.leaveRequests',
  'Absence Requests': 'nav.absenceRequests',
  'Evaluations': 'nav.evaluations',
  'Check In': 'nav.checkIn',
  'My Attendance': 'nav.myAttendance',
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavBarProps {
  user: Profile;
  navItems?: NavItem[];
  schoolName?: string;
  locale?: string;
}

// Default navigation items per role
const defaultNavItems: Record<string, NavItem[]> = {
  moe_admin: [
    { href: '/moe', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/moe/schools', label: 'Schools', icon: 'building-2' },
    { href: '/moe/reports', label: 'Reports', icon: 'bar-chart-3' },
  ],
  school_admin: [
    { href: '/school', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/school/classes', label: 'Classes', icon: 'book-open' },
    { href: '/school/students', label: 'Students', icon: 'graduation-cap' },
    { href: '/school/teachers', label: 'Teachers', icon: 'users' },
    { href: '/school/requests', label: 'Requests', icon: 'inbox' },
  ],
  supervisor: [
    { href: '/school', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/school/classes', label: 'Classes', icon: 'book-open' },
    { href: '/school/attendance', label: 'Attendance', icon: 'check-square' },
    { href: '/school/reports', label: 'Reports', icon: 'bar-chart-3' },
  ],
  teacher: [
    { href: '/teacher', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/teacher/attendance', label: 'Attendance', icon: 'clipboard-check' },
    { href: '/teacher/students', label: 'Students', icon: 'users' },
    { href: '/teacher/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/teacher/notes', label: 'Notes', icon: 'file-text' },
  ],
  parent: [
    { href: '/parent', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/parent/attendance', label: 'Attendance', icon: 'clipboard-check' },
    { href: '/parent/requests', label: 'Requests', icon: 'send' },
    { href: '/parent/reports', label: 'Reports', icon: 'bar-chart-3' },
  ],
  student: [
    { href: '/student', label: 'Check In', icon: 'clipboard-check' },
    { href: '/student/attendance', label: 'My Attendance', icon: 'calendar' },
    { href: '/student/schedule', label: 'Schedule', icon: 'clock' },
  ],
};

export function NavBar({ user, navItems, schoolName, locale = 'ar' }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const links = navItems || defaultNavItems[user.role] || [];

  // Get dashboard path based on role
  const getDashboardPath = () => {
    switch (user.role) {
      case 'moe_admin': return '/moe';
      case 'school_admin': return '/school';
      case 'supervisor': return '/school';
      case 'teacher': return '/teacher';
      case 'parent': return '/parent';
      case 'student': return '/student';
      default: return '/';
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'moe_admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'school_admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'supervisor': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'teacher': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'parent': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'student': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTranslatedLabel = (label: string) => {
    const key = navLabelKeys[label];
    return key ? t(key) : label;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={getDashboardPath()} className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold gradient-text">
                {t('common.appName')}
              </span>
              {schoolName && (
                <span className="text-xs text-muted-foreground block -mt-1">
                  {schoolName}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== getDashboardPath() && pathname.startsWith(link.href));
              const IconComponent = iconMap[link.icon] || LayoutDashboard;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  {getTranslatedLabel(link.label)}
                  {link.badge && link.badge > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right rtl:text-left">
                <p className="text-sm font-medium">{user.full_name}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor())}>
                  {t(`roles.${user.role}`)}
                </span>
              </div>
              <Avatar fallback={user.full_name} src={user.avatar_url} />
            </div>
            
            {/* Language Switcher */}
            <LanguageSwitcher currentLocale={locale} />
            
            {/* Notifications Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
              title={t('nav.notifications')}
            >
              <Bell className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title={t('auth.logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 animate-slide-up">
          <div className="px-4 py-4 space-y-1">
            {/* User info on mobile */}
            <div className="flex items-center gap-3 px-4 py-3 mb-2 border-b border-gray-200/50 dark:border-gray-800/50">
              <Avatar fallback={user.full_name} src={user.avatar_url} />
              <div>
                <p className="font-medium">{user.full_name}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor())}>
                  {t(`roles.${user.role}`)}
                </span>
              </div>
            </div>

            {links.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = iconMap[link.icon] || LayoutDashboard;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                  {getTranslatedLabel(link.label)}
                  {link.badge && link.badge > 0 && (
                    <Badge variant="destructive" className="ms-auto">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
