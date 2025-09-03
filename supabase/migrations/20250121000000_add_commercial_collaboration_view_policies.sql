-- Add RLS policies for commercial_collaboration_view
-- This allows authenticated users to access the view through the REST API

-- Enable RLS on the view (if not already enabled)
ALTER VIEW m8_schema.commercial_collaboration_view SET (security_invoker = true);

-- Create a policy to allow authenticated users to select from the view
CREATE POLICY "Allow authenticated users to view commercial collaboration data"
ON m8_schema.commercial_collaboration_view
FOR SELECT
TO authenticated
USING (true);

-- Alternative approach: Create a function-based policy if the above doesn't work
-- This function checks if the user is authenticated
CREATE OR REPLACE FUNCTION m8_schema.check_user_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.role() = 'authenticated';
$$;

-- Create policy using the function
CREATE POLICY "Authenticated users can access commercial collaboration view"
ON m8_schema.commercial_collaboration_view
FOR SELECT
TO authenticated
USING (m8_schema.check_user_authenticated());
