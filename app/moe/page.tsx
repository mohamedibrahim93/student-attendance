import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function MoEDashboard() {
  const supabase = createClient();
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Fetch all schools
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true);

  // Fetch counts
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['teacher', 'supervisor']);

  // Fetch today's attendance across all schools
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', today);

  const presentCount = todayAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
  const totalAttendance = todayAttendance?.length || 0;
  const overallAttendanceRate = calculateAttendancePercentage(presentCount, totalAttendance);

  // Get schools with their stats
  const schoolsWithStats = await Promise.all(
    (schools || []).map(async (school) => {
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id);

      const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id)
        .in('role', ['teacher', 'supervisor']);

      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id);

      return {
        ...school,
        student_count: studentCount || 0,
        teacher_count: teacherCount || 0,
        class_count: classCount || 0,
      };
    })
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('moe.dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('moe.title')} • {formatDate(new Date(), locale)}
          </p>
        </div>
        <Link href="/moe/schools">
          <Button className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('nav.schools')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('stats.totalSchools')}
          value={schools?.length || 0}
          icon="building-2"
          iconColor="text-blue-600"
        />
        <StatsCard
          title={t('stats.totalStudents')}
          value={totalStudents || 0}
          icon="graduation-cap"
          iconColor="text-violet-600"
        />
        <StatsCard
          title={t('stats.totalTeachers')}
          value={totalTeachers || 0}
          icon="users"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title={t('stats.todaysAttendance')}
          value={`${overallAttendanceRate}%`}
          icon="trending-up"
          iconColor="text-amber-600"
        />
      </div>

      {/* Schools Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('nav.schools')}
          </h2>
          <Link href="/moe/schools" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t('common.viewAll')} <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>

        {schoolsWithStats && schoolsWithStats.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schoolsWithStats.map((school, i) => (
              <Card
                key={school.id}
                className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant={school.is_active ? 'present' : 'absent'}>
                      {school.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">{school.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{school.code}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-violet-600">{school.student_count}</p>
                      <p className="text-xs text-muted-foreground">{t('nav.students')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{school.teacher_count}</p>
                      <p className="text-xs text-muted-foreground">{t('nav.teachers')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{school.class_count}</p>
                      <p className="text-xs text-muted-foreground">{t('nav.classes')}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/moe/schools/${school.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-1 group-hover:text-primary">
                        {t('common.details')}
                        <ArrowIcon className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('common.noData')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('common.noData')}
            </p>
            <Link href="/moe/schools/new">
              <Button>{t('common.add')}</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('common.add')} {t('nav.schools')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('common.create')}
              </p>
            </div>
            <Link href="/moe/schools/new">
              <Button variant="outline" size="sm">
                {t('common.add')}
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('quickActions.viewReports')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('reports.attendanceAndGrades')}
              </p>
            </div>
            <Link href="/moe/reports">
              <Button variant="outline" size="sm">
                {t('common.view')}
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('announcements.announce')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('nav.announcements')}
              </p>
            </div>
            <Link href="/moe/announcements/new">
              <Button variant="outline" size="sm">
                {t('common.submit')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
