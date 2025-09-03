-- Create function to get time series data with joins
CREATE OR REPLACE FUNCTION m8_schema.get_time_series_data(category_id_param TEXT)
RETURNS TABLE (
  category_id TEXT,
  category_name TEXT,
  subcategory_id TEXT,
  subcategory_name TEXT,
  time_period TEXT,
  value NUMERIC,
  customer_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT prd.category_id::text, prd.category_name::text, prd.subcategory_id::text, prd.subcategory_name::text, tsd.time_period::text, tsd.value,  cust.customer_name::text
  FROM m8_schema.time_series ts 
  INNER JOIN m8_schema.time_series_data tsd ON (tsd.series_id = ts.id)
  INNER JOIN m8_schema.products prd 
  ON (ts.product_id::text = prd.product_id)
  INNER JOIN m8_schema.customers cust 
  ON (ts.customer_id::text = cust.customer_id)
  WHERE prd.category_id = category_id_param;
END;
$$ LANGUAGE plpgsql;
