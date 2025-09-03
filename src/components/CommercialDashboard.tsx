import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, X, Package, MapPin, Filter, Truck, TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart } from 'lucide-react';
import { useCommercialCollaboration } from '@/hooks/useCommercialCollaboration';
import { useForecastCollaboration } from '@/hooks/useForecastCollaboration';
import { ForecastCollaborationTable } from '@/components/ForecastCollaborationTable';
import { AggregatedProductSelectionModal } from '@/components/AggregatedProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';

export function CommercialDashboard() {
  const [searchParams] = useSearchParams();
  
  // Helper functions for localStorage persistence
  const getStoredFilters = () => {
    try {
      const stored = localStorage.getItem('commercialCollaborationFilters');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveFiltersToStorage = (filters: { productId: string; locationId: string; customerId: string }) => {
    try {
      localStorage.setItem('commercialCollaborationFilters', JSON.stringify(filters));
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
  const {
    assignments,
    loading: commercialLoading
  } = useCommercialCollaboration();
  const {
    forecastData,
    comments,
    loading: forecastLoading
  } = useForecastCollaboration(selectedProductId, selectedLocationId, selectedCustomerId, selectedAggregation?.type);

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
  
  const handleProductSelect = (selection: { type: 'category' | 'subcategory' | 'product'; id: string; name: string; productCount?: number }) => {
    setSelectedProductId(selection.id);
    setSelectedAggregation(selection);
    saveFiltersToStorage({
      productId: selection.id,
      locationId: selectedLocationId,
      customerId: selectedCustomerId
    });
    //console.log('Selección realizada en Commercial Dashboard:', selection);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId,
      customerId: selectedCustomerId
    });
    //console.log('Ubicación seleccionada en Commercial Dashboard:', locationId);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    saveFiltersToStorage({
      productId: selectedProductId,
      locationId: selectedLocationId,
      customerId
    });
    //console.log('Cliente seleccionado en Commercial Dashboard:', customerId);
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
    //console.log('Filtros limpiados en Commercial Dashboard');
  };
  if (commercialLoading || forecastLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando dashboard comercial...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Comercial</h1>
          <p className="text-muted-foreground">
            Colaboración en pronósticos
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="forecasts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forecasts">Colaboración en Pronósticos</TabsTrigger>
          <TabsTrigger value="customers">Mis Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4 mt-6">
          {/* Always visible filter info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  
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

          <ForecastCollaborationTable data={forecastData} comments={comments} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Asignados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona tus cuentas clave y territorios
              </p>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin asignaciones</h3>
                  <p className="text-muted-foreground">
                    Contacta al administrador para configurar tus clientes asignados.
                  </p>
                </div> : <div className="space-y-3">
                  {assignments.map(assignment => <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{assignment.customer_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Desde: {new Date(assignment.start_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={assignment.assignment_type === 'primary' ? 'default' : 'secondary'}>
                        {assignment.assignment_type}
                      </Badge>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selection Modals */}
      <AggregatedProductSelectionModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSelect={selection => {
      handleProductSelect(selection);
      setIsProductModalOpen(false);
    }} />

      <LocationSelectionModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSelect={locationId => {
      handleLocationSelect(locationId);
      setIsLocationModalOpen(false);
    }} />

      <CustomerSelectionModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSelect={customerId => {
      handleCustomerSelect(customerId);
      setIsCustomerModalOpen(false);
    }} selectedCustomerId={selectedCustomerId} />
    </div>;
}