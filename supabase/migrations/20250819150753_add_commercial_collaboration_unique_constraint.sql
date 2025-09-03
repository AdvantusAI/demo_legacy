-- Add unique constraint to commercial_collaboration table for upsert operations
-- This constraint ensures that each combination of product_id, customer_id, location_id, and postdate is unique

ALTER TABLE m8_schema.commercial_collaboration 
ADD CONSTRAINT commercial_collaboration_unique_key 
UNIQUE (product_id, customer_id, location_id, postdate);

-- Add index for better performance on these columns
CREATE INDEX IF NOT EXISTS idx_commercial_collaboration_lookup 
ON m8_schema.commercial_collaboration (product_id, customer_id, location_id, postdate);
