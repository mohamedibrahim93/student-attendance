export type UserRole = 'teacher' | 'parent' | 'student' | 'admin';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  grade_level?: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
  teacher?: Profile;
}

export interface Student {
  id: string;
  user_id?: string;
  student_id_number?: string;
  full_name: string;
  email?: string;
  class_id: string;
  parent_id?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
  class?: Class;
  parent?: Profile;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  teacher_id: string;
  session_code: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  class?: Class;
}

export interface Attendance {
  id: string;
  student_id: string;
  session_id?: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  marked_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  class?: Class;
}

export interface AttendanceStats {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

