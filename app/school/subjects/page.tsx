'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import type { Subject } from '@/lib/types';

export default function SchoolSubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    description: '',
    max_absence_allowed: 10,
  });
  const [saving, setSaving] = React.useState(false);

  const fetchSubjects = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profile?.school_id) {
        const { data } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('name');

        setSubjects(data || []);
      }
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSubmit = async () => {
    if (!formData.name) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profile?.school_id) {
        if (editingSubject) {
          await supabase
            .from('subjects')
            .update({
              name: formData.name,
              code: formData.code || null,
              description: formData.description || null,
              max_absence_allowed: formData.max_absence_allowed,
            })
            .eq('id', editingSubject.id);
        } else {
          await supabase.from('subjects').insert({
            school_id: profile.school_id,
            name: formData.name,
            code: formData.code || null,
            description: formData.description || null,
            max_absence_allowed: formData.max_absence_allowed,
          });
        }

        setFormData({ name: '', code: '', description: '', max_absence_allowed: 10 });
        setShowAddDialog(false);
        setEditingSubject(null);
        fetchSubjects();
      }
    }
    setSaving(false);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      max_absence_allowed: subject.max_absence_allowed,
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    const supabase = createClient();
    await supabase.from('subjects').delete().eq('id', subjectId);
    fetchSubjects();
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '', max_absence_allowed: 10 });
  };

  const filteredSubjects = subjects.filter((subject) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      subject.name.toLowerCase().includes(searchLower) ||
      subject.code?.toLowerCase().includes(searchLower)
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
            <ClipboardList className="h-8 w-8" />
            Subjects Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage school subjects and curriculum
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject, i) => (
            <Card
              key={subject.id}
              className="animate-fade-in hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    {subject.code && (
                      <Badge variant="outline" className="mt-1 font-mono">
                        {subject.code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(subject)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleDelete(subject.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {subject.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Max absences allowed: <span className="font-semibold">{subject.max_absence_allowed}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subjects Found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'No subjects match your search.' : 'Get started by adding subjects.'}
          </p>
          <Button onClick={() => setShowAddDialog(true)}>Add Subject</Button>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Name *</label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Code</label>
              <Input
                placeholder="e.g., MATH101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Absences Allowed</label>
              <Input
                type="number"
                min={0}
                value={formData.max_absence_allowed}
                onChange={(e) => setFormData({ ...formData, max_absence_allowed: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

