import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ForecastDataTableProps {
  selectedProductId?: string;
  selectedLocationId?: string;
  selectedCustomerId?: string;
  onDataUpdate?: (data: ForecastData[]) => void;
}
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
export function ForecastDataTable({
  selectedProductId,
  selectedLocationId,
  selectedCustomerId,
  onDataUpdate
}: ForecastDataTableProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingValues, setEditingValues] = useState<{[key: string]: number | null}>({});
  const [savingValues, setSavingValues] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Only fetch data if product is selected (location is now optional)
    if (selectedProductId) {
      fetchForecastData();
    } else {
      // Clear data if product is not selected
      setForecastData([]);
    }
  }, [selectedProductId, selectedLocationId, selectedCustomerId]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(forecastData);
    }
  }, [forecastData, onDataUpdate]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
     
      // Use manual aggregation approach since the database aggregation is causing issues
      await fetchAndAggregateManually();
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndAggregateManually = async () => {
    try {
      let query = supabase
        .schema('m8_schema')
        .from('forecast_with_fitted_history')
        .select('product_id,location_id,customer_id,postdate,forecast,actual,sales_plan,demand_planner,forecast_ly,upper_bound,lower_bound,commercial_input,fitted_history')
        .eq('product_id', selectedProductId!)
        .order('postdate');
      
      // Apply location filter only if selected
      if (selectedLocationId) {
        query = query.eq('location_id', selectedLocationId);
      }
      
      // Apply vendor filter only if selected - use customer_id field for vendor filtering
      if (selectedCustomerId) {
        query = query.eq('customer_id', selectedCustomerId);
      }
      
      
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching forecast data for manual aggregation:', error);
        return;
      }
      
      
      
      // Group and aggregate by postdate
      const aggregatedData = new Map<string, ForecastData>();
      
      (data || []).forEach(item => {
        const postdate = item.postdate;
        
        if (!aggregatedData.has(postdate)) {
          aggregatedData.set(postdate, {
            postdate,
            forecast: 0,
            actual: 0,
            sales_plan: 0,
            demand_planner: 0,
            forecast_ly: 0,
            upper_bound: 0,
            lower_bound: 0,
            commercial_input: 0,
            fitted_history: 0
          });
        }
        
        const existing = aggregatedData.get(postdate)!;
        
        // Sum the numerical values
        existing.forecast = (existing.forecast || 0) + (item.forecast || 0);
        existing.actual = (existing.actual || 0) + (item.actual || 0);
        existing.sales_plan = (existing.sales_plan || 0) + (item.sales_plan || 0);
        existing.demand_planner = (existing.demand_planner || 0) + (item.demand_planner || 0);
        existing.forecast_ly = (existing.forecast_ly || 0) + (item.forecast_ly || 0);
        existing.commercial_input = (existing.commercial_input || 0) +  (item.commercial_input || 0); 
        existing.fitted_history = (existing.fitted_history || 0) + (item.fitted_history || 0);
        
    
      });
      
      // Convert to array and sort by postdate
      const result = Array.from(aggregatedData.values()).sort((a, b) => 
        new Date(a.postdate).getTime() - new Date(b.postdate).getTime()
      );

      //console.log('Aggregated forecast data:', result);
      setForecastData(result);
      
    } catch (error) {
      console.error('Error in manual aggregation:', error);
    }
  };

  const handleDemandPlannerChange = async (date: string, value: string) => {
    // Only allow editing if a vendor is selected
    if (!selectedCustomerId) {
      return;
    }

    // Only allow numbers and decimal points
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const numericValue = value === '' ? null : parseFloat(value);
    const key = `${date}`;
    
    setEditingValues(prev => ({
      ...prev,
      [key]: numericValue
    }));
  };

  const saveDemandPlannerValue = async (date: string) => {
    if (!selectedCustomerId || !selectedProductId) {
      return;
    }

    const key = `${date}`;
    const newValue = editingValues[key];
    
    if (newValue === undefined) {
      return;
    }

    setSavingValues(prev => ({ ...prev, [key]: true }));

    try {
      // Build the update query with filters
      let query = supabase
        .from('forecast_data')
        .update({ demand_planner: newValue })
        .eq('postdate', date)
        .eq('product_id', selectedProductId)
        .eq('customer_id', selectedCustomerId);

      // Apply location filter if selected
      if (selectedLocationId) {
        query = query.eq('location_id', selectedLocationId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      // Update local state to reflect the change
      setForecastData(prev => prev.map(item => 
        item.postdate === date 
          ? { ...item, demand_planner: newValue }
          : item
      ));

      // Clear the editing value since it's now saved
      setEditingValues(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });

      toast.success('Valor guardado exitosamente');
    } catch (error) {
      console.error('Error saving demand planner value:', error);
      toast.error('Error al guardar el valor');
    } finally {
      setSavingValues(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>, date: string) => {
    if (event.key === 'Enter') {
      saveDemandPlannerValue(date);
      event.currentTarget.blur();
    }
  };

  const handleBlur = (date: string) => {
    const key = `${date}`;
    if (editingValues.hasOwnProperty(key)) {
      saveDemandPlannerValue(date);
    }
  };

  const getDemandPlannerValue = (date: string, originalValue: number | null) => {
    const key = `${date}`;
    return editingValues.hasOwnProperty(key) ? editingValues[key] : originalValue;
  };

  const {
    tableData,
    uniqueDates
  } = useMemo(() => {
    if (!forecastData.length) return {
      tableData: [],
      uniqueDates: []
    };
    
    const uniqueDates = [...new Set(forecastData.map(item => item.postdate))].sort();
    const seriesData = [{
      series: 'Actual',
      type: 'actual'
    }, {
      series: 'Forecast',
      type: 'forecast'
    }, {
      series: 'Objetivo de ventas',
      type: 'sales_plan'
    }, {
      series: 'Demand Planner',
      type: 'demand_planner'
    }, {
      series: 'Forecast LY',
      type: 'forecast_ly'
    }, {
      series: 'Plan Comercial',
      type: 'commercial_input'
    }, {
      series: 'Historia ajustada',
      type: 'fitted_history'
    }
  
  ];
    
    const tableData = seriesData.map(row => {
      const rowData = {
        ...row
      };
      uniqueDates.forEach(date => {
        const dataPoint = forecastData.find(item => item.postdate === date);
        if (dataPoint) {
          rowData[date] = dataPoint[row.type as keyof ForecastData];
        } else {
          rowData[date] = null;
        }
      });
      return rowData;
    });
    
    return {
      tableData,
      uniqueDates
    };
  }, [forecastData]);

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const downloadCSV = () => {
    if (!forecastData.length) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Create CSV headers
    const headers = ['Serie', ...uniqueDates];
    
    // Create CSV rows
    const csvRows = [headers.join(',')];
    
    tableData.forEach(row => {
      const csvRow = [
        row.series,
        ...uniqueDates.map(date => {
          const value = row[date] as number | null;
          return value !== null && value !== undefined ? value.toString() : '';
        })
      ];
      csvRows.push(csvRow.join(','));
    });

    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `datos_pronostico_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Archivo CSV descargado exitosamente');
  };
  
  const getYearGroups = () => {
    const yearGroups: {
      [year: string]: string[];
    } = {};
    uniqueDates.forEach(date => {
      const year = new Date(date).getFullYear().toString();
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(date);
    });
    return yearGroups;
  };
  
  if (!selectedProductId) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground">
            Selecciona producto para ver los datos
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            El producto es obligatorio para cargar la información
          </div>
        </div>
      </div>;
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando datos de pronóstico...</div>
          <div className="text-sm text-muted-foreground mt-2">
            Filtros: Producto {selectedProductId}
            {selectedLocationId && `, Ubicación ${selectedLocationId}`}
            {selectedCustomerId && `, Proveedor ${selectedCustomerId}`}
          </div>
        </div>
      </div>;
  }
  
  if (!forecastData.length) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground">No se encontraron datos de pronóstico</div>
          <div className="text-sm text-muted-foreground mt-2">
            Filtros aplicados: Producto {selectedProductId}
            {selectedLocationId && `, Ubicación ${selectedLocationId}`}
            {selectedCustomerId && `, Proveedor ${selectedCustomerId}`}
          </div>
        </div>
      </div>;
  }
  
  const yearGroups = getYearGroups();
  return <div className="w-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <div className="text-sm text-muted-foreground">
            Datos agregados por fecha - Mostrando totales por postdate
            {selectedLocationId && ` para ubicación ${selectedLocationId}`}
            {selectedCustomerId ? ` filtrado por proveedor ${selectedCustomerId}` : ' (todos los proveedores)'}
          </div>
        {!selectedCustomerId && (
          <div className="text-sm text-orange-600 mt-1">
            ⚠️ Selecciona un proveedor para editar los valores del Demand Planner
          </div>
        )}
          {selectedCustomerId && (
            <div className="text-sm text-blue-600 mt-1">
              💡 Presiona Enter o haz clic fuera del campo para guardar los cambios
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar CSV
        </Button>
      </div>
      
      <ScrollArea className="w-full">
        <div className="relative">
          <table className="w-full min-w-fit border-collapse border">
            <thead>
              {/* Year headers */}
              <tr className="border-b">
                <th className="text-left py-2 px-3 bg-gray-50 font-medium min-w-[168px] sticky left-0 z-10 border-r">Series</th>
                {Object.entries(yearGroups).map(([year, dates]) => <th key={year} className="text-center py-2 px-3 bg-gray-50 font-medium border-r" colSpan={dates.length}>
                    {year}
                  </th>)}
              </tr>
              {/* Date headers */}
              <tr className="border-b">
                <th className="text-left py-2 px-3 bg-gray-50 font-medium sticky left-0 z-10 border-r"></th>
                {uniqueDates.map(date => (
                  <th key={date} className="text-center py-1 px-3 bg-gray-50 text-xs min-w-28 border-r">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => 
                <tr key={row.series} className={`border-b hover:bg-muted/50 ${rowIndex === 0  ? 'bg-blue-50' : rowIndex === 3 ? 'bg-orange-50' : rowIndex % 2 === 0 ? 'bg-blue-50' : rowIndex === 5  ? 'bg-green-50' : 'bg-white'}`}>
                  <td className="font-medium bg-gray-50 sticky left-0 z-10 whitespace-nowrap border-r">
                    {row.series}
                  </td>
                  {uniqueDates.map(date => {
                    const key = `${date}`;
                    const isSaving = savingValues[key];
                    
                    // Check if current cell should be highlighted (row 5 with different value from row 0)
                    const shouldHighlight = rowIndex === 6 && tableData[0] && 
                      (row[date] as number) !== (tableData[0][date] as number);
                    
                    return (
                      <td key={date} className={`py-2 px-4 text-right text-sm min-w-28 border-r ${shouldHighlight ? 'bg-red-200' : ''}`}>
                        {row.series === 'Demand Planner' ? (
                          selectedCustomerId ? (
                            <div className="relative">
                              <Input
                                type="text"
                                value={getDemandPlannerValue(date, row[date] as number) || ''}
                                onChange={(e) => handleDemandPlannerChange(date, e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, date)}
                                onBlur={() => handleBlur(date)}
                                className="h-8 w-full text-right text-sm border-none bg-transparent p-2 focus:bg-white focus:border-input"
                                placeholder="0"
                                title="Presiona Enter o haz clic fuera para guardar"
                                disabled={isSaving}
                              />
                              {isSaving && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                  <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-8 w-full text-right text-sm p-2 text-gray-400 bg-gray-50 rounded">
                              {formatNumber(row[date] as number)}
                            </div>
                          )
                        ) : (
                          formatNumber(row[date] as number)
                        )}
                      </td>
                    );
                  })}
                </tr>)}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
    </div>;
}
