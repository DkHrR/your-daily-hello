-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'clinician', 'teacher');

-- Create profiles table for clinicians/teachers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  institution TEXT,
  license_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 100),
  grade TEXT NOT NULL,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagnostic_sessions table with JSON metrics storage
CREATE TABLE public.diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  clinician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  eye_tracking_metrics JSONB,
  voice_metrics JSONB,
  handwriting_metrics JSONB,
  cognitive_load_metrics JSONB,
  dyslexia_probability_index NUMERIC(5,2) CHECK (dyslexia_probability_index >= 0 AND dyslexia_probability_index <= 100),
  adhd_probability_index NUMERIC(5,2) CHECK (adhd_probability_index >= 0 AND adhd_probability_index <= 100),
  dysgraphia_probability_index NUMERIC(5,2) CHECK (dysgraphia_probability_index >= 0 AND dysgraphia_probability_index <= 100),
  overall_risk_level TEXT DEFAULT 'low' CHECK (overall_risk_level IN ('low', 'moderate', 'high')),
  session_duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get user's clinician_id
CREATE OR REPLACE FUNCTION public.get_user_clinician_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id
$$;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES POLICIES
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- STUDENTS POLICIES
CREATE POLICY "Clinicians can view their own students"
ON public.students FOR SELECT
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can insert their own students"
ON public.students FOR INSERT
WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can update their own students"
ON public.students FOR UPDATE
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can delete their own students"
ON public.students FOR DELETE
USING (auth.uid() = clinician_id);

CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all students"
ON public.students FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- DIAGNOSTIC_SESSIONS POLICIES
CREATE POLICY "Clinicians can view their own sessions"
ON public.diagnostic_sessions FOR SELECT
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can insert sessions"
ON public.diagnostic_sessions FOR INSERT
WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can update their own sessions"
ON public.diagnostic_sessions FOR UPDATE
USING (auth.uid() = clinician_id);

CREATE POLICY "Admins can view all sessions"
ON public.diagnostic_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Default role is clinician
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'clinician');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();