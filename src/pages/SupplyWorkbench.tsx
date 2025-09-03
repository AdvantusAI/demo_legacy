import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Filter, Truck, X } from "lucide-react";
import { ProductSelectionModal } from "@/components/ProductSelectionModal";
import { LocationSelectionModal } from "@/components/LocationSelectionModal";
import { CustomerSelectionModal } from "@/components/CustomerSelectionModal";
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';

import { InventoryProjectionsChart } from "@/components/InventoryProjectionsChart";
import { useInventoryProjectionsChart } from "@/hooks/useInventoryProjectionsChart";
import { useState, useEffect, useCallback } from "react";

export default function SupplyWorkbench() {
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

  const { data, loading, error, fetchChartData } = useInventoryProjectionsChart();

  // ===== LOCAL STORAGE HELPERS =====
  /**
   * Retrieves stored filters from localStorage
   * @returns Object containing stored filter values or empty object if none exist
   */
  const getStoredFilters = (): Partial<{ productId: string; locationId: string; customerId: string }> => {
    try {
      const stored = localStorage.getItem('supplyWorkbenchFilters');
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
      localStorage.setItem('supplyWorkbenchFilters', JSON.stringify(filters));
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

  // Fetch chart data when filters change
  useEffect(() => {
    fetchChartData({
      product_id: filterProductId || undefined,
      location_id: filterLocationId || undefined,
      customer_id: filterCustomerId || undefined,
    });
  }, [filterProductId, filterLocationId, filterCustomerId, fetchChartData]);

  return (
    <div className="flex-1 space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Supply Workbench</h2>
      </div>

      {/* ===== FILTER SECTION ===== */}
      <Card className="p-4">
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
      </Card>

      {/* Inventory Projections Chart */}
      <InventoryProjectionsChart
        data={data}
        loading={loading}
        error={error}
        onFiltersChange={(filters) => {
          // This will be handled by the chart component's internal filters
        }}
      />

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