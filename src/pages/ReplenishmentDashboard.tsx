import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { 
  Truck,
  Package, 
  RefreshCw,
  MapPin,
  X,
  Filter
} from 'lucide-react';
import { SupplyPlanService } from '@/services/supplyPlanService';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { SupplyPlanAgGrid } from '@/components/replenishment/SupplyPlanAgGrid';
import { PurchaseOrderRecommendationsGrid } from '@/components/replenishment/PurchaseOrderRecommendationsGrid';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';

import { commonAgGridConfig, agGridContainerStyles } from '../lib/ag-grid-config';

// Type definition for filter storage
interface FilterStorage {
  productId: string;
  locationId: string;
}

const ReplenishmentDashboard: React.FC = () => {
  // ===== URL PARAMETERS =====
  // Temporarily disabled for debugging
  // const [searchParams, setSearchParams] = useSearchParams();
  
  // ===== LOCAL STORAGE HELPERS =====
  const getStoredFilters = (): Partial<FilterStorage> => {
    try {
      const stored = localStorage.getItem('replenishmentDashboardFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveFiltersToStorage = (filters: FilterStorage): void => {
    try {
      localStorage.setItem('replenishmentDashboardFilters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  };

  // ===== STATE MANAGEMENT =====
  const storedFilters = getStoredFilters();
  
  // Get initial values from stored filters only (URL params temporarily disabled)
  const getInitialProduct = () => {
    return storedFilters.productId || '';
  };
  
  const getInitialLocation = () => {
    return storedFilters.locationId || '';
  };
  
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>(getInitialProduct());
  const [selectedLocation, setSelectedLocation] = useState<string>(getInitialLocation());
  const [availableProducts, setAvailableProducts] = useState<Array<{product_id: string, location_node_id?: string}>>([]);
  const [supplyPlanData, setSupplyPlanData] = useState<any[]>([]);
  
  // Modal visibility states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  // ===== HOOKS =====
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();

  // Load available products
  const loadAvailableProducts = useCallback(async () => {
    try {
      // For now, we'll use a simple approach - the ProductSelectionModal will handle product loading
      setAvailableProducts([{ product_id: 'sample', location_node_id: undefined }]);
    } catch (error) {
      console.error('Error loading available products:', error);
      toast.error('Error al conectar con la base de datos.');
      setAvailableProducts([]);
    }
  }, [selectedProduct]);

  // Load supply plan data when filters change
  const loadSupplyPlanData = useCallback(async () => {
    if (!selectedProduct || !selectedLocation) {
      setSupplyPlanData([]);
      return;
    }

    setLoading(true);
    try {
      const data = await SupplyPlanService.getSupplyPlanData({
        productId: selectedProduct,
        locationId: selectedLocation
      });
      setSupplyPlanData(data);
    } catch (error) {
      console.error('Error loading supply plan data:', error);
      toast.error('Error al cargar datos del plan de suministro');
      setSupplyPlanData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, selectedLocation]);

  // ===== EVENT HANDLERS =====
  const handleProductSelect = (productId: string): void => {
    setSelectedProduct(productId);
    saveFiltersToStorage({
      productId,
      locationId: selectedLocation
    });
  };

  const handleLocationSelect = (locationId: string): void => {
    setSelectedLocation(locationId);
    saveFiltersToStorage({
      productId: selectedProduct,
      locationId
    });
  };

  const handleClearFilters = (): void => {
    // Clear localStorage first
    try {
      localStorage.removeItem('replenishmentDashboardFilters');
    } catch (error) {
      console.warn('Failed to clear filters from localStorage:', error);
    }
    
    // Clear state
    setSelectedProduct('');
    setSelectedLocation('');
    
    console.log('Filters cleared - selectedProduct:', '', 'selectedLocation:', '');
  };

  useEffect(() => {
    loadAvailableProducts();
  }, [loadAvailableProducts]);

  useEffect(() => {
    loadSupplyPlanData();
  }, [loadSupplyPlanData]);

  // URL parameter handling temporarily disabled for debugging
  // useEffect(() => {
  //   if (isClearingFilters) return; // Skip if we're clearing filters
  //   
  //   const urlProductId = searchParams.get('product_id');
  //   const urlLocationId = searchParams.get('location_node_id');
  //   
  //   if (urlProductId && urlProductId !== selectedProduct) {
  //     setSelectedProduct(urlProductId);
  //   }
  //   
  //   if (urlLocationId && urlLocationId !== selectedLocation) {
  //     setSelectedLocation(urlLocationId);
  //   }
  // }, [searchParams, selectedProduct, selectedLocation, isClearingFilters]);

  // Update URL when filters change - temporarily disabled
  // useEffect(() => {
  //   const newSearchParams = new URLSearchParams(searchParams);
  //   
  //   if (selectedProduct) {
  //     newSearchParams.set('product_id', selectedProduct);
  //   } else {
  //     newSearchParams.delete('product_id');
  //   }
  //   
  //   if (selectedLocation) {
  //     newSearchParams.set('location_node_id', selectedLocation);
  //   } else {
  //     newSearchParams.delete('location_node_id');
  //   }
  //   
  //   setSearchParams(newSearchParams, { replace: true });
  // }, [selectedProduct, selectedLocation, searchParams, setSearchParams]);

  // Check if both filters are selected
  const showDataTable = selectedProduct && selectedLocation;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}

      {/* ===== FILTER SECTION ===== */}
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Product Filter - Required */}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Producto:</span>
                {selectedProduct ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedProduct}</Badge>
                    <Badge variant="secondary">{getProductName(selectedProduct)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {availableProducts.length === 0 ? 'No hay productos disponibles' : 'No seleccionado (obligatorio)'}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsProductModalOpen(true)}
                  className="ml-2 h-8 w-8"
                  disabled={availableProducts.length === 0}
                  title={availableProducts.length === 0 ? 'No hay productos disponibles en la base de datos' : 'Seleccionar producto'}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Location Filter - Optional */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Ubicación:</span>
                {selectedLocation ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedLocation}</Badge>
                    <Badge variant="secondary">{getLocationName(selectedLocation)}</Badge>
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
                {selectedLocation && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setSelectedLocation('');
                      saveFiltersToStorage({
                        productId: selectedProduct,
                        locationId: ''
                      });
                    }}
                    className="h-8 w-8"
                    title="Limpiar solo ubicación"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Global clear all filters button */}
            {(selectedProduct || selectedLocation) && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={handleClearFilters}
                  className="h-8 w-8"
                  title="Limpiar todos los filtros (producto y ubicación)"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="h-8 px-3 text-xs"
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== MODAL COMPONENTS ===== */}
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

      {/* ===== SUPPLY PLAN DATA TABLE ===== */}
      {showDataTable ? (
        
        <div className="space-y-6">
          <SupplyPlanAgGrid
            productId={selectedProduct}
            locationId={selectedLocation}
          />
          
          {/* Purchase Order Recommendations Grid */}
          <Card>
            <CardContent className="p-0">
              <PurchaseOrderRecommendationsGrid
                productId={selectedProduct}
                locationId={selectedLocation}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Package className="h-12 w-12 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Seleccione filtros para ver el plan de suministro
                </p>
                <p className="text-sm text-gray-500">
                  Se requiere seleccionar tanto un producto como una ubicación para visualizar los datos
                </p>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsProductModalOpen(true)}
                  disabled={!selectedProduct}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  {selectedProduct ? 'Cambiar Producto' : 'Seleccionar Producto'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsLocationModalOpen(true)}
                  disabled={!selectedProduct}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {selectedLocation ? 'Cambiar Ubicación' : 'Seleccionar Ubicación'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReplenishmentDashboard;