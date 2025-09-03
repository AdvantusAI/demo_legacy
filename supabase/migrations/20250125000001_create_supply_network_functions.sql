-- Create supply network node types function
CREATE OR REPLACE FUNCTION public.get_supply_network_node_types()
RETURNS TABLE (
  id UUID,
  type_code TEXT,
  type_name TEXT,
  icon_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nt.id,
    nt.type_code,
    nt.type_name,
    nt.icon_name
  FROM m8_schema.supply_network_node_types nt
  ORDER BY nt.type_name;
END;
$$;

-- Create supply network relationship types function
CREATE OR REPLACE FUNCTION public.get_supply_network_relationship_types()
RETURNS TABLE (
  id UUID,
  type_code TEXT,
  type_name TEXT,
  description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.type_code,
    rt.type_name,
    rt.description
  FROM m8_schema.supply_network_relationship_types rt
  ORDER BY rt.type_name;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_supply_network_node_types() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supply_network_relationship_types() TO authenticated;
