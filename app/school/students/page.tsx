'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Student, Class } from '@/lib/types';

interface StudentWithClass extends Student {
  class?: Class;
}

export default function SchoolStudentsPage() {
  const [students, setStudents] = React.useState<StudentWithClass[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedClass, setSelectedClass] = React.useState('all');

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profile?.school_id) {
        const { data: studentData } = await supabase
          .from('students')
          .select('*, class:classes(*)')
          .eq('school_id', profile.school_id)
          .order('full_name');

        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('name');

        setStudents((studentData as StudentWithClass[]) || []);
        setClasses(classData || []);
      }
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const supabase = createClient();
    await supabase.from('students').delete().eq('id', studentId);
    fetchData();
  };

  const filteredStudents = students.filter((student) => {
    const matchesClass = selectedClass === 'all' || student.class_id === selectedClass;
    const matchesSearch = !search || 
      student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.student_id_number?.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
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
            <GraduationCap className="h-8 w-8" />
            Students Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all students in your school
          </p>
        </div>
        <Link href="/school/students/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-48"
        >
          <option value="all">All Classes</option>
          <option value="unassigned">Unassigned</option>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/20">
              <GraduationCap className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned to Classes</p>
              <p className="text-2xl font-bold">{students.filter(s => s.class_id).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20">
              <GraduationCap className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unassigned</p>
              <p className="text-2xl font-bold">{students.filter(s => !s.class_id).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="space-y-3">
              {filteredStudents.map((student, i) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar fallback={student.full_name} size="lg" />
                    <div>
                      <p className="font-semibold">{student.full_name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {student.student_id_number && (
                          <span className="font-mono">{student.student_id_number}</span>
                        )}
                        {student.email && <span>{student.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {student.class ? (
                      <Badge variant="secondary">{student.class.name}</Badge>
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students found</p>
              <Link href="/school/students/new">
                <Button className="mt-4">Add Student</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

