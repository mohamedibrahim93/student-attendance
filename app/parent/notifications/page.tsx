'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  AlertCircle,
  Megaphone,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Loader2,
  Check,
  MailOpen,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'alert': AlertCircle,
  'announcement': Megaphone,
  'absence_alert': XCircle,
  'recall_request': Bell,
  'evacuation': AlertCircle,
  'evaluation': TrendingUp,
  'result': TrendingUp,
  'note': FileText,
  'request_update': CheckCircle,
};

const colorMap: Record<string, string> = {
  'alert': 'text-red-600 bg-red-100 dark:bg-red-900/30',
  'announcement': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  'absence_alert': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  'recall_request': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  'evacuation': 'text-red-600 bg-red-100 dark:bg-red-900/30',
  'evaluation': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  'result': 'text-violet-600 bg-violet-100 dark:bg-violet-900/30',
  'note': 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
  'request_update': 'text-green-600 bg-green-100 dark:bg-green-900/30',
};

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const fetchNotifications = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      let query = supabase
        .from('notifications')
        .select('*, sender:profiles!notifications_sender_id_fkey(*)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data } = await query;
      setNotifications((data as Notification[]) || []);
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

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
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with school announcements and alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <Check className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
          )}
        </Button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length > 0 ? (
        <div className="space-y-3">
          {displayedNotifications.map((notification, i) => {
            const IconComponent = iconMap[notification.type] || Bell;
            const colorClass = colorMap[notification.type] || 'text-gray-600 bg-gray-100';

            return (
              <Card
                key={notification.id}
                className={`animate-fade-in transition-all ${
                  !notification.is_read 
                    ? 'border-l-4 border-l-primary bg-primary/5' 
                    : 'opacity-75 hover:opacity-100'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="flex-shrink-0"
                          >
                            <MailOpen className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{formatDate(notification.created_at)}</span>
                        {notification.priority !== 'normal' && (
                          <Badge
                            variant={
                              notification.priority === 'urgent' ? 'destructive' :
                              notification.priority === 'high' ? 'late' : 'outline'
                            }
                          >
                            {notification.priority}
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
          <p className="text-muted-foreground">
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."}
          </p>
        </Card>
      )}
    </div>
  );
}

