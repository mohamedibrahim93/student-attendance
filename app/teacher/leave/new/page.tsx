'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    start_date: '',
    end_date: '',
    leave_type: 'personal' as 'sick' | 'personal' | 'emergency' | 'other',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.start_date || !formData.reason) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      setError('No school associated');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('teacher_leave_requests').insert({
      teacher_id: user.id,
      school_id: profile.school_id,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      leave_type: formData.leave_type,
      reason: formData.reason,
      status: 'pending',
    });

    if (insertError) {
      setError('Failed to submit request');
      setSubmitting(false);
      return;
    }

    // Notify school admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('school_id', profile.school_id)
      .in('role', ['school_admin', 'supervisor']);

    if (admins) {
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      for (const admin of admins) {
        await supabase.from('notifications').insert({
          school_id: profile.school_id,
          sender_id: user.id,
          recipient_id: admin.id,
          type: 'alert',
          title: 'New Leave Request',
          message: `${teacherProfile?.full_name} has submitted a ${formData.leave_type} leave request for ${formData.start_date}${formData.end_date && formData.end_date !== formData.start_date ? ` to ${formData.end_date}` : ''}.`,
          priority: formData.leave_type === 'emergency' ? 'high' : 'normal',
        });
      }
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/teacher/leave');
    }, 2000);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-6 animate-scale-in">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Request Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your leave request has been submitted and is pending approval.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/leave">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Request Leave
          </h1>
          <p className="text-muted-foreground">
            Submit a leave or absence request
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
          <CardDescription>
            Provide details about your leave request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type *</label>
              <Select
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as typeof formData.leave_type })}
              >
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please describe the reason for your leave request..."
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/teacher/leave" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
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

