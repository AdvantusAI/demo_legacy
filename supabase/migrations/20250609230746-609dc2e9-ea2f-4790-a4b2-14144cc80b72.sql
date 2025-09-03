
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create more permissive policies for company assets
CREATE POLICY "Allow public uploads to company assets" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Allow public updates to company assets" ON storage.objects FOR UPDATE 
USING (bucket_id = 'company-assets');

CREATE POLICY "Allow public deletes from company assets" ON storage.objects FOR DELETE 
USING (bucket_id = 'company-assets');
