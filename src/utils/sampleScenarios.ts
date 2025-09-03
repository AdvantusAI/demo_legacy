import { supabase } from '@/integrations/supabase/client';

export const createSampleScenarios = async () => {
  const sampleScenarios = [
    {
      scenario_name: 'Escenario de Demanda Alta',
      scenario_type: 'forecast_adjustment',
      product_id: 'PROD_001',
      location_id: 'WH_001',
      description: 'Simulación de incremento del 20% en la demanda',
      parameters: { percentage: 20 },
      results: {
        id: '1',
        scenario_execution_id: '1',
        impact_summary: {
          total_order_count_change: 18.5,
          total_value_change: 145000,
          average_lead_time_change: -12.3,
          service_level_impact: 3.2,
          stockout_risk_change: -15.7
        },
        detailed_changes: []
      },
      status: 'completed'
    },
    {
      scenario_name: 'Escenario de Disrupción de Suministro',
      scenario_type: 'supply_disruption',
      product_id: 'PROD_002',
      location_id: 'WH_001',
      description: 'Simulación de reducción del 30% en la disponibilidad',
      parameters: { reduction: 30 },
      results: {
        id: '2',
        scenario_execution_id: '2',
        impact_summary: {
          total_order_count_change: -28.5,
          total_value_change: -95000,
          average_lead_time_change: 18.7,
          service_level_impact: -7.3,
          stockout_risk_change: 32.1
        },
        detailed_changes: []
      },
      status: 'completed'
    },
    {
      scenario_name: 'Escenario de Nivel de Servicio',
      scenario_type: 'service',
      product_id: 'PROD_003',
      location_id: 'WH_002',
      description: 'Optimización del nivel de servicio al 98%',
      parameters: { target_service_level: 0.98 },
      results: {
        id: '3',
        scenario_execution_id: '3',
        scenario_type: 'service',
        service_level_results: {
          target_service_level: 0.98,
          baseline_service_level: 0.95,
          summary: {
            total_products_affected: 45,
            total_inventory_increase: 1250,
            total_cost_impact: 45000,
            service_level_achievement_rate: 0.98,
            average_stockout_risk_reduction: 0.03
          }
        },
        impact_summary: {
          total_order_count_change: 12.8,
          total_value_change: 52000,
          average_lead_time_change: 0,
          service_level_impact: 3.0,
          stockout_risk_change: -3.0
        }
      },
      status: 'completed'
    },
    {
      scenario_name: 'Escenario de Promoción',
      scenario_type: 'promotional_impact',
      product_id: 'PROD_004',
      location_id: 'WH_001',
      description: 'Simulación de campaña promocional con 25% de incremento',
      parameters: { lift: 0.25 },
      results: {
        id: '4',
        scenario_execution_id: '4',
        impact_summary: {
          total_order_count_change: 22.3,
          total_value_change: 187500,
          average_lead_time_change: -8.9,
          service_level_impact: 4.1,
          stockout_risk_change: -18.2
        },
        detailed_changes: []
      },
      status: 'completed'
    },
    {
      scenario_name: 'Escenario de Optimización de Inventario',
      scenario_type: 'inventory_optimization',
      product_id: 'PROD_005',
      location_id: 'WH_002',
      description: 'Reducción de inventario con mantenimiento de servicio',
      parameters: { reduction: 15 },
      results: {
        id: '5',
        scenario_execution_id: '5',
        impact_summary: {
          total_order_count_change: -5.2,
          total_value_change: -35000,
          average_lead_time_change: 2.1,
          service_level_impact: -1.5,
          stockout_risk_change: 8.7
        },
        detailed_changes: []
      },
      status: 'completed'
    }
  ];

  try {
    //console.log('📝 Creating sample scenarios...');
    
    for (const scenario of sampleScenarios) {
      const { data, error } = await supabase
        .from('what_if_scenarios')
        .insert([scenario])
        .select();
      
      if (error) {
        console.error('❌ Error creating sample scenario:', error);
      } else {
        //console.log('✅ Created sample scenario:', data[0].scenario_name);
      }
    }
    
    //console.log('🎉 Sample scenarios created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample scenarios:', error);
  }
}; 