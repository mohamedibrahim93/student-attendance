'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  TrendingUp,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Loader2,
  Download,
  BarChart3,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { School } from '@/lib/types';

interface SchoolReport {
  school: School;
  studentCount: number;
  teacherCount: number;
  totalAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export default function MoEReportsPage() {
  const [reports, setReports] = React.useState<SchoolReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month' | 'year'>('month');
  const [selectedSchool, setSelectedSchool] = React.useState<string>('all');
  const [schools, setSchools] = React.useState<School[]>([]);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date();
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Fetch schools
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('name');

    setSchools(schoolsData || []);

    const schoolsToReport = selectedSchool === 'all' 
      ? schoolsData || []
      : (schoolsData || []).filter(s => s.id === selectedSchool);

    // Generate reports for each school
    const reportsData = await Promise.all(
      schoolsToReport.map(async (school) => {
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id);

        const { count: teacherCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .in('role', ['teacher', 'supervisor']);

        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('school_id', school.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
        const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
        const lateCount = attendance?.filter(a => a.status === 'late').length || 0;

        return {
          school,
          studentCount: studentCount || 0,
          teacherCount: teacherCount || 0,
          totalAttendance: attendance?.length || 0,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate: calculateAttendancePercentage(presentCount + lateCount, attendance?.length || 0),
        };
      })
    );

    setReports(reportsData);
    setLoading(false);
  }, [period, selectedSchool]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Calculate totals
  const totals = reports.reduce(
    (acc, r) => ({
      students: acc.students + r.studentCount,
      teachers: acc.teachers + r.teacherCount,
      attendance: acc.attendance + r.totalAttendance,
      present: acc.present + r.presentCount,
      absent: acc.absent + r.absentCount,
      late: acc.late + r.lateCount,
    }),
    { students: 0, teachers: 0, attendance: 0, present: 0, absent: 0, late: 0 }
  );

  const overallRate = calculateAttendancePercentage(totals.present + totals.late, totals.attendance);

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
            System-wide attendance analytics and reports
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
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
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
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-48"
        >
          <option value="all">All Schools</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
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
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Teachers</p>
                <p className="text-3xl font-bold">{totals.teachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Schools</p>
                <p className="text-3xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Breakdown</CardTitle>
          <CardDescription>Total attendance records for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-3xl font-bold">{totals.attendance}</p>
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

      {/* School Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            School-wise Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">School</th>
                  <th className="text-center py-3 px-4 font-medium">Students</th>
                  <th className="text-center py-3 px-4 font-medium">Teachers</th>
                  <th className="text-center py-3 px-4 font-medium">Present</th>
                  <th className="text-center py-3 px-4 font-medium">Late</th>
                  <th className="text-center py-3 px-4 font-medium">Absent</th>
                  <th className="text-center py-3 px-4 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, i) => (
                  <tr
                    key={report.school.id}
                    className="border-b hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{report.school.name}</p>
                        <p className="text-sm text-muted-foreground">{report.school.code}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{report.studentCount}</td>
                    <td className="text-center py-3 px-4">{report.teacherCount}</td>
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

