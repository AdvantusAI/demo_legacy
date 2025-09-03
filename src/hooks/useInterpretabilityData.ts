
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InterpretabilityData {
  id: number;
  product_id: string;
  location_id: string;
  model_name: string;
  interpretability_score: number;
  confidence_level: string;
  forecast_explanation: string;
  primary_drivers: string[];
  risk_factors: string[];
  recommended_actions: string[];
  data_pattern_type: string;
  model_complexity: string;
  segment_classification: string;
  created_at: string;
}

export function useInterpretabilityData(productId?: string, locationId?: string, customerId?: string) {
  const [data, setData] = useState<InterpretabilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [productId, locationId, customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
       .schema('m8_schema')
        .from('forecast_interpretability')        
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      // Apply customer filter if selected
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(result || []);
    } catch (err) {
      console.error('Error fetching interpretability data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
