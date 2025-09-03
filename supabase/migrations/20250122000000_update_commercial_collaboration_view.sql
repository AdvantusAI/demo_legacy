-- Update commercial_collaboration_view to include forecast_sales_gap and other missing fields
CREATE OR REPLACE VIEW m8_schema.commercial_collaboration_view AS
SELECT 
    fd.product_id, 
    fd.location_id, 
    fd.customer_id, 
    fd.postdate, 
    fd.actual, 
    fd.forecast, 
    fd.commercial_input as approved_sm_kam, 
    fd.forecast_ly,
    prd.category_id, 
    prd.subcategory_id, 
    coc.sm_kam_override, 
    coc.forecast_sales_manager, 
    coc.commercial_input,
    -- Calculate forecast_sales_gap as forecast - actual
    COALESCE(fd.forecast, 0) - COALESCE(fd.actual, 0) as forecast_sales_gap
FROM 
    m8_schema.forecast_data fd 
    INNER JOIN m8_schema.products prd ON prd.product_id = fd.product_id::text
    INNER JOIN m8_schema.time_series ts ON fd.product_id = ts.product_id::text 
      AND fd.location_id = ts.location_id 
      AND fd.customer_id = ts.customer_id
    LEFT JOIN m8_schema.time_series_data tsd ON ts.id = tsd.series_id 
      AND tsd.period_date = fd.postdate
    LEFT JOIN m8_schema.commercial_collaboration coc ON coc.product_id = ts.product_id::text
      AND coc.customer_id = ts.customer_id
      AND coc.location_id = ts.location_id
      AND coc.postdate = tsd.period_date
ORDER BY fd.postdate;
