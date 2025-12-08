'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QRScanner } from '@/components/qr-scanner';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { Calendar } from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { Attendance, Student } from '@/lib/types';

export default function StudentDashboard() {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [recentAttendance, setRecentAttendance] = React.useState<Attendance[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get student record
        const { data: studentData } = await supabase
          .from('students')
          .select('*, class:classes(*)')
          .eq('user_id', user.id)
          .single();

        if (studentData) {
          setStudent(studentData);

          // Get attendance records
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentData.id)
            .order('date', { ascending: false })
            .limit(30);

          setRecentAttendance(attendanceData || []);

          // Calculate stats
          const present = attendanceData?.filter((a) => a.status === 'present').length || 0;
          const absent = attendanceData?.filter((a) => a.status === 'absent').length || 0;
          const late = attendanceData?.filter((a) => a.status === 'late').length || 0;

          setStats({
            total: attendanceData?.length || 0,
            present,
            absent,
            late,
          });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCheckIn = async (code: string): Promise<{ success: boolean; message: string }> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !student) {
      return { success: false, message: 'Please log in to check in.' };
    }

    // Find active session with this code
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', code)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return { success: false, message: 'Invalid or expired code. Please try again.' };
    }

    // Check if student belongs to this class
    if (student.class_id !== session.class_id) {
      return { success: false, message: 'This code is for a different class.' };
    }

    // Check if already marked today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student.id)
      .eq('class_id', session.class_id)
      .eq('date', today)
      .single();

    if (existing) {
      return { success: false, message: 'You have already checked in today!' };
    }

    // Mark attendance
    const { error } = await supabase.from('attendance').insert({
      student_id: student.id,
      session_id: session.id,
      class_id: session.class_id,
      date: today,
      status: 'present',
      check_in_time: new Date().toISOString(),
      marked_by: user.id,
    });

    if (error) {
      return { success: false, message: 'Error checking in. Please try again.' };
    }

    // Refresh data
    const { data: updatedAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student.id)
      .order('date', { ascending: false })
      .limit(30);

    setRecentAttendance(updatedAttendance || []);

    return { success: true, message: 'Successfully checked in! Have a great class.' };
  };

  const attendanceRate = calculateAttendancePercentage(stats.present + stats.late, stats.total);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(new Date())} • {student?.class?.name || 'Loading...'}
        </p>
      </div>

      {/* Check-in Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check In</CardTitle>
          <CardDescription>
            Scan the QR code or enter the session code to mark your attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QRScanner onCodeSubmit={handleCheckIn} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon="trending-up"
          iconColor="text-violet-600"
          description="Last 30 days"
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

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttendance.length > 0 ? (
            <div className="space-y-2">
              {recentAttendance.slice(0, 10).map((record, i) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="font-medium">{formatDate(record.date)}</span>
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
              ))}
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
