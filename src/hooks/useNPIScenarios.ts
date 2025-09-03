import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type NPIScenario = Database['public']['Tables']['npi_forecast_scenarios']['Row'];
type NPIScenarioInsert = Database['public']['Tables']['npi_forecast_scenarios']['Insert'];
type NPIScenarioUpdate = Database['public']['Tables']['npi_forecast_scenarios']['Update'];

export interface NPIScenarioWithProduct extends NPIScenario {
  npi_product?: {
    id: string;
    product_id: string | null;
    npi_status: string;
    launch_date: string | null;
    product?: {
      product_name: string;
    };
  };
}

export interface ScenarioFilters {
  npi_product_id?: string;
  scenario_type?: string;
  postdate_from?: string;
  postdate_to?: string;
  confidence_level?: string;
}

export const useNPIScenarios = (filters: ScenarioFilters = {}) => {
  const [scenarios, setScenarios] = useState<NPIScenarioWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('npi_forecast_scenarios')
        .select(`
          *,
          npi_product:npi_products!npi_forecast_scenarios_npi_product_id_fkey(
            id,
            product_id,
            npi_status,
            launch_date,
            product:products!npi_products_product_id_fkey(
              product_name
            )
          )
        `)
        .order('postdate', { ascending: true });

      // Apply filters
      if (filters.npi_product_id) {
        query = query.eq('npi_product_id', filters.npi_product_id);
      }
      if (filters.scenario_type) {
        query = query.eq('scenario_type', filters.scenario_type);
      }
      if (filters.postdate_from) {
        query = query.gte('postdate', filters.postdate_from);
      }
      if (filters.postdate_to) {
        query = query.lte('postdate', filters.postdate_to);
      }
      if (filters.confidence_level) {
        query = query.eq('confidence_level', filters.confidence_level);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setScenarios(data || []);
    } catch (err) {
      console.error('Error fetching NPI scenarios:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NPI scenarios');
      toast.error('Error loading NPI scenarios');
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async (scenario: NPIScenarioInsert) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_forecast_scenarios')
        .insert(scenario)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI scenario created successfully');
      await fetchScenarios(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating NPI scenario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NPI scenario';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = async (id: string, updates: NPIScenarioUpdate) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_forecast_scenarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI scenario updated successfully');
      await fetchScenarios(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating NPI scenario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update NPI scenario';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('npi_forecast_scenarios')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('NPI scenario deleted successfully');
      await fetchScenarios(); // Refresh the list
    } catch (err) {
      console.error('Error deleting NPI scenario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete NPI scenario';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkCreateScenarios = async (scenarios: NPIScenarioInsert[]) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_forecast_scenarios')
        .insert(scenarios)
        .select();

      if (error) {
        throw error;
      }

      toast.success(`${scenarios.length} NPI scenarios created successfully`);
      await fetchScenarios(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating bulk NPI scenarios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NPI scenarios';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getScenariosByProduct = async (npiProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('npi_forecast_scenarios')
        .select('*')
        .eq('npi_product_id', npiProductId)
        .order('postdate', { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching scenarios by product:', err);
      return [];
    }
  };

  const getScenarioComparison = async (npiProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('npi_forecast_scenarios')
        .select('*')
        .eq('npi_product_id', npiProductId)
        .order('postdate', { ascending: true });

      if (error) {
        throw error;
      }

      // Group scenarios by date for comparison
      const comparison: { [date: string]: { [scenario: string]: number } } = {};
      data?.forEach(scenario => {
        if (!comparison[scenario.postdate]) {
          comparison[scenario.postdate] = {};
        }
        comparison[scenario.postdate][scenario.scenario_type] = scenario.forecast_value;
      });

      return comparison;
    } catch (err) {
      console.error('Error fetching scenario comparison:', err);
      return {};
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [JSON.stringify(filters)]);

  return {
    scenarios,
    loading,
    error,
    fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
    bulkCreateScenarios,
    getScenariosByProduct,
    getScenarioComparison,
  };
};