import { supabase } from '@/integrations/supabase/client';

export interface CurrentInventory {
  product_id: string;
  location_id: string;
  warehouse_id: number;
  current_stock: number;
}

export interface ForecastData {
  product_id: string;
  location_id: string;
  postdate: string;
  forecast: number;
  actual: number;
}

export interface InventoryProjection {
  date: string;
  projected_inventory: number;
  forecast_demand: number;
  current_stock: number;
  cumulative_demand: number;
  reorder_point: number;
  safety_stock: number;
  status: 'optimal' | 'warning' | 'critical' | 'stockout';
}

export interface ProjectionParams {
  product_id?: string;
  location_id?: string;
  warehouse_id?: number;
  projection_days?: number;
}

export class InventoryProjectionService {
  /**
   * Calculate inventory projections for multiple SKUs/locations
   */
  static async calculateProjections(params: ProjectionParams = {}): Promise<{
    product_id: string;
    location_id: string;
    warehouse_id: number;
    projections: InventoryProjection[];
  }[]> {
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
      
      if (params.product_id) {
        inventoryQuery = inventoryQuery.eq('product_id', params.product_id);
      }
      if (params.location_id) {
        inventoryQuery = inventoryQuery.eq('location_id', params.location_id);
      }

      const { data: inventorySeries, error: inventoryError } = await inventoryQuery;
      
      if (inventoryError) throw inventoryError;
      if (!inventorySeries?.length) return [];

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
        .gte('postdate', new Date().toISOString().split('T')[0]) // Future dates only
        .order('postdate', { ascending: true });

      if (params.product_id) {
        forecastQuery = forecastQuery.eq('product_id', params.product_id);
      }
      if (params.location_id) {
        forecastQuery = forecastQuery.eq('location_id', params.location_id);
      }

      const { data: forecastData, error: forecastError } = await forecastQuery;
      
      if (forecastError) throw forecastError;

      // Process projections for each inventory series
      const results = await Promise.all(
        inventorySeries.map(async (series) => {
          const relevantInventoryData = inventoryData?.filter(
            inv => inv.series_id === series.id
          ) || [];
          
          const relevantForecasts = forecastData?.filter(
            f => f.product_id === series.product_id &&
                 f.location_id === series.location_id
          ) || [];

          const projections = this.calculateInventoryTimeline(
            series,
            relevantInventoryData,
            relevantForecasts,
            params.projection_days || 90
          );

          return {
            product_id: series.product_id,
            location_id: series.location_id,
            warehouse_id: 1, // Default warehouse ID
            projections
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error calculating projections:', error);
      throw error;
    }
  }

  /**
   * Enhanced projection calculation with Phase 2 features
   */
  private static calculateInventoryTimeline(
    series: any,
    inventoryData: any[],
    forecasts: ForecastData[],
    projectionDays: number
  ): InventoryProjection[] {
    const projections: InventoryProjection[] = [];
    const startDate = new Date();
    
    // Calculate current inventory from inventory data
    const currentInventory = inventoryData.reduce((sum, item) => sum + (item.value || 0), 0);
    let runningInventory = currentInventory;
    let cumulativeDemand = 0;

    // Calculate enhanced safety stock (using simplified method for now)
    const enhancedSafetyStock = this.calculateEnhancedSafetyStock(series, forecasts);

    // Create daily projections with enhanced logic
    for (let day = 0; day <= projectionDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Get daily demand with seasonal adjustment
      const baseDailyDemand = this.getDailyDemand(forecasts, currentDate);
      const seasonalAdjustment = this.getSeasonalAdjustment(currentDate);
      const adjustedDemand = baseDailyDemand * seasonalAdjustment;
      
      cumulativeDemand += adjustedDemand;
      
      // Calculate projected inventory with potential replenishments
      let projectedInventory = currentInventory - cumulativeDemand;
      
      // Calculate reorder point (simplified calculation)
      const reorderPoint = enhancedSafetyStock * 1.5;
      
      // Simulate automatic replenishment if below reorder point
      if (projectedInventory <= reorderPoint && day > 0) {
        // Use estimated max capacity (current inventory * 2 as fallback)
        const maxCapacity = currentInventory * 2;
        const replenishmentQuantity = maxCapacity - projectedInventory;
        if (replenishmentQuantity > 0) {
          projectedInventory += replenishmentQuantity;
          // Note: In real implementation, this would consider lead times
        }
      }

      // Determine status with enhanced safety stock
      const status = this.determineEnhancedInventoryStatus(
        projectedInventory,
        enhancedSafetyStock,
        reorderPoint
      );

      projections.push({
        date: dateStr,
        projected_inventory: Math.max(0, projectedInventory),
        forecast_demand: adjustedDemand,
        current_stock: currentInventory,
        cumulative_demand: cumulativeDemand,
        reorder_point: reorderPoint,
        safety_stock: enhancedSafetyStock,
        status
      });

      runningInventory = projectedInventory;
    }

    return projections;
  }

  /**
   * Get daily demand from forecast data
   */
  private static getDailyDemand(forecasts: ForecastData[], date: Date): number {
    if (!forecasts.length) return 0;

    // Find exact match first
    const dateStr = date.toISOString().split('T')[0];
    const exactMatch = forecasts.find(f => f.postdate === dateStr);
    if (exactMatch && exactMatch.forecast) {
      return exactMatch.forecast;
    }

    // If no exact match, find closest forecast or interpolate
    const sortedForecasts = forecasts
      .filter(f => f.forecast !== null)
      .sort((a, b) => new Date(a.postdate).getTime() - new Date(b.postdate).getTime());

    if (!sortedForecasts.length) return 0;

    // Use the closest forecast value
    const closest = sortedForecasts.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.postdate).getTime() - date.getTime());
      const currDiff = Math.abs(new Date(curr.postdate).getTime() - date.getTime());
      return currDiff < prevDiff ? curr : prev;
    });

    return closest.forecast || 0;
  }

  /**
   * Calculate enhanced safety stock with seasonal considerations
   */
  private static calculateEnhancedSafetyStock(
    series: any,
    forecasts: ForecastData[]
  ): number {
    if (!forecasts.length) return 10; // Default safety stock

    // Calculate demand variability
    const demands = forecasts.map(f => f.forecast || 0);
    const avgDemand = demands.reduce((sum, d) => sum + d, 0) / demands.length;
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - avgDemand, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);

    // Enhanced safety stock calculation
    const leadTime = 14; // Default 14 days
    const serviceLevel = 1.65; // Z-score for 95% service level
    const enhancedSafetyStock = serviceLevel * stdDev * Math.sqrt(leadTime / 7); // Weekly adjustment

    return Math.max(enhancedSafetyStock, 10); // Minimum safety stock of 10
  }

  /**
   * Get seasonal adjustment factor
   */
  private static getSeasonalAdjustment(date: Date): number {
    const month = date.getMonth() + 1;
    // Simplified seasonal factors (would be calculated from historical data in real implementation)
    const seasonalFactors: { [key: number]: number } = {
      1: 0.9,  // January - post-holiday low
      2: 0.95, // February
      3: 1.0,  // March - baseline
      4: 1.05, // April
      5: 1.1,  // May
      6: 1.15, // June - summer high
      7: 1.2,  // July - peak summer
      8: 1.15, // August
      9: 1.05, // September
      10: 1.1, // October
      11: 1.25, // November - pre-holiday
      12: 1.3  // December - holiday peak
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Enhanced inventory status determination
   */
  private static determineEnhancedInventoryStatus(
    projectedInventory: number,
    enhancedSafetyStock: number,
    reorderPoint: number
  ): 'optimal' | 'warning' | 'critical' | 'stockout' {
    if (projectedInventory <= 0) return 'stockout';
    if (projectedInventory <= enhancedSafetyStock * 0.5) return 'critical';
    if (projectedInventory <= enhancedSafetyStock) return 'warning';
    return 'optimal';
  }

  /**
   * Get summary statistics for projections
   */
  static getProjectionSummary(projections: InventoryProjection[]) {
    if (!projections.length) return null;

    const stockoutDays = projections.filter(p => p.status === 'stockout').length;
    const criticalDays = projections.filter(p => p.status === 'critical').length;
    const warningDays = projections.filter(p => p.status === 'warning').length;
    const minInventory = Math.min(...projections.map(p => p.projected_inventory));
    const totalDemand = projections[projections.length - 1]?.cumulative_demand || 0;

    return {
      stockoutDays,
      criticalDays,
      warningDays,
      minInventory,
      totalDemand,
      riskLevel: stockoutDays > 0 ? 'high' : criticalDays > 7 ? 'medium' : 'low'
    };
  }
}