'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { StudentNote, Student, Class } from '@/lib/types';

interface NoteWithStudent extends StudentNote {
  student: Student;
}

export default function TeacherNotesPage() {
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class');

  const [notes, setNotes] = React.useState<NoteWithStudent[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = React.useState(preselectedClass || 'all');
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get classes
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

        // Get notes created by this teacher
        let notesQuery = supabase
          .from('student_notes')
          .select('*, student:students(*)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        const { data: notesData } = await notesQuery;
        setNotes((notesData as NoteWithStudent[]) || []);
      }
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredNotes = selectedClass === 'all'
    ? notes
    : notes.filter((n) => n.student?.class_id === selectedClass);

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'parent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'school': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300';
    }
  };

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
        <div className="flex items-center gap-4">
          <Link href="/teacher">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Student Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage notes for students
            </p>
          </div>
        </div>
        <Link href="/teacher/notes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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
      </div>

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="grid gap-4">
          {filteredNotes.map((note, i) => (
            <Card
              key={note.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <Avatar fallback={note.student?.full_name || 'S'} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold">{note.title}</h3>
                      <Badge className={getNoteTypeColor(note.note_type)}>
                        {note.note_type === 'both' ? 'School & Parent' : note.note_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {note.student?.full_name}
                    </p>
                    <p className="text-muted-foreground">{note.content}</p>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>{formatDate(note.created_at)}</p>
                    <div className="flex gap-2 mt-2">
                      {note.is_read_by_school && (
                        <Badge variant="outline" className="text-xs">
                          Read by school
                        </Badge>
                      )}
                      {note.is_read_by_parent && (
                        <Badge variant="outline" className="text-xs">
                          Read by parent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Notes Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t created any notes yet.
          </p>
          <Link href="/teacher/notes/new">
            <Button>Add Note</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

