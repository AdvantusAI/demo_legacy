import { supabase } from '@/integrations/supabase/client';

export interface ExceptionSummary {
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_count: number;
  estimated_financial_impact: number;
}

export interface ExceptionDetail {
  id: string;
  exception_code: string;
  exception_type: string;
  severity_level: 'critical' | 'high' | 'medium' | 'low';
  alert_title: string;
  alert_description: string;
  alert_message: string;
  product_id: string;
  product_name: string;
  location_name: string;
  location_code: string;
  location_type: string;
  current_value: number;
  threshold_value: number;
  variance_percentage: number;
  current_stock: number;
  safety_stock_requirement: number;
  weekly_demand: number;
  scheduled_receipts: number;
  planned_receipts: number;
  days_of_supply: number;
  dynamic_safety_stock: number;
  demand_volatility: number;
  estimated_financial_impact: number;
  detected_date: string;
  first_detected_at: string;
  exception_status: string;
}

export interface ExceptionProjection {
  week: string;
  projected_stock: number;
  demand: number;
  receipts: number;
}

export interface ExceptionAction {
  action: 'URGENT_REORDER' | 'REORDER' | 'TRANSFER_OR_PROMOTION' | 'MONITOR';
  priority: number;
  description: string;
  recommended_quantity?: number;
  timeline: string;
}

export class ExceptionService {
  /**
   * Get dashboard summary KPIs
   */
  static async getDashboardSummary(): Promise<ExceptionSummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_alerts')
        .select('alert_severity, alert_type, current_value, threshold_value')
        .eq('processing_date', today)
        .eq('alert_status', 'active');

      if (error) throw error;

      const summary: ExceptionSummary = {
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        total_count: 0,
        estimated_financial_impact: 0
      };

      if (!data) return summary;

      data.forEach(alert => {
        summary.total_count++;
        
        switch (alert.alert_severity) {
          case 'critical':
            summary.critical_count++;
            break;
          case 'high':
            summary.high_count++;
            break;
          case 'medium':
            summary.medium_count++;
            break;
          case 'low':
            summary.low_count++;
            break;
        }

        // Calculate financial impact
        if (alert.alert_type === 'stockout_risk') {
          summary.estimated_financial_impact += 
            Math.abs(alert.current_value - alert.threshold_value) * 15.50;
        } else if (alert.alert_type === 'excess_inventory') {
          summary.estimated_financial_impact += 
            Math.abs(alert.current_value - alert.threshold_value) * 15.50 * 0.1;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get detailed exception list with full context
   */
  static async getExceptionList(filters?: {
    severity?: string;
    type?: string;
    product?: string;
    location?: string;
  }): Promise<ExceptionDetail[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Build the query for inventory alerts
      let query = (supabase as any)
        .schema('m8_schema')
        .from('inventory_alerts')
        .select(`
          *,
          supply_network_nodes!inner (
            node_name,
            node_code,
            location_code,
            node_name,
            address,
            city,
            state_province
          )
        `)
        .eq('processing_date', today)
        .eq('alert_status', 'active');

      // Apply filters
      if (filters?.severity) {
        query = query.eq('alert_severity', filters.severity);
      }
      if (filters?.type) {
        query = query.eq('alert_type', filters.type);
      }
      if (filters?.product) {
        query = query.eq('product_id', filters.product);
      }

      const { data: alertsData, error: alertsError } = await query
        .order('alert_severity', { ascending: true })
        .order('current_value', { ascending: true });

      if (alertsError) throw alertsError;
      if (!alertsData) return [];

      // Debug: Log the raw alerts data
      console.log('Raw alerts data:', alertsData);

      // Process and enrich the data
      const exceptions: ExceptionDetail[] = await Promise.all(
        alertsData.map(async (alert, index) => {
          // Manually fetch product name since join might not work
          const { data: productData } = await (supabase as any)
            .schema('m8_schema')
            .from('products')
            .select('product_name')
            .eq('product_id', alert.product_id)
            .single();

          // Debug: Log the alert data to see what we're getting
          console.log('Alert data:', {
            product_id: alert.product_id,
            product_name: productData?.product_name,
            context_data: alert.context_data
          });
          // Get inventory time phased plan data
          const { data: itpData } = await (supabase as any)
            .schema('m8_schema')
            .from('inventory_time_phased_plan')
            .select('*')
            .eq('product_id', alert.product_id)
            .eq('node_id', alert.node_id)
            .eq('time_bucket', today)
            .single();

          // Get dynamic safety stock data
          const { data: dssData } = await (supabase as any)
            .schema('m8_schema')
            .from('dynamic_safety_stock_plan')
            .select('*')
            .eq('product_id', alert.product_id)
            .eq('node_id', alert.node_id)
            .eq('time_bucket', today)
            .single();

          // Calculate days of supply
          let daysOfSupply = 999;
          if (itpData?.gross_requirements && itpData.gross_requirements > 0) {
            daysOfSupply = Math.round(
              (itpData.starting_balance / (itpData.gross_requirements / 7.0)) * 10
            ) / 10;
          }

          // Calculate financial impact
          let financialImpact = 100;
          if (alert.alert_type === 'stockout_risk') {
            financialImpact = Math.abs(alert.current_value - alert.threshold_value) * 15.50 * 7;
          } else if (alert.alert_type === 'excess_inventory') {
            financialImpact = Math.abs(alert.current_value - alert.threshold_value) * 15.50 * 0.02;
          }

          const exception: ExceptionDetail = {
            id: alert.id,
            exception_code: `EX${String(index + 1).padStart(3, '0')}`,
            exception_type: alert.alert_type,
            severity_level: alert.alert_severity,
            alert_title: alert.alert_title,
            alert_description: alert.alert_description,
            alert_message: alert.alert_message,
            product_id: alert.product_id,
            product_name: productData?.product_name || `Producto ${alert.product_id}`,
            location_name: alert.supply_network_nodes.node_name,
            location_code: alert.supply_network_nodes.location_code,
            location_type: alert.supply_network_nodes.node_name,
            current_value: alert.current_value,
            threshold_value: alert.threshold_value,
            variance_percentage: alert.variance_percentage,
            current_stock: itpData?.starting_balance || 0,
            safety_stock_requirement: itpData?.safety_stock_requirement || 0,
            weekly_demand: itpData?.gross_requirements || 0,
            scheduled_receipts: itpData?.scheduled_receipts || 0,
            planned_receipts: itpData?.planned_receipts || 0,
            days_of_supply: daysOfSupply,
            dynamic_safety_stock: dssData?.dynamic_safety_stock || 0,
            demand_volatility: dssData?.demand_coefficient_variation || 0,
            estimated_financial_impact: financialImpact,
            detected_date: alert.processing_date,
            first_detected_at: alert.first_detected_at,
            exception_status: alert.alert_status
          };

          return exception;
        })
      );

      return exceptions;
    } catch (error) {
      console.error('Error fetching exception list:', error);
      throw error;
    }
  }

  /**
   * Get exception details with projection
   */
  static async getExceptionDetails(exceptionId: string): Promise<{
    exception: ExceptionDetail;
    projection: ExceptionProjection[];
    recommended_action: ExceptionAction;
  } | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get the specific exception
      const { data: alertData, error: alertError } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_alerts')
        .select(`
          *,
          supply_network_nodes!inner (
            node_name,
            node_code,
            location_code,
            node_name
          )
        `)
        .eq('id', exceptionId)
        .single();

      if (alertError || !alertData) return null;

      // Manually fetch product name
      const { data: productData } = await (supabase as any)
        .schema('m8_schema')
        .from('products')
        .select('product_name')
        .eq('product_id', alertData.product_id)
        .single();

      // Get future projections
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 28); // 4 weeks projection
      
      const { data: projectionData } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_time_phased_plan')
        .select('time_bucket, ending_balance, gross_requirements, scheduled_receipts, planned_receipts')
        .eq('product_id', alertData.product_id)
        .eq('node_id', alertData.node_id)
        .gte('time_bucket', today)
        .lte('time_bucket', futureDate.toISOString().split('T')[0])
        .order('time_bucket', { ascending: true });

      const projection: ExceptionProjection[] = projectionData?.map(p => ({
        week: p.time_bucket,
        projected_stock: p.ending_balance,
        demand: p.gross_requirements,
        receipts: p.scheduled_receipts + p.planned_receipts
      })) || [];

      // Generate recommended action
      let recommendedAction: ExceptionAction;
      
      if (alertData.alert_type === 'stockout_risk' && alertData.current_value <= 1.5) {
        recommendedAction = {
          action: 'URGENT_REORDER',
          priority: 1,
          description: 'Crear orden de compra urgente',
          recommended_quantity: Math.max(
            (projectionData?.[0]?.gross_requirements || 0) * 4,
            (projectionData?.[0]?.safety_stock_requirement || 0) * 2
          ),
          timeline: 'Inmediato - dentro de 24 horas'
        };
      } else if (alertData.alert_type === 'stockout_risk' && alertData.current_value <= 4) {
        recommendedAction = {
          action: 'REORDER',
          priority: 2,
          description: 'Crear orden de compra estándar',
          recommended_quantity: (projectionData?.[0]?.gross_requirements || 0) * 6,
          timeline: 'Dentro de 3 días'
        };
      } else if (alertData.alert_type === 'excess_inventory') {
        recommendedAction = {
          action: 'TRANSFER_OR_PROMOTION',
          priority: 3,
          description: 'Transferir exceso o crear promoción',
          recommended_quantity: Math.abs(alertData.current_value - alertData.threshold_value),
          timeline: 'Dentro de 1 semana'
        };
      } else {
        recommendedAction = {
          action: 'MONITOR',
          priority: 4,
          description: 'Monitorear situación',
          timeline: 'Revisión semanal'
        };
      }

      // Build exception detail
      const exception: ExceptionDetail = {
        id: alertData.id,
        exception_code: `EX001`,
        exception_type: alertData.alert_type,
        severity_level: alertData.alert_severity,
        alert_title: alertData.alert_title,
        alert_description: alertData.alert_description,
        alert_message: alertData.alert_message,
        product_id: alertData.product_id,
        product_name: productData?.product_name || `Producto ${alertData.product_id}`,
        location_name: alertData.supply_network_nodes.node_name,
        location_code: alertData.supply_network_nodes.location_code,
        location_type: alertData.supply_network_nodes.node_name,
        current_value: alertData.current_value,
        threshold_value: alertData.threshold_value,
        variance_percentage: alertData.variance_percentage,
        current_stock: 0,
        safety_stock_requirement: 0,
        weekly_demand: 0,
        scheduled_receipts: 0,
        planned_receipts: 0,
        days_of_supply: 0,
        dynamic_safety_stock: 0,
        demand_volatility: 0,
        estimated_financial_impact: 0,
        detected_date: alertData.processing_date,
        first_detected_at: alertData.first_detected_at,
        exception_status: alertData.alert_status
      };

      return {
        exception,
        projection,
        recommended_action: recommendedAction
      };
    } catch (error) {
      console.error('Error fetching exception details:', error);
      throw error;
    }
  }

  /**
   * Update exception status
   */
  static async updateExceptionStatus(
    exceptionId: string, 
    status: 'resolved' | 'acknowledged' | 'in_progress',
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        alert_status: status
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      if (notes) {
        updateData.resolution_notes = notes;
      }

      const { error } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_alerts')
        .update(updateData)
        .eq('id', exceptionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating exception status:', error);
      throw error;
    }
  }
}