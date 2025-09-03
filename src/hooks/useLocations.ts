import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  location_id: string;
  location_name: string;
  [key: string]: any; // Allow any additional fields from the database
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('locations')
        .select('*')
        .order('location_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (locationId: string): string => {
    const location = locations.find(l => l.location_id === locationId);
    return location?.location_name || `Ubicación ${locationId}`;
  };

  return {
    locations,
    loading,
    error,
    getLocationName,
    refetch: fetchLocations
  };
}