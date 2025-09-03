import { supabase } from '@/integrations/supabase/client';

export interface SupplyPlanRecord {
  postdate: string;
  node_name: string;
  product_id: string;
  location_node_id?: string;
  forecast: number;
  actual: number;
  total_demand: number;
  planned_arrivals: number;
  planned_orders: number;
  projected_on_hand: number;
  safety_stock: number;
}

export interface SupplyPlanFilters {
  productId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  nodes?: string[];
}

export class SupplyPlanService {
  /**
   * Fetch supply plan data from v_meio_supply_plan view
   */
  static async getSupplyPlanData(filters: SupplyPlanFilters): Promise<SupplyPlanRecord[]> {
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('*');

      // Apply filters
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.locationId) {
        query = query.eq('location_code', filters.locationId);
      }
      if (filters.startDate) {
        query = query.gte('postdate', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('postdate', filters.endDate);
      }
      if (filters.nodes && filters.nodes.length > 0) {
        query = query.in('node_name', filters.nodes);
      }

      // Order by date and node
      query = query.order('postdate', { ascending: true })
                   .order('node_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching supply plan data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('SupplyPlanService.getSupplyPlanData error:', error);
      throw error;
    }
  }

  /**
   * Get unique nodes for a product/location combination
   */
  static async getUniqueNodes(productId?: string, locationId?: string): Promise<string[]> {
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('node_name');

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (locationId) {
        query = query.eq('location_code', locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unique nodes:', error);
        throw error;
      }

      // Extract unique node names
      const uniqueNodes = [...new Set(data?.map((d: any) => d.node_name as string) || [])];
      return uniqueNodes.sort();
    } catch (error) {
      console.error('SupplyPlanService.getUniqueNodes error:', error);
      throw error;
    }
  }

  /**
   * Get date range for available data
   */
  static async getDateRange(productId?: string, locationId?: string): Promise<{ start: string; end: string } | null> {
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('postdate');

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (locationId) {
        query = query.eq('location_code', locationId);
      }

      query = query.order('postdate', { ascending: true }).limit(1);
      const { data: minData, error: minError } = await query;

      query = (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('postdate');

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (locationId) {
        query = query.eq('location_code', locationId);
      }

      query = query.order('postdate', { ascending: false }).limit(1);
      const { data: maxData, error: maxError } = await query;

      if (minError || maxError) {
        console.error('Error fetching date range:', minError || maxError);
        return null;
      }

      if (minData?.length && maxData?.length) {
        return {
          start: minData[0].postdate,
          end: maxData[0].postdate
        };
      }

      return null;
    } catch (error) {
      console.error('SupplyPlanService.getDateRange error:', error);
      return null;
    }
  }

  /**
   * Calculate aggregated metrics for a specific period
   */
  static async getAggregatedMetrics(
    productId: string,
    locationId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('*')
        .eq('product_id', productId)
        .eq('location_code', locationId)
        .gte('postdate', startDate)
        .lte('postdate', endDate);

      if (error) {
        console.error('Error fetching aggregated metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Calculate aggregations
      const metrics = {
        avgForecast: data.reduce((sum, d) => sum + d.forecast, 0) / data.length,
        avgActual: data.reduce((sum, d) => sum + d.actual, 0) / data.length,
        totalDemand: data.reduce((sum, d) => sum + d.total_demand, 0),
        totalPlannedArrivals: data.reduce((sum, d) => sum + d.planned_arrivals, 0),
        totalPlannedOrders: data.reduce((sum, d) => sum + d.planned_orders, 0),
        minProjectedOnHand: Math.min(...data.map(d => d.projected_on_hand)),
        maxProjectedOnHand: Math.max(...data.map(d => d.projected_on_hand)),
        avgProjectedOnHand: data.reduce((sum, d) => sum + d.projected_on_hand, 0) / data.length,
        criticalPeriods: data.filter(d => d.projected_on_hand < d.safety_stock).length,
        stockoutPeriods: data.filter(d => d.projected_on_hand <= 0).length
      };

      return metrics;
    } catch (error) {
      console.error('SupplyPlanService.getAggregatedMetrics error:', error);
      throw error;
    }
  }
}