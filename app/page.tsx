import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  GraduationCap,
  QrCode,
  Users,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Building2,
  Bell,
  ClipboardCheck,
  Send,
  Calendar,
} from 'lucide-react';

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">{t('common.appName')}</span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLocale={locale} />
              <Link href="/login">
                <Button variant="ghost">{t('auth.signIn')}</Button>
              </Link>
              <Link href="/register">
                <Button>{t('home.startFreeTrial')}</Button>
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
              <Building2 className="h-4 w-4" />
              {t('home.heroTagline')}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="gradient-text">{t('home.heroTitle')}</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up animate-stagger-1">
              {t('home.heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-stagger-2">
              <Link href="/register">
                <Button size="xl" className="gap-2 group">
                  {t('home.startFreeTrial')}
                  <ArrowIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="xl">
                  {t('auth.signIn')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Preview Cards */}
          <div className="mt-20 relative animate-scale-in animate-stagger-3">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-3xl opacity-20 blur-3xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* MoE Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 w-fit mb-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('home.cards.moe.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('home.cards.moe.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {t('home.cards.moe.tag1')}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {t('home.cards.moe.tag2')}
                  </span>
                </div>
              </div>

              {/* School Admin Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('home.cards.school.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('home.cards.school.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {t('home.cards.school.tag1')}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                    {t('home.cards.school.tag2')}
                  </span>
                </div>
              </div>

              {/* Teacher Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 w-fit mb-4">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('home.cards.teacher.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('home.cards.teacher.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {t('home.cards.teacher.tag1')}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                    {t('home.cards.teacher.tag2')}
                  </span>
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
              <span className="gradient-text">{t('home.features.title')}</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: t('home.features.qrAttendance.title'),
                description: t('home.features.qrAttendance.description'),
              },
              {
                icon: Users,
                title: t('home.features.multiLevel.title'),
                description: t('home.features.multiLevel.description'),
              },
              {
                icon: Send,
                title: t('home.features.absenceWorkflow.title'),
                description: t('home.features.absenceWorkflow.description'),
              },
              {
                icon: Bell,
                title: t('home.features.notifications.title'),
                description: t('home.features.notifications.description'),
              },
              {
                icon: Calendar,
                title: t('home.features.schedules.title'),
                description: t('home.features.schedules.description'),
              },
              {
                icon: BarChart3,
                title: t('home.features.reports.title'),
                description: t('home.features.reports.description'),
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

      {/* Role-based Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-text">{t('home.stakeholders.title')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Parents */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                {t('home.stakeholders.forParents')}
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  {t('home.stakeholders.parentFeatures.alerts')}
                </li>
                <li className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber-500" />
                  {t('home.stakeholders.parentFeatures.requests')}
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  {t('home.stakeholders.parentFeatures.evaluations')}
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  {t('home.stakeholders.parentFeatures.notes')}
                </li>
              </ul>
            </div>

            {/* Students */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200/50 dark:border-cyan-800/50">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <GraduationCap className="h-5 w-5 text-cyan-600" />
                </div>
                {t('home.stakeholders.forStudents')}
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-cyan-500" />
                  {t('home.stakeholders.studentFeatures.qrCheckIn')}
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-500" />
                  {t('home.stakeholders.studentFeatures.schedule')}
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                  {t('home.stakeholders.studentFeatures.history')}
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-500" />
                  {t('home.stakeholders.studentFeatures.grades')}
                </li>
              </ul>
            </div>
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
                {t('home.cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('home.cta.subtitle')}
              </p>
              <Link href="/register">
                <Button size="xl" className="gap-2">
                  {t('home.getStartedFree')}
                  <ArrowIcon className="h-4 w-4" />
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
              <span className="font-semibold">{t('common.appName')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('home.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
