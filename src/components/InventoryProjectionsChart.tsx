import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartDataPoint } from '@/services/inventoryProjectionsChartService';
import { Package, MapPin, Filter, Truck, X } from 'lucide-react';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';
import { useState, useCallback, useEffect } from 'react';

interface InventoryProjectionsChartProps {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  onFiltersChange?: (filters: { productId: string; locationId: string; customerId: string }) => void;
}

const chartConfig = {
  forecasted_demand: {
    label: "Demand",
    color: "hsl(var(--chart-1))",
  },
  projected_ending_inventory: {
    label: "Inventario",
    color: "hsl(var(--chart-2))",
  },
};

export function InventoryProjectionsChart({ data, loading, error, onFiltersChange }: InventoryProjectionsChartProps) {
  // ===== HOOKS =====
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();
  const { getCustomerName } = useCustomers();

  // ===== FILTER STATE =====
  // Filter state - product is required, location and customer are optional
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterLocationId, setFilterLocationId] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  
  // Modal visibility states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // ===== LOCAL STORAGE HELPERS =====
  /**
   * Retrieves stored filters from localStorage
   * @returns Object containing stored filter values or empty object if none exist
   */
  const getStoredFilters = (): Partial<{ productId: string; locationId: string; customerId: string }> => {
    try {
      const stored = localStorage.getItem('inventoryProjectionsFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  /**
   * Saves current filter state to localStorage for persistence
   * @param filters - Object containing filter values to store
   */
  const saveFiltersToStorage = (filters: { productId: string; locationId: string; customerId: string }): void => {
    try {
      localStorage.setItem('inventoryProjectionsFilters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  };

  // ===== FILTER EVENT HANDLERS =====
  /**
   * Handles product selection from modal
   * @param productId - Selected product ID
   */
  const handleProductSelect = (productId: string): void => {
    setFilterProductId(productId);
    const newFilters = {
      productId,
      locationId: filterLocationId,
      customerId: filterCustomerId
    };
    saveFiltersToStorage(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * Handles location selection from modal
   * @param locationId - Selected location ID
   */
  const handleLocationSelect = (locationId: string): void => {
    setFilterLocationId(locationId);
    const newFilters = {
      productId: filterProductId,
      locationId,
      customerId: filterCustomerId
    };
    saveFiltersToStorage(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * Handles customer selection from modal
   * @param customerId - Selected customer ID
   */
  const handleCustomerSelect = (customerId: string): void => {
    setFilterCustomerId(customerId);
    const newFilters = {
      productId: filterProductId,
      locationId: filterLocationId,
      customerId
    };
    saveFiltersToStorage(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * Clears all filters and resets to default state
   */
  const handleClearFilters = (): void => {
    setFilterProductId('');
    setFilterLocationId('');
    setFilterCustomerId('');
    const newFilters = {
      productId: '',
      locationId: '',
      customerId: ''
    };
    saveFiltersToStorage(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Load stored filters on component mount
  useEffect(() => {
    const storedFilters = getStoredFilters();
    if (storedFilters.productId) {
      setFilterProductId(storedFilters.productId);
    }
    if (storedFilters.locationId) {
      setFilterLocationId(storedFilters.locationId);
    }
    if (storedFilters.customerId) {
      setFilterCustomerId(storedFilters.customerId);
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Projections</CardTitle>
          <CardDescription>Monthly demand and inventory trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Projections</CardTitle>
          <CardDescription>Monthly demand and inventory trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Projections</CardTitle>
        <CardDescription>Monthly demand and inventory trends</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ===== FILTER SECTION ===== */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Product Filter - Required */}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Producto:</span>
                {filterProductId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{filterProductId}</Badge>
                    <Badge variant="secondary">{getProductName(filterProductId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionado (obligatorio)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsProductModalOpen(true)}
                  className="ml-2 h-8 w-8"
                  disabled={filterLoading}
                >
                  {filterLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Location Filter - Optional */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Ubicación:</span>
                {filterLocationId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{filterLocationId}</Badge>
                    <Badge variant="secondary">{getLocationName(filterLocationId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionada (opcional)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="ml-2 h-8 w-8"
                  disabled={filterLoading}
                >
                  {filterLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                </Button>
                {/* Individual clear button for location */}
                {filterLocationId && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setFilterLocationId('');
                      const newFilters = {
                        productId: filterProductId,
                        locationId: '',
                        customerId: filterCustomerId
                      };
                      saveFiltersToStorage(newFilters);
                      onFiltersChange?.(newFilters);
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
                {filterCustomerId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{filterCustomerId}</Badge>
                    <Badge variant="secondary">{getCustomerName(filterCustomerId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionado (opcional)</span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="ml-2 h-8 w-8"
                  disabled={filterLoading}
                >
                  {filterLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                </Button>
                {/* Individual clear button for customer */}
                {filterCustomerId && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setFilterCustomerId('');
                      const newFilters = {
                        productId: filterProductId,
                        locationId: filterLocationId,
                        customerId: ''
                      };
                      saveFiltersToStorage(newFilters);
                      onFiltersChange?.(newFilters);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
            </div>
            
            {/* Global clear all filters button */}
            {(filterProductId || filterLocationId || filterCustomerId) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearFilters}
                className="h-8 w-8"
                disabled={filterLoading}
              >
                {filterLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Chart Content */}
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">No data available. Please select filters to view projections.</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="projection_month" 
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short' 
                      });
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long' 
                      });
                    } catch {
                      return value;
                    }
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="forecasted_demand" 
                  stroke={chartConfig.forecasted_demand.color}
                  strokeWidth={2}
                  name={chartConfig.forecasted_demand.label}
                />
                <Line 
                  type="monotone" 
                  dataKey="projected_ending_inventory" 
                  stroke={chartConfig.projected_ending_inventory.color}
                  strokeWidth={2}
                  name={chartConfig.projected_ending_inventory.label}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

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
      </CardContent>
    </Card>
  );
}