import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
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

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('customers')
        .select('*')
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer?.customer_name || `Cliente ${customerId}`;
  };

  return {
    customers,
    loading,
    error,
    getCustomerName,
    refetch: fetchCustomers
  };
}