-- Student Attendance MVP Database Schema
-- Run this in your Supabase SQL Editor

-- IMPORTANT: If you have existing tables, drop them first (in reverse order of dependencies)
-- DROP POLICY IF EXISTS ... (all policies)
-- DROP TABLE IF EXISTS public.attendance CASCADE;
-- DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
-- DROP TABLE IF EXISTS public.students CASCADE;
-- DROP TABLE IF EXISTS public.classes CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLASSES TABLE
-- ============================================
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  grade_level TEXT,
  academic_year TEXT DEFAULT '2024-2025',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE SESSIONS (QR Code Sessions)
-- ============================================
CREATE TABLE public.attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
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
-- ============================================
CREATE TABLE public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_parent ON public.students(parent_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX idx_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_sessions_active ON public.attendance_sessions(is_active, expires_at);

-- ============================================
-- HELPER FUNCTION TO GET USER ROLE (avoids recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES (Fixed - no recursion)
-- ============================================

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teachers and admins can view all profiles (using security definer function)
CREATE POLICY "Teachers can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.get_my_role() IN ('teacher', 'admin')
  );

-- ============================================
-- CLASSES POLICIES
-- ============================================

-- Anyone authenticated can view classes
CREATE POLICY "Anyone can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

-- Teachers can insert their own classes
CREATE POLICY "Teachers can insert classes" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = auth.uid() AND public.get_my_role() = 'teacher'
  );

-- Teachers can update their own classes
CREATE POLICY "Teachers can update own classes" ON public.classes
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid());

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete own classes" ON public.classes
  FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- ============================================
-- STUDENTS POLICIES
-- ============================================

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view students in their classes" ON public.students
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Parents can view their children
CREATE POLICY "Parents can view their children" ON public.students
  FOR SELECT TO authenticated USING (parent_id = auth.uid());

-- Students can view themselves
CREATE POLICY "Students can view themselves" ON public.students
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Teachers can insert students into their classes
CREATE POLICY "Teachers can insert students" ON public.students
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can update students in their classes
CREATE POLICY "Teachers can update students" ON public.students
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can delete students from their classes
CREATE POLICY "Teachers can delete students" ON public.students
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- ============================================
-- ATTENDANCE SESSIONS POLICIES
-- ============================================

-- Teachers can manage their own sessions
CREATE POLICY "Teachers can view own sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert sessions" ON public.attendance_sessions
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own sessions" ON public.attendance_sessions
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid());

-- Students can view active sessions for their class
CREATE POLICY "Students can view active sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.user_id = auth.uid() 
      AND students.class_id = attendance_sessions.class_id
    )
  );

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================

-- Teachers can view attendance for their classes
CREATE POLICY "Teachers can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = attendance.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can insert attendance
CREATE POLICY "Teachers can insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can update attendance
CREATE POLICY "Teachers can update attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = attendance.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = attendance.student_id 
      AND students.user_id = auth.uid()
    )
  );

-- Students can insert their own attendance (for QR check-in)
CREATE POLICY "Students can insert own attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = student_id 
      AND students.user_id = auth.uid()
    )
  );

-- Parents can view their children's attendance
CREATE POLICY "Parents can view children attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = attendance.student_id 
      AND students.parent_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
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

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
