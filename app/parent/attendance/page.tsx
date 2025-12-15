'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  Calendar,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { Student, Attendance, Subject } from '@/lib/types';

interface AttendanceWithSubject extends Attendance {
  subject?: Subject;
}

export default function ParentAttendancePage() {
  const searchParams = useSearchParams();
  const preselectedChild = searchParams.get('child');

  const [children, setChildren] = React.useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = React.useState(preselectedChild || '');
  const [attendance, setAttendance] = React.useState<AttendanceWithSubject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<'week' | 'month' | 'all'>('month');

  const fetchChildren = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('students')
        .select('*, class:classes(*)')
        .eq('parent_id', user.id);

      setChildren(data || []);
      if (data && data.length > 0 && !selectedChild) {
        setSelectedChild(data[0].id);
      }
    }
    setLoading(false);
  }, [selectedChild]);

  const fetchAttendance = React.useCallback(async () => {
    if (!selectedChild) return;

    const supabase = createClient();

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const { data } = await supabase
      .from('attendance')
      .select('*, subject:subjects(*)')
      .eq('student_id', selectedChild)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    setAttendance((data as AttendanceWithSubject[]) || []);
  }, [selectedChild, period]);

  React.useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const selectedChildData = children.find((c) => c.id === selectedChild);

  // Calculate stats
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
  };

  const attendanceRate = calculateAttendancePercentage(stats.present + stats.late, stats.total);

  // Group attendance by date
  const attendanceByDate = attendance.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceWithSubject[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Attendance History
          </h1>
          <p className="text-muted-foreground mt-1">
            View detailed attendance records
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {children.length > 1 && (
          <Select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-48"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.full_name}
              </option>
            ))}
          </Select>
        )}

        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {selectedChildData && (
        <>
          {/* Student Card */}
          <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar fallback={selectedChildData.full_name} size="lg" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedChildData.full_name}</h2>
                  <p className="text-muted-foreground">{selectedChildData.class?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-violet-600">{attendanceRate}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                <p className="text-sm text-muted-foreground">Excused</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Daily attendance history for {selectedChildData.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(attendanceByDate).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(attendanceByDate).map(([date, records], i) => (
                    <div
                      key={date}
                      className="p-4 rounded-xl border animate-fade-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{formatDate(date)}</h3>
                        <div className="flex gap-2">
                          {records.map((r) => (
                            <Badge
                              key={r.id}
                              variant={
                                r.status === 'present'
                                  ? 'present'
                                  : r.status === 'late'
                                  ? 'late'
                                  : r.status === 'excused'
                                  ? 'excused'
                                  : 'absent'
                              }
                            >
                              {r.subject?.name || 'General'}: {r.status}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {records.some((r) => r.notes) && (
                        <div className="text-sm text-muted-foreground">
                          {records
                            .filter((r) => r.notes)
                            .map((r) => (
                              <p key={r.id}>
                                {r.subject?.name && <strong>{r.subject.name}:</strong>} {r.notes}
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

