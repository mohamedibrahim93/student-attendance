'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  Download,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Profile, School } from '@/lib/types';

interface TeacherWithSchool extends Profile {
  school?: School;
}

export default function MoETeachersPage() {
  const [teachers, setTeachers] = React.useState<TeacherWithSchool[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedSchool, setSelectedSchool] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState<'all' | 'teacher' | 'supervisor'>('all');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch all schools
    const { data: schoolData } = await supabase
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('name');

    setSchools(schoolData || []);

    // Fetch all teachers
    let query = supabase
      .from('profiles')
      .select('*, school:schools(*)')
      .in('role', ['teacher', 'supervisor'])
      .order('full_name');

    if (selectedSchool !== 'all') {
      query = query.eq('school_id', selectedSchool);
    }

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data } = await query;
    setTeachers((data as TeacherWithSchool[]) || []);
    setLoading(false);
  }, [selectedSchool, roleFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTeachers = teachers.filter((teacher) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      teacher.full_name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      teacher.school?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    total: teachers.length,
    teachers: teachers.filter((t) => t.role === 'teacher').length,
    supervisors: teachers.filter((t) => t.role === 'supervisor').length,
    active: teachers.filter((t) => t.is_active).length,
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Teachers Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            View all teachers across all schools
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.teachers}</p>
            <p className="text-sm text-muted-foreground">Teachers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-violet-600">{stats.supervisors}</p>
            <p className="text-sm text-muted-foreground">Supervisors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-56"
        >
          <option value="all">All Schools</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          {(['all', 'teacher', 'supervisor'] as const).map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className="capitalize"
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
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
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar fallback={teacher.full_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{teacher.full_name}</h3>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {teacher.role}
                    </Badge>
                  </div>
                  <Badge variant={teacher.is_active ? 'present' : 'absent'}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {teacher.school && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{teacher.school.name}</span>
                    </div>
                  )}
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

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Joined {formatDate(teacher.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
          <p className="text-muted-foreground">
            {search ? 'No teachers match your search.' : 'No teachers registered yet.'}
          </p>
        </Card>
      )}
    </div>
  );
}

