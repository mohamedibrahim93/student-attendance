'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Loader2,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/lib/types';

export default function SchoolTeachersPage() {
  const [teachers, setTeachers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'teacher' | 'supervisor'>('all');

  const fetchTeachers = React.useCallback(async () => {
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
          .from('profiles')
          .select('*')
          .eq('school_id', profile.school_id)
          .in('role', ['teacher', 'supervisor'])
          .order('full_name');

        if (filter !== 'all') {
          query = query.eq('role', filter);
        }

        const { data } = await query;
        setTeachers(data || []);
      }
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to remove this teacher?')) return;
    const supabase = createClient();
    await supabase.from('profiles').delete().eq('id', teacherId);
    fetchTeachers();
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      teacher.full_name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower)
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
            <Users className="h-8 w-8" />
            Teachers Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage teachers and supervisors
          </p>
        </div>
        <Link href="/school/teachers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'teacher', 'supervisor'] as const).map((role) => (
            <Button
              key={role}
              variant={filter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(role)}
              className="capitalize"
            >
              {role === 'all' ? 'All Staff' : `${role}s`}
              <Badge variant="secondary" className="ml-2">
                {role === 'all' 
                  ? teachers.length 
                  : teachers.filter(t => t.role === role).length}
              </Badge>
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Teachers List */}
      {filteredTeachers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher, i) => (
            <Card
              key={teacher.id}
              className="animate-fade-in hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar fallback={teacher.full_name} size="lg" />
                    <div>
                      <h3 className="font-semibold">{teacher.full_name}</h3>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {teacher.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleDelete(teacher.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Joined {formatDate(teacher.created_at)}</span>
                  <Badge variant={teacher.is_active ? 'present' : 'absent'}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'No teachers match your search.' : 'Get started by adding teachers.'}
          </p>
          <Link href="/school/teachers/new">
            <Button>Add Teacher</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

