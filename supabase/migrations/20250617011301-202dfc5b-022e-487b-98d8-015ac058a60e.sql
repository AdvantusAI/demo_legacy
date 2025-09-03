
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow anyone to upload files to company-assets bucket
CREATE POLICY "Allow public uploads to company-assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'company-assets');

-- Create policy to allow anyone to view files in company-assets bucket
CREATE POLICY "Allow public access to company-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-assets');

-- Create policy to allow anyone to update files in company-assets bucket
CREATE POLICY "Allow public updates to company-assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'company-assets');

-- Create policy to allow anyone to delete files in company-assets bucket
CREATE POLICY "Allow public deletes to company-assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'company-assets');
