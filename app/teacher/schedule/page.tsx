'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Loader2,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { SubjectSchedule } from '@/lib/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = React.useState<SubjectSchedule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(new Date().getDay());

  React.useEffect(() => {
    const fetchSchedule = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('subject_schedules')
          .select('*, class:classes(*), subject:subjects(*)')
          .eq('teacher_id', user.id)
          .order('day_of_week')
          .order('start_time');

        setSchedules((data as SubjectSchedule[]) || []);
      }
      setLoading(false);
    };

    fetchSchedule();
  }, []);

  const scheduleByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: schedules.filter((s) => s.day_of_week === index),
  }));

  const todaySchedule = schedules.filter((s) => s.day_of_week === selectedDay);

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
          <Calendar className="h-8 w-8" />
          My Schedule
        </h1>
        <p className="text-muted-foreground mt-1">
          Your weekly class schedule
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day, index) => (
          <Button
            key={day}
            variant={selectedDay === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(index)}
            className={`min-w-[100px] ${index === new Date().getDay() ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            {day.slice(0, 3)}
            <Badge variant="secondary" className="ml-2">
              {scheduleByDay[index].slots.length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Selected Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{DAYS[selectedDay]}&apos;s Schedule</span>
            {selectedDay === new Date().getDay() && (
              <Badge variant="present">Today</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 ? (
            <div className="space-y-4">
              {todaySchedule.map((slot, i) => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const startTime = new Date(`${today}T${slot.start_time}`);
                const endTime = new Date(`${today}T${slot.end_time}`);
                const isNow = selectedDay === now.getDay() && now >= startTime && now <= endTime;
                const isPast = selectedDay === now.getDay() && now > endTime;

                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border-2 transition-all animate-fade-in ${
                      isNow
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : isPast
                        ? 'border-muted bg-muted/30 opacity-60'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${isNow ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{slot.subject?.name}</h3>
                          <p className="text-muted-foreground">{slot.class?.name}</p>
                          {slot.room && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              Room {slot.room}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-lg font-mono">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <span>{slot.start_time?.slice(0, 5)}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{slot.end_time?.slice(0, 5)}</span>
                        </div>
                        {isNow && (
                          <Badge variant="present" className="animate-pulse">
                            In Progress
                          </Badge>
                        )}
                        {isPast && <Badge variant="outline">Completed</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes scheduled for {DAYS[selectedDay]}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scheduleByDay.filter((d) => d.slots.length > 0).map((dayData) => (
              <div
                key={dayData.day}
                className={`p-4 rounded-xl border ${dayData.dayIndex === new Date().getDay() ? 'border-primary bg-primary/5' : 'border-muted'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{dayData.day}</h4>
                  <Badge variant="secondary">{dayData.slots.length} classes</Badge>
                </div>
                <div className="space-y-2">
                  {dayData.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <p className="font-medium truncate">{slot.subject?.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

