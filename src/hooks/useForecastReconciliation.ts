import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ForecastReconciliationData {
  id: string;
  product_id: string;
  location_id: string;
  channel_partner_id?: string;
  forecast_period: string;
  sell_in_forecast: number;
  sell_out_forecast: number;
  actual_sell_in?: number;
  actual_sell_out?: number;
  sell_in_variance?: number;
  sell_out_variance?: number;
  sell_in_accuracy_percentage?: number;
  sell_out_accuracy_percentage?: number;
  gap_analysis?: any;
  reconciliation_status: string;
  action_items?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReconciliationFilters {
  product_id?: string;
  location_id?: string;
  channel_partner_id?: string;
  period_start?: string;
  period_end?: string;
  reconciliation_status?: string;
  min_variance?: number;
}

export interface GapAnalysis {
  total_gap: number;
  gap_percentage: number;
  primary_factors: string[];
  recommended_actions: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export function useForecastReconciliation() {
  const [loading, setLoading] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<ForecastReconciliationData[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis[]>([]);
  const { toast } = useToast();

  const fetchReconciliationData = useCallback(async (filters: ReconciliationFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('forecast_reconciliation')
        .select('*');

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters.channel_partner_id) {
        query = query.eq('channel_partner_id', filters.channel_partner_id);
      }
      if (filters.period_start) {
        query = query.gte('forecast_period', filters.period_start);
      }
      if (filters.period_end) {
        query = query.lte('forecast_period', filters.period_end);
      }
      if (filters.reconciliation_status) {
        query = query.eq('reconciliation_status', filters.reconciliation_status);
      }
      if (filters.min_variance) {
        query = query.or(`sell_in_variance.gte.${filters.min_variance},sell_out_variance.gte.${filters.min_variance}`);
      }

      const { data, error } = await query.order('forecast_period', { ascending: false });

      if (error) throw error;

      setReconciliationData(data || []);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reconciliation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateReconciliationRecord = useCallback(async (
    id: string, 
    updates: Partial<ForecastReconciliationData>
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('forecast_reconciliation')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reconciliation record updated successfully",
      });

      // Refresh data
      await fetchReconciliationData();
      return true;
    } catch (error) {
      console.error('Error updating reconciliation record:', error);
      toast({
        title: "Error",
        description: "Failed to update reconciliation record",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchReconciliationData]);

  const addActionItem = useCallback(async (id: string, actionItem: string) => {
    const record = reconciliationData.find(r => r.id === id);
    if (!record) return false;

    const updatedActionItems = [...(record.action_items || []), actionItem];
    return await updateReconciliationRecord(id, { action_items: updatedActionItems });
  }, [reconciliationData, updateReconciliationRecord]);

  const removeActionItem = useCallback(async (id: string, actionItemIndex: number) => {
    const record = reconciliationData.find(r => r.id === id);
    if (!record) return false;

    const updatedActionItems = (record.action_items || []).filter((_, index) => index !== actionItemIndex);
    return await updateReconciliationRecord(id, { action_items: updatedActionItems });
  }, [reconciliationData, updateReconciliationRecord]);

  const calculateGapAnalysis = useCallback(() => {
    const analysis: GapAnalysis[] = reconciliationData.map(record => {
      const sellInGap = Math.abs((record.actual_sell_in || 0) - record.sell_in_forecast);
      const sellOutGap = Math.abs((record.actual_sell_out || 0) - record.sell_out_forecast);
      const totalGap = sellInGap + sellOutGap;
      const totalForecast = record.sell_in_forecast + record.sell_out_forecast;
      const gapPercentage = totalForecast > 0 ? (totalGap / totalForecast) * 100 : 0;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (gapPercentage > 50) riskLevel = 'critical';
      else if (gapPercentage > 25) riskLevel = 'high';
      else if (gapPercentage > 10) riskLevel = 'medium';

      const primaryFactors: string[] = [];
      const recommendedActions: string[] = [];

      if (sellInGap > sellInGap * 0.2) {
        primaryFactors.push('Sell-In Variance');
        recommendedActions.push('Review sell-in forecasting methodology');
      }
      if (sellOutGap > sellOutGap * 0.2) {
        primaryFactors.push('Sell-Out Variance');
        recommendedActions.push('Improve channel partner data collection');
      }
      if (gapPercentage > 25) {
        recommendedActions.push('Implement more frequent reconciliation cycles');
      }

      return {
        total_gap: totalGap,
        gap_percentage: gapPercentage,
        primary_factors: primaryFactors,
        recommended_actions: recommendedActions,
        risk_level: riskLevel,
      };
    });

    setGapAnalysis(analysis);
  }, [reconciliationData]);

  const refreshVarianceCalculations = useCallback(async () => {
    setLoading(true);
    try {
      const updates = reconciliationData.map(async (record) => {
        if (record.actual_sell_in !== undefined && record.actual_sell_out !== undefined) {
          const sellInVariance = record.actual_sell_in - record.sell_in_forecast;
          const sellOutVariance = record.actual_sell_out - record.sell_out_forecast;
          const sellInAccuracy = record.sell_in_forecast > 0 
            ? ((record.sell_in_forecast - Math.abs(sellInVariance)) / record.sell_in_forecast) * 100 
            : 0;
          const sellOutAccuracy = record.sell_out_forecast > 0 
            ? ((record.sell_out_forecast - Math.abs(sellOutVariance)) / record.sell_out_forecast) * 100 
            : 0;

          return supabase
            .from('forecast_reconciliation')
            .update({
              sell_in_variance: sellInVariance,
              sell_out_variance: sellOutVariance,
              sell_in_accuracy_percentage: Math.max(0, sellInAccuracy),
              sell_out_accuracy_percentage: Math.max(0, sellOutAccuracy),
              updated_at: new Date().toISOString(),
            })
            .eq('id', record.id);
        }
      });

      await Promise.all(updates.filter(Boolean));
      
      toast({
        title: "Success",
        description: "Variance calculations updated successfully",
      });

      await fetchReconciliationData();
    } catch (error) {
      console.error('Error refreshing variance calculations:', error);
      toast({
        title: "Error",
        description: "Failed to refresh variance calculations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [reconciliationData, toast, fetchReconciliationData]);

  return {
    loading,
    reconciliationData,
    gapAnalysis,
    fetchReconciliationData,
    updateReconciliationRecord,
    addActionItem,
    removeActionItem,
    calculateGapAnalysis,
    refreshVarianceCalculations,
  };
}