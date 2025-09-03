import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { commonAgGridConfig, agGridContainerStyles, pivotTableConfig } from '../lib/ag-grid-config';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Package, MapPin, Filter, Truck, X } from 'lucide-react';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { LocationSelectionModal } from '@/components/LocationSelectionModal';
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useCustomers } from '@/hooks/useCustomers';

interface ForecastData {
  customer_id: string;
  postdate: string;
  product_id: string;
  subcategory_id: string;
  forecast_ly: number;
  forecast_sales_gap: number;
  forecast: number;
  approved_sm_kam: number;
  sm_kam_override: number;
  forecast_sales_manager: number;
  commercial_input: number;
}

interface CustomerData {
  customer_id: string;
  customer_name: string;
  product_id?: string;
  months: { [key: string]: {
    last_year: number;
    forecast_sales_gap: number;
    calculated_forecast: number;
    xamview: number;
    kam_forecast_correction: number;
    sales_manager_view: number;
    effective_forecast: number;
  }};
}



const ForecastCollaboration: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerData[]>([]);
  const [rawForecastData, setRawForecastData] = useState<ForecastData[]>([]);
  const [customerNames, setCustomerNames] = useState<{[key: string]: string}>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{customerId: string, month: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [inlineEditingCell, setInlineEditingCell] = useState<{customerId: string, month: string} | null>(null);
  const [inlineEditingValue, setInlineEditingValue] = useState<string>('');
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [salesTrends, setSalesTrends] = useState({
    currentPeriod: 0,
    lastYearPeriod: 0,
    growthPercentage: 0,
    trendDirection: 'neutral' as 'up' | 'down' | 'neutral'
  });
  const [kamApprovals, setKamApprovals] = useState<{[key: string]: {[key: string]: string}}>({});

  const months = ['oct-24', 'nov-24', 'dic-24', 'ene-25', 'feb-25', 'mar-25', 'abr-25', 'may-25', 'jun-25', 'jul-25', 'ago-25', 'sep-25', 'oct-25', 'nov-25', 'dic-25'];
  const dataTypes = ['Año pasado (LY)', 'Gap Forecast vs ventas', 'Forecast M8.predict', 'Key Account Manager', 'Kam Forecast', 'Sales manager view', 'Effective Forecast', 'KAM aprobado'];

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

  // ===== LOCAL STORAGE HELPERS =====
  /**
   * Retrieves stored filters from localStorage
   * @returns Object containing stored filter values or empty object if none exist
   */
  const getStoredFilters = (): Partial<{ productId: string; locationId: string; customerId: string }> => {
    try {
      const stored = localStorage.getItem('forecastCollaborationFilters');
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
      localStorage.setItem('forecastCollaborationFilters', JSON.stringify(filters));
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
    saveFiltersToStorage({
      productId,
      locationId: filterLocationId,
      customerId: filterCustomerId
    });
  };

  /**
   * Handles location selection from modal
   * @param locationId - Selected location ID
   */
  const handleLocationSelect = (locationId: string): void => {
    setFilterLocationId(locationId);
    saveFiltersToStorage({
      productId: filterProductId,
      locationId,
      customerId: filterCustomerId
    });
  };

  /**
   * Handles customer selection from modal
   * @param customerId - Selected customer ID
   */
  const handleCustomerSelect = (customerId: string): void => {
    setFilterCustomerId(customerId);
    saveFiltersToStorage({
      productId: filterProductId,
      locationId: filterLocationId,
      customerId
    });
  };

  /**
   * Clears all filters and resets to default state
   */
  const handleClearFilters = (): void => {
    setFilterProductId('');
    setFilterLocationId('');
    setFilterCustomerId('');
    saveFiltersToStorage({
      productId: '',
      locationId: '',
      customerId: ''
    });
  };

  // Process raw data into customer format with filtering
  const processForecastData = useCallback((rawData: ForecastData[], customerNamesMap: {[key: string]: string}) => {
    const groupedData: { [key: string]: CustomerData } = {};
    
    rawData.forEach((row: ForecastData) => {
      // Group by customer_id and product_id combination
      const customerProductKey = `${row.customer_id}-${row.product_id || 'no-product'}`;
      
      if (!groupedData[customerProductKey]) {
        groupedData[customerProductKey] = {
          customer_id: row.customer_id,
          customer_name: customerNamesMap[row.customer_id] || `Customer ${row.customer_id}`,
          product_id: row.product_id || 'no-product',
          months: {}
        };
      }

      // Parse postdate to extract month and year
      const date = new Date(row.postdate);
      const month = date.getMonth() + 1; // 1-based month
      const year = date.getFullYear();
      
      const monthKey = `${month.toString().padStart(2, '0')}-${year.toString().slice(-2)}`;
      const monthMap: { [key: string]: string } = {
        '10-24': 'oct-24', '11-24': 'nov-24', '12-24': 'dic-24',
        '01-25': 'ene-25', '02-25': 'feb-25', '03-25': 'mar-25',
        '04-25': 'abr-25', '05-25': 'may-25', '06-25': 'jun-25',
        '07-25': 'jul-25', '08-25': 'ago-25', '09-25': 'sep-25',
        '10-25': 'oct-25', '11-25': 'nov-25', '12-25': 'dic-25'
      };
      
      const displayMonth = monthMap[monthKey];
      if (displayMonth && groupedData[customerProductKey]) {
        // Initialize month data if it doesn't exist
        if (!groupedData[customerProductKey].months[displayMonth]) {
          groupedData[customerProductKey].months[displayMonth] = {
            last_year: 0,
            forecast_sales_gap: 0,
            calculated_forecast: 0,
            xamview: 0,
            kam_forecast_correction: 0,
            sales_manager_view: 0,
            effective_forecast: 0
          };
        }
        
        // Add the values (this allows aggregation if multiple products exist for same customer/month)
        groupedData[customerProductKey].months[displayMonth].last_year += row.forecast_ly || 0;
        groupedData[customerProductKey].months[displayMonth].forecast_sales_gap += row.forecast_sales_gap || 0;
        groupedData[customerProductKey].months[displayMonth].calculated_forecast += row.forecast || 0;
        groupedData[customerProductKey].months[displayMonth].xamview += row.approved_sm_kam || 0;
        groupedData[customerProductKey].months[displayMonth].kam_forecast_correction += row.sm_kam_override || 0;
        groupedData[customerProductKey].months[displayMonth].sales_manager_view += row.forecast_sales_manager || 0;
        groupedData[customerProductKey].months[displayMonth].effective_forecast += row.commercial_input || row.forecast || 0;
      }
    });

    return Object.values(groupedData);
  }, []);

  const fetchForecastData = useCallback(async (isFilterOperation = false) => {
    try {
      if (isFilterOperation) {
        setFilterLoading(true);
      }
      
      // First, fetch customer names
      const { data: customersData, error: customersError } = await supabase
        .schema('m8_schema')
        .from('customers')
        .select('customer_id,customer_name');

      if (customersError) throw customersError;

      const customerNamesMap: {[key: string]: string} = {};
      
      customersData?.forEach(customer => {
        customerNamesMap[customer.customer_id] = customer.customer_name;
      });
      
      setCustomerNames(customerNamesMap);

      // Then fetch forecast data using the new commercial_collaboration_view
      let query = supabase
        .schema('m8_schema')
        .from('commercial_collaboration_view')
        .select('customer_id,postdate,forecast_ly,forecast,approved_sm_kam,sm_kam_override,forecast_sales_manager,commercial_input,forecast_sales_gap,product_id,subcategory_id')
        .order('customer_id', { ascending: true })
        .order('postdate', { ascending: true });

      // Apply filters
      if (filterProductId) {
        query = query.eq('product_id', filterProductId);
      }
      if (filterLocationId) {
        query = query.eq('location_id', filterLocationId);
      }
      if (filterCustomerId) {
        query = query.eq('customer_id', filterCustomerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Store raw data for filtering
      setRawForecastData(data || []);

      // Process the data using the new function
      const allCustomersData = processForecastData(data || [], customerNamesMap);
      setAllCustomers(allCustomersData);
      setCustomers(allCustomersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [processForecastData, filterProductId, filterLocationId, filterCustomerId]);



  useEffect(() => {
    fetchForecastData();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    fetchForecastData(true);
  }, [filterProductId, filterLocationId, filterCustomerId]);


  
  const calculateTotal = useCallback((field: string) => {
    const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
      ? customers.filter(customer => customer.customer_id === selectedCustomerId)
      : customers;
      
    return customersToUse.reduce((total, customer) => {
      return total + months.reduce((monthTotal, month) => {
        const monthData = customer.months[month];
        return monthTotal + (monthData ? (monthData as Record<string, number>)[field] || 0 : 0);
      }, 0);
    }, 0);
  }, [customers, months, selectedCustomerId]);

  const calculateSalesTrends = useCallback(() => {
    const currentPeriod = calculateTotal('effective_forecast');
    const lastYearPeriod = calculateTotal('last_year');
    
    let growthPercentage = 0;
    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
    
    if (lastYearPeriod > 0) {
      growthPercentage = ((currentPeriod - lastYearPeriod) / lastYearPeriod) * 100;
      trendDirection = growthPercentage > 0 ? 'up' : growthPercentage < 0 ? 'down' : 'neutral';
    }
    
    setSalesTrends({
      currentPeriod,
      lastYearPeriod,
      growthPercentage,
      trendDirection
    });
  }, [calculateTotal]);

  // Calculate sales trends when filters change
  useEffect(() => {
    calculateSalesTrends();
  }, [customers, selectedCustomerId]);

  const handleDoubleClick = useCallback((customerId: string, month: string, currentValue: number) => {
    setEditingCell({ customerId, month });
    setEditingValue(currentValue.toString());
  }, []);

  const handleSaveEdit = useCallback(async (customerId: string, month: string) => {
    const newValue = parseFloat(editingValue) || 0;
    
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => {
        if (customer.customer_id === customerId) {
          return {
            ...customer,
            months: {
              ...customer.months,
              [month]: {
                ...customer.months[month],
                kam_forecast_correction: newValue
              }
            }
          };
        }
        return customer;
      })
    );
    
    setEditingCell(null);
    setEditingValue('');
  }, [editingValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, customerId: string, month: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(customerId, month);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleKamApprovalChange = useCallback((customerId: string, month: string, value: string) => {
    setKamApprovals(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [month]: value
      }
    }));
  }, []);

  const handleInlineEditStart = useCallback((customerId: string, month: string, currentValue: number) => {
    // Prevent multiple rapid double-clicks
    if (inlineEditingCell) return;
    
    // Use requestAnimationFrame to defer the state update and prevent blocking
    requestAnimationFrame(() => {
      setInlineEditingCell({ customerId, month });
      setInlineEditingValue(currentValue.toString());
    });
  }, [inlineEditingCell]);

  const handleInlineEditSave = useCallback((customerId: string, month: string) => {
    const newValue = parseFloat(inlineEditingValue) || 0;
    
    // Use setTimeout to defer the heavy computation and prevent blocking the UI
    setTimeout(() => {
      setCustomers(prevCustomers => {
        // If editing the "all" level, apply fair share formula to individual customers
        if (customerId === 'all') {
          // Calculate total effective forecast for all customers in this month
          const totalEffectiveForecast = prevCustomers.reduce((total, customer) => {
            const monthData = customer.months[month];
            return total + (monthData ? monthData.effective_forecast : 0);
          }, 0);
          
          // Apply fair share formula to each customer
          return prevCustomers.map(customer => {
            const monthData = customer.months[month];
            const customerEffectiveForecast = monthData ? monthData.effective_forecast : 0;
            
            // Calculate fair share: (customer's effective forecast / total effective forecast) * new total value
            let fairShareValue = 0;
            if (totalEffectiveForecast > 0) {
              fairShareValue = (customerEffectiveForecast / totalEffectiveForecast) * newValue;
            }
            
            return {
              ...customer,
              months: {
                ...customer.months,
                [month]: {
                  ...monthData,
                  kam_forecast_correction: Math.ceil(fairShareValue) // Round up to ensure integer numbers
                }
              }
            };
          });
        } else {
          // Individual customer edit - update only that customer
          return prevCustomers.map(customer => {
            if (customer.customer_id === customerId) {
              return {
                ...customer,
                months: {
                  ...customer.months,
                  [month]: {
                    ...customer.months[month],
                    kam_forecast_correction: newValue
                  }
                }
              };
            }
            return customer;
          });
        }
      });
    }, 0);
    
    setInlineEditingCell(null);
    setInlineEditingValue('');
  }, [inlineEditingValue]);

  const handleInlineEditCancel = useCallback(() => {
    setInlineEditingCell(null);
    setInlineEditingValue('');
  }, []);

  const handleInlineKeyPress = useCallback((e: React.KeyboardEvent, customerId: string, month: string) => {
    if (e.key === 'Enter') {
      handleInlineEditSave(customerId, month);
    } else if (e.key === 'Escape') {
      handleInlineEditCancel();
    }
  }, [handleInlineEditSave, handleInlineEditCancel]);

  // AG Grid column definitions
  const customerColumnDefs: ColDef[] = [
    {
      field: 'customer_id',
      headerName: 'ID Cliente',
      width: 120,
      cellStyle: { fontWeight: 'bold' }
    },
    {
      field: 'customer_name',
      headerName: 'Nombre del Cliente',
      flex: 1,
      minWidth: 200
    }
  ];

  const productCategoryColumnDefs: ColDef[] = [
    {
      field: 'category_id',
      headerName: 'ID Categoría',
      width: 120,
      cellStyle: { fontWeight: 'bold' }
    },
    {
      field: 'category_name',
      headerName: 'Categoría',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'subcategory_id',
      headerName: 'ID Subcategoría',
      width: 120
    },
    {
      field: 'subcategory_name',
      headerName: 'Subcategoría',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'customer_id',
      headerName: 'ID Cliente',
      width: 120
    }
  ];

  // AG Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    console.log('Customer grid ready:', params);
  }, []);







  // Filter customers based on selection
  const filteredCustomers = useCallback(() => {
    let filtered = customers;
    
    // Filter by customer if selected
    if (selectedCustomerId && selectedCustomerId !== 'all') {
      filtered = filtered.filter(customer => customer.customer_id === selectedCustomerId);
    }
    
    return filtered;
  }, [customers, selectedCustomerId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Obteniendo datos de demanda y colaboración</h3>
        <p className="text-sm text-gray-500">Esto puede tomar unos segundos...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Error al cargar los datos</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Colaboración en Pronósticos</h1>
      
      {/* ===== FILTER SECTION ===== */}
      <Card className="mb-6">
        <CardContent className="p-4">
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
                      saveFiltersToStorage({
                        productId: filterProductId,
                        locationId: '',
                        customerId: filterCustomerId
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
                      saveFiltersToStorage({
                        productId: filterProductId,
                        locationId: filterLocationId,
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
        </CardContent>
      </Card>
      

      
      {/* Sales Trends Collapsible Panel */}
      <Collapsible 
        open={isCollapsibleOpen} 
        onOpenChange={setIsCollapsibleOpen}
        className="mb-6"
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tendencias de Ventas</CardTitle>
                {isCollapsibleOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Period Sales */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ventas Período Actual</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {salesTrends.currentPeriod.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="text-blue-500">
                        <TrendingUp className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Year Sales */}
                <Card className="border-l-4 border-l-gray-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ventas Año Anterior</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {salesTrends.lastYearPeriod.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="text-gray-500">
                        <Minus className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Percentage */}
                <Card className={`border-l-4 ${
                  salesTrends.trendDirection === 'up' 
                    ? 'border-l-green-500' 
                    : salesTrends.trendDirection === 'down' 
                    ? 'border-l-red-500' 
                    : 'border-l-gray-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Crecimiento vs Año Anterior</p>
                        <p className={`text-2xl font-bold ${
                          salesTrends.trendDirection === 'up' 
                            ? 'text-green-600' 
                            : salesTrends.trendDirection === 'down' 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {salesTrends.growthPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className={`${
                        salesTrends.trendDirection === 'up' 
                          ? 'text-green-500' 
                          : salesTrends.trendDirection === 'down' 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                      }`}>
                        {salesTrends.trendDirection === 'up' ? (
                          <TrendingUp className="h-8 w-8" />
                        ) : salesTrends.trendDirection === 'down' ? (
                          <TrendingDown className="h-8 w-8" />
                        ) : (
                          <Minus className="h-8 w-8" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Forecast Collaboration Data
            {(filterProductId || filterLocationId || filterCustomerId) ? (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Filtrado por: 
                {filterProductId && (
                  <span className="ml-1">Producto: {filterProductId}</span>
                )}
                {filterLocationId && (
                  <span className="ml-1">
                    {filterProductId ? ', ' : ''}
                    Ubicación: {filterLocationId}
                  </span>
                )}
                {filterCustomerId && (
                  <span className="ml-1">
                    {(filterProductId || filterLocationId) ? ', ' : ''}
                    Cliente: {customerNames[filterCustomerId]}
                  </span>
                )}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[80vh] max-w-full relative">
            {filterLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Actualizando datos...</p>
                </div>
              </div>
            )}
            <table className="w-full border-collapse border border-gray-300 text-xs min-w-[1200px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="sticky left-0 bg-gray-200 border-r border-gray-300 p-2 text-left font-semibold min-w-[150px] max-w-[150px] z-10">
                    Cliente
                  </th>
                  <th className="sticky left-[150px] bg-gray-200 border-r border-gray-300 p-2 text-left font-semibold min-w-[120px] max-w-[120px] z-10">
                    Producto
                  </th>
                  <th className="sticky left-[270px] bg-gray-200 border-r border-gray-300 p-2 text-left font-semibold min-w-[120px] max-w-[120px] z-10">
                    Tipo
                  </th>
                  <th className="sticky left-[390px] bg-gray-200 border-r border-gray-300 p-2 text-center font-semibold min-w-[180px] max-w-[180px] z-10">
                    Detalle
                  </th>
                  {months.map(month => (
                    <th key={month} 
                        className={`border-r border-gray-300 p-2 text-center font-semibold min-w-[90px] max-w-[90px] ${
                          month.includes('24') ? 'bg-yellow-200' : 'bg-blue-200'
                        }`}>
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
          <tbody>
            {/* Todos los clientes section with rowspan */}
            {(!selectedCustomerId || selectedCustomerId === 'all') && (
              <React.Fragment>
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="sticky left-0 bg-gray-100 border-r border-gray-300 p-2 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis z-10" rowSpan={dataTypes.length}>
                Todos los clientes
              </td>
              <td className="sticky left-[150px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" rowSpan={dataTypes.length}>
                {filterProductId ? filterProductId : 'Todos los productos'}
              </td>
              <td className="sticky left-[270px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" colSpan={2}>Año pasado (LY)</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.last_year : 0);
                }, 0);
                
                return (
                  <td key={`all-${month}-last-year`} 
                      className={`border-r border-gray-200 p-1 text-right text-xs ${
                        month.includes('24') ? 'bg-yellow-200' : 'bg-gray-100'
                      }`}>
                    {totalValue ? totalValue.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-200">
          
              <td className="sticky left-[270px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" colSpan={2}>Gap Forecast vs ventas</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                
                // Calculate Gap Forecast vs ventas at total level
                // This should be the difference between total effective forecast and total last year sales
                const totalEffectiveForecast = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.effective_forecast : 0);
                }, 0);
                
                const totalLastYear = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.last_year : 0);
                }, 0);
                
                const totalGap = totalEffectiveForecast - totalLastYear;
                
                return (
                  <td key={`all-${month}-gap`} 
                      className={`border-r border-gray-200 p-1 text-right text-xs ${
                        month.includes('24') ? 'bg-yellow-50' : 'bg-white-50'
                      }`}
                      style={{ 
                        backgroundColor: totalGap < 0 ? '#fab7ac' : (month.includes('24') ? '#fef3c7' : '#dbeafe')
                      }}>
                    {totalGap ? totalGap.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            

            
            <tr className="border-b border-gray-200" style={{ backgroundColor: '#ffebd4' }}>
              <td className="sticky left-[270px] bg-[#ffebd4] border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Forecast M8.predict</td>
              <td className="sticky left-[390px] bg-[#ffebd4] border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Forecast</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.calculated_forecast : 0);
                }, 0);
                
                return (
                  <td key={`all-${month}-calculated`} 
                    
                      style={{ backgroundColor: month.includes('24') ? '#fef3c7' : '#ffebd4' }}>
                    {totalValue ? totalValue.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-200 bg-blue-100">
              <td className="sticky left-[270px] bg-blue-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Key Account Manager</td>
              <td className="sticky left-[390px] bg-blue-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Plan inicial de ventas</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.xamview : 0);
                }, 0);
                
                return (
                  <td key={`all-${month}-xamview`} 
                      className={`border-r border-gray-200 p-1 text-right text-xs ${
                        month.includes('24') ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                    {totalValue ? totalValue.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-200 bg-purple-100">
              <td rowSpan={2} className="sticky left-[270px] bg-purple-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Key Account Manager</td>
              <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Kam Forecast</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.kam_forecast_correction : 0);
                }, 0);
                
                const isEditing = inlineEditingCell?.customerId === 'all' && inlineEditingCell?.month === month;
                
                return (
                  <td key={`all-${month}-kam-correction`} 
                      className="border-r border-gray-200 p-1 text-right text-xs relative"
                      style={{ 
                        backgroundColor: totalValue > 0 ? '#7df6ff' : (month.includes('24') ? '#fef3c7' : '#dbeafe'),
                        cursor: 'pointer'
                      }}
                      onDoubleClick={() => handleInlineEditStart('all', month, totalValue)}>
                    {totalValue > 0 && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full transform translate-x-1 -translate-y-1 z-10"></div>
                    )}
                    {isEditing ? (
                      <input
                        type="number"
                        value={inlineEditingValue}
                        onChange={(e) => setInlineEditingValue(e.target.value)}
                        onKeyDown={(e) => handleInlineKeyPress(e, 'all', month)}
                        onBlur={() => handleInlineEditSave('all', month)}
                        className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-right"
                        autoFocus
                      />
                    ) : (
                      totalValue ? totalValue.toLocaleString('es-MX') : ''
                    )}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-200">
              
              <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs z-10">Plan de ventas (SM) </td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.sales_manager_view : 0);
                }, 0);
                
                return (
                  <td key={`all-${month}-sales-manager`} 
                      className={`border-r border-gray-200 p-1 text-right text-xs ${
                        month.includes('24') ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}>
                    {totalValue ? totalValue.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-300 bg-green-100">
              <td className="sticky left-[270px] bg-green-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Effective Forecast</td>
              <td className="sticky left-[390px] bg-green-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Forecast</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                const totalValue = customersToUse.reduce((sum, customer) => {
                  const monthData = customer.months[month];
                  return sum + (monthData ? monthData.effective_forecast : 0);
                }, 0);
                
                return (
                  <td key={`all-${month}-effective`} 
                      className={`border-r border-gray-200 p-1 text-right text-xs ${
                        month.includes('24') ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                    {totalValue ? totalValue.toLocaleString('es-MX') : ''}
                  </td>
                );
              })}
            </tr>
            
            <tr className="border-b border-gray-200 bg-purple-100">
              <td className="sticky left-[270px] bg-purple-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">KAM aprobado</td>
              <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Aprobación</td>
              {months.map(month => {
                const customersToUse = selectedCustomerId && selectedCustomerId !== 'all' 
                  ? customers.filter(customer => customer.customer_id === selectedCustomerId)
                  : customers;
                
                return (
                  <td key={`all-${month}-kam-approval`} 
                      className="border-r border-gray-200 p-1 text-center text-xs bg-purple-50">
                    <select 
                      className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                      defaultValue=""
                      onChange={(e) => {
                        // Handle approval for all customers
                        customersToUse.forEach(customer => {
                          handleKamApprovalChange(customer.customer_id, month, e.target.value);
                        });
                      }}
                    >
                      <option value="">-</option>
                      <option value="Si">Si</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                );
              })}
            </tr>
              </React.Fragment>
            )}

            {/* Individual customer sections */}
            {filteredCustomers().map(customer => (
              <React.Fragment key={`${customer.customer_id}-${customer.product_id}`}>
                {/* Customer header row with rowspan */}
                <tr className="bg-gray-100 border-b border-gray-300">
                  <td className="sticky left-0 bg-gray-100 border-r border-gray-300 p-2 font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis z-10" rowSpan={dataTypes.length}>
                    {customer.customer_name}
                  </td>
                  <td className="sticky left-[150px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" rowSpan={dataTypes.length}>
                    {customer.product_id || 'No producto'}
                  </td>
                   <td className="sticky left-[270px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" colSpan={2}>Año pasado (LY)</td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.last_year : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-last-year`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-200">
                <td className="sticky left-[270px] bg-gray-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10" colSpan={2}>Gap Forecast vs ventas</td>                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.forecast_sales_gap : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-gap`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}
                          style={{ 
                            backgroundColor: value < 0 ? '#fab7ac' : (month.includes('24') ? '#fef3c7' : '#dbeafe')
                          }}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                

                
                <tr className="border-b border-gray-200" style={{ backgroundColor: '#ffebd4' }}>
                  <td className="sticky left-[270px] bg-[#ffebd4] border-r border-gray-300 p-1 text-left text-xs z-10">Forecast M8.predict</td>
                  <td className="sticky left-[390px] bg-[#ffebd4] border-r border-gray-300 p-1 text-xs z-10">Forecast </td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.calculated_forecast : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-calculated`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}
                          style={{ backgroundColor: month.includes('24') ? '#fef3c7' : '#dbeafe' }}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-200 bg-blue-100">
                  <td className="sticky left-[270px] bg-blue-100 border-r border-gray-300 p-1 text-left text-xs z-10">Key Account Manager</td>
                  <td className="sticky left-[390px] bg-blue-100 border-r border-gray-300 p-1 text-xs z-10">Plan inicial de ventas </td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.xamview : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-xamview`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-200 bg-purple-100">
                  <td rowSpan={2} className="sticky left-[270px] bg-purple-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Key Account Manager</td>
                  <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Kam Forecast</td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.kam_forecast_correction : 0;
                    const isEditing = inlineEditingCell?.customerId === customer.customer_id && inlineEditingCell?.month === month;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-kam-forecast`} 
                          className="border-r border-gray-200 p-1 text-right text-xs relative"
                          style={{ 
                            backgroundColor: value > 0 ? '#7df6ff' : (month.includes('24') ? '#fef3c7' : '#dbeafe'),
                            cursor: 'pointer'
                          }}
                          onDoubleClick={() => handleInlineEditStart(customer.customer_id, month, value)}>
                        {value > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full transform translate-x-1 -translate-y-1 z-10"></div>
                        )}
                        {isEditing ? (
                          <input
                            type="number"
                            value={inlineEditingValue}
                            onChange={(e) => setInlineEditingValue(e.target.value)}
                            onKeyDown={(e) => handleInlineKeyPress(e, customer.customer_id, month)}
                            onBlur={() => handleInlineEditSave(customer.customer_id, month)}
                            className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-right"
                            autoFocus
                          />
                        ) : (
                          value ? value.toLocaleString('es-MX') : ''
                        )}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-200">
                  <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs z-10">Plan de ventas (SM) </td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.sales_manager_view : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-sales-manager`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-white-50' : 'bg-white-50'
                          }`}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-300 bg-green-100">
                  <td className="sticky left-[270px] bg-green-100 border-r border-gray-300 p-1 text-left text-xs z-10">Effective Forecast</td>
                  <td className="sticky left-[390px] bg-green-100 border-r border-gray-300 p-1 text-xs z-10">Forecast </td>
                  {months.map(month => {
                    const monthData = customer.months[month];
                    const value = monthData ? monthData.effective_forecast : 0;
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-effective`} 
                          className={`border-r border-gray-200 p-1 text-right text-xs ${
                            month.includes('24') ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                        {value ? value.toLocaleString('es-MX') : ''}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-gray-200 bg-purple-100">
                  <td className="sticky left-[270px] bg-purple-100 border-r border-gray-300 p-1 text-left text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">KAM aprobado</td>
                  <td className="sticky left-[390px] bg-purple-100 border-r border-gray-300 p-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis z-10">Aprobación</td>
                  {months.map(month => {
                    const currentValue = kamApprovals[customer.customer_id]?.[month] || '';
                    
                    return (
                      <td key={`${customer.customer_id}-${customer.product_id}-${month}-kam-approval`} 
                          className="border-r border-gray-200 p-1 text-center text-xs bg-purple-50">
                        <select 
                          className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                          value={currentValue}
                          onChange={(e) => handleKamApprovalChange(customer.customer_id, month, e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="Si">Si</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
            </table>
          </div>
          
          {/* Edit Modal */}
          {editingCell && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">
                  Edit Kam Forecast
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer: {editingCell.customerId === 'all' ? 'Todos los clientes' : customerNames[editingCell.customerId]}
                  </label>
                  <label className="block text-sm font-medium mb-2">
                    Month: {editingCell.month}
                  </label>
                </div>
                <input
                  type="number"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, editingCell.customerId, editingCell.month)}
                  className="w-full p-2 border border-gray-300 rounded mb-4"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(editingCell.customerId, editingCell.month)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
};

export default ForecastCollaboration;