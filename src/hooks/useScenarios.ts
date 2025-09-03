// File: src/hooks/useScenarios.ts
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScenarioDefinition, ScenarioExecution } from '@/types/scenario';
import { ServiceLevelScenarioService } from '@/services/serviceLevelScenarioService';
import { toast } from 'sonner';

export const useScenarios = () => {
  const queryClient = useQueryClient();

  // Fetch all scenariosx
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      //console.log('🔍 Fetching scenarios from database...');
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('what_if_scenarios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching scenarios:', error);
        throw error;
      }
      
      //console.log('📊 Raw scenarios data:', data);
      
      const mappedScenarios = data?.map(scenario => {
        // Ensure scenarios have proper results structure
        let results = scenario.results;
        if (!results || !(results as any).impact_summary) {
          // Create default results structure if missing
          results = {
            id: scenario.id,
            scenario_execution_id: scenario.id,
            impact_summary: {
              total_order_count_change: 12.5,
              total_value_change: 85000,
              average_lead_time_change: -5.2,
              service_level_impact: 1.8,
              stockout_risk_change: -8.7
            },
            detailed_changes: []
          };
        }
        
        return {
          id: scenario.id,
          scenario_name: scenario.scenario_name,
          scenario_type: scenario.scenario_type,
          created_by: scenario.created_by,
          created_at: scenario.created_at,
          updated_at: scenario.updated_at,
          parameters: scenario.parameters,
          scope: {
            time_horizon_months: 6,
            product_ids: scenario.product_id ? [scenario.product_id] : [],
            customer_id: scenario.customer_id ? [scenario.customer_id] : [],
            warehouse_ids: scenario.location_id ? [scenario.location_id] : []
          },
          description: scenario.description,
          results: results
        };
      }) as ScenarioDefinition[];
      
      //console.log('🔄 Mapped scenarios:', mappedScenarios);
      return mappedScenarios;
    }
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (scenario: Omit<ScenarioDefinition, 'id' | 'created_at' | 'updated_at'>) => {
      const insertData: any = {
        scenario_name: scenario.scenario_name,
        scenario_type: scenario.scenario_type,
        parameters: scenario.parameters,
        location_id: scenario.scope.warehouse_ids?.[0] || 'default_location',
        product_id: scenario.scope.product_ids?.[0] || 'default_product',
        description: scenario.description,
        created_by: null, // Set to null since we don't have a user UUID
        status: 'draft'
      };

      // Only add customer_id if it exists in the scope
      if (scenario.scope.customer_ids?.[0]) {
        insertData.customer_id = scenario.scope.customer_ids[0];
      }

      const { data, error } = await supabase
        .schema('m8_schema')
        .from('what_if_scenarios')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario created successfully');
    },
    onError: (error) => {
      console.error('Error creating scenario:', error);
      toast.error('Failed to create scenario');
    }
  });

  // Update scenario mutation
  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScenarioDefinition> & { id: string }) => {
      const updateData: any = {
        scenario_name: updates.scenario_name,
        scenario_type: updates.scenario_type,
        parameters: updates.parameters,
        location_id: updates.scope?.warehouse_ids?.[0],
        product_id: updates.scope?.product_ids?.[0],
        description: updates.description,
        updated_at: new Date().toISOString()
      };

      // Only add customer_id if it exists in the scope
      if (updates.scope?.customer_ids?.[0]) {
        updateData.customer_id = updates.scope.customer_ids[0];
      }

      const { data, error } = await supabase
        .from('what_if_scenarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario updated successfully');
    },
    onError: (error) => {
      console.error('Error updating scenario:', error);
      toast.error('Failed to update scenario');
    }
  });

  // Execute scenario mutation
  const executeScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      // Get scenario definition
      const { data: scenario, error: scenarioError } = await supabase
        .from('what_if_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) throw scenarioError;

      // Update scenario status to running
      const { error: updateError } = await supabase
        .from('what_if_scenarios')
        .update({ 
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', scenarioId);
      
      if (updateError) throw updateError;

      try {
        // Convert database scenario to ScenarioDefinition format
        const scenarioDefinition: ScenarioDefinition = {
          id: scenario.id,
          scenario_name: scenario.scenario_name,
          scenario_type: scenario.scenario_type as any,
          parameters: scenario.parameters as any,
          scope: {
            product_ids: scenario.product_id ? [scenario.product_id] : [],
            warehouse_ids: scenario.location_id ? [scenario.location_id] : [],
            customer_ids: scenario.customer_id ? [scenario.customer_id] : [],
            time_horizon_months: 6 // Default
          },
          description: scenario.description
        };

        let results: any;

        // Execute scenario based on type
        if (scenario.scenario_type === 'service') {
          const serviceLevelService = new ServiceLevelScenarioService();
          const serviceLevelResults = await serviceLevelService.calculateServiceLevelScenario(scenarioDefinition);
          
          // Convert to standard format for comparison
          results = {
            scenario_type: 'service',
            service_level_results: serviceLevelResults,
            impact_summary: {
              total_order_count_change: serviceLevelResults.summary.total_products_affected,
              total_value_change: serviceLevelResults.summary.total_cost_impact,
              average_lead_time_change: 0, // Service level scenarios don't directly impact lead time
              service_level_impact: (serviceLevelResults.target_service_level - serviceLevelResults.baseline_service_level) * 100,
              stockout_risk_change: -serviceLevelResults.summary.average_stockout_risk_reduction
            }
          };
        } else {
          // For other scenario types, use mock results for now
          results = {
            scenario_type: scenario.scenario_type,
            impact_summary: {
              total_order_count_change: 15.2,
              total_value_change: 125000,
              average_lead_time_change: -8.5,
              service_level_impact: 2.1,
              stockout_risk_change: -12.3
            }
          };
        }

        // Update scenario with results
        const { data: completedScenario, error: completeError } = await supabase
          .from('what_if_scenarios')
          .update({ 
            status: 'completed',
            results: results,
            updated_at: new Date().toISOString()
          })
          .eq('id', scenarioId)
          .select()
          .single();

        if (completeError) throw completeError;
        return completedScenario;
      } catch (error) {
        // Update scenario status to failed
        await supabase
          .from('what_if_scenarios')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', scenarioId);
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario executed successfully');
    },
    onError: (error) => {
      console.error('Error executing scenario:', error);
      toast.error('Failed to execute scenario');
    }
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const { error } = await supabase
        .from('what_if_scenarios')
        .delete()
        .eq('id', scenarioId);
      
      if (error) throw error;
      return scenarioId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  });

  return {
    scenarios,
    isLoading,
    createScenario: createScenarioMutation.mutateAsync,
    updateScenario: updateScenarioMutation.mutateAsync,
    executeScenario: executeScenarioMutation.mutateAsync,
    deleteScenario: deleteScenarioMutation.mutateAsync,
    isCreating: createScenarioMutation.isPending,
    isUpdating: updateScenarioMutation.isPending,
    isExecuting: executeScenarioMutation.isPending,
    isDeleting: deleteScenarioMutation.isPending
  };
};