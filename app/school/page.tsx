import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Inbox,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function SchoolDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Get school info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user?.id)
    .single();

  const schoolId = profile?.school_id;

  if (!schoolId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">{t('dashboard.noSchoolAssigned')}</h1>
        <p className="text-muted-foreground">{t('dashboard.contactAdmin')}</p>
      </div>
    );
  }

  // Fetch classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*, students:students(count)')
    .eq('school_id', schoolId);

  // Fetch counts
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('role', ['teacher', 'supervisor']);

  // Pending absence requests
  const { data: pendingRequests, count: pendingCount } = await supabase
    .from('absence_requests')
    .select('*, student:students(*), parent:profiles!absence_requests_parent_id_fkey(*)', { count: 'exact' })
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // Pending parent approvals
  const { count: pendingParentApprovals } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('role', 'parent')
    .eq('is_approved', false);

  // Open issues
  const { count: openIssues } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('status', ['open', 'in_progress']);

  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('school_id', schoolId)
    .eq('date', today);

  const stats = {
    present: todayAttendance?.filter(a => a.status === 'present').length || 0,
    absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
    late: todayAttendance?.filter(a => a.status === 'late').length || 0,
    total: todayAttendance?.length || 0,
  };

  const attendanceRate = calculateAttendancePercentage(
    stats.present + stats.late,
    stats.total
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{profile?.school?.name || t('school.dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.schoolAdmin')} • {formatDate(new Date(), locale)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/school/announcements/new">
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              {t('announcements.announce')}
            </Button>
          </Link>
          <Link href="/school/requests">
            <Button className="gap-2">
              <Inbox className="h-4 w-4" />
              {t('nav.requests')}
              {(pendingCount || 0) > 0 && (
                <Badge variant="destructive" className="ms-1">{pendingCount}</Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Cards */}
      {((pendingCount || 0) > 0 || (pendingParentApprovals || 0) > 0 || (openIssues || 0) > 0) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(pendingCount || 0) > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {pendingCount === 1 
                      ? t('alerts.pendingAbsenceRequest')
                      : t('alerts.pendingAbsenceRequests', { count: pendingCount || 0 })}
                  </p>
                </div>
                <Link href="/school/requests">
                  <Button size="sm" variant="outline">{t('common.review')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {(pendingParentApprovals || 0) > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    {pendingParentApprovals === 1
                      ? t('alerts.parentAwaitingApproval')
                      : t('alerts.parentsAwaitingApproval', { count: pendingParentApprovals || 0 })}
                  </p>
                </div>
                <Link href="/school/parents">
                  <Button size="sm" variant="outline">{t('common.approve')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {(openIssues || 0) > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {openIssues === 1
                      ? t('alerts.openIssue')
                      : t('alerts.openIssues', { count: openIssues || 0 })}
                  </p>
                </div>
                <Link href="/school/issues">
                  <Button size="sm" variant="outline">{t('common.view')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title={t('stats.totalClasses')}
          value={classes?.length || 0}
          icon="book-open"
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
          value={`${attendanceRate}%`}
          icon="trending-up"
          iconColor="text-amber-600"
        />
        <StatsCard
          title={t('stats.presentToday')}
          value={stats.present}
          icon="check-circle"
          iconColor="text-green-600"
          description={`${stats.absent} ${t('attendance.absent')}, ${stats.late} ${t('attendance.late')}`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Classes Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('classes.overview')}
            </h2>
            <Link href="/school/classes" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('common.viewAll')} <ArrowIcon className="h-3 w-3" />
            </Link>
          </div>

          {classes && classes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.slice(0, 6).map((cls, i) => (
                <Card
                  key={cls.id}
                  className="group hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <Badge variant="outline">{cls.grade_level}</Badge>
                    </div>
                    <CardDescription>{t('classes.studentsCount', { count: cls.students?.[0]?.count || 0 })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant={cls.status === 'in_session' ? 'present' : 'outline'}>
                        {cls.status === 'in_session' ? t('classes.inSession') : cls.status}
                      </Badge>
                      <Link href={`/school/classes/${cls.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {t('common.manage')} <ArrowIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('classes.noClasses')}</h3>
              <p className="text-muted-foreground mb-4">{t('classes.noClassesDesc')}</p>
              <Link href="/school/classes/new">
                <Button>{t('classes.createClass')}</Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Pending Requests Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              {t('requests.pendingRequests')}
            </h2>
          </div>

          <Card>
            <CardContent className="p-4">
              {pendingRequests && pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{request.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(request.start_date, locale)} - {formatDate(request.end_date, locale)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {request.reason}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/school/requests" className="block">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      {t('requests.viewAllRequests')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">{t('requests.noPendingRequests')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/school/students/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <GraduationCap className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.addStudent')}</h3>
              <p className="text-xs text-muted-foreground">{t('students.registerNewStudent')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/school/teachers/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.addTeacher')}</h3>
              <p className="text-xs text-muted-foreground">{t('teachers.createTeacherAccount')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/school/classes/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.createClass')}</h3>
              <p className="text-xs text-muted-foreground">{t('classes.addClass')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/school/reports" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.viewReports')}</h3>
              <p className="text-xs text-muted-foreground">{t('reports.attendanceAndGrades')}</p>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
