import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';

export default async function MoEDashboard() {
  const supabase = createClient();

  // Fetch all schools
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true);

  // Fetch counts
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['teacher', 'supervisor']);

  // Fetch today's attendance across all schools
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', today);

  const presentCount = todayAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
  const totalAttendance = todayAttendance?.length || 0;
  const overallAttendanceRate = calculateAttendancePercentage(presentCount, totalAttendance);

  // Get schools with their stats
  const schoolsWithStats = await Promise.all(
    (schools || []).map(async (school) => {
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id);

      const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id)
        .in('role', ['teacher', 'supervisor']);

      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id);

      return {
        ...school,
        student_count: studentCount || 0,
        teacher_count: teacherCount || 0,
        class_count: classCount || 0,
      };
    })
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">MoE Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Ministry of Education Overview • {formatDate(new Date())}
          </p>
        </div>
        <Link href="/moe/schools">
          <Button className="gap-2">
            <Building2 className="h-4 w-4" />
            Manage Schools
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Schools"
          value={schools?.length || 0}
          icon="building-2"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Total Students"
          value={totalStudents || 0}
          icon="graduation-cap"
          iconColor="text-violet-600"
        />
        <StatsCard
          title="Total Teachers"
          value={totalTeachers || 0}
          icon="users"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Today's Attendance"
          value={`${overallAttendanceRate}%`}
          icon="trending-up"
          iconColor="text-amber-600"
          description="Across all schools"
        />
      </div>

      {/* Schools Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Schools Overview
          </h2>
          <Link href="/moe/schools" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {schoolsWithStats && schoolsWithStats.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schoolsWithStats.map((school, i) => (
              <Card
                key={school.id}
                className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant={school.is_active ? 'present' : 'absent'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">{school.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{school.code}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-violet-600">{school.student_count}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{school.teacher_count}</p>
                      <p className="text-xs text-muted-foreground">Teachers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{school.class_count}</p>
                      <p className="text-xs text-muted-foreground">Classes</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/moe/schools/${school.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-1 group-hover:text-primary">
                        View Details
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
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schools Registered</h3>
            <p className="text-muted-foreground mb-4">
              Add schools to start managing the education system.
            </p>
            <Link href="/moe/schools/new">
              <Button>Add School</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Add New School</h3>
              <p className="text-sm text-muted-foreground">
                Register a new school
              </p>
            </div>
            <Link href="/moe/schools/new">
              <Button variant="outline" size="sm">
                Add
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">View Reports</h3>
              <p className="text-sm text-muted-foreground">
                Attendance & evaluations
              </p>
            </div>
            <Link href="/moe/reports">
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Send Announcement</h3>
              <p className="text-sm text-muted-foreground">
                Broadcast to all schools
              </p>
            </div>
            <Link href="/moe/announcements/new">
              <Button variant="outline" size="sm">
                Send
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

