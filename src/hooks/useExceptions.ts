import { useState, useEffect, useCallback } from 'react';
import { 
  ExceptionService, 
  ExceptionSummary, 
  ExceptionDetail,
  ExceptionProjection,
  ExceptionAction
} from '@/services/exceptionService';
import { toast } from 'sonner';

interface UseExceptionsReturn {
  // Data
  summary: ExceptionSummary;
  exceptions: ExceptionDetail[];
  selectedException: ExceptionDetail | null;
  exceptionProjection: ExceptionProjection[];
  recommendedAction: ExceptionAction | null;
  
  // Loading states
  loading: boolean;
  summaryLoading: boolean;
  exceptionsLoading: boolean;
  
  // Filters
  filters: {
    severity?: string;
    type?: string;
    product?: string;
    location?: string;
  };
  
  // Actions
  refreshData: () => Promise<void>;
  setFilters: (filters: any) => void;
  selectException: (exception: ExceptionDetail | null) => void;
  updateExceptionStatus: (
    exceptionId: string, 
    status: 'resolved' | 'acknowledged' | 'in_progress',
    notes?: string
  ) => Promise<boolean>;
}

export const useExceptions = (): UseExceptionsReturn => {
  // State management
  const [summary, setSummary] = useState<ExceptionSummary>({
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    total_count: 0,
    estimated_financial_impact: 0
  });
  
  const [exceptions, setExceptions] = useState<ExceptionDetail[]>([]);
  const [selectedException, setSelectedException] = useState<ExceptionDetail | null>(null);
  const [exceptionProjection, setExceptionProjection] = useState<ExceptionProjection[]>([]);
  const [recommendedAction, setRecommendedAction] = useState<ExceptionAction | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);
  
  const [filters, setFilters] = useState<{
    severity?: string;
    type?: string;
    product?: string;
    location?: string;
  }>({});

  // Fetch dashboard summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const summaryData = await ExceptionService.getDashboardSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching exception summary:', error);
      toast.error('Error al cargar el resumen de excepciones');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch exceptions list
  const fetchExceptions = useCallback(async () => {
    setExceptionsLoading(true);
    try {
      const exceptionsData = await ExceptionService.getExceptionList(filters);
      setExceptions(exceptionsData);
    } catch (error) {
      console.error('Error fetching exceptions:', error);
      toast.error('Error al cargar la lista de excepciones');
    } finally {
      setExceptionsLoading(false);
    }
  }, [filters]);

  // Fetch exception details with projection
  const fetchExceptionDetails = useCallback(async (exceptionId: string) => {
    try {
      const details = await ExceptionService.getExceptionDetails(exceptionId);
      if (details) {
        setExceptionProjection(details.projection);
        setRecommendedAction(details.recommended_action);
      }
    } catch (error) {
      console.error('Error fetching exception details:', error);
      toast.error('Error al cargar los detalles de la excepción');
    }
  }, []);

  // Select an exception
  const selectException = useCallback(async (exception: ExceptionDetail | null) => {
    setSelectedException(exception);
    if (exception) {
      await fetchExceptionDetails(exception.id);
    } else {
      setExceptionProjection([]);
      setRecommendedAction(null);
    }
  }, [fetchExceptionDetails]);

  // Update exception status
  const updateExceptionStatus = useCallback(async (
    exceptionId: string,
    status: 'resolved' | 'acknowledged' | 'in_progress',
    notes?: string
  ): Promise<boolean> => {
    try {
      const success = await ExceptionService.updateExceptionStatus(exceptionId, status, notes);
      
      if (success) {
        toast.success(`Excepción ${status === 'resolved' ? 'resuelta' : 
                       status === 'acknowledged' ? 'reconocida' : 
                       'en progreso'} exitosamente`);
        
        // Refresh data after status update
        await refreshData();
        
        // Clear selection if the exception was resolved
        if (status === 'resolved' && selectedException?.id === exceptionId) {
          setSelectedException(null);
          setExceptionProjection([]);
          setRecommendedAction(null);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error updating exception status:', error);
      toast.error('Error al actualizar el estado de la excepción');
      return false;
    }
  }, [selectedException]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchExceptions()
    ]);
    setLoading(false);
  }, [fetchSummary, fetchExceptions]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh exceptions when filters change
  useEffect(() => {
    fetchExceptions();
  }, [filters, fetchExceptions]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    // Data
    summary,
    exceptions,
    selectedException,
    exceptionProjection,
    recommendedAction,
    
    // Loading states
    loading: loading || (summaryLoading && exceptionsLoading),
    summaryLoading,
    exceptionsLoading,
    
    // Filters
    filters,
    
    // Actions
    refreshData,
    setFilters,
    selectException,
    updateExceptionStatus
  };
};

// Hook for exception statistics
export const useExceptionStats = (exceptions: ExceptionDetail[]) => {
  const [stats, setStats] = useState({
    byType: {} as Record<string, number>,
    byLocation: {} as Record<string, number>,
    byProduct: {} as Record<string, number>,
    criticalProducts: [] as Array<{
      productId: string;
      productName: string;
      exceptionsCount: number;
      totalImpact: number;
      locations: string[];
    }>,
    totalImpact: 0,
    avgDaysOfSupply: 0
  });

  useEffect(() => {
    if (!exceptions || exceptions.length === 0) {
      setStats({
        byType: {},
        byLocation: {},
        byProduct: {},
        criticalProducts: [],
        totalImpact: 0,
        avgDaysOfSupply: 0
      });
      return;
    }

    // Calculate statistics
    const byType: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    const productDetails: Record<string, {
      name: string;
      count: number;
      impact: number;
      locations: Set<string>;
    }> = {};

    let totalImpact = 0;
    let totalDaysOfSupply = 0;

    exceptions.forEach(exception => {
      // By type
      byType[exception.exception_type] = (byType[exception.exception_type] || 0) + 1;
      
      // By location
      byLocation[exception.location_name] = (byLocation[exception.location_name] || 0) + 1;
      
      // By product
      byProduct[exception.product_id] = (byProduct[exception.product_id] || 0) + 1;
      
      // Product details for critical products
      if (!productDetails[exception.product_id]) {
        productDetails[exception.product_id] = {
          name: exception.product_name,
          count: 0,
          impact: 0,
          locations: new Set()
        };
      }
      productDetails[exception.product_id].count++;
      productDetails[exception.product_id].impact += exception.estimated_financial_impact;
      productDetails[exception.product_id].locations.add(exception.location_name);
      
      // Totals
      totalImpact += exception.estimated_financial_impact;
      totalDaysOfSupply += exception.days_of_supply;
    });

    // Get top critical products
    const criticalProducts = Object.entries(productDetails)
      .map(([productId, details]) => ({
        productId,
        productName: details.name,
        exceptionsCount: details.count,
        totalImpact: details.impact,
        locations: Array.from(details.locations)
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5);

    setStats({
      byType,
      byLocation,
      byProduct,
      criticalProducts,
      totalImpact,
      avgDaysOfSupply: exceptions.length > 0 ? totalDaysOfSupply / exceptions.length : 0
    });
  }, [exceptions]);

  return stats;
};