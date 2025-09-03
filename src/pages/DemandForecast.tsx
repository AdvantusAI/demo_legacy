
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, MapPin, X, Filter } from "lucide-react";
import { ForecastDataTable } from "@/components/ForecastDataTable";
import { ForecastChart } from "@/components/ForecastChart";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { DynamicUpcomingChallenges } from "@/components/DynamicUpcomingChallenges";
import { DynamicActionItems } from "@/components/DynamicActionItems";
import { ProductSelectionModal } from "@/components/ProductSelectionModal";
import { LocationSelectionModal } from "@/components/LocationSelectionModal";
import { CustomerSelectionModal } from "@/components/CustomerSelectionModal";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useInterpretabilityData } from "@/hooks/useInterpretabilityData";
import { useProducts } from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useCustomers } from "@/hooks/useCustomers";
import OutliersTab from "@/components/OutliersTab";

// Import the ForecastData interface from ForecastDataTable
interface ForecastData {
  postdate: string;
  forecast: number | null;
  actual: number | null;
  sales_plan: number | null;
  demand_planner: number | null;
  forecast_ly: number | null;
  upper_bound: number | null;
  lower_bound: number | null;
  commercial_input: number | null;
  fitted_history?: number | null;
}

// Type definition for filter storage
interface FilterStorage {
  productId: string;
  locationId: string;
  customerId: string;
}

/**
 * DemandForecast Component
 * 
 * Main component for demand forecasting functionality. Provides:
 * - Filter management (Product, Location, Customer)
 * - Chart visualization of forecast data
 * - Data table with editing capabilities
 * - Metrics dashboard
 * - Outliers analysis
 * - Collaboration features
 */
export default function DemandForecast() {
  const [searchParams] = useSearchParams();
  
  // ===== LOCAL STORAGE HELPERS =====
  /**
   * Retrieves stored filters from localStorage
   * @returns Object containing stored filter values or empty object if none exist
   */
  const getStoredFilters = (): Partial<FilterStorage> => {
    try {
      const stored = localStorage.getItem('demandForecastFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  /**
   * Saves current filter state to localStorage for persistence
   * @param filters - Object containing filter values to store
   */
  const saveFiltersToStorage = (filters: FilterStorage): void => {
    try {
      localStorage.setItem('demandForecastFilters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  };

  // ===== STATE MANAGEMENT =====
  // Initialize state with localStorage values, fallback to URL params
  const storedFilters = getStoredFilters();
  
  // Filter state - product is required, location and customer are optional
  const [selectedProductId, setSelectedProductId] = useState<string>(
    searchParams.get('product_id') || storedFilters.productId || ''
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    searchParams.get('location_id') || storedFilters.locationId || ''
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get('customer_id') || storedFilters.customerId || ''
  );
  
  // Chart data state for forecast visualization
  const [chartData, setChartData] = useState<ForecastData[]>([]);
  
  // Modal visibility states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  // ===== HOOKS =====
  // Data hooks for interpretability and name resolution
  const { data: interpretabilityData } = useInterpretabilityData(selectedProductId, selectedLocationId, selectedCustomerId);
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();
  const { getCustomerName } = useCustomers();

  // ===== URL PARAMETER SYNC =====
  /**
   * Syncs component state with URL parameters when they change
   * This allows for deep linking and browser navigation
   */
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
  }, [searchParams, selectedProductId, selectedLocationId, selectedCustomerId]);

  // ===== EVENT HANDLERS =====
  /**
   * Handles product selection from modal
   * @param productId - Selected product ID
   */
  const handleProductSelect = (productId: string): void => {
    setSelectedProductId(productId);
    saveFiltersToStorage({
      productId,
      locationId: selectedLocationId,
      customerId: selectedCustomerId
    });
    //console.log('Producto seleccionado en Demand Forecast:', productId);
  };

  /**
   * Handles location selection from modal
   * @param locationId - Selected location ID
   */
  const handleLocationSelect = (locationId: string): void => {
    setSelectedLocationId(locationId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId,
      customerId: selectedCustomerId
    });
    //console.log('Ubicación seleccionada en Demand Forecast:', locationId);
  };

  /**
   * Handles customer selection from modal
   * @param customerId - Selected customer ID
   */
  const handleCustomerSelect = (customerId: string): void => {
    setSelectedCustomerId(customerId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId: selectedLocationId,
      customerId
    });
    //console.log('Cliente seleccionado en Demand Forecast:', customerId);
  };

  /**
   * Updates chart data when forecast data changes
   * @param data - New forecast data array
   */
  const handleForecastDataUpdate = (data: ForecastData[]): void => {
    setChartData(data);
  };

  /**
   * Clears all filters and resets to default state
   */
  const handleClearFilters = (): void => {
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

  // ===== COLLABORATION METRICS CALCULATION =====
  /**
   * Calculates dynamic collaboration metrics based on interpretability data
   * @returns Object containing calculated metrics or default values
   */
  const calculateCollaborationMetrics = () => {
    if (!interpretabilityData.length) {
      return {
        forecastAccuracy: 85,
        responseTime: "3.2 días",
        compliance: 82,
        marketAlignment: 78
      };
    }

    const avgAccuracy = interpretabilityData.reduce((sum, item) => sum + (item.interpretability_score || 0), 0) / interpretabilityData.length;
    const highConfidenceCount = interpretabilityData.filter(item => item.confidence_level === 'Alta').length;
    const confidenceRatio = (highConfidenceCount / interpretabilityData.length) * 100;

    return {
      forecastAccuracy: Math.round(avgAccuracy),
      responseTime: avgAccuracy > 80 ? "2.1 días" : "3.5 días",
      compliance: Math.round(confidenceRatio),
      marketAlignment: Math.round((avgAccuracy + confidenceRatio) / 2)
    };
  };

  const collaborationMetrics = calculateCollaborationMetrics();

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* ===== FILTER SECTION ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Product Filter - Required */}
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
              
              {/* Location Filter - Optional */}
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
                {/* Individual clear button for location */}
                {selectedLocationId && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setSelectedLocationId('');
                      saveFiltersToStorage({
                        productId: selectedProductId,
                        locationId: '',
                        customerId: selectedCustomerId
                      });
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Customer Filter - Optional */}
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
                {/* Individual clear button for customer */}
                {selectedCustomerId && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setSelectedCustomerId('');
                      saveFiltersToStorage({
                        productId: selectedProductId,
                        locationId: selectedLocationId,
                        customerId: ''
                      });
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
            </div>
            
            {/* Global clear all filters button */}
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

      {/* ===== TAB INTERFACE ===== */}
      <Tabs defaultValue="plan-demanda" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plan-demanda">Plan de la demanda</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        {/* ===== PLAN DE DEMANDA TAB ===== */}
        <TabsContent value="plan-demanda" className="space-y-6 mt-6">
          {/* Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Pronósticos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualización de datos de pronóstico vs. valores reales
                {!selectedProductId ? 
                  " - Selecciona producto para ver datos" : 
                  `${selectedLocationId ? ` - Ubicación: ${selectedLocationId}` : ' - Todas las ubicaciones'}${selectedCustomerId ? ` - Cliente: ${selectedCustomerId}` : " - Todos los clientes"}`
                }
              </p>
            </CardHeader>
            <CardContent>
              <ForecastChart data={chartData} />
            </CardContent>
          </Card>

          {/* Forecast Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Datos de Pronóstico</CardTitle>
              <p className="text-sm text-muted-foreground">
                Datos detallados con capacidad de edición para Demand Planner
                {!selectedProductId ? 
                  " - Selecciona producto para ver datos" : 
                  `${selectedLocationId ? ` - Ubicación: ${selectedLocationId}` : ' - Todas las ubicaciones'}${selectedCustomerId ? ` - Cliente: ${selectedCustomerId}` : " - Todos los clientes"}`
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ForecastDataTable 
                selectedProductId={selectedProductId}
                selectedLocationId={selectedLocationId}
                selectedCustomerId={selectedCustomerId}
                onDataUpdate={handleForecastDataUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== MÉTRICAS TAB ===== */}
        <TabsContent value="metricas" className="space-y-6 mt-6">
          <MetricsDashboard 
            selectedProductId={selectedProductId}
            selectedLocationId={selectedLocationId}
            selectedCustomerId={selectedCustomerId}
          />
        </TabsContent>

        {/* ===== OUTLIERS TAB ===== */}
        <TabsContent value="outliers" className="space-y-6 mt-6">
          <OutliersTab 
            selectedProductId={selectedProductId}
            selectedCustomerId={selectedCustomerId}
            selectedLocationId={selectedLocationId}
          />
        </TabsContent>
      </Tabs>

      {/* ===== MODALS ===== */}
      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
      />

      {/* Location Selection Modal */}
      <LocationSelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={handleLocationSelect}
      />

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
}
