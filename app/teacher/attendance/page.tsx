'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QRGenerator } from '@/components/qr-generator';
import { AttendanceTable } from '@/components/attendance-table';
import { AttendancePopup } from '@/components/attendance-popup';
import { QrCode, ClipboardList, Save, Loader2, UserCheck, Play } from 'lucide-react';
import { formatDate, generateSessionCode } from '@/lib/utils';
import type { Class, Student, AttendanceStatus } from '@/lib/types';

type ViewMode = 'qr' | 'manual';

interface AttendanceWithComment {
  status: AttendanceStatus;
  comment: string;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('class');
  const t = useTranslations();
  
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>(initialClassId || '');
  const [viewMode, setViewMode] = React.useState<ViewMode>('manual');
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceWithComment>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sessionCode, setSessionCode] = React.useState('');
  const [showAttendancePopup, setShowAttendancePopup] = React.useState(false);
  const [locale, setLocale] = React.useState('ar');

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setLocale(document.documentElement.lang || 'ar');
    }
  }, []);

  // Fetch classes on mount
  React.useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);
        
        setClasses(data || []);
        
        if (data && data.length > 0 && !selectedClass) {
          setSelectedClass(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchClasses();
  }, [selectedClass]);

  // Fetch students when class changes
  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      const supabase = createClient();
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .order('full_name');

      setStudents(studentData || []);

      // Fetch today's attendance for this class
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status, notes')
        .eq('class_id', selectedClass)
        .eq('date', today);

      const attendanceMap: Record<string, AttendanceWithComment> = {};
      studentData?.forEach((s) => {
        const record = attendanceData?.find((a) => a.student_id === s.id);
        attendanceMap[s.id] = {
          status: (record?.status as AttendanceStatus) || 'absent',
          comment: record?.notes || '',
        };
      });
      setAttendance(attendanceMap);
    };

    fetchStudents();
  }, [selectedClass]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleAttendanceComplete = (records: Array<{ studentId: string; status: AttendanceStatus; comment: string }>) => {
    const newAttendance: Record<string, AttendanceWithComment> = { ...attendance };
    records.forEach((record) => {
      newAttendance[record.studentId] = {
        status: record.status,
        comment: record.comment,
      };
    });
    setAttendance(newAttendance);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Upsert attendance records
      const records = Object.entries(attendance).map(([studentId, data]) => ({
        student_id: studentId,
        class_id: selectedClass,
        date: today,
        status: data.status,
        notes: data.comment || null,
        marked_by: user?.id,
        check_in_time: data.status === 'present' || data.status === 'late' ? new Date().toISOString() : null,
      }));

      for (const record of records) {
        await supabase
          .from('attendance')
          .upsert(record, { onConflict: 'student_id,class_id,date' });
      }

      alert(t('common.success'));
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSessionCreated = async (code: string) => {
    setSessionCode(code);
    
    if (!selectedClass) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create attendance session
    await supabase.from('attendance_sessions').insert({
      class_id: selectedClass,
      teacher_id: user?.id,
      session_code: code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  };

  const handleStartRegister = () => {
    if (students.length > 0) {
      setShowAttendancePopup(true);
    }
  };

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name;

  // Calculate simple status for AttendanceTable
  const simpleAttendance: Record<string, AttendanceStatus> = {};
  Object.entries(attendance).forEach(([id, data]) => {
    simpleAttendance[id] = data.status;
  });

  // Count stats
  const stats = {
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    absent: Object.values(attendance).filter(a => a.status === 'absent').length,
    late: Object.values(attendance).filter(a => a.status === 'late').length,
    excused: Object.values(attendance).filter(a => a.status === 'excused').length,
    withComments: Object.values(attendance).filter(a => a.comment).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.attendance')}</h1>
          <p className="text-muted-foreground mt-1">{formatDate(new Date(), locale)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-48"
          >
            <option value="">{t('teacherAttendance.selectClass')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {selectedClass ? (
        <>
          {/* View Mode Toggle */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={viewMode === 'qr' ? 'default' : 'outline'}
              onClick={() => setViewMode('qr')}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              {t('teacherAttendance.qrCode')}
            </Button>
            <Button
              variant={viewMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setViewMode('manual')}
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              {t('teacherAttendance.manualEntry')}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* QR Code / Manual Entry Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {viewMode === 'qr' ? t('teacherAttendance.qrCheckIn') : t('teacherAttendance.manualAttendance')}
                  </CardTitle>
                  {selectedClassName && (
                    <Badge variant="secondary">{selectedClassName}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'qr' ? (
                  <QRGenerator
                    classId={selectedClass}
                    onSessionCreated={handleSessionCreated}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Register Attendance Button */}
                    <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800">
                      <UserCheck className="h-12 w-12 text-violet-500 mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t('teacherAttendance.registerAttendance')}
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
                        {t('teacherAttendance.registerDescription')}
                      </p>
                      <Button 
                        onClick={handleStartRegister}
                        disabled={students.length === 0}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        size="lg"
                      >
                        <Play className="h-5 w-5" />
                        {t('teacherAttendance.startRegistration')} ({students.length} {t('nav.students')})
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    {Object.keys(attendance).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                          <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
                          <p className="text-xs text-muted-foreground">{t('attendance.present')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                          <p className="text-xs text-muted-foreground">{t('attendance.absent')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20">
                          <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                          <p className="text-xs text-muted-foreground">{t('attendance.late')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                          <p className="text-2xl font-bold text-blue-600">{stats.withComments}</p>
                          <p className="text-xs text-muted-foreground">{t('teacherAttendance.withNotes')}</p>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={saving || Object.keys(attendance).length === 0}
                      className="w-full gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('teacherAttendance.saving')}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {t('teacherAttendance.saveAttendance')}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Attendance Status */}
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherAttendance.todaysAttendance')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: t('attendance.present'), count: stats.present, color: 'emerald' },
                    { label: t('attendance.absent'), count: stats.absent, color: 'red' },
                    { label: t('attendance.late'), count: stats.late, color: 'amber' },
                    { label: t('attendance.excused'), count: stats.excused, color: 'blue' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`text-center p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
                    >
                      <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.count}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Student List with Comments */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => {
                    const data = attendance[student.id];
                    const statusColors: Record<AttendanceStatus, string> = {
                      present: 'bg-emerald-500',
                      absent: 'bg-red-500',
                      late: 'bg-amber-500',
                      excused: 'bg-blue-500',
                    };
                    
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${data ? statusColors[data.status] : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium text-sm">{student.full_name}</p>
                            {data?.comment && (
                              <p className="text-xs text-muted-foreground italic truncate max-w-48">
                                💬 {data.comment}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={data?.status === 'present' ? 'present' : data?.status === 'late' ? 'late' : data?.status === 'excused' ? 'excused' : 'absent'}
                        >
                          {data?.status ? t(`attendance.${data.status}`) : t('teacherAttendance.notMarked')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('teacherAttendance.selectClassTitle')}</h3>
          <p className="text-muted-foreground">
            {t('teacherAttendance.selectClassDescription')}
          </p>
        </Card>
      )}

      {/* Attendance Popup */}
      <AttendancePopup
        open={showAttendancePopup}
        onOpenChange={setShowAttendancePopup}
        students={students}
        existingAttendance={attendance}
        onComplete={handleAttendanceComplete}
      />
    </div>
  );
}
