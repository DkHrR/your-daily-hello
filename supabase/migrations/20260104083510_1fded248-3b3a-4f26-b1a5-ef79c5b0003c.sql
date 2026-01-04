-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'educator', 'clinician', 'parent');

-- Create assessment_type enum
CREATE TYPE public.assessment_type AS ENUM ('reading', 'phonological', 'visual', 'comprehensive');

-- Create assessment_status enum
CREATE TYPE public.assessment_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
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

-- RLS policy for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default 'educator' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'educator');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    grade_level TEXT,
    school TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students RLS policies
CREATE POLICY "Users can view their own students"
ON public.students
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create students"
ON public.students
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own students"
ON public.students
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own students"
ON public.students
FOR DELETE
USING (auth.uid() = created_by);

-- Trigger for students updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on students.created_by
CREATE INDEX idx_students_created_by ON public.students(created_by);

-- Create assessments table
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type assessment_type NOT NULL DEFAULT 'comprehensive',
    status assessment_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Assessments RLS policies
CREATE POLICY "Users can view their own assessments"
ON public.assessments
FOR SELECT
USING (auth.uid() = assessor_id);

CREATE POLICY "Users can create assessments"
ON public.assessments
FOR INSERT
WITH CHECK (auth.uid() = assessor_id);

CREATE POLICY "Users can update their own assessments"
ON public.assessments
FOR UPDATE
USING (auth.uid() = assessor_id);

CREATE POLICY "Users can delete their own assessments"
ON public.assessments
FOR DELETE
USING (auth.uid() = assessor_id);

-- Create indexes on assessments
CREATE INDEX idx_assessments_student_id ON public.assessments(student_id);
CREATE INDEX idx_assessments_assessor_id ON public.assessments(assessor_id);

-- Create assessment_results table
CREATE TABLE public.assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    overall_risk_score NUMERIC(5,2),
    reading_fluency_score NUMERIC(5,2),
    phonological_awareness_score NUMERIC(5,2),
    visual_processing_score NUMERIC(5,2),
    attention_score NUMERIC(5,2),
    recommendations JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessment_results
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Assessment results RLS policies (linked through assessments)
CREATE POLICY "Users can view results for their assessments"
ON public.assessment_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.assessor_id = auth.uid()
  )
);

CREATE POLICY "Users can create results for their assessments"
ON public.assessment_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.assessor_id = auth.uid()
  )
);

-- Create index on assessment_results
CREATE INDEX idx_assessment_results_assessment_id ON public.assessment_results(assessment_id);

-- Create eye_tracking_data table
CREATE TABLE public.eye_tracking_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    fixation_points JSONB DEFAULT '[]'::jsonb,
    saccade_patterns JSONB DEFAULT '[]'::jsonb,
    regression_count INTEGER DEFAULT 0,
    average_fixation_duration NUMERIC(10,2),
    reading_speed_wpm NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on eye_tracking_data
ALTER TABLE public.eye_tracking_data ENABLE ROW LEVEL SECURITY;

-- Eye tracking RLS policies
CREATE POLICY "Users can view eye tracking for their assessments"
ON public.eye_tracking_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = eye_tracking_data.assessment_id
    AND assessments.assessor_id = auth.uid()
  )
);

CREATE POLICY "Users can create eye tracking for their assessments"
ON public.eye_tracking_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessments
    WHERE assessments.id = eye_tracking_data.assessment_id
    AND assessments.assessor_id = auth.uid()
  )
);

-- Create index on eye_tracking_data
CREATE INDEX idx_eye_tracking_assessment_id ON public.eye_tracking_data(assessment_id);

-- Create interventions table
CREATE TABLE public.interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    intervention_type TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interventions
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Interventions RLS policies
CREATE POLICY "Users can view their own interventions"
ON public.interventions
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create interventions"
ON public.interventions
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own interventions"
ON public.interventions
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own interventions"
ON public.interventions
FOR DELETE
USING (auth.uid() = created_by);

-- Trigger for interventions updated_at
CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes on interventions
CREATE INDEX idx_interventions_student_id ON public.interventions(student_id);
CREATE INDEX idx_interventions_created_by ON public.interventions(created_by);