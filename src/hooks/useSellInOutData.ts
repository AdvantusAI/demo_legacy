import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SellInData {
  id: string;
  product_id: string;
  location_id: string;
  channel_partner_id: string; // Maps to customer_id in the view
  transaction_date: string; // Maps to postdate in the view
  quantity: number; // Maps to value in the view
  unit_price: number; // Not available in view, defaults to 0
  total_value: number; // Not available in view, defaults to 0
  invoice_number?: string; // Not available in view
  payment_terms?: string; // Not available in view
  discount_percentage?: number; // Not available in view
  transaction_metadata?: any; // Not available in view
}

export interface SellOutData {
  id: string;
  product_id: string;
  location_id: string;
  channel_partner_id: string;
  transaction_date: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  end_customer_id?: string;
  inventory_on_hand?: number;
  transaction_metadata?: any;
}

export interface SellThroughMetrics {
  product_id: string;
  location_id: string;
  customer_id: string;
  period_month: string;
  sell_in_units: number;
  sell_out_units: number;
  eom_inventory_units: number;
  sell_through_rate_pct: number | null;
  weeks_of_cover: number | null;
  potential_stockout: boolean;
  any_promo: boolean;
}

export const useSellInOutData = () => {
  const [loading, setLoading] = useState(false);
  const [sellInData, setSellInData] = useState<SellInData[]>([]);
  const [sellOutData, setSellOutData] = useState<SellOutData[]>([]);
  const [sellThroughMetrics, setSellThroughMetrics] = useState<SellThroughMetrics[]>([]);

  const fetchSellInData = useCallback(async (filters: {
    product_id?: string;
    location_id?: string;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('sell_in_data')
        .select('*');
      
      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.customer_id) query = query.eq('channel_partner_id', filters.customer_id);
      if (filters.start_date) query = query.gte('transaction_date', filters.start_date);
      if (filters.end_date) query = query.lte('transaction_date', filters.end_date);

      const { data, error } = await query.order('transaction_date', { ascending: false });
      
      if (error) throw error;
      setSellInData(data || []);
    } catch (error) {
      console.error('Error fetching sell-in data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sell-in data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellOutData = useCallback(async (filters: {
    product_id?: string;
    location_id?: string;
    channel_partner_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('sell_out_data')
        .select('*');
      
      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.channel_partner_id) query = query.eq('channel_partner_id', filters.channel_partner_id);
      if (filters.start_date) query = query.gte('transaction_date', filters.start_date);
      if (filters.end_date) query = query.lte('transaction_date', filters.end_date);

      const { data, error } = await query.order('transaction_date', { ascending: false });
      
      if (error) throw error;
      setSellOutData(data || []);
    } catch (error) {
      console.error('Error fetching sell-out data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sell-out data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellThroughMetrics = useCallback(async (filters: {
    product_id?: string;
    location_id?: string;
    customer_id?: string;
    period_start?: string;
    period_end?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_sell_through_monthly')
        .select('*');

      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.period_start) query = query.gte('period_month', filters.period_start);
      if (filters.period_end) query = query.lte('period_month', filters.period_end);

      const { data, error } = await query.order('period_month', { ascending: false });
      
      if (error) throw error;
      setSellThroughMetrics(data || []);
    } catch (error) {
      console.error('Error fetching sell-through metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sell-through metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createSellInRecord = useCallback(async (data: Omit<SellInData, 'id'>) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .schema('m8_schema')
        .from('sell_in_data')
        .insert([data]);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Sell-in record created successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating sell-in record:', error);
      toast({
        title: "Error",
        description: "Failed to create sell-in record",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSellOutRecord = useCallback(async (data: Omit<SellOutData, 'id'>) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .schema('m8_schema')
        .from('sell_out_data')
        .insert([data]);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Sell-out record created successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating sell-out record:', error);
      toast({
        title: "Error",
        description: "Failed to create sell-out record",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSellThroughRates = useCallback(async (periodStart?: string, periodEnd?: string) => {
    setLoading(true);
    try {
      // Since we're now using a view, we don't need to refresh it
      // The view automatically calculates the metrics based on the underlying data
      toast({
        title: "Info",
        description: "Sell-through metrics are automatically calculated from the view",
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing sell-through rates:', error);
      toast({
        title: "Error",
        description: "Failed to refresh sell-through rates",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    sellInData,
    sellOutData,
    sellThroughMetrics,
    fetchSellInData,
    fetchSellOutData,
    fetchSellThroughMetrics,
    createSellInRecord,
    createSellOutRecord,
    refreshSellThroughRates,
  };
};