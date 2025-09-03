-- Create sell-in and sell-out data tables
CREATE TABLE IF NOT EXISTS m8_schema.sell_in_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    channel_partner_id TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    invoice_number TEXT,
    payment_terms TEXT,
    discount_percentage NUMERIC,
    transaction_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m8_schema.sell_out_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    channel_partner_id TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    end_customer_id TEXT,
    inventory_on_hand NUMERIC,
    transaction_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE m8_schema.sell_in_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE m8_schema.sell_out_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all for authenticated users" ON m8_schema.sell_in_data
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON m8_schema.sell_out_data
    FOR ALL USING (auth.role() = 'authenticated');

-- Create sell-through monthly metrics view
CREATE OR REPLACE VIEW m8_schema.v_sell_through_monthly AS
WITH monthly_sell_in AS (
    SELECT 
        product_id,
        location_id,
        channel_partner_id as customer_id,
        DATE_TRUNC('month', transaction_date) as period_month,
        SUM(quantity) as sell_in_units
    FROM m8_schema.sell_in_data
    GROUP BY product_id, location_id, channel_partner_id, DATE_TRUNC('month', transaction_date)
),
monthly_sell_out AS (
    SELECT 
        product_id,
        location_id,
        channel_partner_id as customer_id,
        DATE_TRUNC('month', transaction_date) as period_month,
        SUM(quantity) as sell_out_units
    FROM m8_schema.sell_out_data
    GROUP BY product_id, location_id, channel_partner_id, DATE_TRUNC('month', transaction_date)
),
monthly_inventory AS (
    SELECT 
        product_id,
        location_id,
        channel_partner_id as customer_id,
        DATE_TRUNC('month', transaction_date) as period_month,
        SUM(COALESCE(inventory_on_hand, 0)) as eom_inventory_units
    FROM m8_schema.sell_out_data
    GROUP BY product_id, location_id, channel_partner_id, DATE_TRUNC('month', transaction_date)
)
SELECT 
    COALESCE(si.product_id, so.product_id, inv.product_id) as product_id,
    COALESCE(si.location_id, so.location_id, inv.location_id) as location_id,
    COALESCE(si.customer_id, so.customer_id, inv.customer_id) as customer_id,
    COALESCE(si.period_month, so.period_month, inv.period_month) as period_month,
    COALESCE(si.sell_in_units, 0) as sell_in_units,
    COALESCE(so.sell_out_units, 0) as sell_out_units,
    COALESCE(inv.eom_inventory_units, 0) as eom_inventory_units,
    CASE 
        WHEN COALESCE(si.sell_in_units, 0) > 0 
        THEN (COALESCE(so.sell_out_units, 0) / COALESCE(si.sell_in_units, 1)) * 100
        ELSE 0 
    END as sell_through_rate_pct,
    CASE 
        WHEN COALESCE(so.sell_out_units, 0) > 0 
        THEN COALESCE(inv.eom_inventory_units, 0) / (COALESCE(so.sell_out_units, 0) / 4.33) -- Assuming 4.33 weeks per month
        ELSE 0 
    END as weeks_of_cover,
    CASE 
        WHEN COALESCE(inv.eom_inventory_units, 0) = 0 AND COALESCE(so.sell_out_units, 0) > 0 
        THEN true 
        ELSE false 
    END as potential_stockout,
    false as any_promo -- Placeholder for promotional activity
FROM monthly_sell_in si
FULL OUTER JOIN monthly_sell_out so 
    ON si.product_id = so.product_id 
    AND si.location_id = so.location_id 
    AND si.customer_id = so.customer_id 
    AND si.period_month = so.period_month
FULL OUTER JOIN monthly_inventory inv 
    ON COALESCE(si.product_id, so.product_id) = inv.product_id 
    AND COALESCE(si.location_id, so.location_id) = inv.location_id 
    AND COALESCE(si.customer_id, so.customer_id) = inv.customer_id 
    AND COALESCE(si.period_month, so.period_month) = inv.period_month;

-- Grant permissions
GRANT ALL ON m8_schema.sell_in_data TO authenticated;
GRANT ALL ON m8_schema.sell_out_data TO authenticated;
GRANT SELECT ON m8_schema.v_sell_through_monthly TO authenticated;

-- Add comments
COMMENT ON TABLE m8_schema.sell_in_data IS 'Records of sales from company to channel partners';
COMMENT ON TABLE m8_schema.sell_out_data IS 'Records of sales from channel partners to end customers';
COMMENT ON VIEW m8_schema.v_sell_through_monthly IS 'Monthly aggregated sell-through metrics with calculated rates and inventory coverage';
