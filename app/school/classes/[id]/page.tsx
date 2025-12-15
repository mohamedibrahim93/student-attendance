'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Users,
  Plus,
  Trash2,
  Save,
  UserPlus,
  X,
} from 'lucide-react';
import type { Class, Student, Profile } from '@/lib/types';

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = React.useState<Class | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddStudent, setShowAddStudent] = React.useState(false);
  const [newStudent, setNewStudent] = React.useState({ name: '', email: '', student_id: '' });
  const [selectedStudent, setSelectedStudent] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();

    const { data: cls } = await supabase
      .from('classes')
      .select('*, homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(*)')
      .eq('id', classId)
      .single();

    if (cls) {
      setClassData(cls);

      // Fetch students in this class
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('full_name');

      setStudents(studentData || []);

      // Fetch students not in any class
      const { data: unassigned } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', cls.school_id)
        .is('class_id', null)
        .order('full_name');

      setAvailableStudents(unassigned || []);

      // Fetch teachers
      const { data: teacherData } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', cls.school_id)
        .in('role', ['teacher', 'supervisor'])
        .order('full_name');

      setTeachers(teacherData || []);
    }

    setLoading(false);
  }, [classId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !classData) return;

    const supabase = createClient();

    await supabase.from('students').insert({
      full_name: newStudent.name,
      email: newStudent.email || null,
      student_id_number: newStudent.student_id || null,
      class_id: classId,
      school_id: classData.school_id,
    });

    setNewStudent({ name: '', email: '', student_id: '' });
    setShowAddStudent(false);
    fetchData();
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent) return;

    const supabase = createClient();
    await supabase
      .from('students')
      .update({ class_id: classId })
      .eq('id', selectedStudent);

    setSelectedStudent('');
    fetchData();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the class?')) return;

    const supabase = createClient();
    await supabase
      .from('students')
      .update({ class_id: null })
      .eq('id', studentId);

    fetchData();
  };

  const handleUpdateClass = async (updates: Partial<Class>) => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('classes')
      .update(updates)
      .eq('id', classId);

    const { data: updatedClass } = await supabase
      .from('classes')
      .select('*, homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(*)')
      .eq('id', classId)
      .single();

    setClassData(updatedClass);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Class Not Found</h1>
        <Link href="/school/classes">
          <Button>Back to Classes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/school/classes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{classData.name}</h1>
              <Badge variant={classData.status === 'active' ? 'present' : 'outline'}>
                {classData.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {classData.grade_level} • {classData.academic_year}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Class Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Homeroom Teacher</label>
              <Select
                value={classData.homeroom_teacher_id || ''}
                onChange={(e) => handleUpdateClass({ homeroom_teacher_id: e.target.value || null })}
              >
                <option value="">No Teacher Assigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={classData.status}
                onChange={(e) => handleUpdateClass({ status: e.target.value as Class['status'] })}
              >
                <option value="active">Active</option>
                <option value="in_session">In Session</option>
                <option value="break">Break</option>
                <option value="ended">Ended</option>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-3xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Students Enrolled</p>
              </div>
            </div>

            {saving && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({students.length})
              </CardTitle>
              <div className="flex gap-2">
                {availableStudents.length > 0 && (
                  <div className="flex gap-2">
                    <Select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-48"
                    >
                      <option value="">Assign existing...</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </Select>
                    {selectedStudent && (
                      <Button size="sm" onClick={handleAssignStudent}>
                        Assign
                      </Button>
                    )}
                  </div>
                )}
                <Button size="sm" onClick={() => setShowAddStudent(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Student Form */}
            {showAddStudent && (
              <Card className="mb-4 border-dashed animate-fade-in">
                <CardContent className="p-4">
                  <form onSubmit={handleAddNewStudent} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Add New Student</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAddStudent(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input
                        placeholder="Full Name *"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                      <Input
                        placeholder="Student ID"
                        value={newStudent.student_id}
                        onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                      />
                    </div>
                    <Button type="submit" size="sm" className="gap-1">
                      <UserPlus className="h-4 w-4" />
                      Add Student
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Students List */}
            {students.length > 0 ? (
              <div className="space-y-2">
                {students.map((student, i) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar fallback={student.full_name} />
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {student.student_id_number && (
                            <span className="font-mono">{student.student_id_number}</span>
                          )}
                          {student.email && <span>{student.email}</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students in this class yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddStudent(true)}
                >
                  Add First Student
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

