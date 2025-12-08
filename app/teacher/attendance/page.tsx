'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QRGenerator } from '@/components/qr-generator';
import { AttendanceTable } from '@/components/attendance-table';
import { QrCode, ClipboardList, Save, Loader2 } from 'lucide-react';
import { formatDate, generateSessionCode } from '@/lib/utils';
import type { Class, Student, AttendanceStatus } from '@/lib/types';

type ViewMode = 'qr' | 'manual';

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('class');
  
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>(initialClassId || '');
  const [viewMode, setViewMode] = React.useState<ViewMode>('qr');
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sessionCode, setSessionCode] = React.useState('');

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
        .select('student_id, status')
        .eq('class_id', selectedClass)
        .eq('date', today);

      const attendanceMap: Record<string, AttendanceStatus> = {};
      studentData?.forEach((s) => {
        const record = attendanceData?.find((a) => a.student_id === s.id);
        attendanceMap[s.id] = record?.status as AttendanceStatus || 'absent';
      });
      setAttendance(attendanceMap);
    };

    fetchStudents();
  }, [selectedClass]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Upsert attendance records
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        date: today,
        status,
        marked_by: user?.id,
        check_in_time: status === 'present' || status === 'late' ? new Date().toISOString() : null,
      }));

      for (const record of records) {
        await supabase
          .from('attendance')
          .upsert(record, { onConflict: 'student_id,class_id,date' });
      }

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
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

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name;

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
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-48"
          >
            <option value="">Select Class</option>
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
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'qr' ? 'default' : 'outline'}
              onClick={() => setViewMode('qr')}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Button
              variant={viewMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setViewMode('manual')}
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Manual Entry
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* QR Code / Manual Entry Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {viewMode === 'qr' ? 'QR Code Check-in' : 'Manual Attendance'}
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
                  <div className="space-y-4">
                    <AttendanceTable
                      students={students}
                      attendance={attendance}
                      onStatusChange={handleStatusChange}
                      editable
                    />
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      className="w-full gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Attendance
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
                <CardTitle>Today&apos;s Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Present', count: Object.values(attendance).filter(s => s === 'present').length, color: 'emerald' },
                    { label: 'Absent', count: Object.values(attendance).filter(s => s === 'absent').length, color: 'red' },
                    { label: 'Late', count: Object.values(attendance).filter(s => s === 'late').length, color: 'amber' },
                    { label: 'Excused', count: Object.values(attendance).filter(s => s === 'excused').length, color: 'blue' },
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

                {/* Student List */}
                <AttendanceTable
                  students={students}
                  attendance={attendance}
                  onStatusChange={handleStatusChange}
                  editable={false}
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
          <p className="text-muted-foreground">
            Choose a class from the dropdown to start taking attendance.
          </p>
        </Card>
      )}
    </div>
  );
}

