import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  QrCode,
  ArrowRight,
  Clock,
  FileText,
  Calendar,
  CheckCircle,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function TeacherDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get teacher profile and school
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, school:schools(*)')
    .eq('id', user?.id)
    .single();

  // Fetch teacher's assignments (classes and subjects)
  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select('*, class:classes(*), subject:subjects(*)')
    .eq('teacher_id', user?.id);

  // Fetch unique classes
  const classIds = Array.from(new Set(assignments?.map(a => a.class_id) || []));
  
  const { data: classes } = await supabase
    .from('classes')
    .select('*, students:students(count)')
    .in('id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);

  // Fetch today's schedule
  const today = new Date();
  const dayOfWeek = today.getDay();
  const { data: todaySchedule } = await supabase
    .from('subject_schedules')
    .select('*, class:classes(*), subject:subjects(*)')
    .eq('teacher_id', user?.id)
    .eq('day_of_week', dayOfWeek)
    .order('start_time');

  // Fetch today's attendance stats
  const todayDate = today.toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status, class_id')
    .eq('date', todayDate)
    .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);

  // Fetch active check-in
  const { data: activeCheckIn } = await supabase
    .from('teacher_check_ins')
    .select('*, class:classes(*), subject:subjects(*)')
    .eq('teacher_id', user?.id)
    .eq('date', todayDate)
    .eq('status', 'active')
    .single();

  // Fetch pending leave requests
  const { data: leaveRequests } = await supabase
    .from('teacher_leave_requests')
    .select('*')
    .eq('teacher_id', user?.id)
    .eq('status', 'pending');

  const stats = {
    totalStudents: classes?.reduce((acc, c) => acc + (c.students?.[0]?.count || 0), 0) || 0,
    present: todayAttendance?.filter(a => a.status === 'present').length || 0,
    absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
    late: todayAttendance?.filter(a => a.status === 'late').length || 0,
  };

  const attendanceRate = calculateAttendancePercentage(
    stats.present + stats.late,
    todayAttendance?.length || 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            {formatDate(new Date())} • {profile?.school?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {activeCheckIn ? (
            <Button variant="outline" className="gap-2 border-green-500 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Checked In: {activeCheckIn.class?.name}
            </Button>
          ) : (
            <Link href="/teacher/attendance">
              <Button variant="outline" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Check In to Class
              </Button>
            </Link>
          )}
          <Link href="/teacher/attendance">
            <Button className="gap-2">
              <QrCode className="h-4 w-4" />
              Take Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Leave Requests Alert */}
      {leaveRequests && leaveRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                You have {leaveRequests.length} pending leave request{leaveRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/teacher/leave">
              <Button size="sm" variant="outline">View</Button>
            </Link>
          </CardContent>
        </Card>
      )}

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
          title="Today's Rate"
          value={`${attendanceRate}%`}
          icon="trending-up"
          iconColor="text-amber-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule && todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((slot, i) => {
                  const now = new Date();
                  const startTime = new Date(`${todayDate}T${slot.start_time}`);
                  const endTime = new Date(`${todayDate}T${slot.end_time}`);
                  const isNow = now >= startTime && now <= endTime;
                  const isPast = now > endTime;

                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isNow
                          ? 'border-primary bg-primary/5'
                          : isPast
                          ? 'border-muted bg-muted/30 opacity-60'
                          : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{slot.subject?.name}</p>
                          <p className="text-sm text-muted-foreground">{slot.class?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                          </p>
                          {slot.room && (
                            <p className="text-xs text-muted-foreground">Room {slot.room}</p>
                          )}
                        </div>
                      </div>
                      {isNow && (
                        <Badge className="mt-2" variant="present">In Progress</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No classes scheduled for today</p>
              </div>
            )}
            <Link href="/teacher/schedule" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View Full Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Classes Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Classes</h2>
            <Link href="/teacher/students" className="text-sm text-primary hover:underline">
              Manage Students →
            </Link>
          </div>

          {classes && classes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map((cls, i) => {
                const classAttendance = todayAttendance?.filter(a => a.class_id === cls.id) || [];
                const presentCount = classAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
                const rate = calculateAttendancePercentage(presentCount, classAttendance.length);

                return (
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
                        <Badge variant="outline">{cls.grade_level}</Badge>
                      </div>
                      <CardTitle className="mt-3">{cls.name}</CardTitle>
                      {cls.description && (
                        <CardDescription className="line-clamp-2">
                          {cls.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{cls.students?.[0]?.count || 0} students</span>
                        </div>
                        {classAttendance.length > 0 && (
                          <Badge variant={rate >= 80 ? 'present' : rate >= 60 ? 'late' : 'absent'}>
                            {rate}% today
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/teacher/attendance?class=${cls.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1">
                            <QrCode className="h-3 w-3" />
                            Attendance
                          </Button>
                        </Link>
                        <Link href={`/teacher/notes?class=${cls.id}`}>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
              <p className="text-muted-foreground mb-4">
                Contact your school admin to be assigned to classes.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/teacher/attendance" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <QrCode className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium">Generate QR Code</h3>
              <p className="text-xs text-muted-foreground">For student check-in</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/teacher/notes/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium">Add Student Note</h3>
              <p className="text-xs text-muted-foreground">For school or parent</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/teacher/leave/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Request Leave</h3>
              <p className="text-xs text-muted-foreground">Submit absence request</p>
            </div>
          </Link>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <Link href="/teacher/issues/new" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium">Report Issue</h3>
              <p className="text-xs text-muted-foreground">To supervisor/admin</p>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
