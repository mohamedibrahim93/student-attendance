'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';
import type { Student } from '@/lib/types';

export default function NewParentIssuePage() {
  const router = useRouter();
  const [children, setChildren] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    issue_type: 'student_issue' as 'student_issue' | 'complaint' | 'suggestion' | 'other',
    related_student_id: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  React.useEffect(() => {
    const fetchChildren = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('students')
          .select('*, class:classes(*)')
          .eq('parent_id', user.id);

        setChildren(data || []);
        if (data && data.length > 0) {
          setFormData((f) => ({ ...f, related_student_id: data[0].id }));
        }
      }
      setLoading(false);
    };

    fetchChildren();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.title || !formData.description) {
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
      .select('school_id, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      setError('No school associated');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('issues').insert({
      school_id: profile.school_id,
      reported_by: user.id,
      issue_type: formData.issue_type,
      related_student_id: formData.related_student_id || null,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'open',
    });

    if (insertError) {
      setError('Failed to submit issue');
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
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          school_id: profile.school_id,
          sender_id: user.id,
          recipient_id: admin.id,
          type: 'alert',
          title: `Parent Issue: ${formData.title}`,
          message: `${profile.full_name} reported an issue: ${formData.description.substring(0, 100)}...`,
          priority: formData.priority,
        });
      }
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/parent');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-6 animate-scale-in">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Issue Reported!</h1>
        <p className="text-muted-foreground mb-6">
          Your issue has been submitted and will be reviewed by the school.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/parent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Report Issue
          </h1>
          <p className="text-muted-foreground">
            Contact the school about an issue
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Describe the issue you want to report to the school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type *</label>
              <Select
                value={formData.issue_type}
                onChange={(e) => setFormData({ ...formData, issue_type: e.target.value as typeof formData.issue_type })}
              >
                <option value="student_issue">Issue Related to My Child</option>
                <option value="complaint">General Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Related Child */}
            {formData.issue_type === 'student_issue' && children.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Related Child</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, related_student_id: child.id })}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        formData.related_student_id === child.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <Avatar fallback={child.full_name} />
                      <div>
                        <p className="font-medium">{child.full_name}</p>
                        <p className="text-sm text-muted-foreground">{child.class?.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Brief title for the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                className="w-full min-h-[150px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-2 flex-wrap">
                {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={formData.priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`capitalize ${p === 'urgent' ? 'border-red-500' : p === 'high' ? 'border-amber-500' : ''}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/parent" className="flex-1">
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
                    Submit Issue
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

