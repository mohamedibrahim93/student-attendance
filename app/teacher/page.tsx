import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function TeacherDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*, students:students(count)')
    .eq('teacher_id', user?.id);

  // Fetch today's attendance stats
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status, class_id')
    .eq('date', today)
    .in('class_id', classes?.map(c => c.id) || []);

  const stats = {
    totalStudents: classes?.reduce((acc, c) => acc + (c.students?.[0]?.count || 0), 0) || 0,
    present: todayAttendance?.filter(a => a.status === 'present').length || 0,
    absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
    late: todayAttendance?.filter(a => a.status === 'late').length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{formatDate(new Date())}</p>
        </div>
        <Link href="/teacher/attendance">
          <Button className="gap-2">
            <QrCode className="h-4 w-4" />
            Take Attendance
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon="users"
          iconColor="text-violet-600"
        />
        <StatsCard
          title="Present Today"
          value={stats.present}
          icon="user-check"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Absent Today"
          value={stats.absent}
          icon="user-x"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Late Today"
          value={stats.late}
          icon="clock"
          iconColor="text-amber-600"
        />
      </div>

      {/* Classes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Classes</h2>
          <Link href="/teacher/students" className="text-sm text-primary hover:underline">
            Manage Students →
          </Link>
        </div>

        {classes && classes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls, i) => (
              <Card
                key={cls.id}
                className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{cls.grade_level}</span>
                  </div>
                  <CardTitle className="mt-3">{cls.name}</CardTitle>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{cls.students?.[0]?.count || 0} students</span>
                    </div>
                    <Link href={`/teacher/attendance?class=${cls.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary">
                        Attendance
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first class to start tracking attendance.
            </p>
            <Link href="/teacher/students">
              <Button>Create Class</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">QR Code Attendance</h3>
              <p className="text-sm text-muted-foreground">
                Generate a QR code for students to scan
              </p>
            </div>
            <Link href="/teacher/attendance">
              <Button variant="outline" size="sm">
                Start
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Manage Students</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove students
              </p>
            </div>
            <Link href="/teacher/students">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
