import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SalesVelocityData {
  id: string;
  product_id: string;
  channel_partner_id: string;
  location_id: string;
  period: string;
  velocity_units_per_day: number;
  velocity_units_per_week: number;
  normalized_velocity_per_location: number;
  trailing_velocity_l3m: number;
  trailing_velocity_l6m: number;
  active_locations: number;
  sell_out_units: number;
  days_in_month: number;
}

export interface VelocityMetrics {
  id: string;
  product_id: string;
  channel_partner_id: string;
  location_id: string;
  velocity_units_per_day: number;
  velocity_units_per_week: number;
  normalized_velocity_per_location: number;
  trailing_velocity_l3m: number;
  trailing_velocity_l6m: number;
  velocity_rank: number;
  coefficient_of_variation: number;
  recommended_order_qty: number;
  weeks_of_cover: number;
  created_at: string;
  updated_at: string;
}

export interface TopMover {
  product_id: string;
  product_name: string;
  velocity_units_per_week: number;
  velocity_rank: number;
}

export interface VelocityAlert {
  id: string;
  type: 'overstock' | 'replenishment';
  product_id: string;
  product_name: string;
  partner_id: string;
  partner_name: string;
  message: string;
  recommended_action: string;
  severity: 'low' | 'medium' | 'high';
}

export const useSalesVelocityData = () => {
  const [loading, setLoading] = useState(false);
  const [velocityData, setVelocityData] = useState<SalesVelocityData[]>([]);
  const [velocityMetrics, setVelocityMetrics] = useState<VelocityMetrics[]>([]);
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [alerts, setAlerts] = useState<VelocityAlert[]>([]);

  const fetchVelocityData = useCallback(async (filters: {
    product_id?: string;
    customer_id?: string;
    location_id?: string;
    period_start?: string;
    period_end?: string;
  } = {}) => {
    setLoading(true);
    try {
      // Use the actual v_sales_velocity_monthly view
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_sales_velocity_monthly')
        .select(`
          *,
          products!inner(name, code),
          customers!inner(customer_name)
        `);
      
      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.period_start) query = query.gte('period_month', filters.period_start);
      if (filters.period_end) query = query.lte('period_month', filters.period_end);

      const { data, error } = await query.order('period_month', { ascending: false });
      
      if (error) throw error;

      // Transform the data to match our interface
      const velocityData: SalesVelocityData[] = data?.map(record => ({
        id: `${record.product_id}_${record.customer_id}_${record.location_id}_${record.period_month}`,
        product_id: record.product_id,
        channel_partner_id: record.customer_id, // Map customer_id to channel_partner_id for compatibility
        location_id: record.location_id,
        period: record.period_month,
        velocity_units_per_day: record.velocity_units_per_day || 0,
        velocity_units_per_week: record.velocity_units_per_week || 0,
        normalized_velocity_per_location: record.velocity_units_per_month_per_location || 0,
        trailing_velocity_l3m: 0, // Would need additional calculation for trailing periods
        trailing_velocity_l6m: 0, // Would need additional calculation for trailing periods
        active_locations: record.active_locations || 0,
        sell_out_units: record.sell_out_units || 0,
        days_in_month: 0, // Not directly available in the view, could be calculated
      })) || [];
      
      setVelocityData(velocityData);
    } catch (error) {
      console.error('Error fetching velocity data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch velocity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVelocityMetrics = useCallback(async (filters: {
    product_id?: string;
    customer_id?: string;
    location_id?: string;
    period_start?: string;
    period_end?: string;
  } = {}) => {
    setLoading(true);
    try {
      // Use the actual v_sales_velocity_monthly view for metrics
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_sales_velocity_monthly')
        .select(`
          *,
          products!inner(name, code),
          customers!inner(customer_name)
        `);
      
      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);
      if (filters.period_start) query = query.gte('period_month', filters.period_start);
      if (filters.period_end) query = query.lte('period_month', filters.period_end);

      const { data, error } = await query.order('period_month', { ascending: false });
      
      if (error) throw error;

      // Transform the data to match our metrics interface
      const metrics: VelocityMetrics[] = data?.map((record, index) => ({
        id: `${record.product_id}_${record.customer_id}_${record.location_id}_${record.period_month}`,
        product_id: record.product_id,
        channel_partner_id: record.customer_id, // Map customer_id to channel_partner_id for compatibility
        location_id: record.location_id,
        velocity_units_per_day: record.velocity_units_per_day || 0,
        velocity_units_per_week: record.velocity_units_per_week || 0,
        normalized_velocity_per_location: record.velocity_units_per_month_per_location || 0,
        trailing_velocity_l3m: 0, // Would need additional calculation for trailing periods
        trailing_velocity_l6m: 0, // Would need additional calculation for trailing periods
        velocity_rank: index + 1, // Simple ranking based on order
        coefficient_of_variation: 0.15, // Placeholder - would need calculation
        recommended_order_qty: Math.round((record.velocity_units_per_week || 0) * 2), // Simple calculation
        weeks_of_cover: record.eom_inventory_units ? Math.round((record.eom_inventory_units / (record.velocity_units_per_week || 1)) * 4.345) : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];

      setVelocityMetrics(metrics);

      // Generate top movers
      const topMoversData: TopMover[] = metrics
        .sort((a, b) => b.velocity_units_per_week - a.velocity_units_per_week)
        .slice(0, 5)
        .map(metric => ({
          product_id: metric.product_id,
          product_name: `Product ${metric.product_id}`, // Would need to get actual product name
          velocity_units_per_week: metric.velocity_units_per_week,
          velocity_rank: metric.velocity_rank,
        }));

      setTopMovers(topMoversData);

      // Generate alerts
      const alertsData: VelocityAlert[] = [];
      
      metrics.forEach(metric => {
        // Overstock alert: low velocity + high weeks of cover
        if (metric.velocity_units_per_week < 20 && metric.weeks_of_cover > 8) {
          alertsData.push({
            id: `overstock_${metric.id}`,
            type: 'overstock',
            product_id: metric.product_id,
            product_name: `Product ${metric.product_id}`,
            partner_id: metric.channel_partner_id,
            partner_name: `Partner ${metric.channel_partner_id}`,
            message: `Low velocity (${metric.velocity_units_per_week.toFixed(1)} units/week) with ${metric.weeks_of_cover.toFixed(1)} weeks of cover`,
            recommended_action: 'Consider promotional activities or inventory redistribution',
            severity: metric.weeks_of_cover > 12 ? 'high' : 'medium',
          });
        }
        
        // Replenishment alert: high velocity + low weeks of cover
        if (metric.velocity_units_per_week > 50 && metric.weeks_of_cover < 3) {
          alertsData.push({
            id: `replenishment_${metric.id}`,
            type: 'replenishment',
            product_id: metric.product_id,
            product_name: `Product ${metric.product_id}`,
            partner_id: metric.channel_partner_id,
            partner_name: `Partner ${metric.channel_partner_id}`,
            message: `High velocity (${metric.velocity_units_per_week.toFixed(1)} units/week) with only ${metric.weeks_of_cover.toFixed(1)} weeks of cover`,
            recommended_action: `Order ${metric.recommended_order_qty} units immediately`,
            severity: metric.weeks_of_cover < 1.5 ? 'high' : 'medium',
          });
        }
      });

      setAlerts(alertsData);
      
    } catch (error) {
      console.error('Error fetching velocity metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch velocity metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const exportVelocityReport = useCallback(async (filters: {
    product_id?: string;
    channel_partner_id?: string;
    location_id?: string;
  } = {}) => {
    try {
      // Simulate CSV export
      const csvData = velocityMetrics.map(metric => ({
        'Product ID': metric.product_id,
        'Channel Partner ID': metric.channel_partner_id,
        'Location ID': metric.location_id,
        'Velocity (Units/Week)': metric.velocity_units_per_week.toFixed(2),
        'Velocity (Units/Day)': metric.velocity_units_per_day.toFixed(2),
        'Trailing 3M Velocity': metric.trailing_velocity_l3m.toFixed(2),
        'Trailing 6M Velocity': metric.trailing_velocity_l6m.toFixed(2),
        'Velocity Rank': metric.velocity_rank,
        'Coefficient of Variation': metric.coefficient_of_variation.toFixed(3),
        'Weeks of Cover': metric.weeks_of_cover.toFixed(1),
        'Recommended Order Qty': metric.recommended_order_qty,
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velocity-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Velocity report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting velocity report:', error);
      toast({
        title: "Error",
        description: "Failed to export velocity report",
        variant: "destructive",
      });
    }
  }, [velocityMetrics]);

  return {
    loading,
    velocityData,
    velocityMetrics,
    topMovers,
    alerts,
    fetchVelocityData,
    fetchVelocityMetrics,
    exportVelocityReport,
  };
};