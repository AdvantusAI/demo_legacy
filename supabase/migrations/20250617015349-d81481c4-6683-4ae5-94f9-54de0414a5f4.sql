
-- Phase 1: Foundation Setup - Database enhancements for forecast collaboration

-- Create commercial team roles
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'user'::app_role FROM auth.users 
WHERE email LIKE '%commercial%' OR email LIKE '%sales%' 
ON CONFLICT (user_id, role) DO NOTHING;

-- Create commercial team profiles extension
CREATE TABLE IF NOT EXISTS public.commercial_team_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    territory TEXT,
    customer_segments TEXT[],
    specialization TEXT,
    phone TEXT,
    region TEXT,
    manager_level TEXT CHECK (manager_level IN ('junior', 'senior', 'director')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.commercial_team_profiles ENABLE ROW LEVEL SECURITY;

-- Create customer assignments table (which customers each commercial person manages)
CREATE TABLE IF NOT EXISTS public.customer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commercial_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id TEXT NOT NULL,
    assignment_type TEXT CHECK (assignment_type IN ('primary', 'secondary', 'support')) DEFAULT 'primary',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(commercial_user_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.customer_assignments ENABLE ROW LEVEL SECURITY;

-- Extend forecast_data table with commercial collaboration fields
ALTER TABLE public.forecast_data 
ADD COLUMN IF NOT EXISTS commercial_input NUMERIC,
ADD COLUMN IF NOT EXISTS commercial_confidence TEXT CHECK (commercial_confidence IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS commercial_notes TEXT,
ADD COLUMN IF NOT EXISTS commercial_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS commercial_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS market_intelligence TEXT,
ADD COLUMN IF NOT EXISTS promotional_activity TEXT,
ADD COLUMN IF NOT EXISTS competitive_impact TEXT,
ADD COLUMN IF NOT EXISTS collaboration_status TEXT CHECK (collaboration_status IN ('pending_review', 'reviewed', 'approved', 'rejected')) DEFAULT 'pending_review';

-- Create forecast collaboration comments table
CREATE TABLE IF NOT EXISTS public.forecast_collaboration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_data_id UUID REFERENCES public.forecast_data(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type TEXT CHECK (comment_type IN ('suggestion', 'concern', 'approval', 'information')) DEFAULT 'information',
    parent_comment_id UUID REFERENCES public.forecast_collaboration_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.forecast_collaboration_comments ENABLE ROW LEVEL SECURITY;

-- Create collaboration workflows table
CREATE TABLE IF NOT EXISTS public.collaboration_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    customer_id TEXT,
    workflow_type TEXT CHECK (workflow_type IN ('monthly_review', 'quarterly_review', 'exception_review', 'new_product')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'pending', 'completed', 'cancelled')) DEFAULT 'active',
    assigned_planner UUID REFERENCES auth.users(id),
    assigned_commercial UUID REFERENCES auth.users(id),
    due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.collaboration_workflows ENABLE ROW LEVEL SECURITY;

-- Create market intelligence table
CREATE TABLE IF NOT EXISTS public.market_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commercial_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id TEXT NOT NULL,
    product_id TEXT,
    location_id TEXT,
    intelligence_type TEXT CHECK (intelligence_type IN ('competitive', 'promotional', 'seasonal', 'economic', 'regulatory')) NOT NULL,
    impact_assessment TEXT CHECK (impact_assessment IN ('positive', 'negative', 'neutral')) NOT NULL,
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    time_horizon TEXT CHECK (time_horizon IN ('immediate', 'short_term', 'medium_term', 'long_term')) DEFAULT 'short_term',
    description TEXT NOT NULL,
    quantitative_impact NUMERIC,
    effective_from DATE,
    effective_to DATE,
    status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commercial team profiles
CREATE POLICY "Users can view their own commercial profile"
ON public.commercial_team_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own commercial profile"
ON public.commercial_team_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for customer assignments
CREATE POLICY "Commercial users can view their customer assignments"
ON public.customer_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = commercial_user_id);

-- RLS Policies for collaboration comments
CREATE POLICY "Users can view collaboration comments for their forecasts"
ON public.forecast_collaboration_comments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.forecast_data fd
        WHERE fd.id = forecast_data_id
        AND (
            -- Allow if user is assigned to this customer
            EXISTS (
                SELECT 1 FROM public.customer_assignments ca
                WHERE ca.commercial_user_id = auth.uid()
                AND ca.customer_id = fd.customer_id
            )
            -- Or if this is their comment
            OR user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create collaboration comments"
ON public.forecast_collaboration_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for workflows
CREATE POLICY "Users can view workflows assigned to them"
ON public.collaboration_workflows
FOR SELECT
TO authenticated
USING (
    auth.uid() = assigned_planner 
    OR auth.uid() = assigned_commercial
    OR EXISTS (
        SELECT 1 FROM public.customer_assignments ca
        WHERE ca.commercial_user_id = auth.uid()
        AND ca.customer_id = collaboration_workflows.customer_id
    )
);

-- RLS Policies for market intelligence
CREATE POLICY "Commercial users can view their market intelligence"
ON public.market_intelligence
FOR SELECT
TO authenticated
USING (auth.uid() = commercial_user_id);

CREATE POLICY "Commercial users can manage their market intelligence"
ON public.market_intelligence
FOR ALL
TO authenticated
USING (auth.uid() = commercial_user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_assignments_commercial_user ON public.customer_assignments(commercial_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON public.customer_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_forecast_collaboration_forecast_id ON public.forecast_collaboration_comments(forecast_data_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_workflows_assigned ON public.collaboration_workflows(assigned_commercial, assigned_planner);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_customer ON public.market_intelligence(customer_id, commercial_user_id);
CREATE INDEX IF NOT EXISTS idx_forecast_data_collaboration ON public.forecast_data(collaboration_status, commercial_reviewed_at);
