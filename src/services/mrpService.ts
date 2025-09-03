import { supabase } from '@/integrations/supabase/client';

export interface MRPPlan {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_type: 'MRP' | 'DRP' | 'Manual';
  planning_horizon_weeks: number;
  time_bucket: 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'active' | 'archived' | 'running';
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
  parameters?: any;
}

export interface DemandExplosionResult {
  id: string;
  plan_id: string;
  product_id: string;
  location_node_id: string;
  week_start_date: string;
  week_end_date: string;
  week_number: number;
  year: number;
  beginning_inventory: number;
  gross_requirements: number;
  scheduled_receipts: number;
  projected_available: number;
  net_requirements: number;
  planned_order_receipts: number;
  planned_order_releases: number;
  safety_stock: number;
  reorder_point: number;
  lot_size?: number;
  lead_time_offset?: number;
  firm_planned_orders?: number;
}

export interface PurchaseOrderRecommendation {
  id: string;
  plan_id: string;
  recommendation_id: string;
  product_id: string;
  location_node_id: string;
  supplier_id?: string;
  supplier_name?: string;
  week_start_date: string;
  week_end_date: string;
  week_number: number;
  year: number;
  recommended_quantity: number;
  minimum_order_quantity?: number;
  order_multiple?: number;
  final_order_quantity?: number;
  unit_cost?: number;
  total_value?: number;
  lead_time_days?: number;
  recommended_order_date?: string;
  expected_delivery_date?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'modified' | 'converted';
  approval_threshold_exceeded?: boolean;
  notes?: string;
}

export interface PlanningException {
  id: string;
  plan_id: string;
  exception_id: string;
  exception_type: 'stockout' | 'excess_inventory' | 'below_safety_stock' | 'order_urgency' | 'forecast_deviation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  product_id: string;
  location_node_id: string;
  week_start_date?: string;
  exception_date?: string;
  current_inventory?: number;
  projected_inventory?: number;
  safety_stock?: number;
  reorder_point?: number;
  projected_demand?: number;
  projected_supply?: number;
  shortage_quantity?: number;
  excess_quantity?: number;
  recommended_action?: string;
  resolution_status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  resolution_notes?: string;
}

export interface MRPParameters {
  id: string;
  product_id: string;
  location_node_id: string;
  safety_stock_method: 'statistical' | 'fixed' | 'lead_time_based' | 'percentage';
  safety_stock_value?: number;
  safety_stock_days?: number;
  service_level?: number;
  lot_sizing_rule: 'lot_for_lot' | 'fixed_quantity' | 'min_max' | 'economic_order_quantity' | 'periods_of_supply';
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  order_multiple?: number;
  lead_time_days?: number;
  planning_time_fence_days?: number;
  demand_time_fence_days?: number;
  supplier_id?: string;
  preferred_supplier?: string;
  unit_cost?: number;
  carrying_cost_percentage?: number;
  ordering_cost?: number;
  abc_classification?: 'A' | 'B' | 'C';
  xyz_classification?: 'X' | 'Y' | 'Z';
  active: boolean;
}

export class MRPService {
  /**
   * Create a new MRP plan
   */
  static async createPlan(plan: Partial<MRPPlan>): Promise<MRPPlan> {
    const { data: user } = await supabase.auth.getUser();
    
    const planData = {
      plan_id: `MRP-${Date.now()}`,
      plan_name: plan.plan_name || 'New MRP Plan',
      plan_type: plan.plan_type || 'MRP',
      planning_horizon_weeks: plan.planning_horizon_weeks || 12,
      time_bucket: plan.time_bucket || 'weekly',
      status: 'draft',
      created_by: user?.user?.id,
      parameters: plan.parameters || {}
    };

    const { data, error } = await supabase
      .schema('m8_schema')
      .from('replenishment_plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all MRP plans
   */
  static async getPlans(): Promise<MRPPlan[]> {
    const { data, error } = await supabase
      .schema('m8_schema')
      .from('replenishment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active MRP plan
   */
  static async getActivePlan(): Promise<MRPPlan | null> {
    const { data, error } = await supabase
      .schema('m8_schema')
      .from('replenishment_plans')
      .select('*')
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Run MRP calculation for a plan
   */
  static async runMRPCalculation(planId: string, filters?: {
    product_ids?: string[];
    location_node_ids?: string[];
  }): Promise<void> {
    try {
      // Update plan status to running
      await supabase
        .schema('m8_schema')
        .from('replenishment_plans')
        .update({ 
          status: 'running',
          last_run_at: new Date().toISOString()
        })
        .eq('id', planId);

      // Get products and locations to process
      let productsQuery = supabase
        .schema('m8_schema')
        .from('products')
        .select('product_id');

      if (filters?.product_ids?.length) {
        productsQuery = productsQuery.in('product_id', filters.product_ids);
      }

      const { data: products } = await productsQuery;

      let locationsQuery = supabase
        .schema('m8_schema')
        .from('locations')
        .select('location_node_id');

      if (filters?.location_node_ids?.length) {
        locationsQuery = locationsQuery.in('location_node_id', filters.location_node_ids);
      }

      const { data: locations } = await locationsQuery;

      // Process each product-location combination
      for (const product of products || []) {
        for (const location of locations || []) {
          await this.calculateMRPForItem(planId, product.product_id, location.location_node_id);
        }
      }

      // Generate purchase order recommendations
      await this.generatePurchaseOrderRecommendations(planId);

      // Identify planning exceptions
      await this.identifyPlanningExceptions(planId);

      // Update plan status to active
      await supabase
        .schema('m8_schema')
        .from('replenishment_plans')
        .update({ 
          status: 'active',
          next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
        })
        .eq('id', planId);

    } catch (error) {
      // Update plan status to draft on error
      await supabase
        .schema('m8_schema')
        .from('replenishment_plans')
        .update({ status: 'draft' })
        .eq('id', planId);
      
      throw error;
    }
  }

  /**
   * Calculate MRP for a specific product-location
   */
  private static async calculateMRPForItem(
    planId: string,
    productId: string,
    locationId: string
  ): Promise<void> {
    // Call the database function to calculate MRP explosion
    const { error } = await supabase.rpc('calculate_mrp_explosion', {
      p_plan_id: planId,
      p_product_id: productId,
      p_location_node_id: locationId
    });

    if (error) {
      console.error(`Error calculating MRP for ${productId} at ${locationId}:`, error);
    }
  }

  /**
   * Get MRP explosion results
   */
  static async getMRPExplosionResults(
    planId: string,
    filters?: {
      product_id?: string;
      location_node_id?: string;
      week_start?: string;
      week_end?: string;
    }
  ): Promise<DemandExplosionResult[]> {
    let query = supabase
      .schema('m8_schema')
      .from('demand_explosion_results')
      .select('*')
      .eq('plan_id', planId);

    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    if (filters?.location_node_id) {
      query = query.eq('location_node_id', filters.location_node_id);
    }
    if (filters?.week_start) {
      query = query.gte('week_start_date', filters.week_start);
    }
    if (filters?.week_end) {
      query = query.lte('week_end_date', filters.week_end);
    }

    const { data, error } = await query
      .order('product_id')
      .order('location_node_id')
      .order('week_start_date');

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate purchase order recommendations from MRP results
   */
  private static async generatePurchaseOrderRecommendations(planId: string): Promise<void> {
    // Get MRP results with planned order receipts > 0
    const { data: mrpResults } = await supabase
      .schema('m8_schema')
      .from('demand_explosion_results')
      .select('*')
      .eq('plan_id', planId)
      .gt('planned_order_receipts', 0);

    for (const result of mrpResults || []) {
      // Get MRP parameters for the product-location
      const { data: params } = await supabase
        .schema('m8_schema')
        .from('mrp_parameters')
        .select('*')
        .eq('product_id', result.product_id)
        .eq('location_node_id', result.location_node_id)
        .single();

      // Calculate order date considering lead time
      const orderDate = new Date(result.week_start_date);
      orderDate.setDate(orderDate.getDate() - (params?.lead_time_days || 14));

      // Calculate delivery date
      const deliveryDate = new Date(result.week_start_date);

      // Create recommendation
      const recommendation = {
        plan_id: planId,
        recommendation_id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: result.product_id,
        location_node_id: result.location_node_id,
        supplier_id: params?.supplier_id,
        supplier_name: params?.preferred_supplier,
        week_start_date: result.week_start_date,
        week_end_date: result.week_end_date,
        week_number: result.week_number,
        year: result.year,
        recommended_quantity: result.planned_order_receipts,
        minimum_order_quantity: params?.minimum_order_quantity,
        order_multiple: params?.order_multiple,
        final_order_quantity: result.planned_order_receipts,
        unit_cost: params?.unit_cost,
        total_value: result.planned_order_receipts * (params?.unit_cost || 0),
        lead_time_days: params?.lead_time_days,
        recommended_order_date: orderDate.toISOString().split('T')[0],
        expected_delivery_date: deliveryDate.toISOString().split('T')[0],
        approval_status: 'pending',
        approval_threshold_exceeded: (result.planned_order_receipts * (params?.unit_cost || 0)) > 10000
      };

      await supabase
        .schema('m8_schema')
        .from('purchase_order_recommendations')
        .insert(recommendation);
    }
  }

  /**
   * Identify planning exceptions
   */
  private static async identifyPlanningExceptions(planId: string): Promise<void> {
    // Get MRP results
    const { data: mrpResults } = await supabase
      .schema('m8_schema')
      .from('demand_explosion_results')
      .select('*')
      .eq('plan_id', planId);

    for (const result of mrpResults || []) {
      const exceptions: Partial<PlanningException>[] = [];

      // Check for stockout
      if (result.projected_available < 0) {
        exceptions.push({
          plan_id: planId,
          exception_id: `EXC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          exception_type: 'stockout',
          severity: 'critical',
          product_id: result.product_id,
          location_node_id: result.location_node_id,
          week_start_date: result.week_start_date,
          exception_date: result.week_start_date,
          current_inventory: result.beginning_inventory,
          projected_inventory: result.projected_available,
          safety_stock: result.safety_stock,
          projected_demand: result.gross_requirements,
          shortage_quantity: Math.abs(result.projected_available),
          recommended_action: `Expedite order for ${Math.abs(result.projected_available)} units`,
          resolution_status: 'open'
        });
      }
      
      // Check for below safety stock
      else if (result.projected_available < result.safety_stock) {
        exceptions.push({
          plan_id: planId,
          exception_id: `EXC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          exception_type: 'below_safety_stock',
          severity: 'high',
          product_id: result.product_id,
          location_node_id: result.location_node_id,
          week_start_date: result.week_start_date,
          exception_date: result.week_start_date,
          current_inventory: result.beginning_inventory,
          projected_inventory: result.projected_available,
          safety_stock: result.safety_stock,
          projected_demand: result.gross_requirements,
          shortage_quantity: result.safety_stock - result.projected_available,
          recommended_action: `Review safety stock levels and consider placing order`,
          resolution_status: 'open'
        });
      }
      
      // Check for excess inventory (e.g., > 3x safety stock)
      else if (result.projected_available > result.safety_stock * 3) {
        exceptions.push({
          plan_id: planId,
          exception_id: `EXC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          exception_type: 'excess_inventory',
          severity: 'low',
          product_id: result.product_id,
          location_node_id: result.location_node_id,
          week_start_date: result.week_start_date,
          exception_date: result.week_start_date,
          current_inventory: result.beginning_inventory,
          projected_inventory: result.projected_available,
          safety_stock: result.safety_stock,
          excess_quantity: result.projected_available - (result.safety_stock * 2),
          recommended_action: `Consider reducing orders or redistributing inventory`,
          resolution_status: 'open'
        });
      }

      // Insert exceptions
      for (const exception of exceptions) {
        await supabase
          .schema('m8_schema')
          .from('planning_exceptions')
          .insert(exception);
      }
    }
  }

  /**
   * Get purchase order recommendations
   */
  static async getPurchaseOrderRecommendations(
    planId: string,
    filters?: {
      product_id?: string;
      location_node_id?: string;
      supplier_id?: string;
      approval_status?: string;
      week_start?: string;
    }
  ): Promise<PurchaseOrderRecommendation[]> {
    let query = supabase
      .schema('m8_schema')
      .from('purchase_order_recommendations')
      .select('*')
      .eq('plan_id', planId);

    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    if (filters?.location_node_id) {
      query = query.eq('location_node_id', filters.location_node_id);
    }
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters?.approval_status) {
      query = query.eq('approval_status', filters.approval_status);
    }
    if (filters?.week_start) {
      query = query.gte('week_start_date', filters.week_start);
    }

    const { data, error } = await query
      .order('recommended_order_date')
      .order('product_id');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get planning exceptions
   */
  static async getPlanningExceptions(
    planId: string,
    filters?: {
      product_id?: string;
      location_node_id?: string;
      exception_type?: string;
      severity?: string;
      resolution_status?: string;
    }
  ): Promise<PlanningException[]> {
    let query = supabase
      .schema('m8_schema')
      .from('planning_exceptions')
      .select('*')
      .eq('plan_id', planId);

    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    if (filters?.location_node_id) {
      query = query.eq('location_node_id', filters.location_node_id);
    }
    if (filters?.exception_type) {
      query = query.eq('exception_type', filters.exception_type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.resolution_status) {
      query = query.eq('resolution_status', filters.resolution_status);
    }

    const { data, error } = await query
      .order('severity')
      .order('exception_date');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update purchase order recommendation
   */
  static async updateRecommendation(
    id: string,
    updates: Partial<PurchaseOrderRecommendation>
  ): Promise<void> {
    const { error } = await supabase
      .schema('m8_schema')
      .from('purchase_order_recommendations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Approve purchase order recommendation
   */
  static async approveRecommendation(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .schema('m8_schema')
      .from('purchase_order_recommendations')
      .update({
        approval_status: 'approved',
        approved_by: user?.user?.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Update planning exception
   */
  static async updateException(
    id: string,
    updates: Partial<PlanningException>
  ): Promise<void> {
    const { error } = await supabase
      .schema('m8_schema')
      .from('planning_exceptions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Resolve planning exception
   */
  static async resolveException(id: string, notes: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .schema('m8_schema')
      .from('planning_exceptions')
      .update({
        resolution_status: 'resolved',
        resolved_by: user?.user?.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get or create MRP parameters for a product-location
   */
  static async getMRPParameters(
    productId: string,
    locationId: string
  ): Promise<MRPParameters | null> {
    const { data, error } = await supabase
      .schema('m8_schema')
      .from('mrp_parameters')
      .select('*')
      .eq('product_id', productId)
      .eq('location_node_id', locationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update MRP parameters
   */
  static async updateMRPParameters(
    productId: string,
    locationId: string,
    parameters: Partial<MRPParameters>
  ): Promise<void> {
    const { error } = await supabase
      .schema('m8_schema')
      .from('mrp_parameters')
      .upsert({
        product_id: productId,
        location_node_id: locationId,
        ...parameters
      }, {
        onConflict: 'product_id,location_node_id'
      });

    if (error) throw error;
  }
}