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
import type { Class } from '@/lib/types';

export default function NewSchoolAnnouncementPage() {
  const router = useRouter();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    targetClass: 'all',
    targetAudience: 'all' as 'all' | 'teachers' | 'parents' | 'students',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  React.useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();

        if (profile?.school_id) {
          const { data } = await supabase
            .from('classes')
            .select('*')
            .eq('school_id', profile.school_id)
            .eq('status', 'active')
            .order('name');
          setClasses(data || []);
        }
      }
      setLoading(false);
    };
    fetchClasses();
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

    // Create announcement
    const { error: insertError } = await supabase.from('announcements').insert({
      school_id: profile.school_id,
      class_id: formData.targetClass === 'all' ? null : formData.targetClass,
      created_by: user.id,
      title: formData.title,
      content: formData.content,
      target_audience: formData.targetAudience,
      priority: formData.priority,
      is_active: true,
    });

    if (insertError) {
      setError('Failed to create announcement');
      setSubmitting(false);
      return;
    }

    // Get recipients based on target
    let recipientQuery = supabase
      .from('profiles')
      .select('id')
      .eq('school_id', profile.school_id)
      .eq('is_active', true);

    if (formData.targetAudience !== 'all') {
      const roleMap = { teachers: 'teacher', parents: 'parent', students: 'student' };
      recipientQuery = recipientQuery.eq('role', roleMap[formData.targetAudience as keyof typeof roleMap]);
    }

    const { data: recipients } = await recipientQuery;

    // Create notifications for recipients
    if (recipients) {
      for (const recipient of recipients) {
        await supabase.from('notifications').insert({
          school_id: profile.school_id,
          sender_id: user.id,
          recipient_id: recipient.id,
          type: 'announcement',
          title: formData.title,
          message: formData.content.substring(0, 200) + (formData.content.length > 200 ? '...' : ''),
          priority: formData.priority,
        });
      }
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/school');
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
          Your announcement has been broadcast successfully.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/school">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Create Announcement
          </h1>
          <p className="text-muted-foreground">
            Broadcast a message to your school
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
          <CardDescription>
            Create an announcement to send to your school community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Class</label>
                <Select
                  value={formData.targetClass}
                  onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                >
                  <option value="all">All Classes (School-wide)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
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
                    className="capitalize"
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
              <Link href="/school" className="flex-1">
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

