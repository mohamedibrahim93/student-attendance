'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  User,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student, AttendanceStatus } from '@/lib/types';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  comment: string;
}

interface AttendancePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  onComplete: (records: AttendanceRecord[]) => void;
  existingAttendance?: Record<string, { status: AttendanceStatus; comment: string }>;
}

export function AttendancePopup({
  open,
  onOpenChange,
  students,
  onComplete,
  existingAttendance = {},
}: AttendancePopupProps) {
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [records, setRecords] = React.useState<Record<string, AttendanceRecord>>({});
  const [comment, setComment] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<AttendanceStatus | null>(null);
  const [showCommentField, setShowCommentField] = React.useState(false);

  const currentStudent = students[currentIndex];
  const totalStudents = students.length;
  const progress = ((currentIndex + 1) / totalStudents) * 100;

  // Initialize records from existing attendance when opening
  React.useEffect(() => {
    if (open && students.length > 0) {
      const initialRecords: Record<string, AttendanceRecord> = {};
      students.forEach((student) => {
        const existing = existingAttendance[student.id];
        if (existing) {
          initialRecords[student.id] = {
            studentId: student.id,
            status: existing.status,
            comment: existing.comment || '',
          };
        }
      });
      setRecords(initialRecords);
      setCurrentIndex(0);

      // Set initial state for first student
      const firstStudent = students[0];
      const firstExisting = existingAttendance[firstStudent?.id];
      if (firstExisting) {
        setSelectedStatus(firstExisting.status);
        setComment(firstExisting.comment || '');
        setShowCommentField(!!firstExisting.comment);
      } else {
        setSelectedStatus(null);
        setComment('');
        setShowCommentField(false);
      }
    }
  }, [open, students, existingAttendance]);

  // Update state when navigating between students
  React.useEffect(() => {
    if (currentStudent) {
      const existingRecord = records[currentStudent.id];
      if (existingRecord) {
        setSelectedStatus(existingRecord.status);
        setComment(existingRecord.comment);
        setShowCommentField(!!existingRecord.comment);
      } else {
        setSelectedStatus(null);
        setComment('');
        setShowCommentField(false);
      }
    }
  }, [currentIndex, currentStudent, records]);

  const handleStatusSelect = (status: AttendanceStatus) => {
    setSelectedStatus(status);
  };

  const saveCurrentAndProceed = (goNext: boolean) => {
    if (!currentStudent || !selectedStatus) return;

    // Save current student's record
    setRecords((prev) => ({
      ...prev,
      [currentStudent.id]: {
        studentId: currentStudent.id,
        status: selectedStatus,
        comment: comment.trim(),
      },
    }));

    if (goNext) {
      if (currentIndex < totalStudents - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Complete - gather all records
        const finalRecords = {
          ...records,
          [currentStudent.id]: {
            studentId: currentStudent.id,
            status: selectedStatus,
            comment: comment.trim(),
          },
        };
        onComplete(Object.values(finalRecords));
        onOpenChange(false);
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  const handlePrevious = () => {
    if (selectedStatus) {
      saveCurrentAndProceed(false);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    saveCurrentAndProceed(true);
  };

  const handleSkip = () => {
    if (currentIndex < totalStudents - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Complete with whatever we have
      onComplete(Object.values(records));
      onOpenChange(false);
    }
  };

  if (!currentStudent) return null;

  const statusButtons = [
    { status: 'present' as AttendanceStatus, icon: Check, label: t('attendance.present'), color: 'emerald', bgClass: 'bg-emerald-500 hover:bg-emerald-600', ringClass: 'ring-emerald-500' },
    { status: 'absent' as AttendanceStatus, icon: X, label: t('attendance.absent'), color: 'red', bgClass: 'bg-red-500 hover:bg-red-600', ringClass: 'ring-red-500' },
    { status: 'late' as AttendanceStatus, icon: Clock, label: t('attendance.late'), color: 'amber', bgClass: 'bg-amber-500 hover:bg-amber-600', ringClass: 'ring-amber-500' },
  ];

  const isLastStudent = currentIndex === totalStudents - 1;
  const hasRecord = records[currentStudent.id] || selectedStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[30vw] max-w-none" onClose={() => onOpenChange(false)}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <DialogHeader className="pt-6">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {t('attendancePopup.studentOf', { current: currentIndex + 1, total: totalStudents })}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                hasRecord && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              )}
            >
              {Object.keys(records).length} {t('attendancePopup.marked')}
            </Badge>
          </div>
          <DialogTitle className="text-center mt-4">{t('teacherAttendance.registerAttendance')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('attendancePopup.markStatus')}
          </DialogDescription>
        </DialogHeader>

        {/* Student Card */}
        <div className="px-6">
          <div className="flex flex-col items-center py-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border border-violet-100 dark:border-violet-900/50">
            <Avatar fallback={currentStudent.full_name} size="xl" />
            <h3 className="text-xl font-bold mt-4 text-foreground">
              {currentStudent.full_name}
            </h3>
            {currentStudent.student_id_number && (
              <p className="text-sm text-muted-foreground font-mono mt-1">
                ID: {currentStudent.student_id_number}
              </p>
            )}
            {currentStudent.email && (
              <p className="text-xs text-muted-foreground mt-1">
                {currentStudent.email}
              </p>
            )}
          </div>

          {/* Status Buttons */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
              {t('attendancePopup.selectStatus')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {statusButtons.map(({ status, icon: Icon, label, bgClass, ringClass }) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
                    'border-2 hover:scale-105',
                    selectedStatus === status
                      ? `${bgClass} text-white border-transparent ring-2 ring-offset-2 ${ringClass}`
                      : 'bg-muted/50 border-transparent hover:border-gray-300 dark:hover:border-gray-700 text-foreground'
                  )}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-6">
            {!showCommentField ? (
              <button
                onClick={() => setShowCommentField(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-muted-foreground hover:text-foreground hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{t('attendancePopup.addComment')}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">{t('attendancePopup.comment')}</label>
                  <button
                    onClick={() => {
                      setShowCommentField(false);
                      setComment('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('attendancePopup.remove')}
                  </button>
                </div>
                <Textarea
                  placeholder={t('attendancePopup.commentPlaceholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-initial gap-1"
            >
              <ChevronRight className="h-4 w-4" />
              {t('common.previous')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 sm:flex-initial text-muted-foreground"
            >
              {t('attendancePopup.skip')}
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={!selectedStatus}
            className={cn(
              'flex-1 sm:flex-initial gap-1',
              isLastStudent && 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {isLastStudent ? (
              <>
                <Check className="h-4 w-4" />
                {t('attendancePopup.complete')}
              </>
            ) : (
              <>
                {t('common.next')}
                <ChevronLeft className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
