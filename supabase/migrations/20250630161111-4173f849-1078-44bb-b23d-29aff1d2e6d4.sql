
-- Update storage policies to allow public uploads to company-assets bucket
-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public uploads to company assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to company assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from company assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes to company-assets" ON storage.objects;

-- Create more permissive policies for company-assets bucket
CREATE POLICY "Allow all operations on company-assets" ON storage.objects
FOR ALL USING (bucket_id = 'company-assets');

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-assets', 'company-assets', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
public = true,
file_size_limit = 52428800,
allowed_mime_types = ARRAY['image/*'];
