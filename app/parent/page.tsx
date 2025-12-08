import { createClient } from '@/lib/supabase/server';
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
  Bell,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function ParentDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch children linked to this parent
  const { data: children } = await supabase
    .from('students')
    .select('*, class:classes(*)')
    .eq('parent_id', user?.id);

  // Fetch attendance for all children
  const childIds = children?.map((c) => c.id) || [];
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', childIds)
    .order('date', { ascending: false })
    .limit(100);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your children&apos;s attendance
          </p>
        </div>
        <Link href="/parent/reports">
          <Button className="gap-2">
            View Full Reports
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {recentAbsences.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Recent Absences
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {recentAbsences.length} absence(s) in the last 7 days. View reports for details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Overall Attendance"
          value={`${attendanceRate}%`}
          icon="trending-up"
          iconColor="text-violet-600"
          description="All children combined"
        />
        <StatsCard
          title="Days Present"
          value={stats.present}
          icon="check-circle"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Days Absent"
          value={stats.absent}
          icon="x-circle"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Days Late"
          value={stats.late}
          icon="clock"
          iconColor="text-amber-600"
        />
      </div>

      {/* Children Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Children
        </h2>

        {children && children.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child, i) => {
              const childAttendance = allAttendance?.filter((a) => a.student_id === child.id) || [];
              const childPresent = childAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
              const childRate = calculateAttendancePercentage(childPresent, childAttendance.length);
              const lastRecord = childAttendance[0];

              return (
                <Card
                  key={child.id}
                  className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar fallback={child.full_name} size="lg" />
                      <div>
                        <CardTitle className="text-lg">{child.full_name}</CardTitle>
                        <CardDescription>{child.class?.name || 'No class assigned'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Attendance Rate */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Attendance Rate</span>
                          <span className="font-semibold">{childRate}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${childRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Last Status */}
                      {lastRecord && (
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(lastRecord.date)}
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
                            {lastRecord.status.charAt(0).toUpperCase() + lastRecord.status.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
            <p className="text-muted-foreground">
              Please contact your school administrator to link your children to your account.
            </p>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allAttendance && allAttendance.length > 0 ? (
            <div className="space-y-2">
              {allAttendance.slice(0, 10).map((record, i) => {
                const child = children?.find((c) => c.id === record.student_id);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar fallback={child?.full_name || '?'} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{child?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'present'
                          : record.status === 'late'
                          ? 'late'
                          : record.status === 'excused'
                          ? 'excused'
                          : 'absent'
                      }
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
