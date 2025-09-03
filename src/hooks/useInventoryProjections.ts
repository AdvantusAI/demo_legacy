import { useState, useCallback } from 'react';
import { InventoryProjectionService, InventoryProjection } from '@/services/inventoryProjectionService';

interface ProjectionResult {
  product_id: string;
  location_id: string;
  warehouse_id: number;
  projections: InventoryProjection[];
}

interface ProjectionParams {
  product_id?: string;
  location_id?: string;
  warehouse_id?: number;
  projection_days?: number;
}

export const useInventoryProjections = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProjectionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const calculateProjections = useCallback(async (params: ProjectionParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const projectionResults = await InventoryProjectionService.calculateProjections(params);
      setResults(projectionResults);
      return projectionResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error calculating projections';
      setError(errorMessage);
      console.error('Projection calculation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProjectionSummary = useCallback((result: ProjectionResult) => {
    return InventoryProjectionService.getProjectionSummary(result.projections);
  }, []);

  return {
    loading,
    results,
    error,
    calculateProjections,
    getProjectionSummary
  };
};