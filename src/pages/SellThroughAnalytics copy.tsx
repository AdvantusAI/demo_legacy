import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellThroughAnalyticsDashboard } from '@/components/SellThroughAnalyticsDashboard';
import { SellInOutDataEntry } from '@/components/SellInOutDataEntry';
import { SalesVelocityReports } from '@/components/SalesVelocityReports';
import { AggregatedProductSelectionModal } from '@/components/AggregatedProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
import { BarChart3, Database, Zap, Package, MapPin, Filter, Truck, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';

export default function SellThroughAnalytics() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Helper functions for localStorage persistence
  const getStoredFilters = () => {
    try {
      const stored = localStorage.getItem('sellThroughAnalyticsFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveFiltersToStorage = (filters: { productId: string; locationId: string; customerId: string }) => {
    try {
      localStorage.setItem('sellThroughAnalyticsFilters', JSON.stringify(filters));
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
    searchParams.get('location_node_id') || storedFilters.locationId || ''
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get('customer_id') || storedFilters.customerId || ''
  );
  
  // New state for aggregated selection
  const [selectedAggregation, setSelectedAggregation] = useState<{
    type: 'category' | 'subcategory' | 'product';
    id: string;
    name: string;
    productCount?: number;
  } | null>(null);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();
  const { getCustomerName } = useCustomers();

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Update state when URL parameters change
  useEffect(() => {
    const productParam = searchParams.get('product_id');
    const locationParam = searchParams.get('location_node_id');
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
  
  const handleProductSelect = (selection: { type: 'category' | 'subcategory' | 'product'; id: string; name: string; productCount?: number }) => {
    setSelectedProductId(selection.id);
    setSelectedAggregation(selection);
    saveFiltersToStorage({
      productId: selection.id,
      locationId: selectedLocationId,
      customerId: selectedCustomerId
    });
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId,
      customerId: selectedCustomerId
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId: selectedLocationId,
      customerId
    });
  };

  const handleClearFilters = () => {
    setSelectedProductId('');
    setSelectedLocationId('');
    setSelectedCustomerId('');
    setSelectedAggregation(null);
    saveFiltersToStorage({
      productId: '',
      locationId: '',
      customerId: ''
    });
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold">Análisis de Ventas a Través de Canales</h1>
          <p className="text-lg text-muted-foreground">
            Seguimiento y análisis integral del rendimiento de ventas desde la entrada hasta la salida
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Product Filter */}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Producto/Categoría:</span>
                {selectedProductId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedProductId}</Badge>
                    <Badge variant="secondary">
                      {selectedAggregation ? (
                        <>
                          {selectedAggregation.name}
                          {selectedAggregation.productCount && selectedAggregation.type !== 'product' && (
                            <span className="ml-1 text-xs">({selectedAggregation.productCount} productos)</span>
                          )}
                        </>
                      ) : (
                        getProductName(selectedProductId)
                      )}
                    </Badge>
                    {selectedAggregation && (
                      <Badge variant="outline" className="text-xs">
                        {selectedAggregation.type === 'category' ? 'Categoría' : 
                         selectedAggregation.type === 'subcategory' ? 'Subcategoría' : 'Producto'}
                      </Badge>
                    )}
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
              
              {/* Location Filter */}
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

              {/* Customer Filter */}
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
            
            {/* Clear All Filters Button */}
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

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Panel de Análisis
          </TabsTrigger>
          <TabsTrigger value="velocity" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Reportes de Velocidad
          </TabsTrigger>
          <TabsTrigger value="data-entry" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Entrada de Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SellThroughAnalyticsDashboard 
            selectedProductId={selectedProductId}
            selectedLocationId={selectedLocationId}
            selectedCustomerId={selectedCustomerId}
            selectedAggregation={selectedAggregation}
          />
        </TabsContent>

        <TabsContent value="velocity">
          <SalesVelocityReports 
            selectedProductId={selectedProductId}
            selectedLocationId={selectedLocationId}
            selectedCustomerId={selectedCustomerId}
            selectedAggregation={selectedAggregation}
          />
        </TabsContent>

        <TabsContent value="data-entry">
          <SellInOutDataEntry 
            selectedProductId={selectedProductId}
            selectedLocationId={selectedLocationId}
            selectedCustomerId={selectedCustomerId}
            selectedAggregation={selectedAggregation}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Components */}
      <AggregatedProductSelectionModal
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