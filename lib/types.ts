// User roles based on EduTech App specification
export type UserRole = 'moe_admin' | 'school_admin' | 'teacher' | 'supervisor' | 'parent' | 'student';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationType = 
  | 'alert' 
  | 'announcement' 
  | 'absence_alert' 
  | 'recall_request' 
  | 'evacuation' 
  | 'evaluation' 
  | 'result' 
  | 'note' 
  | 'request_update';

export type EvaluationType = 'weekly' | 'monthly' | 'midterm' | 'final';

export type LeaveType = 'sick' | 'personal' | 'emergency' | 'other';

export type NoteType = 'school' | 'parent' | 'both';

export type IssueType = 'student_issue' | 'teacher_issue' | 'facility_issue' | 'complaint' | 'suggestion' | 'other';

export type ClassStatus = 'active' | 'in_session' | 'break' | 'ended';

// ============================================
// SCHOOL
// ============================================
export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  principal_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// PROFILE
// ============================================
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  school_id?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  school?: School;
}

// ============================================
// SUBJECT
// ============================================
export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code?: string;
  description?: string;
  max_absence_allowed: number;
  created_at: string;
  updated_at: string;
  school?: School;
}

// ============================================
// CLASS
// ============================================
export interface Class {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  grade_level?: string;
  mobility_level?: string;
  academic_year: string;
  homeroom_teacher_id?: string;
  current_subject_id?: string;
  current_teacher_id?: string;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
  school?: School;
  homeroom_teacher?: Profile;
  current_subject?: Subject;
  current_teacher?: Profile;
  students?: Student[];
}

// ============================================
// SUBJECT SCHEDULE
// ============================================
export interface SubjectSchedule {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number; // 0-6, Sunday-Saturday
  start_time: string; // TIME format
  end_time: string;
  room?: string;
  created_at: string;
  updated_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Profile;
}

// ============================================
// STUDENT
// ============================================
export interface Student {
  id: string;
  user_id?: string;
  school_id: string;
  student_id_number?: string;
  full_name: string;
  email?: string;
  class_id?: string;
  parent_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  class?: Class;
  parent?: Profile;
  school?: School;
}

// ============================================
// TEACHER ASSIGNMENT
// ============================================
export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  is_supervisor: boolean;
  created_at: string;
  teacher?: Profile;
  class?: Class;
  subject?: Subject;
}

// ============================================
// ATTENDANCE SESSION
// ============================================
export interface AttendanceSession {
  id: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  teacher_id: string;
  session_code: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Profile;
}

// ============================================
// ATTENDANCE
// ============================================
export interface Attendance {
  id: string;
  student_id: string;
  session_id?: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  marked_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  class?: Class;
  subject?: Subject;
  session?: AttendanceSession;
}

// ============================================
// TEACHER CHECK-IN
// ============================================
export interface TeacherCheckIn {
  id: string;
  teacher_id: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  check_in_time: string;
  check_out_time?: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  teacher?: Profile;
  class?: Class;
  subject?: Subject;
}

// ============================================
// STUDENT NOTES
// ============================================
export interface StudentNote {
  id: string;
  student_id: string;
  school_id: string;
  created_by: string;
  note_type: NoteType;
  title: string;
  content: string;
  is_read_by_school: boolean;
  is_read_by_parent: boolean;
  created_at: string;
  updated_at: string;
  student?: Student;
  creator?: Profile;
}

// ============================================
// ABSENCE REQUEST (Parent submits)
// ============================================
export interface AbsenceRequest {
  id: string;
  student_id: string;
  school_id: string;
  parent_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  parent?: Profile;
  reviewer?: Profile;
}

// ============================================
// TEACHER LEAVE REQUEST
// ============================================
export interface TeacherLeaveRequest {
  id: string;
  teacher_id: string;
  school_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  status: RequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  teacher?: Profile;
  reviewer?: Profile;
}

// ============================================
// NOTIFICATION
// ============================================
export interface Notification {
  id: string;
  school_id?: string;
  sender_id?: string;
  recipient_id: string;
  recipient_role?: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  priority: Priority;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  sender?: Profile;
}

// ============================================
// EVALUATION
// ============================================
export interface Evaluation {
  id: string;
  student_id: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  evaluation_type: EvaluationType;
  period_start: string;
  period_end: string;
  attendance_rate?: number;
  grade?: number;
  comments?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  class?: Class;
  subject?: Subject;
  creator?: Profile;
}

// ============================================
// ISSUE/COMPLAINT
// ============================================
export interface Issue {
  id: string;
  school_id: string;
  reported_by: string;
  issue_type: IssueType;
  related_student_id?: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  related_student?: Student;
  assignee?: Profile;
}

// ============================================
// ANNOUNCEMENT
// ============================================
export interface Announcement {
  id: string;
  school_id: string;
  class_id?: string;
  created_by: string;
  title: string;
  content: string;
  target_audience: 'all' | 'teachers' | 'parents' | 'students';
  priority: Priority;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  school?: School;
  class?: Class;
  creator?: Profile;
}

// ============================================
// STATISTICS & REPORTS
// ============================================
export interface AttendanceStats {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface ClassAttendanceStats {
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
}

export interface SchoolStats {
  total_classes: number;
  total_students: number;
  total_teachers: number;
  overall_attendance_rate: number;
  pending_absence_requests: number;
  pending_issues: number;
}

export interface StudentSubjectAttendance {
  subject_id: string;
  subject_name: string;
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
  max_absence_allowed: number;
  is_at_risk: boolean;
}

// ============================================
// DASHBOARD DATA TYPES
// ============================================
export interface MoEDashboardData {
  total_schools: number;
  active_schools: number;
  total_students: number;
  total_teachers: number;
  overall_attendance_rate: number;
  schools: (School & {
    student_count: number;
    teacher_count: number;
    attendance_rate: number;
  })[];
}

export interface SchoolDashboardData {
  school: School;
  stats: SchoolStats;
  recent_absences: Attendance[];
  pending_requests: AbsenceRequest[];
  recent_issues: Issue[];
  active_announcements: Announcement[];
  classes: (Class & {
    student_count: number;
    today_attendance: ClassAttendanceStats;
  })[];
}

export interface TeacherDashboardData {
  profile: Profile;
  assignments: TeacherAssignment[];
  todays_schedule: SubjectSchedule[];
  classes: (Class & {
    student_count: number;
    today_attendance: ClassAttendanceStats;
  })[];
  recent_check_ins: TeacherCheckIn[];
  leave_requests: TeacherLeaveRequest[];
  unread_notifications: number;
}

export interface ParentDashboardData {
  profile: Profile;
  children: (Student & {
    attendance_stats: AttendanceStats;
    subject_attendance: StudentSubjectAttendance[];
    recent_attendance: Attendance[];
    recent_evaluations: Evaluation[];
    recent_notes: StudentNote[];
  })[];
  absence_requests: AbsenceRequest[];
  notifications: Notification[];
  unread_count: number;
}

export interface StudentDashboardData {
  profile: Profile;
  student: Student;
  attendance_stats: AttendanceStats;
  subject_attendance: StudentSubjectAttendance[];
  recent_attendance: Attendance[];
  today_schedule: SubjectSchedule[];
  evaluations: Evaluation[];
  notifications: Notification[];
}
