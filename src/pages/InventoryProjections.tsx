import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  Warehouse, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  BarChart3,
  Shield,
  Network,
  Calculator,
  Target,
  Clock,
  MapPin,
  Truck,
  Filter,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, ComposedChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
import { SafetyStockAnalysisPanel } from '@/components/SafetyStockAnalysisPanel';
import { useAdvancedInventoryProjections } from '@/hooks/useAdvancedInventoryProjections';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

interface InventoryProjectionData {
  id: string;
  product_id: string;
  location_id: string;
  projection_month: string;
  current_inventory: number;
  forecasted_demand: number;
  planned_receipts: number;
  lead_time_days: number;
  safety_stock: number;
  reorder_point: number;
  projected_ending_inventory: number;
  stockout_risk_percentage: number;
  calculation_method: string;
  demand_variability: number;
  created_at: string;
  updated_at?: string;
}

interface MonthlyProjection {
  month: string;
  current_inventory: number;
  forecasted_demand: number;
  planned_receipts: number;
  projected_ending_inventory: number;
  safety_stock: number;
  reorder_point: number;
  status: 'optimal' | 'warning' | 'critical' | 'stockout' | 'overstock';
  stockout_risk: number;
  days_of_supply: number;
}

export default function InventoryProjections() {
  const [searchParams] = useSearchParams();
  
  // Helper functions for localStorage persistence
  const getStoredFilters = () => {
    try {
      const stored = localStorage.getItem('inventoryProjectionsFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveFiltersToStorage = (filters: { productId: string; locationId: string; customerId: string }) => {
    try {
      localStorage.setItem('inventoryProjectionsFilters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  };

  // Initialize state with localStorage values, fallback to URL params
  const storedFilters = getStoredFilters();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    searchParams.get('product_id') || storedFilters.productId || ''
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    searchParams.get('location_id') || storedFilters.locationId || ''
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get('customer_id') || storedFilters.customerId || ''
  );
  const [projectionDays, setProjectionDays] = useState(90);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');
  const [timeHorizon, setTimeHorizon] = useState<30 | 60 | 90>(90);
  const [monthlyProjections, setMonthlyProjections] = useState<MonthlyProjection[]>([]);
  const [inventoryProjectionData, setInventoryProjectionData] = useState<InventoryProjectionData[]>([]);
  const [includeSafetyStockAnalysis, setIncludeSafetyStockAnalysis] = useState(true);
  const [includeMultiNodeAnalysis, setIncludeMultiNodeAnalysis] = useState(true);
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(false);
  
  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  // Hooks for filter data
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();
  const { getCustomerName } = useCustomers();
  
  const { 
    loading, 
    results: projectionResults, 
    error, 
    calculateAdvancedProjections,
    getProjectionSummary 
  } = useAdvancedInventoryProjections();
  
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Update state when URL parameters change
  useEffect(() => {
    const productParam = searchParams.get('product_id');
    const locationParam = searchParams.get('location_id');
    const customerParam = searchParams.get('customer_id');
    
    if (productParam && productParam !== selectedProductId) {
      setSelectedProductId(productParam);
    }
    if (locationParam && locationParam !== selectedLocationId) {
      setSelectedLocationId(locationParam);
    }
    if (customerParam && customerParam !== selectedCustomerId) {
      setSelectedCustomerId(customerParam);
    }
  }, [searchParams]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    saveFiltersToStorage({
      productId,
      locationId: selectedLocationId,
      customerId: selectedCustomerId
    });
    //console.log('Producto seleccionado en Inventory Projections:', productId);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId,
      customerId: selectedCustomerId
    });
    //console.log('Ubicación seleccionada en Inventory Projections:', locationId);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId: selectedLocationId,
      customerId
    });
    //console.log('Cliente seleccionado en Inventory Projections:', customerId);
  };

  const handleClearFilters = () => {
    setSelectedProductId('');
    setSelectedLocationId('');
    setSelectedCustomerId('');
    saveFiltersToStorage({
      productId: '',
      locationId: '',
      customerId: ''
    });
    //console.log('Filtros limpiados');
  };

  // Load projections when filters change
  useEffect(() => {
    //console.log('Filters changed:', { selectedProductId, selectedLocationId, selectedCustomerId, viewMode });
    if (selectedProductId) {
      if (viewMode === 'monthly') {
        loadMonthlyProjections();
      } else {
        loadProjections();
      }
    }
  }, [selectedProductId, selectedLocationId, selectedCustomerId, projectionDays, includeSafetyStockAnalysis, includeMultiNodeAnalysis, viewMode, timeHorizon]);

  const loadProjections = async () => {
    try {
      const results = await calculateAdvancedProjections({
        product_id: selectedProductId || undefined,
        location_id: selectedLocationId || undefined,
        projection_days: projectionDays,
        includeSafetyStockAnalysis,
        includeMultiNodeAnalysis
      });
      
      setSelectedResult(results[0] || null);
      
      if (results.length === 0) {
        toast({
          title: "No hay datos disponibles",
          description: "No se encontraron datos de inventario para los filtros seleccionados.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading projections:', error);
      toast({
        title: "Error al cargar proyecciones",
        description: "Hubo un problema al calcular las proyecciones de inventario.",
        variant: "destructive"
      });
    }
  };

  const loadMonthlyProjections = async () => {
    //console.log('Loading monthly projections for:', { selectedProductId, selectedLocationId });
    setLoadingMonthlyData(true);
    try {
      // Get inventory series data
      let inventoryQuery = (supabase as any)
        .schema('m8_schema')
        .from('inventory_series')
        .select(`
          id,
          product_id,
          location_id,
          customer_id
        `);

      if (selectedProductId) {
        inventoryQuery = inventoryQuery.eq('product_id', selectedProductId);
      }
      if (selectedLocationId) {
        inventoryQuery = inventoryQuery.eq('location_id', selectedLocationId);
      }
      if (selectedCustomerId) {
        inventoryQuery = inventoryQuery.eq('customer_id', selectedCustomerId);
      }

      const { data: inventorySeries, error: inventoryError } = await inventoryQuery;
      if (inventoryError) throw inventoryError;

      if (!inventorySeries || inventorySeries.length === 0) {
        setInventoryProjectionData([]);
        setMonthlyProjections([]);
        return;
      }

      // Get inventory transactions for the series
      const seriesIds = inventorySeries.map(s => s.id);
      const { data: inventoryData, error: inventoryDataError } = await (supabase as any)
        .schema('m8_schema')
        .from('inventory_series_data')
        .select('*')
        .in('series_id', seriesIds)
        .gte('period_date', new Date().toISOString().slice(0, 7))
        .order('period_date', { ascending: true });

      if (inventoryDataError) throw inventoryDataError;

      // Get forecast data
      let forecastQuery = (supabase as any)
        .schema('m8_schema')
        .from('forecast_with_fitted_history')
        .select(`
          product_id,
          location_id,
          customer_id,
          postdate,
          forecast,
          actual
        `)
        .gte('postdate', new Date().toISOString().slice(0, 7));

      if (selectedProductId) {
        forecastQuery = forecastQuery.eq('product_id', selectedProductId);
      }
      if (selectedLocationId) {
        forecastQuery = forecastQuery.eq('location_id', selectedLocationId);
      }
      if (selectedCustomerId) {
        forecastQuery = forecastQuery.eq('customer_id', selectedCustomerId);
      }

      const { data: forecastData, error: forecastError } = await forecastQuery;
      if (forecastError) throw forecastError;

      // Combine and aggregate data by month
      const monthlyData = combineInventoryAndForecastData(
        inventoryData || [],
        forecastData || [],
        inventorySeries
      );

      setInventoryProjectionData(monthlyData);
      
      // Transform data to monthly projections format
      const monthlyProjectionsData = transformToMonthlyProjections(monthlyData);
      setMonthlyProjections(monthlyProjectionsData);
      
      if (monthlyProjectionsData.length === 0) {
        toast({
          title: "No hay datos mensuales disponibles",
          description: "No se encontraron proyecciones mensuales para los filtros seleccionados.",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error loading monthly projections:', error);
      toast({
        title: "Error al cargar proyecciones mensuales",
        description: "Hubo un problema al obtener los datos de proyecciones mensuales.",
        variant: "destructive"
      });
    } finally {
      setLoadingMonthlyData(false);
    }
  };

  const combineInventoryAndForecastData = (
    inventoryData: any[],
    forecastData: any[],
    inventorySeries: any[]
  ): InventoryProjectionData[] => {
    // Group inventory data by month
    const inventoryByMonth = inventoryData.reduce((acc, item) => {
      const month = new Date(item.period_date).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = {
          current_inventory: 0,
          planned_receipts: 0,
          projected_ending_inventory: 0,
          safety_stock: 0,
          reorder_point: 0,
          stockout_risk_percentage: 0
        };
      }
      acc[month].current_inventory += item.value || 0;
      return acc;
    }, {} as Record<string, any>);

    // Group forecast data by month
    const forecastByMonth = forecastData.reduce((acc, item) => {
      const month = new Date(item.postdate).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = {
          forecasted_demand: 0,
          actual_sales: 0
        };
      }
      acc[month].forecasted_demand += item.forecast || 0;
      acc[month].actual_sales += item.actual || 0;
      return acc;
    }, {} as Record<string, any>);

    // Combine data and calculate projections
    const allMonths = new Set([
      ...Object.keys(inventoryByMonth),
      ...Object.keys(forecastByMonth)
    ]);

    return Array.from(allMonths).map(month => {
      const inventory = inventoryByMonth[month] || {
        current_inventory: 0,
        planned_receipts: 0,
        projected_ending_inventory: 0,
        safety_stock: 0,
        reorder_point: 0,
        stockout_risk_percentage: 0
      };
      
      const forecast = forecastByMonth[month] || {
        forecasted_demand: 0,
        actual_sales: 0
      };

      // Calculate projected ending inventory
      const projectedEnding = inventory.current_inventory + inventory.planned_receipts - forecast.forecasted_demand;
      
      // Calculate safety stock (20% of forecasted demand as default)
      const safetyStock = forecast.forecasted_demand * 0.2;
      
      // Calculate reorder point (safety stock + lead time demand)
      const reorderPoint = safetyStock + (forecast.forecasted_demand * 0.5); // Assuming 15 days lead time
      
      // Calculate stockout risk
      const stockoutRisk = projectedEnding <= 0 ? 100 : 
                          projectedEnding < safetyStock ? 50 : 
                          projectedEnding < reorderPoint ? 25 : 0;

      return {
        id: `${inventorySeries[0]?.product_id || ''}_${inventorySeries[0]?.location_id || ''}_${month}`,
        product_id: inventorySeries[0]?.product_id || '',
        location_id: inventorySeries[0]?.location_id || '',
        projection_month: month,
        current_inventory: inventory.current_inventory,
        forecasted_demand: forecast.forecasted_demand,
        planned_receipts: inventory.planned_receipts,
        lead_time_days: 15, // Default lead time
        safety_stock: safetyStock,
        reorder_point: reorderPoint,
        projected_ending_inventory: projectedEnding,
        stockout_risk_percentage: stockoutRisk,
        calculation_method: 'forecast_based',
        demand_variability: 0.2, // Default 20% variability
        created_at: new Date().toISOString()
      };
    }).sort((a, b) => a.projection_month.localeCompare(b.projection_month));
  };

  const transformToMonthlyProjections = (data: InventoryProjectionData[]): MonthlyProjection[] => {
    return data.map(item => {
      const daysOfSupply = item.forecasted_demand > 0 ? item.projected_ending_inventory / (item.forecasted_demand / 30) : 0;
      
      let status: MonthlyProjection['status'] = 'optimal';
      if (item.projected_ending_inventory <= 0) status = 'stockout';
      else if (item.projected_ending_inventory < item.safety_stock) status = 'critical';
      else if (item.projected_ending_inventory < item.reorder_point) status = 'warning';
      else if (item.projected_ending_inventory > item.safety_stock * 3) status = 'overstock';
      
      return {
        month: new Date(item.projection_month).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
        current_inventory: item.current_inventory,
        forecasted_demand: item.forecasted_demand,
        planned_receipts: item.planned_receipts,
        projected_ending_inventory: item.projected_ending_inventory,
        safety_stock: item.safety_stock,
        reorder_point: item.reorder_point,
        status,
        stockout_risk: item.stockout_risk_percentage,
        days_of_supply: Math.round(daysOfSupply)
      };
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'stockout': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return <Badge className="bg-green-100 text-green-700">Óptimo</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Advertencia</Badge>;
      case 'critical':
        return <Badge className="bg-orange-100 text-orange-700">Crítico</Badge>;
      case 'stockout':
        return <Badge className="bg-red-100 text-red-700">Agotado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatChartData = (projections: any[]) => {
    return projections.map(p => ({
      date: new Date(p.date).getMonth() + 1 + '/' + new Date(p.date).getDate(),
      inventory: p.projected_inventory,
      demand: p.forecast_demand,
      safety_stock: p.safety_stock,
      reorder_point: p.reorder_point,
      status: p.status
    }));
  };

  const getSummaryStats = (result: any) => {
    return getProjectionSummary(result);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proyecciones de Inventario</h1>
          <p className="text-muted-foreground">
            Análisis predictivo de niveles de inventario basado en demanda pronosticada
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Vista Diaria</SelectItem>
                <SelectItem value="monthly">Vista Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeHorizon.toString()} onValueChange={(value) => setTimeHorizon(parseInt(value) as 30 | 60 | 90)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filter Section - Same as DemandForecast */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Producto:</span>
                {selectedProductId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedProductId}</Badge>
                    <Badge variant="secondary">{getProductName(selectedProductId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionado (obligatorio)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsProductModalOpen(true)}
                  className="ml-2 h-8 w-8"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Ubicación:</span>
                {selectedLocationId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedLocationId}</Badge>
                    <Badge variant="secondary">{getLocationName(selectedLocationId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionada (opcional)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="ml-2 h-8 w-8"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Cliente:</span>           
                {selectedCustomerId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedCustomerId}</Badge>
                    <Badge variant="secondary">{getCustomerName(selectedCustomerId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionado (opcional)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="ml-2 h-8 w-8"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
            </div>
            
            {(selectedProductId || selectedLocationId || selectedCustomerId) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearFilters}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configuración de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-end">
                <Button 
                  onClick={loadProjections} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Calculando...' : 'Actualizar Proyecciones'}
                </Button>
              </div>
            </div>
            
            {/* Advanced Analysis Options */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Análisis Avanzado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Análisis de Stock de Seguridad
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Incluye cálculos avanzados de stock de seguridad con múltiples métodos
                    </p>
                  </div>
                  <Switch
                    checked={includeSafetyStockAnalysis}
                    onCheckedChange={setIncludeSafetyStockAnalysis}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Análisis Multi-Nodo
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Análisis de red de inventario y optimización entre ubicaciones
                    </p>
                  </div>
                  <Switch
                    checked={includeMultiNodeAnalysis}
                    onCheckedChange={setIncludeMultiNodeAnalysis}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(loading || loadingMonthlyData) && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Cargando proyecciones...</h3>
            <p className="text-muted-foreground">
              Por favor espera mientras calculamos las proyecciones de inventario.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {!loading && !loadingMonthlyData && (projectionResults.length > 0 || monthlyProjections.length > 0) && (
        <Tabs defaultValue={viewMode === 'monthly' ? 'monthly-overview' : 'overview'} className="space-y-4">
          <TabsList>
            {viewMode === 'monthly' && <TabsTrigger value="monthly-overview">Resumen Mensual</TabsTrigger>}
            {viewMode === 'monthly' && <TabsTrigger value="monthly-chart">Gráfico Mensual</TabsTrigger>}
            {viewMode === 'monthly' && <TabsTrigger value="inventory-management">Gestión de Inventario</TabsTrigger>}
            {viewMode === 'daily' && <TabsTrigger value="overview">Resumen</TabsTrigger>}
            {viewMode === 'daily' && <TabsTrigger value="chart">Gráfico de Proyección</TabsTrigger>}
            {viewMode === 'daily' && <TabsTrigger value="details">Análisis Detallado</TabsTrigger>}
            {includeSafetyStockAnalysis && <TabsTrigger value="safety-stock">Stock de Seguridad</TabsTrigger>}
            {includeMultiNodeAnalysis && <TabsTrigger value="multi-node">Análisis Multi-Nodo</TabsTrigger>}
          </TabsList>

          {/* Product/Location Selector */}
          {projectionResults.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Seleccionar producto/ubicación:</span>
                  <Select
                    value={selectedResult ? `${selectedResult.product_id}_${selectedResult.location_id}` : ''}
                    onValueChange={(value) => {
                      const [product_id, location_id] = value.split('_');
                      const result = projectionResults.find(r => 
                        r.product_id === product_id && r.location_id === location_id
                      );
                      setSelectedResult(result || null);
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Seleccionar combinación" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectionResults.map((result) => (
                        <SelectItem 
                          key={`${result.product_id}_${result.location_id}`}
                          value={`${result.product_id}_${result.location_id}`}
                        >
                          {result.product_id} - {result.location_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly View Tabs */}
          {viewMode === 'monthly' && monthlyProjections.length > 0 && (
            <>
              <TabsContent value="monthly-overview">
                <div className="space-y-6">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const totalStockouts = monthlyProjections.filter(p => p.status === 'stockout').length;
                      const totalCritical = monthlyProjections.filter(p => p.status === 'critical').length;
                      const totalOverstock = monthlyProjections.filter(p => p.status === 'overstock').length;
                      const avgStockoutRisk = monthlyProjections.reduce((sum, p) => sum + p.stockout_risk, 0) / monthlyProjections.length;
                      
                      return (
                        <>
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Meses con Agotamiento</p>
                                  <p className="text-2xl font-bold text-red-600">{totalStockouts}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Meses Críticos</p>
                                  <p className="text-2xl font-bold text-orange-600">{totalCritical}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-orange-500" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Meses con Exceso</p>
                                  <p className="text-2xl font-bold text-blue-600">{totalOverstock}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-blue-500" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Riesgo Promedio (%)</p>
                                  <p className="text-2xl font-bold">{Math.round(avgStockoutRisk)}%</p>
                                </div>
                                <Activity className="h-8 w-8 text-gray-500" />
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Monthly Projections Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Proyecciones Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Mes</th>
                              <th className="text-left p-2">Inventario Actual</th>
                              <th className="text-left p-2">Demanda</th>
                              <th className="text-left p-2">Recepciones</th>
                              <th className="text-left p-2">Inventario Final</th>
                              <th className="text-left p-2">Días de Suministro</th>
                              <th className="text-left p-2">Riesgo (%)</th>
                              <th className="text-left p-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyProjections.map((projection, index) => (
                              <tr key={index} className="border-b hover:bg-muted/50">
                                <td className="p-2 font-medium">{projection.month}</td>
                                <td className="p-2">{Math.round(projection.current_inventory)}</td>
                                <td className="p-2">{Math.round(projection.forecasted_demand)}</td>
                                <td className="p-2">{Math.round(projection.planned_receipts)}</td>
                                <td className="p-2 font-medium">{Math.round(projection.projected_ending_inventory)}</td>
                                <td className="p-2">{projection.days_of_supply}</td>
                                <td className="p-2">{Math.round(projection.stockout_risk)}%</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(projection.status)}
                                    {getStatusBadge(projection.status)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly-chart">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Proyecciones Mensuales de Inventario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ChartContainer
                      config={{
                        projected_ending_inventory: { label: "Inventario Final", color: "hsl(var(--primary))" },
                        forecasted_demand: { label: "Demanda", color: "hsl(var(--destructive))" },
                        safety_stock: { label: "Stock de Seguridad", color: "hsl(var(--warning))" },
                        reorder_point: { label: "Punto de Reorden", color: "hsl(var(--secondary))" }
                      }}
                      className="w-full h-[400px] min-h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyProjections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar 
                            dataKey="projected_ending_inventory" 
                            fill="hsl(var(--primary))" 
                            name="Inventario Final"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecasted_demand" 
                            stroke="hsl(var(--destructive))" 
                            strokeWidth={2}
                            name="Demanda"
                          />
                          <ReferenceLine 
                            y={monthlyProjections[0]?.safety_stock || 0} 
                            stroke="hsl(var(--warning))" 
                            strokeDasharray="5 5"
                            label="Stock de Seguridad"
                          />
                          <ReferenceLine 
                            y={monthlyProjections[0]?.reorder_point || 0} 
                            stroke="hsl(var(--secondary))" 
                            strokeDasharray="5 5"
                            label="Punto de Reorden"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="inventory-management">
                <div className="space-y-6">
                  {/* Critical Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Acciones Críticas Requeridas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {monthlyProjections
                          .filter(p => p.status === 'stockout' || p.status === 'critical')
                          .map((projection, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-red-800">
                                    {projection.status === 'stockout' ? 'AGOTAMIENTO PROYECTADO' : 'NIVEL CRÍTICO'}
                                  </h4>
                                  <p className="text-sm text-red-600 mt-1">
                                    Mes: {projection.month} | Inventario Final: {Math.round(projection.projected_ending_inventory)} unidades
                                  </p>
                                  <p className="text-sm font-medium mt-2">
                                    Acción Recomendada: Ordenar {Math.max(0, projection.reorder_point - projection.projected_ending_inventory + projection.forecasted_demand)} unidades
                                  </p>
                                </div>
                                <Badge variant="destructive">
                                  {projection.stockout_risk}% Riesgo
                                </Badge>
                              </div>
                            </div>
                          ))}
                        
                        {monthlyProjections
                          .filter(p => p.status === 'overstock')
                          .map((projection, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-blue-800">EXCESO DE INVENTARIO</h4>
                                  <p className="text-sm text-blue-600 mt-1">
                                    Mes: {projection.month} | Inventario Final: {Math.round(projection.projected_ending_inventory)} unidades
                                  </p>
                                  <p className="text-sm font-medium mt-2">
                                    Considerar redistribuir {Math.round(projection.projected_ending_inventory - projection.safety_stock * 2)} unidades
                                  </p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-700">
                                  {projection.days_of_supply} días
                                </Badge>
                              </div>
                            </div>
                          ))}
                        
                        {monthlyProjections.filter(p => p.status === 'stockout' || p.status === 'critical' || p.status === 'overstock').length === 0 && (
                          <p className="text-muted-foreground text-center py-4">
                            No hay acciones críticas requeridas en este período
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Lead Time Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Análisis de Tiempos de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inventoryProjectionData.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-primary">
                              {item.lead_time_days}
                            </p>
                            <p className="text-sm text-muted-foreground">Días de Lead Time</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.projection_month).toLocaleDateString('es-ES', { month: 'long' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
          
          {/* Daily View Tabs */}
          {viewMode === 'daily' && selectedResult && (
            <>
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const summary = getSummaryStats(selectedResult);
                    if (!summary) return null;
                    
                    return (
                      <>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Días con Agotamiento</p>
                                <p className="text-2xl font-bold text-red-600">{summary.stockoutDays}</p>
                              </div>
                              <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Días Críticos</p>
                                <p className="text-2xl font-bold text-orange-600">{summary.criticalDays}</p>
                              </div>
                              <AlertTriangle className="h-8 w-8 text-orange-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Inventario Mínimo</p>
                                <p className="text-2xl font-bold">{Math.round(summary.minInventory)}</p>
                              </div>
                              <TrendingDown className="h-8 w-8 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>
                         <Card>
                           <CardContent className="p-6">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-sm font-medium text-muted-foreground">Nivel de Riesgo</p>
                                 <div className="flex items-center gap-2">
                                   {selectedResult.riskAssessment ? (
                                     <Badge className={
                                       selectedResult.riskAssessment.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                       selectedResult.riskAssessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                       'bg-red-100 text-red-700'
                                     }>
                                       {selectedResult.riskAssessment.riskLevel === 'low' ? 'Bajo' :
                                        selectedResult.riskAssessment.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                                     </Badge>
                                   ) : (
                                     getStatusBadge(summary.riskLevel)
                                   )}
                                 </div>
                               </div>
                               <Activity className="h-8 w-8 text-gray-500" />
                             </div>
                           </CardContent>
                         </Card>
                      </>
                    );
                  })()}
                </div>
              </TabsContent>

              <TabsContent value="chart">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Proyección de Inventario - {selectedResult.product_id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ChartContainer
                      config={{
                        inventory: { label: "Inventario Proyectado", color: "hsl(var(--primary))" },
                        safety_stock: { label: "Stock de Seguridad", color: "hsl(var(--destructive))" },
                        reorder_point: { label: "Punto de Reorden", color: "hsl(var(--warning))" }
                      }}
                      className="w-full h-[400px] min-h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formatChartData(selectedResult.projections)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="inventory" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            name="Inventario Proyectado"
                          />
                          <ReferenceLine 
                            y={selectedResult.projections[0]?.safety_stock || 0} 
                            stroke="hsl(var(--destructive))" 
                            strokeDasharray="5 5"
                            label="Stock de Seguridad"
                          />
                          <ReferenceLine 
                            y={selectedResult.projections[0]?.reorder_point || 0} 
                            stroke="hsl(var(--warning))" 
                            strokeDasharray="5 5"
                            label="Punto de Reorden"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis Detallado por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      {(() => {
                        // Get first 15 projections for the pivot table
                        const projections = selectedResult.projections.slice(0, 15);
                        const dates = projections.map(p => new Date(p.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
                        
                        return (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 font-semibold bg-muted/50">Métrica</th>
                                {dates.map((date, index) => (
                                  <th key={index} className="text-center p-2 font-medium min-w-[80px]">{date}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {/* Inventario Proyectado Row */}
                              <tr className="border-b hover:bg-muted/30">
                                <td className="p-2 font-medium bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-500" />
                                    Inventario Proyectado
                                  </div>
                                </td>
                                {projections.map((projection, index) => (
                                  <td key={index} className="p-2 text-center font-medium">
                                    {Math.round(projection.projected_inventory).toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Demanda Diaria Row */}
                              <tr className="border-b hover:bg-muted/30">
                                <td className="p-2 font-medium bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                    Demanda Diaria
                                  </div>
                                </td>
                                {projections.map((projection, index) => (
                                  <td key={index} className="p-2 text-center">
                                    {Math.round(projection.forecast_demand).toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Demanda Acumulada Row */}
                              <tr className="border-b hover:bg-muted/30">
                                <td className="p-2 font-medium bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    Demanda Acumulada
                                  </div>
                                </td>
                                {projections.map((projection, index) => (
                                  <td key={index} className="p-2 text-center">
                                    {Math.round(projection.cumulative_demand).toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Estado Row */}
                              <tr className="border-b hover:bg-muted/30">
                                <td className="p-2 font-medium bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-gray-500" />
                                    Estado
                                  </div>
                                </td>
                                {projections.map((projection, index) => (
                                  <td key={index} className="p-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {getStatusIcon(projection.status)}
                                      <span className="text-xs">{
                                        projection.status === 'optimal' ? 'Óptimo' :
                                        projection.status === 'warning' ? 'Advertencia' :
                                        projection.status === 'critical' ? 'Crítico' :
                                        projection.status === 'stockout' ? 'Agotado' :
                                        projection.status
                                      }</span>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Safety Stock Analysis Tab */}
              {includeSafetyStockAnalysis && selectedResult?.safetyStockAnalysis && (
                <TabsContent value="safety-stock">
                  <SafetyStockAnalysisPanel analysis={selectedResult.safetyStockAnalysis} />
                </TabsContent>
              )}

              {/* Multi-Node Analysis Tab */}
              {includeMultiNodeAnalysis && selectedResult?.multiNodeAnalysis && (
                <TabsContent value="multi-node">
                  <div className="space-y-6">
                    {/* Network Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-5 w-5" />
                          Análisis de Red de Inventario
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {selectedResult.multiNodeAnalysis.total_network_inventory}
                            </p>
                            <p className="text-sm text-muted-foreground">Inventario Total Red</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              {selectedResult.multiNodeAnalysis.locations_with_excess}
                            </p>
                            <p className="text-sm text-muted-foreground">Ubicaciones con Exceso</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {selectedResult.multiNodeAnalysis.locations_at_risk}
                            </p>
                            <p className="text-sm text-muted-foreground">Ubicaciones en Riesgo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Optimization Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recomendaciones de Optimización</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedResult.multiNodeAnalysis.optimization_recommendations?.map((rec, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{rec.action}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    De: {rec.from_location} → A: {rec.to_location}
                                  </p>
                                  <p className="text-sm font-medium mt-2">
                                    Cantidad: {rec.quantity} | Prioridad: 
                                    <Badge className="ml-2" variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                                    </Badge>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Ahorro Estimado</p>
                                  <p className="font-bold text-green-600">${rec.estimated_savings?.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          )) || (
                            <p className="text-muted-foreground text-center py-4">
                              No hay recomendaciones de optimización disponibles
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </>
          )}
        </Tabs>
      )}

      {/* Empty State */}
      {!loading && !loadingMonthlyData && projectionResults.length === 0 && monthlyProjections.length === 0 && selectedProductId && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyecciones disponibles</h3>
            <p className="text-muted-foreground mb-4">
              No se encontraron datos de proyecciones para el producto seleccionado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State - No Product Selected */}
      {!selectedProductId && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un producto</h3>
            <p className="text-muted-foreground mb-4">
              Selecciona un producto para generar proyecciones de inventario.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selection Modals */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
      />
      
      <LocationSelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={handleLocationSelect}
      />
      
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
}