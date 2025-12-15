'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';
import type { Class, Student } from '@/lib/types';

export default function NewStudentNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class');

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState(preselectedClass || '');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    student_id: '',
    title: '',
    content: '',
    note_type: 'both' as 'school' | 'parent' | 'both',
  });

  React.useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get classes assigned to teacher
        const { data: assignments } = await supabase
          .from('teacher_assignments')
          .select('class_id')
          .eq('teacher_id', user.id);

        const classIds = Array.from(new Set(assignments?.map((a) => a.class_id) || []));

        if (classIds.length > 0) {
          const { data: classData } = await supabase
            .from('classes')
            .select('*')
            .in('id', classIds)
            .order('name');

          setClasses(classData || []);
        }
      }
      setLoading(false);
    };

    fetchClasses();
  }, []);

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .order('full_name');

      setStudents(data || []);
    };

    fetchStudents();
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.student_id || !formData.title || !formData.content) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated');
      setSubmitting(false);
      return;
    }

    const student = students.find((s) => s.id === formData.student_id);
    if (!student) {
      setError('Student not found');
      setSubmitting(false);
      return;
    }

    // Create the note
    const { error: insertError } = await supabase.from('student_notes').insert({
      student_id: formData.student_id,
      school_id: student.school_id,
      created_by: user.id,
      note_type: formData.note_type,
      title: formData.title,
      content: formData.content,
    });

    if (insertError) {
      setError('Failed to create note');
      setSubmitting(false);
      return;
    }

    // If note is for parent, notify them
    if ((formData.note_type === 'parent' || formData.note_type === 'both') && student.parent_id) {
      await supabase.from('notifications').insert({
        school_id: student.school_id,
        sender_id: user.id,
        recipient_id: student.parent_id,
        type: 'note',
        title: `New Note: ${formData.title}`,
        message: `A new note has been added for ${student.full_name}: ${formData.content.substring(0, 100)}...`,
        priority: 'normal',
        related_entity_type: 'student',
        related_entity_id: student.id,
      });
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/teacher');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-6 animate-scale-in">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Note Created!</h1>
        <p className="text-muted-foreground mb-6">
          The note has been saved and relevant parties have been notified.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Add Student Note
          </h1>
          <p className="text-muted-foreground">
            Create a note for school or parent
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Note Details</CardTitle>
          <CardDescription>
            Add a note about a student for school records or to share with parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class & Student Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class *</label>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setFormData({ ...formData, student_id: '' });
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Student *</label>
                <Select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  disabled={!selectedClass}
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Note Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Visibility *</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'both', label: 'School & Parent' },
                  { value: 'school', label: 'School Only' },
                  { value: 'parent', label: 'Parent Only' },
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.note_type === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, note_type: type.value as typeof formData.note_type })}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.note_type === 'school' && 'Only visible to school administrators'}
                {formData.note_type === 'parent' && 'Visible to the student\'s parent/guardian'}
                {formData.note_type === 'both' && 'Visible to both school and parent'}
              </p>
            </div>

            {/* Note Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Brief title for the note"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note here..."
                className="w-full min-h-[150px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/teacher" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

