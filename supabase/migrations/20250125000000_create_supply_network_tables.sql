-- Create supply network node types table
CREATE TABLE IF NOT EXISTS m8_schema.supply_network_node_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code TEXT NOT NULL UNIQUE,
  type_name TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Package',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply network relationship types table
CREATE TABLE IF NOT EXISTS m8_schema.supply_network_relationship_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code TEXT NOT NULL UNIQUE,
  type_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply network nodes table
CREATE TABLE IF NOT EXISTS m8_schema.supply_network_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name TEXT NOT NULL,
  node_type_id UUID REFERENCES m8_schema.supply_network_node_types(id),
  description TEXT,
  status TEXT DEFAULT 'active',
  contact_information JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply network relationships table
CREATE TABLE IF NOT EXISTS m8_schema.supply_network_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_code TEXT,
  description TEXT,
  source_node_id UUID REFERENCES m8_schema.supply_network_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES m8_schema.supply_network_nodes(id) ON DELETE CASCADE,
  relationship_type_id UUID REFERENCES m8_schema.supply_network_relationship_types(id),
  lead_time_days INTEGER,
  primary_transport_method TEXT,
  primary_transport_cost NUMERIC,
  cost_unit TEXT DEFAULT 'USD',
  alternate_transport_method TEXT,
  alternate_lead_time_days INTEGER,
  alternate_transport_cost NUMERIC,
  capacity_constraint NUMERIC,
  is_bidirectional BOOLEAN DEFAULT false,
  priority_rank INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE m8_schema.supply_network_node_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE m8_schema.supply_network_relationship_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE m8_schema.supply_network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE m8_schema.supply_network_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON m8_schema.supply_network_node_types
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON m8_schema.supply_network_relationship_types
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON m8_schema.supply_network_nodes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON m8_schema.supply_network_relationships
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default node types
INSERT INTO m8_schema.supply_network_node_types (type_code, type_name, icon_name, description) VALUES
  ('factory', 'Factory', 'Factory', 'Manufacturing facility'),
  ('warehouse', 'Warehouse', 'Warehouse', 'Storage facility'),
  ('distributor', 'Distributor', 'Truck', 'Distribution center'),
  ('retailer', 'Retailer', 'Store', 'Retail store'),
  ('supplier', 'Supplier', 'Package', 'Raw material supplier')
ON CONFLICT (type_code) DO NOTHING;

-- Insert default relationship types
INSERT INTO m8_schema.supply_network_relationship_types (type_code, type_name, description) VALUES
  ('supplies', 'Supplies', 'One node supplies products to another'),
  ('distributes', 'Distributes', 'One node distributes products to another'),
  ('stores', 'Stores', 'One node stores products for another'),
  ('transports', 'Transports', 'One node transports products to another')
ON CONFLICT (type_code) DO NOTHING;
