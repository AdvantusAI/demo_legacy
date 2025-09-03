
-- Create RLS policy to allow public access to company assets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');

-- Create RLS policy to allow authenticated users to upload company assets
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

-- Create RLS policy to allow authenticated users to update company assets
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE 
USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

-- Create RLS policy to allow authenticated users to delete company assets
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE 
USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');
