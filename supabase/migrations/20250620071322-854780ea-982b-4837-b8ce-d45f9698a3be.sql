
-- Create commercial team profiles table
CREATE TABLE public.commercial_team_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  territory TEXT,
  customer_segments TEXT[],
  specialization TEXT,
  phone TEXT,
  region TEXT,
  manager_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer assignments table
CREATE TABLE public.customer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market intelligence table
CREATE TABLE public.market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  product_id TEXT,
  location_id TEXT,
  intelligence_type TEXT NOT NULL,
  impact_assessment TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  time_horizon TEXT NOT NULL,
  description TEXT NOT NULL,
  quantitative_impact NUMERIC,
  effective_from DATE,
  effective_to DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forecast collaboration comments table
CREATE TABLE public.forecast_collaboration_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_data_id UUID REFERENCES public.forecast_data(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'information',
  parent_comment_id UUID REFERENCES public.forecast_collaboration_comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to forecast_data table for collaboration
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS commercial_input NUMERIC;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS commercial_confidence TEXT;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS commercial_notes TEXT;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS commercial_reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS commercial_reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS market_intelligence TEXT;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS promotional_activity TEXT;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS competitive_impact TEXT;
ALTER TABLE public.forecast_data ADD COLUMN IF NOT EXISTS collaboration_status TEXT DEFAULT 'pending';

-- Enable RLS on all new tables
ALTER TABLE public.commercial_team_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_collaboration_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for commercial_team_profiles
CREATE POLICY "Users can view their own commercial profile" ON public.commercial_team_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commercial profile" ON public.commercial_team_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commercial profile" ON public.commercial_team_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for customer_assignments
CREATE POLICY "Users can view their own customer assignments" ON public.customer_assignments
  FOR SELECT USING (auth.uid() = commercial_user_id);

CREATE POLICY "Users can insert their own customer assignments" ON public.customer_assignments
  FOR INSERT WITH CHECK (auth.uid() = commercial_user_id);

CREATE POLICY "Users can update their own customer assignments" ON public.customer_assignments
  FOR UPDATE USING (auth.uid() = commercial_user_id);

-- Create RLS policies for market_intelligence
CREATE POLICY "Users can view their own market intelligence" ON public.market_intelligence
  FOR SELECT USING (auth.uid() = commercial_user_id);

CREATE POLICY "Users can insert their own market intelligence" ON public.market_intelligence
  FOR INSERT WITH CHECK (auth.uid() = commercial_user_id);

CREATE POLICY "Users can update their own market intelligence" ON public.market_intelligence
  FOR UPDATE USING (auth.uid() = commercial_user_id);

-- Create RLS policies for forecast_collaboration_comments
CREATE POLICY "Users can view forecast comments" ON public.forecast_collaboration_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.forecast_collaboration_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.forecast_collaboration_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commercial_team_profiles_updated_at 
  BEFORE UPDATE ON public.commercial_team_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_assignments_updated_at 
  BEFORE UPDATE ON public.customer_assignments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_intelligence_updated_at 
  BEFORE UPDATE ON public.market_intelligence 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forecast_collaboration_comments_updated_at 
  BEFORE UPDATE ON public.forecast_collaboration_comments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
