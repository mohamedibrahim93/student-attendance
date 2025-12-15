'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Users,
  GraduationCap,
  ArrowRight,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
} from 'lucide-react';
import { formatDate, calculateAttendancePercentage } from '@/lib/utils';
import type { School } from '@/lib/types';

interface SchoolWithStats extends School {
  student_count: number;
  teacher_count: number;
  class_count: number;
}

export default function MoESchoolsPage() {
  const [schools, setSchools] = React.useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  const fetchSchools = React.useCallback(async () => {
    const supabase = createClient();

    let query = supabase.from('schools').select('*').order('name');
    
    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: schoolsData } = await query;

    // Get stats for each school
    const schoolsWithStats = await Promise.all(
      (schoolsData || []).map(async (school) => {
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id);

        const { count: teacherCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .in('role', ['teacher', 'supervisor']);

        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id);

        return {
          ...school,
          student_count: studentCount || 0,
          teacher_count: teacherCount || 0,
          class_count: classCount || 0,
        };
      })
    );

    setSchools(schoolsWithStats);
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleToggleActive = async (schoolId: string, currentStatus: boolean) => {
    const supabase = createClient();
    await supabase
      .from('schools')
      .update({ is_active: !currentStatus })
      .eq('id', schoolId);
    fetchSchools();
  };

  const handleDelete = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }
    const supabase = createClient();
    await supabase.from('schools').delete().eq('id', schoolId);
    fetchSchools();
  };

  const filteredSchools = schools.filter((school) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      school.name.toLowerCase().includes(searchLower) ||
      school.code.toLowerCase().includes(searchLower) ||
      school.principal_name?.toLowerCase().includes(searchLower)
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
            <Building2 className="h-8 w-8" />
            Schools Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered schools in the system
          </p>
        </div>
        <Link href="/moe/schools/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add School
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
              <Badge variant="secondary" className="ml-2">
                {status === 'all' 
                  ? schools.length 
                  : schools.filter(s => s.is_active === (status === 'active')).length}
              </Badge>
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Schools Grid */}
      {filteredSchools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school, i) => (
            <Card
              key={school.id}
              className="group hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={school.is_active ? 'present' : 'absent'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="relative group/menu">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-8 hidden group-hover/menu:block bg-card border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <Link
                          href={`/moe/schools/${school.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleActive(school.id, school.is_active)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-left"
                        >
                          <Power className="h-4 w-4" />
                          {school.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(school.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-left text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <CardTitle className="mt-3">{school.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{school.code}</p>
                {school.principal_name && (
                  <p className="text-sm text-muted-foreground">
                    Principal: {school.principal_name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-violet-600">{school.student_count}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{school.teacher_count}</p>
                    <p className="text-xs text-muted-foreground">Teachers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{school.class_count}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/moe/schools/${school.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      View Details
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Schools Found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'No schools match your search.' : 'Get started by adding your first school.'}
          </p>
          <Link href="/moe/schools/new">
            <Button>Add School</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

