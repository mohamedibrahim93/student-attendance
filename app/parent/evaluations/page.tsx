'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  TrendingUp,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { Student, Evaluation, Subject } from '@/lib/types';

interface EvaluationWithSubject extends Evaluation {
  subject?: Subject;
}

export default function ParentEvaluationsPage() {
  const [children, setChildren] = React.useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = React.useState('');
  const [evaluations, setEvaluations] = React.useState<EvaluationWithSubject[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchChildren = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('students')
        .select('*, class:classes(*)')
        .eq('parent_id', user.id);

      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0].id);
      }
    }
    setLoading(false);
  }, []);

  const fetchEvaluations = React.useCallback(async () => {
    if (!selectedChild) return;

    const supabase = createClient();

    const { data } = await supabase
      .from('evaluations')
      .select('*, subject:subjects(*)')
      .eq('student_id', selectedChild)
      .order('created_at', { ascending: false });

    setEvaluations((data as EvaluationWithSubject[]) || []);
  }, [selectedChild]);

  React.useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  React.useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const selectedChildData = children.find((c) => c.id === selectedChild);

  // Group evaluations by type
  const evaluationsByType = evaluations.reduce((acc, ev) => {
    if (!acc[ev.evaluation_type]) acc[ev.evaluation_type] = [];
    acc[ev.evaluation_type].push(ev);
    return acc;
  }, {} as Record<string, EvaluationWithSubject[]>);

  // Calculate overall grade
  const overallGrade = evaluations.length > 0
    ? evaluations.filter((e) => e.grade).reduce((sum, e) => sum + (e.grade || 0), 0) / evaluations.filter((e) => e.grade).length
    : 0;

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
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8" />
            Evaluations & Grades
          </h1>
          <p className="text-muted-foreground mt-1">
            View student evaluations and progress
          </p>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Select
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
          className="w-48"
        >
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.full_name}
            </option>
          ))}
        </Select>
      )}

      {selectedChildData && (
        <>
          {/* Student Card */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar fallback={selectedChildData.full_name} size="lg" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedChildData.full_name}</h2>
                  <p className="text-muted-foreground">{selectedChildData.class?.name}</p>
                </div>
                {overallGrade > 0 && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {overallGrade.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Overall Grade</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evaluations */}
          {evaluations.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(evaluationsByType).map(([type, evals]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <FileText className="h-5 w-5" />
                      {type} Evaluations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {evals.map((ev, i) => (
                        <div
                          key={ev.id}
                          className="p-4 rounded-xl border animate-fade-in"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {ev.subject && (
                                  <Badge variant="outline" className="gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {ev.subject.name}
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(ev.period_start)} - {formatDate(ev.period_end)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-3">
                                {ev.grade !== null && ev.grade !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Grade</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                      {ev.grade}%
                                    </p>
                                  </div>
                                )}
                                {ev.attendance_rate !== null && ev.attendance_rate !== undefined && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Attendance</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {ev.attendance_rate}%
                                    </p>
                                  </div>
                                )}
                              </div>

                              {ev.comments && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                  <p className="text-sm font-medium mb-1">Teacher Comments</p>
                                  <p className="text-sm text-muted-foreground">{ev.comments}</p>
                                </div>
                              )}
                            </div>

                            <div className="text-right text-sm text-muted-foreground">
                              <p>Created</p>
                              <p className="font-medium">{formatDate(ev.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evaluations Yet</h3>
              <p className="text-muted-foreground">
                Evaluations will appear here when teachers submit them.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

