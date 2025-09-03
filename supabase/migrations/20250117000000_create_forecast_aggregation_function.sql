-- Create function to get aggregated forecast data
CREATE OR REPLACE FUNCTION m8_schema.get_aggregated_forecast_data(
  p_product_id TEXT DEFAULT NULL,
  p_location_id TEXT DEFAULT NULL,
  p_customer_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  postdate TEXT,
  product_id TEXT,
  location_id TEXT,
  customer_id TEXT,
  forecast NUMERIC,
  actual NUMERIC,
  sales_plan NUMERIC,
  demand_planner NUMERIC,
  commercial_input NUMERIC,
  commercial_notes TEXT,
  collaboration_status TEXT,
  category_id TEXT,
  subcategory_id TEXT,
  category_name TEXT,
  subcategory_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fd.postdate::text,
    COALESCE(p.product_id, fd.product_id)::text as product_id,
    fd.location_id::text,
    fd.customer_id::text,
    SUM(fd.forecast)::numeric as forecast,
    SUM(fd.actual)::numeric as actual,
    SUM(fd.sales_plan)::numeric as sales_plan,
    SUM(fd.demand_planner)::numeric as demand_planner,
    SUM(COALESCE(fd.commercial_input, 0))::numeric as commercial_input,
    '' as commercial_notes,
    'pending_review' as collaboration_status,
    p.category_id::text,
    p.subcategory_id::text,
    p.category_name::text,
    p.subcategory_name::text
  FROM m8_schema.forecast_data fd
  LEFT JOIN m8_schema.products p ON fd.product_id = p.product_id
  WHERE 
    (p_product_id IS NULL OR 
     (p_product_id LIKE 'CAT_%' AND p.category_id = SUBSTRING(p_product_id FROM 5)) OR
     (p_product_id LIKE 'SUBCAT_%' AND p.subcategory_id = SUBSTRING(p_product_id FROM 9)) OR
     (p_product_id NOT LIKE 'CAT_%' AND p_product_id NOT LIKE 'SUBCAT_%' AND fd.product_id = p_product_id))
    AND (p_location_id IS NULL OR fd.location_id = p_location_id)
    AND (p_customer_id IS NULL OR fd.customer_id = p_customer_id)
  GROUP BY 
    fd.postdate,
    COALESCE(p.product_id, fd.product_id),
    fd.location_id,
    fd.customer_id,
    p.category_id,
    p.subcategory_id,
    p.category_name,
    p.subcategory_name
  ORDER BY fd.postdate DESC;
END;
$$ LANGUAGE plpgsql;
