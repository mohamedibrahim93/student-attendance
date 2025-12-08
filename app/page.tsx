import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  QrCode,
  Users,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AttendEase</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              Smart Attendance Tracking
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="gradient-text">Effortless</span>
              <br />
              Student Attendance
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up animate-stagger-1">
              Modernize your classroom attendance with QR codes. Students check in instantly,
              teachers save time, and parents stay informed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-stagger-2">
              <Link href="/register">
                <Button size="xl" className="gap-2 group">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="xl">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 relative animate-scale-in animate-stagger-3">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-3xl opacity-20 blur-3xl" />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">AttendEase Dashboard</span>
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-950">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Present Today', value: '28', color: 'emerald' },
                    { label: 'Absent', value: '2', color: 'red' },
                    { label: 'Attendance Rate', value: '93%', color: 'violet' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="h-32 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need for <span className="gradient-text">smart attendance</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete solution for teachers, students, and parents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR Code Check-in',
                description: 'Students scan a time-limited QR code to mark attendance instantly. No more roll calls.',
              },
              {
                icon: Users,
                title: 'Multi-Role Access',
                description: 'Separate portals for teachers, students, and parents with role-based permissions.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Reports',
                description: 'Track attendance patterns with beautiful charts and downloadable reports.',
              },
              {
                icon: Shield,
                title: 'Anti-Cheating',
                description: 'Time-limited codes, one-time use, and optional location verification.',
              },
              {
                icon: Zap,
                title: 'Instant Notifications',
                description: 'Parents get notified immediately when their child is marked absent.',
              },
              {
                icon: GraduationCap,
                title: 'Class Management',
                description: 'Organize students into classes, manage rosters, and track progress.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-3xl opacity-10 blur-2xl" />
            <div className="relative p-12 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to modernize attendance?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join schools already using AttendEase to save time and keep everyone connected.
              </p>
              <Link href="/register">
                <Button size="xl" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">AttendEase</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AttendEase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

