'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Profile, Student } from '@/lib/types';

interface ParentWithStudents extends Profile {
  students: Student[];
}

export default function SchoolParentsPage() {
  const [parents, setParents] = React.useState<ParentWithStudents[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved'>('pending');
  const [processing, setProcessing] = React.useState<string | null>(null);

  const fetchParents = React.useCallback(async () => {
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
          .eq('role', 'parent')
          .order('created_at', { ascending: false });

        if (filter === 'pending') {
          query = query.eq('is_approved', false);
        } else if (filter === 'approved') {
          query = query.eq('is_approved', true);
        }

        const { data: parentData } = await query;

        // Get students for each parent
        const parentsWithStudents = await Promise.all(
          (parentData || []).map(async (parent) => {
            const { data: studentData } = await supabase
              .from('students')
              .select('*')
              .eq('parent_id', parent.id);

            return {
              ...parent,
              students: studentData || [],
            };
          })
        );

        setParents(parentsWithStudents);
      }
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleApprove = async (parentId: string) => {
    setProcessing(parentId);
    const supabase = createClient();

    await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', parentId);

    // Send notification
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        school_id: profile?.school_id,
        sender_id: user.id,
        recipient_id: parentId,
        type: 'result',
        title: 'Account Approved',
        message: 'Your parent account has been approved. You can now access the parent portal.',
        priority: 'normal',
      });
    }

    fetchParents();
    setProcessing(null);
  };

  const handleReject = async (parentId: string) => {
    if (!confirm('Are you sure you want to reject this parent registration?')) return;
    
    setProcessing(parentId);
    const supabase = createClient();

    await supabase
      .from('profiles')
      .delete()
      .eq('id', parentId);

    fetchParents();
    setProcessing(null);
  };

  const filteredParents = parents.filter((parent) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      parent.full_name.toLowerCase().includes(searchLower) ||
      parent.email.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = parents.filter((p) => !p.is_approved).length;

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
            Parent Management
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve parent registrations
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
              {status === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
              {status}
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Parents List */}
      {filteredParents.length > 0 ? (
        <div className="grid gap-4">
          {filteredParents.map((parent, i) => (
            <Card
              key={parent.id}
              className={`animate-fade-in ${!parent.is_approved ? 'border-amber-200 dark:border-amber-800' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar fallback={parent.full_name} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{parent.full_name}</h3>
                        <Badge variant={parent.is_approved ? 'present' : 'late'}>
                          {parent.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {parent.email}
                        </div>
                        {parent.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {parent.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {parent.students.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Children: </span>
                        {parent.students.map((s) => s.full_name).join(', ')}
                      </div>
                    )}

                    {!parent.is_approved && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(parent.id)}
                          disabled={processing === parent.id}
                        >
                          {processing === parent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600"
                          onClick={() => handleReject(parent.id)}
                          disabled={processing === parent.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Registered: {formatDate(parent.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Parents Found</h3>
          <p className="text-muted-foreground">
            {filter === 'pending' 
              ? 'No pending parent registrations.'
              : 'No parents match your filters.'}
          </p>
        </Card>
      )}
    </div>
  );
}

