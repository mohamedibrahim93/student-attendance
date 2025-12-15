'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  Search,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AbsenceRequest, Student, Profile } from '@/lib/types';

type RequestWithRelations = AbsenceRequest & {
  student: Student;
  parent: Profile;
};

export default function SchoolRequestsPage() {
  const [requests, setRequests] = React.useState<RequestWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState<RequestWithRelations | null>(null);
  const [reviewNotes, setReviewNotes] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const fetchRequests = React.useCallback(async () => {
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
          .from('absence_requests')
          .select('*, student:students(*), parent:profiles!absence_requests_parent_id_fkey(*)')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data } = await query;
        setRequests((data as RequestWithRelations[]) || []);
      }
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setProcessing(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Update the request
      await supabase
        .from('absence_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedRequest.id);

      // Create notification for parent
      await supabase.from('notifications').insert({
        school_id: selectedRequest.school_id,
        sender_id: user.id,
        recipient_id: selectedRequest.parent_id,
        type: 'request_update',
        title: `Absence Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your absence request for ${selectedRequest.student?.full_name} (${formatDate(selectedRequest.start_date)} - ${formatDate(selectedRequest.end_date)}) has been ${status}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
        priority: 'normal',
        related_entity_type: 'absence_request',
        related_entity_id: selectedRequest.id,
      });

      // If approved, mark attendance as excused for those dates
      if (status === 'approved') {
        const startDate = new Date(selectedRequest.start_date);
        const endDate = new Date(selectedRequest.end_date);
        const dates: string[] = [];

        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }

        // Get student's class
        const { data: student } = await supabase
          .from('students')
          .select('class_id')
          .eq('id', selectedRequest.student_id)
          .single();

        if (student?.class_id) {
          for (const date of dates) {
            await supabase.from('attendance').upsert({
              student_id: selectedRequest.student_id,
              school_id: selectedRequest.school_id,
              class_id: student.class_id,
              date,
              status: 'excused',
              notes: `Excused absence - ${selectedRequest.reason}`,
              marked_by: user.id,
            }, {
              onConflict: 'student_id,class_id,subject_id,date',
            });
          }
        }
      }

      setSelectedRequest(null);
      setReviewNotes('');
      fetchRequests();
    }

    setProcessing(false);
  };

  const filteredRequests = requests.filter(r => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.student?.full_name?.toLowerCase().includes(searchLower) ||
      r.parent?.full_name?.toLowerCase().includes(searchLower) ||
      r.reason?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

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
            <Inbox className="h-8 w-8" />
            Absence Requests
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage parent absence requests
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
              {status === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
              {status === 'rejected' && <XCircle className="h-4 w-4 mr-1" />}
              {status}
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="grid gap-4">
          {filteredRequests.map((request, i) => (
            <Card
              key={request.id}
              className={`animate-fade-in cursor-pointer transition-all hover:shadow-lg ${
                request.status === 'pending' ? 'border-amber-200 dark:border-amber-800' : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setSelectedRequest(request)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar fallback={request.student?.full_name} size="lg" />
                    <div>
                      <h3 className="font-semibold text-lg">{request.student?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.parent?.full_name}
                      </p>
                    </div>
                  </div>

                  {/* Date & Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDate(request.start_date)}
                        {request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}
                      </span>
                    </div>
                    <Badge
                      variant={
                        request.status === 'approved' ? 'present' :
                        request.status === 'rejected' ? 'absent' : 'late'
                      }
                    >
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      <span className="capitalize">{request.status}</span>
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">Reason:</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
          <p className="text-muted-foreground">
            {filter === 'pending' 
              ? 'No pending requests to review.'
              : 'No requests match your filters.'}
          </p>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Absence Request</DialogTitle>
            <DialogDescription>
              Review the request details and approve or reject.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar fallback={selectedRequest.student?.full_name} size="lg" />
                <div>
                  <h3 className="font-semibold">{selectedRequest.student?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.student?.class?.name}
                  </p>
                </div>
              </div>

              {/* Parent Contact */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Parent Contact</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {selectedRequest.parent?.full_name}
                </div>
                {selectedRequest.parent?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {selectedRequest.parent.email}
                  </div>
                )}
                {selectedRequest.parent?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {selectedRequest.parent.phone}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDate(selectedRequest.start_date)}
                  {selectedRequest.start_date !== selectedRequest.end_date && 
                    ` - ${formatDate(selectedRequest.end_date)}`}
                </span>
              </div>

              {/* Reason */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Reason:</p>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>

              {/* Review Notes */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Review Notes (Optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Review Result (if already reviewed) */}
              {selectedRequest.status !== 'pending' && selectedRequest.review_notes && (
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-1">Review Notes:</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.review_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleReview('rejected')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview('approved')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Approve
                </Button>
              </>
            ) : (
              <Button onClick={() => setSelectedRequest(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

