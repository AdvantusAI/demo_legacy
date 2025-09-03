import { supabase } from '@/integrations/supabase/client';

export interface ChartDataPoint {
  projection_month: string;
  forecasted_demand: number;
  projected_ending_inventory: number;
}

export interface ChartFilters {
  product_id?: string;
  location_node_id?: string;
  customer_id?: string;
}

export class InventoryProjectionsChartService {
  /**
   * Fetch inventory projections data for chart from forecast_with_fitted_history table
   */
  static async getChartData(filters: ChartFilters = {}): Promise<ChartDataPoint[]> {
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('forecast_with_fitted_history')
        .select(`
          postdate,
          forecast,
          fitted_history,
          product_id,
          location_node_id,
          customer_id
        `)
        .order('postdate', { ascending: true });

      // Apply filters
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.location_node_id) {
        query = query.eq('location_node_id', filters.location_node_id);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(row => ({
        projection_month: row.postdate || '',
        forecasted_demand: row.forecast || 0,
        projected_ending_inventory: row.fitted_history || 0,
      })) || [];
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }
}