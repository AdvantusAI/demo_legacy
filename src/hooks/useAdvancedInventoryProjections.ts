import { useState, useCallback } from 'react';
import { InventoryProjectionService, ProjectionParams } from '@/services/inventoryProjectionService';
import { SafetyStockService, SafetyStockCalculation, MultiNodeInventory } from '@/services/safetyStockService';

interface EnhancedProjectionResult {
  product_id: string;
  location_id: string;
  warehouse_id: number;
  projections: any[];
  safetyStockAnalysis?: SafetyStockCalculation;
  multiNodeAnalysis?: MultiNodeInventory;
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    stockoutProbability: number;
    seasonalRisk: number;
    networkOptimizationScore: number;
  };
}

export const useAdvancedInventoryProjections = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EnhancedProjectionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const calculateAdvancedProjections = useCallback(async (params: ProjectionParams & {
    includeSafetyStockAnalysis?: boolean;
    includeMultiNodeAnalysis?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get basic projections
      const basicProjections = await InventoryProjectionService.calculateProjections(params);
      
      const enhancedResults: EnhancedProjectionResult[] = [];

      for (const projection of basicProjections) {
        let safetyStockAnalysis: SafetyStockCalculation | undefined;
        let multiNodeAnalysis: MultiNodeInventory | undefined;

        // Phase 2: Enhanced Safety Stock Analysis
        if (params.includeSafetyStockAnalysis) {
          try {
            const safetyStockResults = await SafetyStockService.calculateAdvancedSafetyStock(
              projection.product_id,
              projection.location_id,
              projection.warehouse_id
            );
            safetyStockAnalysis = safetyStockResults[0]; // Take first result
          } catch (err) {
            console.warn(`Failed to calculate safety stock for ${projection.product_id}:`, err);
          }
        }

        // Phase 2: Multi-Node Analysis
        if (params.includeMultiNodeAnalysis) {
          try {
            multiNodeAnalysis = await SafetyStockService.analyzeMultiNodeInventory(projection.product_id);
          } catch (err) {
            console.warn(`Failed to analyze multi-node inventory for ${projection.product_id}:`, err);
          }
        }

        // Phase 2: Enhanced Risk Assessment
        const riskAssessment = calculateEnhancedRiskAssessment(
          projection,
          safetyStockAnalysis,
          multiNodeAnalysis
        );

        enhancedResults.push({
          ...projection,
          safetyStockAnalysis,
          multiNodeAnalysis,
          riskAssessment
        });
      }

      setResults(enhancedResults);
      return enhancedResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error calculating advanced projections';
      setError(errorMessage);
      console.error('Advanced projection calculation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateEnhancedRiskAssessment = (
    projection: any,
    safetyStock?: SafetyStockCalculation,
    multiNode?: MultiNodeInventory
  ) => {
    const summary = InventoryProjectionService.getProjectionSummary(projection.projections);
    
    // Calculate base risk from projection summary
    let baseRisk = 0;
    if (summary) {
      baseRisk = (summary.stockoutDays * 0.4) + (summary.criticalDays * 0.2) + (summary.warningDays * 0.1);
      baseRisk = Math.min(baseRisk / 30, 1); // Normalize to 0-1
    }

    // Phase 2: Enhanced risk factors
    let seasonalRisk = 0;
    if (safetyStock?.seasonal_factors) {
      const currentMonth = new Date().getMonth() + 1;
      const currentSeasonalFactor = safetyStock.seasonal_factors.find(f => f.month === currentMonth);
      seasonalRisk = currentSeasonalFactor ? Math.abs(currentSeasonalFactor.factor - 1) : 0;
    }

    // Network optimization score (higher is better)
    let networkOptimizationScore = 0.5; // Default neutral score
    if (multiNode?.optimal_distribution) {
      const totalRecommendations = multiNode.optimal_distribution.reduce(
        (sum, plan) => sum + plan.transfer_recommendations.length, 0
      );
      networkOptimizationScore = Math.max(0.1, 1 - (totalRecommendations * 0.1));
    }

    // Stockout probability considering all factors
    const stockoutProbability = Math.min(1, baseRisk + (seasonalRisk * 0.3) + ((1 - networkOptimizationScore) * 0.2));

    // Overall risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (stockoutProbability < 0.2) riskLevel = 'low';
    else if (stockoutProbability < 0.5) riskLevel = 'medium';
    else riskLevel = 'high';

    return {
      riskLevel,
      stockoutProbability: Math.round(stockoutProbability * 100) / 100,
      seasonalRisk: Math.round(seasonalRisk * 100) / 100,
      networkOptimizationScore: Math.round(networkOptimizationScore * 100) / 100
    };
  };

  const getProjectionSummary = useCallback((result: EnhancedProjectionResult) => {
    return InventoryProjectionService.getProjectionSummary(result.projections);
  }, []);

  return {
    loading,
    results,
    error,
    calculateAdvancedProjections,
    getProjectionSummary
  };
};