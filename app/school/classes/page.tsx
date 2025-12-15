'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  ArrowRight,
  Loader2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { Class } from '@/lib/types';

interface ClassWithStats extends Class {
  student_count: number;
  attendance_rate: number;
}

export default function SchoolClassesPage() {
  const [classes, setClasses] = React.useState<ClassWithStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'active' | 'ended'>('all');

  const fetchClasses = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profile?.school_id) {
        let query = supabase
          .from('classes')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('name');

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data: classesData } = await query;

        // Get stats for each class
        const today = new Date().toISOString().split('T')[0];
        const classesWithStats = await Promise.all(
          (classesData || []).map(async (cls) => {
            const { count: studentCount } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id);

            const { data: attendance } = await supabase
              .from('attendance')
              .select('status')
              .eq('class_id', cls.id)
              .eq('date', today);

            const presentCount = attendance?.filter(
              (a) => a.status === 'present' || a.status === 'late'
            ).length || 0;

            return {
              ...cls,
              student_count: studentCount || 0,
              attendance_rate: calculateAttendancePercentage(presentCount, attendance?.length || 0),
            };
          })
        );

        setClasses(classesWithStats);
      }
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleDelete = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? All students and attendance records will be affected.')) {
      return;
    }
    const supabase = createClient();
    await supabase.from('classes').delete().eq('id', classId);
    fetchClasses();
  };

  const filteredClasses = classes.filter((cls) => {
    if (!search) return true;
    return (
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.grade_level?.toLowerCase().includes(search.toLowerCase())
    );
  });

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
            <BookOpen className="h-8 w-8" />
            Classes Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage school classes and their students
          </p>
        </div>
        <Link href="/school/classes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'active', 'ended'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls, i) => (
            <Card
              key={cls.id}
              className="group hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cls.status === 'active' ? 'present' : 'outline'}>
                      {cls.status}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-3">{cls.name}</CardTitle>
                {cls.grade_level && (
                  <p className="text-sm text-muted-foreground">{cls.grade_level}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xl font-bold">{cls.student_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xl font-bold">{cls.attendance_rate}%</p>
                    <p className="text-xs text-muted-foreground">Today&apos;s Rate</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/school/classes/${cls.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      Manage
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleDelete(cls.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'No classes match your search.' : 'Get started by creating your first class.'}
          </p>
          <Link href="/school/classes/new">
            <Button>Create Class</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

