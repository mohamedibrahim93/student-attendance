'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Hash,
  Save,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import type { School, Profile, Class } from '@/lib/types';
import { calculateAttendancePercentage } from '@/lib/utils';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const [school, setSchool] = React.useState<School | null>(null);
  const [teachers, setTeachers] = React.useState<Profile[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [stats, setStats] = React.useState({
    students: 0,
    teachers: 0,
    classes: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principal_name: '',
  });

  React.useEffect(() => {
    const fetchSchool = async () => {
      const supabase = createClient();

      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolData) {
        setSchool(schoolData);
        setFormData({
          name: schoolData.name || '',
          code: schoolData.code || '',
          address: schoolData.address || '',
          phone: schoolData.phone || '',
          email: schoolData.email || '',
          principal_name: schoolData.principal_name || '',
        });

        // Fetch stats
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);

        const { data: teacherData, count: teacherCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('school_id', schoolId)
          .in('role', ['teacher', 'supervisor', 'school_admin']);

        const { data: classData, count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact' })
          .eq('school_id', schoolId);

        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('school_id', schoolId)
          .eq('date', today);

        const presentCount = attendanceData?.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length || 0;

        setTeachers(teacherData || []);
        setClasses(classData || []);
        setStats({
          students: studentCount || 0,
          teachers: teacherCount || 0,
          classes: classCount || 0,
          attendanceRate: calculateAttendancePercentage(presentCount, attendanceData?.length || 0),
        });
      }

      setLoading(false);
    };

    fetchSchool();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('schools')
      .update({
        name: formData.name,
        code: formData.code.toUpperCase(),
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        principal_name: formData.principal_name || null,
      })
      .eq('id', schoolId);

    if (updateError) {
      setError('Failed to update school. Please try again.');
      setSaving(false);
      return;
    }

    setSuccess(true);
    setIsEditing(false);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);

    // Refresh school data
    const { data: updatedSchool } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();
    if (updatedSchool) setSchool(updatedSchool);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-16">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">School Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The school you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/moe/schools">
          <Button>Back to Schools</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/moe/schools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{school.name}</h1>
              <Badge variant={school.is_active ? 'present' : 'absent'}>
                {school.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{school.code}</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit School
          </Button>
        )}
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          School updated successfully!
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.students}
          icon="graduation-cap"
          iconColor="text-violet-600"
        />
        <StatsCard
          title="Total Teachers"
          value={stats.teachers}
          icon="users"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Total Classes"
          value={stats.classes}
          icon="book-open"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Today's Attendance"
          value={`${stats.attendanceRate}%`}
          icon="trending-up"
          iconColor="text-amber-600"
        />
      </div>

      {/* School Details / Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>
            {isEditing ? 'Edit school details' : 'View school information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    School Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    School Code *
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Principal Name
                </label>
                <Input
                  value={formData.principal_name}
                  onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">School Name</p>
                  <p className="font-medium">{school.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School Code</p>
                  <p className="font-medium">{school.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Principal</p>
                  <p className="font-medium">{school.principal_name || 'Not set'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{school.email || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{school.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{school.address || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teachers & Classes Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teachers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{teacher.full_name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {teacher.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No staff members</p>
            )}
          </CardContent>
        </Card>

        {/* Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Classes ({classes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.grade_level || 'No grade'} • {cls.academic_year}
                      </p>
                    </div>
                    <Badge
                      variant={cls.status === 'active' ? 'present' : 'outline'}
                      className="capitalize"
                    >
                      {cls.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No classes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

