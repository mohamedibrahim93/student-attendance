'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Trash2,
  Edit2,
  X,
  Loader2,
} from 'lucide-react';
import type { Class, Student } from '@/lib/types';

export default function StudentsPage() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [showAddClass, setShowAddClass] = React.useState(false);
  const [showAddStudent, setShowAddStudent] = React.useState(false);
  const [newClassName, setNewClassName] = React.useState('');
  const [newClassGrade, setNewClassGrade] = React.useState('');
  const [newStudent, setNewStudent] = React.useState({ name: '', email: '', studentId: '' });

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id);

      setClasses(classData || []);

      if (classData && classData.length > 0) {
        const classIds = classData.map((c) => c.id);
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .in('class_id', classIds)
          .order('full_name');

        setStudents(studentData || []);
      }
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('classes').insert({
      name: newClassName,
      grade_level: newClassGrade,
      teacher_id: user?.id,
    });

    setNewClassName('');
    setNewClassGrade('');
    setShowAddClass(false);
    fetchData();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !selectedClass) return;

    const supabase = createClient();

    await supabase.from('students').insert({
      full_name: newStudent.name,
      email: newStudent.email || null,
      student_id_number: newStudent.studentId || null,
      class_id: selectedClass,
    });

    setNewStudent({ name: '', email: '', studentId: '' });
    setShowAddStudent(false);
    fetchData();
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return;

    const supabase = createClient();
    await supabase.from('students').delete().eq('id', studentId);
    fetchData();
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will remove all students and attendance records.')) return;

    const supabase = createClient();
    await supabase.from('classes').delete().eq('id', classId);
    if (selectedClass === classId) {
      setSelectedClass('');
    }
    fetchData();
  };

  const filteredStudents = students.filter((s) => {
    const matchesClass = !selectedClass || s.class_id === selectedClass;
    const matchesSearch =
      !searchQuery ||
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students & Classes</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes and student roster
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddClass(true)} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Add Class
          </Button>
          <Button onClick={() => setShowAddStudent(true)} className="gap-2" disabled={!selectedClass}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddClass && (
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Class</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowAddClass(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddClass} className="space-y-4">
              <Input
                placeholder="Class Name (e.g., Mathematics 101)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
              />
              <Input
                placeholder="Grade Level (e.g., Grade 9)"
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit">Create Class</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddClass(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add New Student</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowAddStudent(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Email (optional)"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))}
              />
              <Input
                placeholder="Student ID (optional)"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent((p) => ({ ...p, studentId: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button type="submit">Add Student</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddStudent(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classes Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Classes</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedClass === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedClass('')}
          >
            All Classes
          </Button>
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center gap-1">
              <Button
                variant={selectedClass === cls.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedClass(cls.id)}
              >
                {cls.name}
                <Badge variant="secondary" className="ml-2">
                  {students.filter((s) => s.class_id === cls.id).length}
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeleteClass(cls.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {filteredStudents.map((student, i) => {
                const studentClass = classes.find((c) => c.id === student.class_id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar fallback={student.full_name} size="md" />
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
                    <div className="flex items-center gap-2">
                      {studentClass && (
                        <Badge variant="secondary">{studentClass.name}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedClass
                  ? 'Add students to this class to get started.'
                  : 'Create a class and add students to get started.'}
              </p>
              {selectedClass && (
                <Button onClick={() => setShowAddStudent(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

