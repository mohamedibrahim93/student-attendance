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
  Bell,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';
import type { School } from '@/lib/types';

export default function NewMoEAnnouncementPage() {
  const router = useRouter();
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    targetSchool: 'all',
    targetAudience: 'all' as 'all' | 'teachers' | 'parents' | 'students',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  React.useEffect(() => {
    const fetchSchools = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');
      setSchools(data || []);
      setLoading(false);
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.title || !formData.content) {
      setError('Title and content are required');
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

    // Determine which schools to send to
    const targetSchools = formData.targetSchool === 'all' 
      ? schools 
      : schools.filter(s => s.id === formData.targetSchool);

    // Create announcements for each school
    for (const school of targetSchools) {
      await supabase.from('announcements').insert({
        school_id: school.id,
        created_by: user.id,
        title: formData.title,
        content: formData.content,
        target_audience: formData.targetAudience,
        priority: formData.priority,
        is_active: true,
      });

      // Get recipients based on target audience
      let recipientQuery = supabase
        .from('profiles')
        .select('id')
        .eq('school_id', school.id)
        .eq('is_active', true);

      if (formData.targetAudience !== 'all') {
        recipientQuery = recipientQuery.eq('role', formData.targetAudience === 'teachers' ? 'teacher' : formData.targetAudience === 'parents' ? 'parent' : 'student');
      }

      const { data: recipients } = await recipientQuery;

      // Create notifications for recipients
      if (recipients) {
        for (const recipient of recipients) {
          await supabase.from('notifications').insert({
            school_id: school.id,
            sender_id: user.id,
            recipient_id: recipient.id,
            type: 'announcement',
            title: formData.title,
            message: formData.content.substring(0, 200) + (formData.content.length > 200 ? '...' : ''),
            priority: formData.priority,
          });
        }
      }
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/moe');
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
        <h1 className="text-2xl font-bold mb-2">Announcement Sent!</h1>
        <p className="text-muted-foreground mb-6">
          Your announcement has been broadcast to {formData.targetSchool === 'all' ? 'all schools' : 'the selected school'}.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/moe">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Send Announcement
          </h1>
          <p className="text-muted-foreground">
            Broadcast a message to schools
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
          <CardDescription>
            Create an announcement to send to schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your announcement message..."
                className="w-full min-h-[150px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Target Options */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target School</label>
                <Select
                  value={formData.targetSchool}
                  onChange={(e) => setFormData({ ...formData, targetSchool: e.target.value })}
                >
                  <option value="all">All Schools</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as typeof formData.targetAudience })}
                >
                  <option value="all">Everyone</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="parents">Parents Only</option>
                  <option value="students">Students Only</option>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-2">
                {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={formData.priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`capitalize ${
                      p === 'urgent' ? 'border-red-500' : 
                      p === 'high' ? 'border-amber-500' : ''
                    }`}
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
              <Link href="/moe" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Announcement
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

