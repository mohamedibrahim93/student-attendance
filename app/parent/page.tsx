import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Bell,
  Send,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function ParentDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations();
  const locale = await getLocale();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Get parent profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user?.id)
    .single();

  // Check if parent is approved
  if (profile && !profile.is_approved) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 w-fit mx-auto mb-6">
          <Clock className="h-12 w-12 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('accountPending.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('accountPending.description')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('accountPending.school')}: {profile?.school?.name || t('common.noData')}
        </p>
      </div>
    );
  }

  // Fetch children linked to this parent
  const { data: children } = await supabase
    .from('students')
    .select('*, class:classes(*)')
    .eq('parent_id', user?.id);

  // Fetch attendance for all children
  const childIds = children?.map((c) => c.id) || [];
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('*, subject:subjects(*)')
    .in('student_id', childIds.length > 0 ? childIds : ['00000000-0000-0000-0000-000000000000'])
    .order('date', { ascending: false })
    .limit(100);

  // Fetch absence requests
  const { data: absenceRequests } = await supabase
    .from('absence_requests')
    .select('*, student:students(*)')
    .eq('parent_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent evaluations
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*, student:students(*), subject:subjects(*)')
    .in('student_id', childIds.length > 0 ? childIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch unread notifications
  const { data: notifications, count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user?.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch recent notes for children
  const { data: recentNotes } = await supabase
    .from('student_notes')
    .select('*, student:students(*), creator:profiles!student_notes_created_by_fkey(*)')
    .in('student_id', childIds.length > 0 ? childIds : ['00000000-0000-0000-0000-000000000000'])
    .in('note_type', ['parent', 'both'])
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate overall stats
  const stats = {
    totalDays: allAttendance?.length || 0,
    present: allAttendance?.filter((a) => a.status === 'present').length || 0,
    absent: allAttendance?.filter((a) => a.status === 'absent').length || 0,
    late: allAttendance?.filter((a) => a.status === 'late').length || 0,
  };

  const attendanceRate = calculateAttendancePercentage(
    stats.present + stats.late,
    stats.totalDays
  );

  // Recent absences for alerts
  const recentAbsences = allAttendance?.filter(
    (a) => a.status === 'absent' && new Date(a.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ) || [];

  // Pending requests count
  const pendingRequests = absenceRequests?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.welcome', { name: profile?.full_name?.split(' ')[0] || '' })}</h1>
          <p className="text-muted-foreground mt-1">
            {formatDate(new Date(), locale)} • {profile?.school?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/parent/notifications">
            <Button variant="outline" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              {t('nav.notifications')}
              {(unreadCount || 0) > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -end-2 h-5 min-w-[20px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/parent/requests/new">
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              {t('requests.requestAbsence')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {recentAbsences.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800 dark:text-red-200">
                  {recentAbsences.length === 1
                    ? t('alerts.absenceThisWeek')
                    : t('alerts.absencesThisWeek', { count: recentAbsences.length || 0 })}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {t('alerts.clickToView')}
                </p>
              </div>
              <Link href="/parent/attendance">
                <Button size="sm" variant="outline">{t('common.view')}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {(unreadCount || 0) > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {unreadCount === 1
                    ? t('alerts.unreadNotification')
                    : t('alerts.unreadNotifications', { count: unreadCount || 0 })}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {t('alerts.fromSchoolAdmin')}
                </p>
              </div>
              <Link href="/parent/notifications">
                <Button size="sm" variant="outline">{t('common.read')}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('stats.overallAttendance')}
          value={`${attendanceRate}%`}
          icon="trending-up"
          iconColor="text-violet-600"
          description={t('stats.allChildrenCombined')}
        />
        <StatsCard
          title={t('stats.daysPresent')}
          value={stats.present}
          icon="check-circle"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title={t('stats.daysAbsent')}
          value={stats.absent}
          icon="x-circle"
          iconColor="text-red-600"
        />
        <StatsCard
          title={t('stats.pendingRequests')}
          value={pendingRequests}
          icon="clock"
          iconColor="text-amber-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Children Overview */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t('students.yourChildren')}
          </h2>

          {children && children.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((child, i) => {
                const childAttendance = allAttendance?.filter((a) => a.student_id === child.id) || [];
                const childPresent = childAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
                const childRate = calculateAttendancePercentage(childPresent, childAttendance.length);
                const lastRecord = childAttendance[0];
                const childEval = evaluations?.find(e => e.student_id === child.id);

                return (
                  <Card
                    key={child.id}
                    className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={child.full_name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{child.full_name}</CardTitle>
                          <CardDescription>{child.class?.name || t('students.noClassAssigned')}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Attendance Rate */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{t('students.attendanceRate')}</span>
                            <span className="font-semibold">{childRate}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                childRate >= 80 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                  : childRate >= 60
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                                  : 'bg-gradient-to-r from-red-500 to-rose-500'
                              }`}
                              style={{ width: `${childRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Last Status */}
                        {lastRecord && (
                          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(lastRecord.date, locale)}
                            </span>
                            <Badge
                              variant={
                                lastRecord.status === 'present'
                                  ? 'present'
                                  : lastRecord.status === 'late'
                                  ? 'late'
                                  : lastRecord.status === 'excused'
                                  ? 'excused'
                                  : 'absent'
                              }
                            >
                              {t(`attendance.${lastRecord.status}`)}
                            </Badge>
                          </div>
                        )}

                        {/* Recent Evaluation */}
                        {childEval && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {childEval.evaluation_type}: 
                            </span>
                            {childEval.grade && (
                              <Badge variant="outline">{childEval.grade}%</Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link href={`/parent/attendance?child=${child.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              {t('nav.attendance')}
                            </Button>
                          </Link>
                          <Link href={`/parent/requests/new?child=${child.id}`}>
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('students.noChildrenLinked')}</h3>
              <p className="text-muted-foreground">
                {t('students.contactSchoolToLink')}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Absence Requests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-4 w-4" />
                {t('requests.absenceRequests')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {absenceRequests && absenceRequests.length > 0 ? (
                <div className="space-y-3">
                  {absenceRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{request.student?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(request.start_date, locale)} - {formatDate(request.end_date, locale)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'present'
                              : request.status === 'rejected'
                              ? 'absent'
                              : 'late'
                          }
                        >
                          {request.status === 'pending' && <Clock className="h-3 w-3 me-1" />}
                          {request.status === 'approved' && <CheckCircle className="h-3 w-3 me-1" />}
                          {request.status === 'rejected' && <XCircle className="h-3 w-3 me-1" />}
                          {t(`common.${request.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Link href="/parent/requests">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      {t('requests.viewAllRequests')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('requests.noRequests')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('notes.recentNotes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotes && recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg ${
                        note.is_read_by_parent ? 'bg-muted/30' : 'bg-blue-50 dark:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!note.is_read_by_parent && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{note.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {note.student?.full_name} • {formatDate(note.created_at, locale)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('notes.noNotesFromTeachers')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/parent/requests/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Send className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.submitAbsence')}</h3>
              <p className="text-xs text-muted-foreground">{t('requests.requestStudentAbsence')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/parent/attendance" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.viewAttendance')}</h3>
              <p className="text-xs text-muted-foreground">{t('attendance.detailedRecords')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/parent/evaluations" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.viewEvaluations')}</h3>
              <p className="text-xs text-muted-foreground">{t('evaluations.gradesAndProgress')}</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/parent/issues/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium">{t('quickActions.reportIssue')}</h3>
              <p className="text-xs text-muted-foreground">{t('issues.contactSchool')}</p>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
