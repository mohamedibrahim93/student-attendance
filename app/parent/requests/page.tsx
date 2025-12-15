'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Send,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AbsenceRequest, Student } from '@/lib/types';

export default function ParentRequestsPage() {
  const [requests, setRequests] = React.useState<(AbsenceRequest & { student: Student })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  React.useEffect(() => {
    const fetchRequests = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('absence_requests')
          .select('*, student:students(*), reviewer:profiles!absence_requests_reviewed_by_fkey(*)')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false });

        setRequests((data as (AbsenceRequest & { student: Student })[]) || []);
      }
      setLoading(false);
    };

    fetchRequests();
  }, []);

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'present';
      case 'rejected': return 'absent';
      default: return 'late';
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
        <div>
          <h1 className="text-3xl font-bold">Absence Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your absence requests
          </p>
        </div>
        <Link href="/parent/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status}
            {status !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {requests.filter(r => status === 'all' || r.status === status).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="grid gap-4">
          {filteredRequests.map((request, i) => (
            <Card
              key={request.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{request.student?.full_name}</h3>
                      <Badge variant={getStatusVariant(request.status) as 'present' | 'absent' | 'late'}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(request.start_date)} 
                        {request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{request.reason}</p>

                    {request.review_notes && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">Review Notes:</p>
                        <p className="text-sm text-muted-foreground">{request.review_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground text-right">
                    <p>Submitted</p>
                    <p className="font-medium">{formatDate(request.created_at)}</p>
                    {request.reviewed_at && (
                      <>
                        <p className="mt-2">Reviewed</p>
                        <p className="font-medium">{formatDate(request.reviewed_at)}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all' 
              ? "You haven't submitted any absence requests yet."
              : `No ${filter} requests found.`}
          </p>
          {filter === 'all' && (
            <Link href="/parent/requests/new">
              <Button>Submit Request</Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}

