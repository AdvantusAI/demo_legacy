import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_logo: string | null;
  level_1: string | null;
  level_1_name: string | null;
  level_2: string | null;
  level_2_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useChannelPartners = () => {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Customer[]>([]);

  const fetchPartners = useCallback(async (filters: {
    level_1?: string;
    level_2?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('customers')
        .select('*');
      
      if (filters.level_1) query = query.eq('level_1', filters.level_1);
      if (filters.level_2) query = query.eq('level_2', filters.level_2);

      const { data, error } = await query.order('customer_name');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    loading,
    partners,
    fetchPartners,
    refetch: fetchPartners,
  };
};