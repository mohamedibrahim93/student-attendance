'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Search,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Issue, Profile, Student } from '@/lib/types';

type IssueWithRelations = Issue & {
  reporter: Profile;
  related_student?: Student;
  assignee?: Profile;
};

export default function SchoolIssuesPage() {
  const [issues, setIssues] = React.useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'open' | 'in_progress' | 'resolved' | 'all'>('open');
  const [selectedIssue, setSelectedIssue] = React.useState<IssueWithRelations | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const fetchIssues = React.useCallback(async () => {
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
          .from('issues')
          .select('*, reporter:profiles!issues_reported_by_fkey(*), related_student:students(*), assignee:profiles!issues_assigned_to_fkey(*)')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data } = await query;
        setIssues((data as IssueWithRelations[]) || []);
      }
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleUpdateStatus = async (issueId: string, status: Issue['status'], notes?: string) => {
    setProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const updates: Partial<Issue> = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolution_notes = notes || null;
    }
    if (status === 'in_progress' && user) {
      updates.assigned_to = user.id;
    }

    await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId);

    // Notify reporter
    const issue = issues.find((i) => i.id === issueId);
    if (issue && user) {
      await supabase.from('notifications').insert({
        school_id: issue.school_id,
        sender_id: user.id,
        recipient_id: issue.reported_by,
        type: 'result',
        title: `Issue ${status === 'resolved' ? 'Resolved' : 'Updated'}`,
        message: `Your issue "${issue.title}" has been ${status === 'resolved' ? 'resolved' : 'marked as in progress'}.${notes ? ` Resolution: ${notes}` : ''}`,
        priority: 'normal',
      });
    }

    setSelectedIssue(null);
    setResolutionNotes('');
    fetchIssues();
    setProcessing(false);
  };

  const filteredIssues = issues.filter((issue) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      issue.title.toLowerCase().includes(searchLower) ||
      issue.description.toLowerCase().includes(searchLower) ||
      issue.reporter?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'absent';
      case 'in_progress': return 'late';
      case 'resolved': return 'present';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
      default: return 'text-muted-foreground bg-muted';
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="h-8 w-8" />
          Issues & Complaints
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage reported issues from teachers and parents
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {(['open', 'in_progress', 'resolved', 'all'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status.replace('_', ' ')}
              <Badge variant="secondary" className="ml-2">
                {issues.filter((i) => status === 'all' || i.status === status).length}
              </Badge>
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length > 0 ? (
        <div className="grid gap-4">
          {filteredIssues.map((issue, i) => (
            <Card
              key={issue.id}
              className="animate-fade-in cursor-pointer hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setSelectedIssue(issue)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(issue.priority)}`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge variant={getStatusColor(issue.status) as 'present' | 'absent' | 'late'}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {issue.issue_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar fallback={issue.reporter?.full_name || 'U'} size="sm" />
                      <span className="text-muted-foreground">{issue.reporter?.full_name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(issue.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
          <p className="text-muted-foreground">
            {filter === 'open' ? 'No open issues to address.' : 'No issues match your filters.'}
          </p>
        </Card>
      )}

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getStatusColor(selectedIssue.status) as 'present' | 'absent' | 'late'}>
                    {selectedIssue.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedIssue.issue_type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedIssue.priority)}>
                    {selectedIssue.priority}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">{selectedIssue.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <Avatar fallback={selectedIssue.reporter?.full_name || 'U'} />
                <div>
                  <p className="font-medium">{selectedIssue.reporter?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Reported on {formatDate(selectedIssue.created_at)}
                  </p>
                </div>
              </div>

              {selectedIssue.related_student && (
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Related Student</p>
                  <p className="font-medium">{selectedIssue.related_student.full_name}</p>
                </div>
              )}

              {selectedIssue.resolution_notes && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Resolution</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{selectedIssue.resolution_notes}</p>
                </div>
              )}

              {selectedIssue.status !== 'resolved' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about how this issue was resolved..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedIssue?.status === 'open' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus(selectedIssue.id, 'in_progress')}
                disabled={processing}
                className="gap-1"
              >
                <Clock className="h-4 w-4" />
                Mark In Progress
              </Button>
            )}
            {selectedIssue?.status !== 'resolved' && (
              <Button
                className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateStatus(selectedIssue!.id, 'resolved', resolutionNotes)}
                disabled={processing}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Resolve Issue
              </Button>
            )}
            {selectedIssue?.status === 'resolved' && (
              <Button onClick={() => setSelectedIssue(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

