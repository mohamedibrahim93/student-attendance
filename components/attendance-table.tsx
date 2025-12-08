'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student, AttendanceStatus } from '@/lib/types';

interface AttendanceTableProps {
  students: Student[];
  attendance: Record<string, AttendanceStatus>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  editable?: boolean;
  className?: string;
}

const statusConfig: Record<AttendanceStatus, { icon: typeof Check; label: string; variant: 'present' | 'absent' | 'late' | 'excused' }> = {
  present: { icon: Check, label: 'Present', variant: 'present' },
  absent: { icon: X, label: 'Absent', variant: 'absent' },
  late: { icon: Clock, label: 'Late', variant: 'late' },
  excused: { icon: Minus, label: 'Excused', variant: 'excused' },
};

export function AttendanceTable({
  students,
  attendance,
  onStatusChange,
  editable = true,
  className,
}: AttendanceTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800/50', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              {editable && (
                <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
            {students.map((student, index) => {
              const status = attendance[student.id] || 'absent';
              const config = statusConfig[status];
              const Icon = config.icon;

              return (
                <tr
                  key={student.id}
                  className={cn(
                    'bg-white dark:bg-gray-900 hover:bg-muted/30 transition-colors',
                    'animate-fade-in',
                    index % 2 === 1 && 'bg-muted/20'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={student.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{student.full_name}</p>
                        {student.email && (
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-muted-foreground">
                      {student.student_id_number || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={config.variant} className="gap-1.5">
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </td>
                  {editable && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {(Object.keys(statusConfig) as AttendanceStatus[]).map((s) => {
                          const StatusIcon = statusConfig[s].icon;
                          const isActive = status === s;
                          return (
                            <Button
                              key={s}
                              variant={isActive ? 'default' : 'ghost'}
                              size="icon"
                              className={cn(
                                'h-8 w-8 transition-all',
                                isActive && s === 'present' && 'bg-emerald-500 hover:bg-emerald-600',
                                isActive && s === 'absent' && 'bg-red-500 hover:bg-red-600',
                                isActive && s === 'late' && 'bg-amber-500 hover:bg-amber-600',
                                isActive && s === 'excused' && 'bg-blue-500 hover:bg-blue-600'
                              )}
                              onClick={() => onStatusChange(student.id, s)}
                              title={statusConfig[s].label}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {students.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No students in this class yet.</p>
        </div>
      )}
    </div>
  );
}

