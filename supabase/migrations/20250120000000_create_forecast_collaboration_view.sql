-- Create a comprehensive view for forecast collaboration data
-- This view joins forecast data with customer and subcategory information
CREATE OR REPLACE VIEW m8_schema.forecast_collaboration_view AS
SELECT 
    f.customer_id,
    c.customer_name,
    f.product_id,
    p.subcategory_id,
    p.subcategory_name,
    f.postdate,
    f.forecast_ly,
    f.forecast,
    f.commercial_input,
    f.fitted_history
FROM m8_schema.forecast_with_fitted_history f
LEFT JOIN m8_schema.customers c ON f.customer_id::text = c.customer_id::text
LEFT JOIN m8_schema.products p ON f.product_id::text = p.product_id::text
WHERE f.customer_id IS NOT NULL
ORDER BY f.customer_id, p.subcategory_id, f.postdate;

-- Add comment to the view
COMMENT ON VIEW m8_schema.forecast_collaboration_view IS 'Comprehensive view for forecast collaboration data with customer and subcategory information';
