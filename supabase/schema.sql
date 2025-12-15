-- EduTech School Management System Database Schema
-- Based on the EduTech App.pdf specification
-- Run this in your Supabase SQL Editor

-- IMPORTANT: If you have existing tables, drop them first (in reverse order of dependencies)
-- DROP POLICY IF EXISTS ... (all policies)
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.absence_requests CASCADE;
-- DROP TABLE IF EXISTS public.evaluations CASCADE;
-- DROP TABLE IF EXISTS public.teacher_check_ins CASCADE;
-- DROP TABLE IF EXISTS public.student_notes CASCADE;
-- DROP TABLE IF EXISTS public.attendance CASCADE;
-- DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
-- DROP TABLE IF EXISTS public.subject_schedules CASCADE;
-- DROP TABLE IF EXISTS public.subjects CASCADE;
-- DROP TABLE IF EXISTS public.students CASCADE;
-- DROP TABLE IF EXISTS public.classes CASCADE;
-- DROP TABLE IF EXISTS public.teacher_assignments CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.schools CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SCHOOLS TABLE (Top level entity)
-- ============================================
CREATE TABLE public.schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  principal_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('moe_admin', 'school_admin', 'teacher', 'supervisor', 'parent', 'student')),
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE, -- For parent registration approval
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBJECTS TABLE
-- ============================================
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  max_absence_allowed INTEGER DEFAULT 10, -- Max allowed absences before action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- ============================================
-- CLASSES TABLE
-- ============================================
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  mobility_level TEXT, -- As mentioned in PDF: mobility level attribute
  academic_year TEXT DEFAULT '2024-2025',
  homeroom_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  current_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_session', 'break', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBJECT SCHEDULES TABLE
-- Links subjects, teachers, and classes with time slots
-- ============================================
CREATE TABLE public.subject_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  student_id_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEACHER ASSIGNMENTS (Teacher-Class-Subject links)
-- ============================================
CREATE TABLE public.teacher_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  is_supervisor BOOLEAN DEFAULT FALSE, -- Supervisor role as mentioned in PDF
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id)
);

-- ============================================
-- ATTENDANCE SESSIONS (QR Code Sessions)
-- ============================================
CREATE TABLE public.attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_code TEXT UNIQUE NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE RECORDS
-- Now includes subject-level tracking as per PDF
-- ============================================
CREATE TABLE public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL, -- Subject-level attendance
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, subject_id, date)
);

-- ============================================
-- TEACHER CHECK-INS (Teacher attendance to classes)
-- As mentioned in PDF: "check-in to the classes"
-- ============================================
CREATE TABLE public.teacher_check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STUDENT NOTES (Notes from teachers)
-- As mentioned: "add notes for student (note type could be school or parent)"
-- ============================================
CREATE TABLE public.student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('school', 'parent', 'both')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read_by_school BOOLEAN DEFAULT FALSE,
  is_read_by_parent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ABSENCE REQUESTS (Parent submits, School approves/rejects)
-- As mentioned: "Submit absence requests" & "Approve/Reject absence requests from parents"
-- ============================================
CREATE TABLE public.absence_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEACHER LEAVE REQUESTS
-- As mentioned: "Submit absence/Leave requests"
-- ============================================
CREATE TABLE public.teacher_leave_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'personal', 'emergency', 'other')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- For alerts, announcements, and communications
-- ============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role TEXT, -- For broadcast to role (e.g., all teachers)
  type TEXT NOT NULL CHECK (type IN ('alert', 'announcement', 'absence_alert', 'recall_request', 'evacuation', 'evaluation', 'result', 'note', 'request_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT, -- e.g., 'student', 'class', 'absence_request'
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVALUATIONS (Weekly/Monthly student evaluations)
-- As mentioned: "Receive weekly or monthly evaluations"
-- ============================================
CREATE TABLE public.evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('weekly', 'monthly', 'midterm', 'final')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  attendance_rate DECIMAL(5,2),
  grade DECIMAL(5,2),
  comments TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ISSUES/COMPLAINTS (Report issues)
-- As mentioned: "Reports issues related to his student to school" & "report issues to supervisor/school admin"
-- ============================================
CREATE TABLE public.issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('student_issue', 'teacher_issue', 'facility_issue', 'complaint', 'suggestion', 'other')),
  related_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANNOUNCEMENTS (School-wide or class-specific)
-- ============================================
CREATE TABLE public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- NULL means school-wide
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'teachers', 'parents', 'students')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_school ON public.profiles(school_id);
CREATE INDEX idx_profiles_approved ON public.profiles(is_approved);
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_parent ON public.students(parent_id);
CREATE INDEX idx_students_school ON public.students(school_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX idx_attendance_subject ON public.attendance(subject_id);
CREATE INDEX idx_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_sessions_active ON public.attendance_sessions(is_active, expires_at);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX idx_absence_requests_status ON public.absence_requests(status);
CREATE INDEX idx_absence_requests_school ON public.absence_requests(school_id);
CREATE INDEX idx_schedules_class ON public.subject_schedules(class_id);
CREATE INDEX idx_schedules_teacher ON public.subject_schedules(teacher_id);
CREATE INDEX idx_evaluations_student ON public.evaluations(student_id);
CREATE INDEX idx_issues_school ON public.issues(school_id);
CREATE INDEX idx_issues_status ON public.issues(status);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get current user's school_id
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user is MoE admin
CREATE OR REPLACE FUNCTION public.is_moe_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'moe_admin' FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SCHOOLS POLICIES
-- ============================================
CREATE POLICY "MoE can manage all schools" ON public.schools
  FOR ALL USING (public.is_moe_admin());

CREATE POLICY "Users can view their school" ON public.schools
  FOR SELECT USING (id = public.get_my_school_id() OR public.is_moe_admin());

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "MoE can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_moe_admin());

CREATE POLICY "School admins can view school profiles" ON public.profiles
  FOR SELECT USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

CREATE POLICY "School admins can manage school profiles" ON public.profiles
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() = 'school_admin'
  );

-- ============================================
-- CLASSES POLICIES
-- ============================================
CREATE POLICY "Users can view classes in their school" ON public.classes
  FOR SELECT USING (school_id = public.get_my_school_id() OR public.is_moe_admin());

CREATE POLICY "School admins can manage classes" ON public.classes
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

-- ============================================
-- SUBJECTS POLICIES
-- ============================================
CREATE POLICY "Users can view subjects in their school" ON public.subjects
  FOR SELECT USING (school_id = public.get_my_school_id() OR public.is_moe_admin());

CREATE POLICY "School admins can manage subjects" ON public.subjects
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() = 'school_admin'
  );

-- ============================================
-- STUDENTS POLICIES
-- ============================================
CREATE POLICY "Teachers can view students in their classes" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_assignments ta
      WHERE ta.teacher_id = auth.uid() 
      AND ta.class_id = students.class_id
    )
  );

CREATE POLICY "Parents can view their children" ON public.students
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Students can view themselves" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "School admins can manage students" ON public.students
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

CREATE POLICY "MoE can view all students" ON public.students
  FOR SELECT USING (public.is_moe_admin());

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================
CREATE POLICY "Teachers can manage attendance in their classes" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teacher_assignments ta
      WHERE ta.teacher_id = auth.uid() 
      AND ta.class_id = attendance.class_id
    )
  );

CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own attendance (QR check-in)" ON public.attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id 
      AND s.parent_id = auth.uid()
    )
  );

CREATE POLICY "School admins can view all attendance" ON public.attendance
  FOR SELECT USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

CREATE POLICY "MoE can view all attendance" ON public.attendance
  FOR SELECT USING (public.is_moe_admin());

-- ============================================
-- ABSENCE REQUESTS POLICIES
-- ============================================
CREATE POLICY "Parents can manage own requests" ON public.absence_requests
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "School admins can manage school requests" ON public.absence_requests
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark as read)" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "School admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor', 'teacher', 'moe_admin')
  );

-- ============================================
-- STUDENT NOTES POLICIES
-- ============================================
CREATE POLICY "Teachers can manage notes" ON public.student_notes
  FOR ALL USING (
    created_by = auth.uid() OR (
      school_id = public.get_my_school_id() AND 
      public.get_my_role() IN ('school_admin', 'supervisor', 'teacher')
    )
  );

CREATE POLICY "Parents can view notes for their children" ON public.student_notes
  FOR SELECT USING (
    note_type IN ('parent', 'both') AND
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_notes.student_id 
      AND s.parent_id = auth.uid()
    )
  );

-- ============================================
-- EVALUATIONS POLICIES
-- ============================================
CREATE POLICY "Parents can view children evaluations" ON public.evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = evaluations.student_id 
      AND s.parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own evaluations" ON public.evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = evaluations.student_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage evaluations" ON public.evaluations
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor', 'teacher')
  );

-- ============================================
-- ISSUES POLICIES
-- ============================================
CREATE POLICY "Users can manage own issues" ON public.issues
  FOR ALL USING (reported_by = auth.uid());

CREATE POLICY "School admins can manage all issues" ON public.issues
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

-- ============================================
-- ANNOUNCEMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view relevant announcements" ON public.announcements
  FOR SELECT USING (
    school_id = public.get_my_school_id() AND
    is_active = true AND
    (expires_at IS NULL OR expires_at > NOW()) AND
    (target_audience = 'all' OR 
     (target_audience = 'teachers' AND public.get_my_role() IN ('teacher', 'supervisor', 'school_admin')) OR
     (target_audience = 'parents' AND public.get_my_role() = 'parent') OR
     (target_audience = 'students' AND public.get_my_role() = 'student')
    )
  );

CREATE POLICY "School admins can manage announcements" ON public.announcements
  FOR ALL USING (
    school_id = public.get_my_school_id() AND 
    public.get_my_role() IN ('school_admin', 'supervisor')
  );

CREATE POLICY "MoE can manage all announcements" ON public.announcements
  FOR ALL USING (public.is_moe_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, school_id, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    (NEW.raw_user_meta_data->>'school_id')::UUID,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'parent') IN ('moe_admin', 'school_admin', 'teacher', 'supervisor') THEN TRUE
      ELSE FALSE -- Parents need approval
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all relevant tables
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON public.student_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_absence_requests_updated_at BEFORE UPDATE ON public.absence_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- HELPER FUNCTIONS FOR REPORTS
-- ============================================

-- Calculate student absence count per subject
CREATE OR REPLACE FUNCTION public.get_student_absence_count(
  p_student_id UUID,
  p_subject_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.attendance
  WHERE student_id = p_student_id
    AND (p_subject_id IS NULL OR subject_id = p_subject_id)
    AND status = 'absent'
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get class attendance statistics
CREATE OR REPLACE FUNCTION public.get_class_attendance_stats(
  p_class_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_students BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.students WHERE class_id = p_class_id)::BIGINT as total_students,
    COUNT(*) FILTER (WHERE status = 'present')::BIGINT as present_count,
    COUNT(*) FILTER (WHERE status = 'absent')::BIGINT as absent_count,
    COUNT(*) FILTER (WHERE status = 'late')::BIGINT as late_count,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.students WHERE class_id = p_class_id) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status IN ('present', 'late'))::NUMERIC / 
               (SELECT COUNT(*) FROM public.students WHERE class_id = p_class_id) * 100), 2)
      ELSE 0
    END as attendance_rate
  FROM public.attendance
  WHERE class_id = p_class_id AND date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
