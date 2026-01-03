-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinician_id UUID NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 3 AND age <= 25),
  grade TEXT NOT NULL,
  notes TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagnostic_results table for storing assessment data
CREATE TABLE public.diagnostic_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Eye tracking metrics
  eye_total_fixations INTEGER DEFAULT 0,
  eye_avg_fixation_duration NUMERIC DEFAULT 0,
  eye_regression_count INTEGER DEFAULT 0,
  eye_prolonged_fixations INTEGER DEFAULT 0,
  eye_chaos_index NUMERIC DEFAULT 0,
  eye_fixation_intersection_coefficient NUMERIC DEFAULT 0,
  
  -- Voice metrics
  voice_words_per_minute INTEGER DEFAULT 0,
  voice_pause_count INTEGER DEFAULT 0,
  voice_avg_pause_duration NUMERIC DEFAULT 0,
  voice_phonemic_errors INTEGER DEFAULT 0,
  voice_fluency_score INTEGER DEFAULT 0,
  voice_prosody_score INTEGER DEFAULT 0,
  voice_stall_count INTEGER DEFAULT 0,
  voice_avg_stall_duration NUMERIC DEFAULT 0,
  voice_stall_events JSONB DEFAULT '[]'::jsonb,
  
  -- Handwriting metrics
  handwriting_reversal_count INTEGER DEFAULT 0,
  handwriting_letter_crowding NUMERIC DEFAULT 0,
  handwriting_graphic_inconsistency NUMERIC DEFAULT 0,
  handwriting_line_adherence NUMERIC DEFAULT 0,
  
  -- Cognitive load metrics
  cognitive_avg_pupil_dilation NUMERIC DEFAULT 0,
  cognitive_overload_events INTEGER DEFAULT 0,
  cognitive_stress_indicators INTEGER DEFAULT 0,
  
  -- Probability indices
  dyslexia_probability_index NUMERIC DEFAULT 0,
  adhd_probability_index NUMERIC DEFAULT 0,
  dysgraphia_probability_index NUMERIC DEFAULT 0,
  overall_risk_level TEXT DEFAULT 'low' CHECK (overall_risk_level IN ('low', 'moderate', 'high')),
  
  -- Raw gaze data for heatmaps
  fixation_data JSONB DEFAULT '[]'::jsonb,
  saccade_data JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for clinician data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  title TEXT DEFAULT 'Clinician',
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create handwriting_samples table for storing uploaded samples
CREATE TABLE public.handwriting_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  recognized_text TEXT,
  reversal_count INTEGER DEFAULT 0,
  letter_crowding NUMERIC DEFAULT 0,
  graphic_inconsistency NUMERIC DEFAULT 0,
  line_adherence NUMERIC DEFAULT 0,
  analysis_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handwriting_samples ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Clinicians can view their own students" 
ON public.students 
FOR SELECT 
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can create students" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can update their own students" 
ON public.students 
FOR UPDATE 
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can delete their own students" 
ON public.students 
FOR DELETE 
USING (auth.uid() = clinician_id);

-- RLS Policies for diagnostic_results
CREATE POLICY "Clinicians can view their own diagnostic results" 
ON public.diagnostic_results 
FOR SELECT 
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can create diagnostic results" 
ON public.diagnostic_results 
FOR INSERT 
WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can update their own diagnostic results" 
ON public.diagnostic_results 
FOR UPDATE 
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can delete their own diagnostic results" 
ON public.diagnostic_results 
FOR DELETE 
USING (auth.uid() = clinician_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for handwriting_samples
CREATE POLICY "Clinicians can view their own handwriting samples" 
ON public.handwriting_samples 
FOR SELECT 
USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can create handwriting samples" 
ON public.handwriting_samples 
FOR INSERT 
WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can delete their own handwriting samples" 
ON public.handwriting_samples 
FOR DELETE 
USING (auth.uid() = clinician_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for handwriting samples
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('handwriting-samples', 'handwriting-samples', false, 10485760);

-- Storage policies
CREATE POLICY "Clinicians can upload handwriting samples"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clinicians can view their handwriting samples"
ON storage.objects
FOR SELECT
USING (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clinicians can delete their handwriting samples"
ON storage.objects
FOR DELETE
USING (bucket_id = 'handwriting-samples' AND auth.uid()::text = (storage.foldername(name))[1]);