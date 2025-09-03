import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface InventoryProjectionRow {
  projection_month: string;
  forecasted_demand: number;
  projected_ending_inventory: number;
  product_id: string;
  location_id: string;
}

export interface ChartDataPoint {
  projection_month: string;
  forecasted_demand: number;
  projected_ending_inventory: number;
}

export interface ChartFilters {
  product_id?: string;
  location_id?: string;
  customer_id?: string;
}

export class InventoryProjectionsChartService {
  /**
   * Fetch inventory projections data for chart
   */
  static async getChartData(filters: ChartFilters = {}): Promise<ChartDataPoint[]> {
    try {
      // Get inventory series data
      let inventoryQuery = (supabase as any)
        .schema('m8_schema')
        .from('inventory_series')
        .select(`
          id,
          product_id,
          location_id
        `);

      if (filters.product_id) {
        inventoryQuery = inventoryQuery.eq('product_id', filters.product_id);
      }
      if (filters.location_id) {
        inventoryQuery = inventoryQuery.eq('location_id', filters.location_id);
      }

      const { data: inventorySeries, error: inventoryError } = await inventoryQuery;
      if (inventoryError) throw inventoryError;

      if (!inventorySeries || inventorySeries.length === 0) {
        return [];
      }

      // Get inventory transactions for the series
      const seriesIds = inventorySeries.map(s => s.id);
      const { data: inventoryData, error: inventoryDataError } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_series_data')
        .select('*')
        .in('series_id', seriesIds)
        .order('period_date', { ascending: true });

      if (inventoryDataError) throw inventoryDataError;

      // Get forecast data
      let forecastQuery = (supabase as any)
        .schema('m8_schema')
        .from('forecast_with_fitted_history')
        .select(`
          product_id,
          location_id,
          postdate,
          forecast,
          actual
        `)
        .order('postdate', { ascending: true });

      if (filters.product_id) {
        forecastQuery = forecastQuery.eq('product_id', filters.product_id);
      }
      if (filters.location_id) {
        forecastQuery = forecastQuery.eq('location_id', filters.location_id);
      }

      const { data: forecastData, error: forecastError } = await forecastQuery;
      if (forecastError) throw forecastError;

      // Combine and aggregate data by month
      const monthlyData = this.combineInventoryAndForecastData(
        inventoryData || [],
        forecastData || []
      );

      return monthlyData.map(item => ({
        projection_month: item.projection_month,
        forecasted_demand: item.forecasted_demand || 0,
        projected_ending_inventory: item.projected_ending_inventory || 0,
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  private static combineInventoryAndForecastData(
    inventoryData: any[],
    forecastData: any[]
  ): InventoryProjectionRow[] {
    // Group inventory data by month
    const inventoryByMonth = inventoryData.reduce((acc, item) => {
      const month = new Date(item.period_date).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { current_inventory: 0 };
      }
      acc[month].current_inventory += item.value || 0;
      return acc;
    }, {} as Record<string, any>);

    // Group forecast data by month
    const forecastByMonth = forecastData.reduce((acc, item) => {
      const month = new Date(item.postdate).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { forecasted_demand: 0 };
      }
      acc[month].forecasted_demand += item.forecast || 0;
      return acc;
    }, {} as Record<string, any>);

    // Combine data and calculate projections
    const allMonths = new Set([
      ...Object.keys(inventoryByMonth),
      ...Object.keys(forecastByMonth)
    ]);

    return Array.from(allMonths).map(month => {
      const inventory = inventoryByMonth[month] || { current_inventory: 0 };
      const forecast = forecastByMonth[month] || { forecasted_demand: 0 };

      // Calculate projected ending inventory
      const projectedEnding = inventory.current_inventory - forecast.forecasted_demand;

      return {
        projection_month: month,
        product_id: inventoryData[0]?.product_id || '',
        location_id: inventoryData[0]?.location_id || '',
        forecasted_demand: forecast.forecasted_demand,
        projected_ending_inventory: projectedEnding
      };
    }).sort((a, b) => a.projection_month.localeCompare(b.projection_month));
  }
}