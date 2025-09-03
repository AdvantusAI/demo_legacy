-- Check and fix RLS policies for commercial_collaboration table
-- This migration will ensure proper permissions for insert/update operations

-- First, let's check if RLS is enabled and what policies exist
-- You can run these queries manually in your database to see the current state:

-- Check if RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'commercial_collaboration';

-- Check existing policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'commercial_collaboration';

-- Enable RLS if not already enabled
ALTER TABLE m8_schema.commercial_collaboration ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON m8_schema.commercial_collaboration;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON m8_schema.commercial_collaboration;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON m8_schema.commercial_collaboration;

-- Create policies for authenticated users
-- Insert policy
CREATE POLICY "Enable insert for authenticated users" ON m8_schema.commercial_collaboration
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Update policy  
CREATE POLICY "Enable update for authenticated users" ON m8_schema.commercial_collaboration
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Select policy
CREATE POLICY "Enable select for authenticated users" ON m8_schema.commercial_collaboration
    FOR SELECT TO authenticated
    USING (true);

-- Also create policies for service role (if needed for admin operations)
CREATE POLICY "Enable all for service role" ON m8_schema.commercial_collaboration
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON m8_schema.commercial_collaboration TO authenticated;
GRANT ALL ON m8_schema.commercial_collaboration TO service_role;
