'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  CheckSquare,
  Search,
  Loader2,
  Calendar,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { Attendance, Class, Student } from '@/lib/types';

interface AttendanceRecord extends Attendance {
  student?: Student;
  class?: Class;
}

export default function SchoolAttendancePage() {
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedClass, setSelectedClass] = React.useState('all');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profile?.school_id) {
        // Fetch classes
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('name');

        setClasses(classData || []);

        // Fetch attendance
        let query = supabase
          .from('attendance')
          .select('*, student:students(*), class:classes(*)')
          .eq('school_id', profile.school_id)
          .eq('date', selectedDate)
          .order('check_in_time', { ascending: false });

        if (selectedClass !== 'all') {
          query = query.eq('class_id', selectedClass);
        }

        const { data } = await query;
        setAttendance((data as AttendanceRecord[]) || []);
      }
    }
    setLoading(false);
  }, [selectedClass, selectedDate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAttendance = attendance.filter((record) => {
    if (!search) return true;
    return record.student?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  // Stats
  const stats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((a) => a.status === 'present').length,
    absent: filteredAttendance.filter((a) => a.status === 'absent').length,
    late: filteredAttendance.filter((a) => a.status === 'late').length,
    excused: filteredAttendance.filter((a) => a.status === 'excused').length,
  };

  const attendanceRate = calculateAttendancePercentage(stats.present + stats.late, stats.total);

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
            <CheckSquare className="h-8 w-8" />
            Attendance Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage school attendance records
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
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
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.present}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.late}</p>
            <p className="text-sm text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-violet-600">{attendanceRate}%</p>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance for {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            {filteredAttendance.length} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length > 0 ? (
            <div className="space-y-2">
              {filteredAttendance.map((record, i) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'present' ? 'bg-emerald-500' :
                      record.status === 'late' ? 'bg-amber-500' :
                      record.status === 'excused' ? 'bg-blue-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{record.student?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.class?.name}
                        {record.check_in_time && (
                          <> • Check-in: {new Date(record.check_in_time).toLocaleTimeString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {record.notes && (
                      <span className="text-sm text-muted-foreground max-w-48 truncate">
                        📝 {record.notes}
                      </span>
                    )}
                    <Badge
                      variant={
                        record.status === 'present' ? 'present' :
                        record.status === 'late' ? 'late' :
                        record.status === 'excused' ? 'excused' : 'absent'
                      }
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

