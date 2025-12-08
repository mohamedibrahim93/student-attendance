import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import {
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function ParentReports() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch children linked to this parent
  const { data: children } = await supabase
    .from('students')
    .select('*, class:classes(*)')
    .eq('parent_id', user?.id);

  // Fetch all attendance records
  const childIds = children?.map((c) => c.id) || [];
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', childIds)
    .order('date', { ascending: false });

  // Group attendance by month
  const attendanceByMonth: Record<string, typeof allAttendance> = {};
  allAttendance?.forEach((record) => {
    const month = record.date.substring(0, 7); // YYYY-MM
    if (!attendanceByMonth[month]) {
      attendanceByMonth[month] = [];
    }
    attendanceByMonth[month]?.push(record);
  });

  const months = Object.keys(attendanceByMonth).sort().reverse();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground mt-1">
            Detailed attendance history for your children
          </p>
        </div>
      </div>

      {/* Children Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children?.map((child, i) => {
          const childAttendance = allAttendance?.filter((a) => a.student_id === child.id) || [];
          const present = childAttendance.filter((a) => a.status === 'present').length;
          const late = childAttendance.filter((a) => a.status === 'late').length;
          const absent = childAttendance.filter((a) => a.status === 'absent').length;
          const excused = childAttendance.filter((a) => a.status === 'excused').length;
          const total = childAttendance.length;
          const rate = calculateAttendancePercentage(present + late, total);

          return (
            <Card key={child.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar fallback={child.full_name} size="lg" />
                  <div>
                    <CardTitle className="text-lg">{child.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{child.class?.name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall Rate */}
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
                    <p className="text-4xl font-bold text-violet-600">{rate}%</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                      <p className="text-xl font-bold text-emerald-600">{present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                      <p className="text-xl font-bold text-amber-600">{late}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                      <p className="text-xl font-bold text-red-600">{absent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <p className="text-xl font-bold text-blue-600">{excused}</p>
                      <p className="text-xs text-muted-foreground">Excused</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length > 0 ? (
            <div className="space-y-6">
              {months.map((month) => {
                const records = attendanceByMonth[month] || [];
                const monthDate = new Date(month + '-01');
                const monthName = monthDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div key={month}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {monthName}
                      <Badge variant="secondary">{records.length} days</Badge>
                    </h3>
                    <div className="grid gap-2">
                      {records.map((record, i) => {
                        const child = children?.find((c) => c.id === record.student_id);
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar fallback={child?.full_name || '?'} size="sm" />
                              <div>
                                <p className="font-medium text-sm">{child?.full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(record.date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {record.check_in_time && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(record.check_in_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

