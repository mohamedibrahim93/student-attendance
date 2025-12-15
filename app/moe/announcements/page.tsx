'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Loader2,
  Trash2,
  Users,
  Clock,
  Building2,
  Globe,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Announcement, Profile, School } from '@/lib/types';

interface AnnouncementWithDetails extends Announcement {
  creator?: Profile;
  school?: School;
}

export default function MoEAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<AnnouncementWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'active' | 'expired'>('active');

  const fetchAnnouncements = React.useCallback(async () => {
    const supabase = createClient();

    let query = supabase
      .from('announcements')
      .select('*, creator:profiles!announcements_created_by_fkey(*), school:schools(*)')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'expired') {
      query = query.eq('is_active', false);
    }

    const { data } = await query;
    setAnnouncements((data as AnnouncementWithDetails[]) || []);
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const supabase = createClient();
    await supabase.from('announcements').delete().eq('id', announcementId);
    fetchAnnouncements();
  };

  const handleToggleActive = async (announcementId: string, currentStatus: boolean) => {
    const supabase = createClient();
    await supabase
      .from('announcements')
      .update({ is_active: !currentStatus })
      .eq('id', announcementId);
    fetchAnnouncements();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'teachers': return 'Teachers';
      case 'parents': return 'Parents';
      case 'students': return 'Students';
      default: return 'Everyone';
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="h-8 w-8" />
            Ministry Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Broadcast announcements to all schools
          </p>
        </div>
        <Link href="/moe/announcements/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Announcement
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['active', 'expired', 'all'] as const).map((status) => (
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
                ? announcements.length 
                : announcements.filter(a => a.is_active === (status === 'active')).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement, i) => (
            <Card
              key={announcement.id}
              className={`animate-fade-in ${!announcement.is_active ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {getAudienceLabel(announcement.target_audience)}
                      </Badge>
                      {announcement.school ? (
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          {announcement.school.name}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-600">
                          <Globe className="h-3 w-3 mr-1" />
                          All Schools
                        </Badge>
                      )}
                      {!announcement.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span>By {announcement.creator?.full_name || 'Ministry'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                    >
                      {announcement.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'active' 
              ? 'No active announcements.'
              : 'No announcements found.'}
          </p>
          <Link href="/moe/announcements/new">
            <Button>Create Announcement</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

