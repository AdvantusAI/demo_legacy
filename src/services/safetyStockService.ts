import { supabase } from '@/integrations/supabase/client';

export interface SafetyStockCalculation {
  product_id: string;
  location_id: string;
  warehouse_id: number;
  current_safety_stock: number;
  recommended_safety_stock: number;
  calculation_method: 'static' | 'seasonal' | 'trend_based' | 'service_level';
  demand_variability: number;
  lead_time_variability: number;
  service_level_target: number;
  seasonal_factors: SeasonalFactor[];
  confidence_interval: number;
  cost_impact: number;
}

export interface SeasonalFactor {
  month: number;
  factor: number;
  historical_variance: number;
}

export interface MultiNodeInventory {
  product_id: string;
  nodes: InventoryNode[];
  transfer_rules: TransferRule[];
  total_network_stock: number;
  optimal_distribution: DistributionPlan[];
}

export interface InventoryNode {
  node_id: string;
  node_type: 'warehouse' | 'distribution_center' | 'store';
  location_id: string;
  current_stock: number;
  capacity: number;
  lead_time_to_replenish: number;
  demand_zone: string[];
  upstream_nodes: string[];
  downstream_nodes: string[];
}

export interface TransferRule {
  from_node: string;
  to_node: string;
  transfer_cost: number;
  transfer_time: number;
  min_transfer_quantity: number;
  max_transfer_quantity: number;
}

export interface DistributionPlan {
  node_id: string;
  recommended_stock_level: number;
  reorder_point: number;
  max_stock_level: number;
  transfer_recommendations: TransferRecommendation[];
}

export interface TransferRecommendation {
  from_node: string;
  to_node: string;
  quantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expected_benefit: number;
}

export class SafetyStockService {
  /**
   * Calculate advanced safety stock levels using multiple methods
   */
  static async calculateAdvancedSafetyStock(
    product_id: string,
    location_id?: string,
    warehouse_id?: number
  ): Promise<SafetyStockCalculation[]> {
    // Get current inventory data
    let inventoryQuery = supabase
      .from('current_inventory')
      .select('*')
      .eq('product_id', product_id);
    
    if (warehouse_id) inventoryQuery = inventoryQuery.eq('warehouse_id', warehouse_id);

    const { data: inventoryData, error: inventoryError } = await inventoryQuery;
    if (inventoryError) throw inventoryError;

    // Get historical demand data for variability analysis
    const { data: demandHistory, error: demandError } = await supabase
      .from('forecast_data')
      .select('*')
      .eq('product_id', product_id)
      .gte('postdate', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('postdate', { ascending: true });

    if (demandError) throw demandError;

    const results: SafetyStockCalculation[] = [];

    for (const inventory of inventoryData || []) {
      const relevantDemand = demandHistory?.filter(d => 
        location_id ? d.location_id === location_id : true
      ) || [];

      // Calculate demand variability
      const demandVariability = this.calculateDemandVariability(relevantDemand);
      
      // Calculate seasonal factors
      const seasonalFactors = this.calculateSeasonalFactors(relevantDemand);
      
      // Calculate recommended safety stock using multiple methods
      const calculations = await this.calculateSafetyStockMethods(
        inventory,
        relevantDemand,
        demandVariability,
        seasonalFactors
      );

      results.push({
        product_id: inventory.product_id,
        location_id: location_id || 'default',
        warehouse_id: inventory.warehouse_id,
        current_safety_stock: inventory.safety_stock,
        recommended_safety_stock: calculations.recommended,
        calculation_method: calculations.method,
        demand_variability: demandVariability,
        lead_time_variability: calculations.leadTimeVariability,
        service_level_target: 95, // Default 95% service level
        seasonal_factors: seasonalFactors,
        confidence_interval: calculations.confidenceInterval,
        cost_impact: calculations.costImpact
      });
    }

    return results;
  }

  /**
   * Calculate demand variability from historical data
   */
  private static calculateDemandVariability(demandHistory: any[]): number {
    if (demandHistory.length < 2) return 0;

    const demands = demandHistory.map(d => d.forecast || 0);
    const mean = demands.reduce((sum, d) => sum + d, 0) / demands.length;
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / demands.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Calculate seasonal factors by month
   */
  private static calculateSeasonalFactors(demandHistory: any[]): SeasonalFactor[] {
    const monthlyData: { [month: number]: number[] } = {};
    
    demandHistory.forEach(d => {
      const month = new Date(d.postdate).getMonth() + 1;
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(d.forecast || 0);
    });

    const overallMean = demandHistory.reduce((sum, d) => sum + (d.forecast || 0), 0) / demandHistory.length;
    
    const factors: SeasonalFactor[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyData[month] || [overallMean];
      const monthMean = monthData.reduce((sum, d) => sum + d, 0) / monthData.length;
      const variance = monthData.reduce((sum, d) => sum + Math.pow(d - monthMean, 2), 0) / monthData.length;
      
      factors.push({
        month,
        factor: monthMean / overallMean,
        historical_variance: variance
      });
    }

    return factors;
  }

  /**
   * Calculate safety stock using different methods and select the best one
   */
  private static async calculateSafetyStockMethods(
    inventory: any,
    demandHistory: any[],
    demandVariability: number,
    seasonalFactors: SeasonalFactor[]
  ): Promise<{
    recommended: number;
    method: SafetyStockCalculation['calculation_method'];
    leadTimeVariability: number;
    confidenceInterval: number;
    costImpact: number;
  }> {
    const leadTime = inventory.lead_time || 14; // Default 14 days
    const serviceLevel = 0.95; // 95% service level
    const zScore = 1.65; // Z-score for 95% service level

    // Method 1: Static calculation (square root formula)
    const avgDemand = demandHistory.length > 0 ? 
      demandHistory.reduce((sum, d) => sum + (d.forecast || 0), 0) / demandHistory.length : 
      inventory.current_stock / 30; // Estimate based on current stock

    const staticSafetyStock = zScore * Math.sqrt(leadTime) * (avgDemand * demandVariability);

    // Method 2: Seasonal adjustment
    const currentMonth = new Date().getMonth() + 1;
    const seasonalFactor = seasonalFactors.find(f => f.month === currentMonth)?.factor || 1;
    const seasonalSafetyStock = staticSafetyStock * seasonalFactor;

    // Method 3: Trend-based (if there's a clear trend in demand)
    let trendSafetyStock = staticSafetyStock;
    if (demandHistory.length >= 6) {
      const recentDemand = demandHistory.slice(-3).reduce((sum, d) => sum + (d.forecast || 0), 0) / 3;
      const olderDemand = demandHistory.slice(-6, -3).reduce((sum, d) => sum + (d.forecast || 0), 0) / 3;
      const trendFactor = recentDemand > olderDemand ? 1.2 : 0.9;
      trendSafetyStock = staticSafetyStock * trendFactor;
    }

    // Select the most appropriate method based on data quality and variability
    let recommendedStock: number;
    let method: SafetyStockCalculation['calculation_method'];

    if (demandHistory.length >= 12 && demandVariability > 0.3) {
      // High variability with good historical data - use seasonal
      recommendedStock = seasonalSafetyStock;
      method = 'seasonal';
    } else if (demandHistory.length >= 6 && demandVariability > 0.2) {
      // Medium variability with some historical data - use trend-based
      recommendedStock = trendSafetyStock;
      method = 'trend_based';
    } else {
      // Low variability or limited data - use static
      recommendedStock = staticSafetyStock;
      method = 'static';
    }

    // Ensure minimum safety stock
    recommendedStock = Math.max(recommendedStock, avgDemand * 3); // At least 3 days of demand

    return {
      recommended: Math.round(recommendedStock),
      method,
      leadTimeVariability: 0.1, // Estimated 10% lead time variability
      confidenceInterval: 95,
      costImpact: (recommendedStock - inventory.safety_stock) * (inventory.unit_cost || 10) // Estimated cost impact
    };
  }

  /**
   * Analyze multi-node inventory distribution
   */
  static async analyzeMultiNodeInventory(product_id: string): Promise<MultiNodeInventory> {
    // Get all inventory locations for the product
    const { data: inventoryNodes, error } = await supabase
      .from('current_inventory')
      .select('*')
      .eq('product_id', product_id);

    if (error) throw error;

    // Create network topology (simplified for demo)
    const nodes: InventoryNode[] = (inventoryNodes || []).map(inv => ({
      node_id: `${inv.warehouse_id}`,
      node_type: inv.warehouse_id < 10 ? 'distribution_center' : 'warehouse',
      location_id: 'default', // Fallback since location_id doesn't exist in schema
      current_stock: inv.current_stock,
      capacity: inv.current_stock * 2, // Estimated capacity since max_capacity doesn't exist
      lead_time_to_replenish: 14, // Default since lead_time doesn't exist
      demand_zone: ['default'],
      upstream_nodes: [],
      downstream_nodes: []
    }));

    // Calculate total network stock
    const totalStock = nodes.reduce((sum, node) => sum + node.current_stock, 0);

    // Generate transfer rules (simplified)
    const transferRules: TransferRule[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        transferRules.push({
          from_node: nodes[i].node_id,
          to_node: nodes[j].node_id,
          transfer_cost: 50, // Fixed cost for demo
          transfer_time: 2, // 2 days
          min_transfer_quantity: 10,
          max_transfer_quantity: Math.min(nodes[i].current_stock, nodes[j].capacity)
        });
      }
    }

    // Generate optimal distribution plan
    const distributionPlan = await this.calculateOptimalDistribution(nodes, product_id);

    return {
      product_id,
      nodes,
      transfer_rules: transferRules,
      total_network_stock: totalStock,
      optimal_distribution: distributionPlan
    };
  }

  /**
   * Calculate optimal inventory distribution across nodes
   */
  private static async calculateOptimalDistribution(
    nodes: InventoryNode[],
    product_id: string
  ): Promise<DistributionPlan[]> {
    // Get demand forecasts for each location
    const { data: forecastData } = await supabase
      .from('forecast_data')
      .select('*')
      .eq('product_id', product_id)
      .gte('postdate', new Date().toISOString().split('T')[0]);

    const plans: DistributionPlan[] = [];

    for (const node of nodes) {
      // Calculate expected demand for this node's zone
      const nodeDemand = forecastData?.filter(f => 
        node.demand_zone.includes(f.location_id || 'unknown')
      ) || [];

      const avgDailyDemand = nodeDemand.length > 0 ?
        nodeDemand.reduce((sum, f) => sum + (f.forecast || 0), 0) / nodeDemand.length :
        node.current_stock / 30; // Estimate

      // Calculate recommended levels
      const recommendedStock = Math.min(
        avgDailyDemand * 30, // 30 days of demand
        node.capacity * 0.8 // 80% of capacity
      );

      const reorderPoint = avgDailyDemand * (node.lead_time_to_replenish + 5); // Lead time + safety buffer

      // Generate transfer recommendations if stock is imbalanced
      const transferRecommendations: TransferRecommendation[] = [];
      if (node.current_stock < recommendedStock * 0.5) {
        // Node needs stock
        const deficit = recommendedStock - node.current_stock;
        const sourceNode = nodes.find(n => 
          n.node_id !== node.node_id && 
          n.current_stock > recommendedStock * 1.2
        );

        if (sourceNode) {
          transferRecommendations.push({
            from_node: sourceNode.node_id,
            to_node: node.node_id,
            quantity: Math.min(deficit, sourceNode.current_stock * 0.2),
            urgency: node.current_stock < reorderPoint ? 'critical' : 'high',
            expected_benefit: deficit * 0.1 // Estimated benefit
          });
        }
      }

      plans.push({
        node_id: node.node_id,
        recommended_stock_level: Math.round(recommendedStock),
        reorder_point: Math.round(reorderPoint),
        max_stock_level: Math.round(node.capacity * 0.9),
        transfer_recommendations: transferRecommendations
      });
    }

    return plans;
  }
}