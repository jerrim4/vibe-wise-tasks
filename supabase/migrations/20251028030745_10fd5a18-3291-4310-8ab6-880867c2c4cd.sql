-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('work', 'personal', 'health', 'learning', 'creative')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  duration_minutes INTEGER NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  cognitive_load TEXT NOT NULL CHECK (cognitive_load IN ('light', 'moderate', 'heavy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mood_checkins table
CREATE TABLE public.mood_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_scale INTEGER NOT NULL CHECK (mood_scale >= 1 AND mood_scale <= 10),
  emotion_keywords TEXT[] NOT NULL,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affirmations table
CREATE TABLE public.affirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('motivation', 'focus', 'calm', 'energy', 'confidence')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create break_reminders table
CREATE TABLE public.break_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL CHECK (break_type IN ('stretch', 'hydration', 'breathing', 'walk', 'rest')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  break_interval_minutes INTEGER DEFAULT 60,
  work_start_time TIME DEFAULT '09:00:00',
  work_end_time TIME DEFAULT '17:00:00',
  enable_affirmations BOOLEAN DEFAULT true,
  enable_break_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mood_checkins
CREATE POLICY "Users can view own mood checkins" ON public.mood_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mood checkins" ON public.mood_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for affirmations
CREATE POLICY "Anyone can view affirmations" ON public.affirmations
  FOR SELECT USING (true);

-- RLS Policies for break_reminders
CREATE POLICY "Users can view own break reminders" ON public.break_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own break reminders" ON public.break_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own break reminders" ON public.break_reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample affirmations
INSERT INTO public.affirmations (message, category) VALUES
  ('You are capable of amazing things today.', 'motivation'),
  ('Your focus is your superpower.', 'focus'),
  ('Take a deep breath. You''ve got this.', 'calm'),
  ('Every small step counts toward your goals.', 'motivation'),
  ('Your energy is building momentum.', 'energy'),
  ('Trust in your abilities and process.', 'confidence'),
  ('Progress over perfection, always.', 'motivation'),
  ('Your mind is clear and ready to create.', 'focus'),
  ('You deserve this moment of peace.', 'calm'),
  ('Your potential is limitless.', 'confidence');