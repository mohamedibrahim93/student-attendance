'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  GraduationCap,
  Calendar,
  Loader2,
  Download,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { Class, Student } from '@/lib/types';

interface ClassReport {
  class: Class;
  studentCount: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export default function SchoolReportsPage() {
  const [reports, setReports] = React.useState<ClassReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month'>('month');
  const [selectedClass, setSelectedClass] = React.useState<string>('all');
  const [classes, setClasses] = React.useState<Class[]>([]);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) return;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Fetch classes
    const { data: classesData } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');

    setClasses(classesData || []);

    const classesToReport = selectedClass === 'all'
      ? classesData || []
      : (classesData || []).filter((c) => c.id === selectedClass);

    // Generate reports for each class
    const reportsData = await Promise.all(
      classesToReport.map(async (cls) => {
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('class_id', cls.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        const presentCount = attendance?.filter((a) => a.status === 'present').length || 0;
        const absentCount = attendance?.filter((a) => a.status === 'absent').length || 0;
        const lateCount = attendance?.filter((a) => a.status === 'late').length || 0;

        return {
          class: cls,
          studentCount: studentCount || 0,
          totalRecords: attendance?.length || 0,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate: calculateAttendancePercentage(presentCount + lateCount, attendance?.length || 0),
        };
      })
    );

    setReports(reportsData);
    setLoading(false);
  }, [period, selectedClass]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Calculate totals
  const totals = reports.reduce(
    (acc, r) => ({
      students: acc.students + r.studentCount,
      records: acc.records + r.totalRecords,
      present: acc.present + r.presentCount,
      absent: acc.absent + r.absentCount,
      late: acc.late + r.lateCount,
    }),
    { students: 0, records: 0, present: 0, absent: 0, late: 0 }
  );

  const overallRate = calculateAttendancePercentage(totals.present + totals.late, totals.records);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Attendance Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            School attendance analytics and statistics
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p === 'today' ? 'Today' : `This ${p}`}
            </Button>
          ))}
        </div>
        <Select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-48"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold text-violet-600">{overallRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <GraduationCap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold">{totals.students}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-3xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="text-3xl font-bold">{totals.records}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-3xl font-bold">{totals.records}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-center">
              <p className="text-3xl font-bold text-emerald-600">{totals.present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-center">
              <p className="text-3xl font-bold text-amber-600">{totals.late}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </div>
            <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-center">
              <p className="text-3xl font-bold text-red-600">{totals.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Class-wise Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Class</th>
                  <th className="text-center py-3 px-4 font-medium">Students</th>
                  <th className="text-center py-3 px-4 font-medium">Present</th>
                  <th className="text-center py-3 px-4 font-medium">Late</th>
                  <th className="text-center py-3 px-4 font-medium">Absent</th>
                  <th className="text-center py-3 px-4 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, i) => (
                  <tr
                    key={report.class.id}
                    className="border-b hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{report.class.name}</p>
                        <p className="text-sm text-muted-foreground">{report.class.grade_level}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{report.studentCount}</td>
                    <td className="text-center py-3 px-4 text-emerald-600 font-medium">
                      {report.presentCount}
                    </td>
                    <td className="text-center py-3 px-4 text-amber-600 font-medium">
                      {report.lateCount}
                    </td>
                    <td className="text-center py-3 px-4 text-red-600 font-medium">
                      {report.absentCount}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge
                        variant={
                          report.attendanceRate >= 80
                            ? 'present'
                            : report.attendanceRate >= 60
                            ? 'late'
                            : 'absent'
                        }
                      >
                        {report.attendanceRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

