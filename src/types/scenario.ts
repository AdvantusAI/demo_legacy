// File: src/types/scenario.ts
export interface ScenarioDefinition {
  id?: string;
  scenario_name: string;
  scenario_type: ScenarioType;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  parameters: ScenarioParameters;
  scope: ScenarioScope;
  is_template?: boolean;
  template_name?: string;
  description?: string;
  results?: any;
}

export type ScenarioType = 
  | 'demand' 
  | 'supply' 
  | 'cost' 
  | 'service' 
  | 'capacity' 
  | 'custom';

export interface ScenarioParameters {
  demand_multiplier?: number;
  lead_time_adjustment?: number;
  cost_change_percentage?: number;
  vendor_availability?: Record<string, boolean>;
  service_level_target?: number;
  capacity_constraints?: Record<string, number>;
  seasonality_adjustment?: {
    peak_multiplier: number;
    normal_multiplier: number;
    low_multiplier: number;
  };
  promotional_impact?: {
    event_type: string;
    duration_days: number;
    expected_lift: number;
  };
}

export interface ScenarioScope {
  product_ids?: string[];
  warehouse_ids?: string[];
  customer_ids?: string[];
  time_horizon_months: number;
}

export interface ScenarioExecution {
  id?: string;
  scenario_id: string;
  execution_timestamp?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  execution_time_seconds?: number;
  baseline_snapshot?: any;
  error_message?: string;
}

export interface ScenarioResults {
  id?: string;
  scenario_execution_id: string;
  impact_summary: {
    total_order_count_change: number;
    total_value_change: number;
    average_lead_time_change: number;
    service_level_impact: number;
    stockout_risk_change: number;
  };
  detailed_changes: any[];
  created_at?: string;
}