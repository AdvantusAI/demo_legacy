import { useState, useEffect } from 'react';
import { InventoryProjectionsChartService, ChartDataPoint, ChartFilters } from '@/services/inventoryProjectionsChartService';

export const useInventoryProjectionsChart = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async (filters: ChartFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const chartData = await InventoryProjectionsChartService.getChartData(filters);
      setData(chartData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching chart data';
      setError(errorMessage);
      console.error('Chart data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchChartData
  };
};