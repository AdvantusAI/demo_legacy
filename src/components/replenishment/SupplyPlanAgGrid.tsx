import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgGridReact } from 'ag-grid-react';

import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { commonAgGridConfig, agGridContainerStyles } from '../../lib/ag-grid-config';
import { 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Package,
  Palette
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// Add custom styles for the demanda total row
const customStyles = `
  /* Custom styles can be added here if needed */
`;

interface SupplyPlanRow {
  node_name: string;
  postdate: string;
  forecast?: number;
  actual?: number;
  total_demand?: number;
  planned_arrivals?: number;
  planned_orders?: number;
  projected_on_hand?: number;
  safety_stock?: number;
  metric?: string;
  [key: string]: any; // Allow dynamic properties for date columns
}

interface SupplyPlanAgGridProps {
  productId: string;
  locationId: string;
}

const METRICS = [
  { key: 'forecast', label: 'Forecast' },
  { key: 'actual', label: 'Actual' },
  { key: 'total_demand', label: 'Demanda Total' },
  { key: 'planned_arrivals', label: 'Llegadas Planificadas' },
  { key: 'planned_orders', label: 'Órdenes Planificadas' },
  { key: 'safety_stock', label: 'Stock de Seguridad' }
];

export function SupplyPlanAgGrid({ productId, locationId }: SupplyPlanAgGridProps) {
  const [data, setData] = useState<SupplyPlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);
  const [showColorCustomization, setShowColorCustomization] = useState(false);
  const [chartColors, setChartColors] = useState({
    inventarioProyectado: '#4285F4',
    demandaTotal: '#DB4437',
    stockDeSeguridad: '#FFA500'
  });

  const loadData = useCallback(async () => {
    if (!productId || !locationId) return;

    setLoading(true);
    try {
      const { data: rawData, error } = await (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan_pivot')
        .select('*')
        .eq('product_id', productId)
        .eq('location_code', locationId);

      if (error) throw error;

      if (!rawData || rawData.length === 0) {
        setData([]);
        toast.info('No se encontraron datos para los filtros seleccionados');
        return;
      }

             // The pivot table structure has metrics as rows, so we need to transform the row labels
       const transformedData = rawData.map(row => {
         const transformedRow: any = { ...row };
         
         // Transform the metric name if it exists in the row
         if (transformedRow.metric) {
           const metricMappings: { [key: string]: string } = {
             'total_demand': 'Demanda Total',
             'planned_arrivals': 'Llegadas Planificadas',
             'planned_orders': 'Órdenes Planificadas',
             'projected_on_hand': 'Inventario Proyectado',
             'safety_stock': 'Stock de Seguridad',
             'forecast': 'Forecast',
             'actual': 'Actual'
           };
           
           transformedRow.metric = metricMappings[transformedRow.metric] || transformedRow.metric;
         }
         
         return transformedRow;
       });
       
       setData(transformedData);
    } catch (error) {
      console.error('Error loading supply plan data:', error);
      toast.error('Error al cargar datos del plan de suministro');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [productId, locationId]);

  const formatValue = (value: number) => {
    // Enhanced formatting with better number display
    const formatted = Math.abs(value).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (value < 0) {
      return `(${formatted})`;
    }
    return formatted;
  };

  // Prepare chart data from the pivot data
  const chartData = useMemo(() => {
   
    if (data.length === 0) return [];

    ////console.log('First row keys:', Object.keys(data[0]));
    //console.log('Available metrics:', data.map(row => row.metric));
    //console.log('First row data:', data[0]);

    // Get all date columns (excluding metric and other non-date columns)
    // The date columns are in format "2025_09_01", "2025_09_02", etc. (with underscores)
    const dateColumns = Object.keys(data[0]).filter(key => 
      !['metric', 'node_name', 'product_id', 'location_node_id', 'location_code'].includes(key) &&
      (key.includes('date') || key.includes('Date') || /^\d{4}-\d{2}-\d{2}$/.test(key) || /^\d{4}\s\d{2}\s\d{2}$/.test(key) || /^\d{4}_\d{2}_\d{2}$/.test(key))
    );

    //console.log('Date columns found:', dateColumns);

    // Find the rows for Demanda Total, Inventario Proyectado, and Stock de Seguridad
    // Since the data is already transformed, we look for the Spanish names
    const demandaTotalRow = data.find(row => row.metric === 'Demanda Total');
    const inventarioProyectadoRow = data.find(row => row.metric === 'Inventario Proyectado');
    const stockDeSeguridadRow = data.find(row => row.metric === 'Stock de Seguridad');

    //console.log('Demanda Total row found:', !!demandaTotalRow);
    //console.log('Inventario Proyectado row found:', !!inventarioProyectadoRow);
    //console.log('Stock de Seguridad row found:', !!stockDeSeguridadRow);
    //console.log('Demanda Total row metric:', demandaTotalRow?.metric);
    //console.log('Inventario Proyectado row metric:', inventarioProyectadoRow?.metric);
    //console.log('Stock de Seguridad row metric:', stockDeSeguridadRow?.metric);

    if (!demandaTotalRow || !inventarioProyectadoRow) {
      //console.log('Missing required rows for chart');
      return [];
    }

    // Create chart data points
    const chartDataPoints = dateColumns.map(dateCol => {
      // Parse date from "2025_09_01" format to Date object
      const [year, month, day] = dateCol.split('_');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return {
        date: format(dateObj, 'dd/MM/yyyy', { locale: es }),
        originalDate: dateCol,
        demandaTotal: demandaTotalRow[dateCol] || 0,
        inventarioProyectado: inventarioProyectadoRow[dateCol] || 0,
        stockDeSeguridad: stockDeSeguridadRow ? (stockDeSeguridadRow[dateCol] || 0) : 0
      };
    });

    //console.log('Chart data points created:', chartDataPoints.length);
    //console.log('Sample chart data:', chartDataPoints.slice(0, 3));

    return chartDataPoints;
  }, [data]);

  const getCellStyle = (params: any) => {
    const value = params.value;
    const field = params.column.getColId();
    
    // Base styling with proper padding and typography
    const baseStyle = {
      paddingLeft: '12px',
      paddingRight: '12px',
      fontSize: '13px',
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'all 0.2s ease'
    };
    
    // Special handling for Demanda Total row
    if (params.data?.metric === 'Demanda Total') {
      if (field === 'metric') {
        // Keep metric column with default background
        return {
          ...baseStyle,
          backgroundColor: 'transparent'
        };
      } else {
        // Apply orange background to all other columns in Demanda Total row
        return {
          ...baseStyle,
          backgroundColor: '#faf0e3'
        };
      }
    }
    
    // Special handling for Órdenes Planificadas row
    if (params.data?.metric === 'Órdenes Planificadas') {
      if (field === 'metric') {
        // Keep metric column with default background
        return {
          ...baseStyle,
          backgroundColor: 'transparent'
        };
      } else {
        // Apply green background to all other columns in Órdenes Planificadas row
        return {
          ...baseStyle,
          backgroundColor: '#f0faf1'
        };
      }
    }
    
    // Special handling for Inventario Proyectado row - compare with Stock de Seguridad
    if (params.data?.metric === 'Inventario Proyectado') {
      if (field === 'metric') {
        // Keep metric column with default background
        return {
          ...baseStyle,
          backgroundColor: 'transparent'
        };
      } else {
        // Find the corresponding Stock de Seguridad value for this column
        const stockDeSeguridadRow = data.find(row => row.metric === 'Stock de Seguridad');
        const stockDeSeguridadValue = stockDeSeguridadRow ? stockDeSeguridadRow[field] : null;
        const projectedInventoryValue = params.value;
        
        // If projected inventory is less than or equal to safety stock, highlight with red
        if (typeof projectedInventoryValue === 'number' && 
            typeof stockDeSeguridadValue === 'number' && 
            projectedInventoryValue <= stockDeSeguridadValue) {
          return {
            ...baseStyle,
            backgroundColor: '#fadede'
          };
        }
      }
    }
    
    // Handle numeric columns with conditional formatting
    if (typeof value === 'number') {
      if (field === 'projected_on_hand') {
        if (value < 0) {
          // Critical level - strong red with subtle gradient
          return { 
            ...baseStyle,
            background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#991b1b',
            fontWeight: '600',
            borderLeft: '3px solid #dc2626'
          };
        } else if (value < params.data.safety_stock) {
          // Warning level - amber with gradient
          return { 
            ...baseStyle,
            background: 'linear-gradient(90deg, #fefce8 0%, #fef3c7 100%)',
            color: '#92400e',
            fontWeight: '500',
            borderLeft: '3px solid #f59e0b'
          };
        } else {
          // Healthy level - green with gradient
          return { 
            ...baseStyle,
            background: 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)',
            color: '#14532d',
            fontWeight: '500'
          };
        }
      } else if (field === 'total_demand' && value > 0) {
        return { 
          ...baseStyle,
          color: '#dc2626',
          fontWeight: '500',
          backgroundColor: '#fef2f2'
        };
      } else if (['planned_arrivals', 'planned_orders'].includes(field) && value > 0) {
        return { 
          ...baseStyle,
          color: '#059669',
          fontWeight: '500',
          backgroundColor: '#ecfdf5'
        };
      } else if (field === 'safety_stock') {
        return { 
          ...baseStyle,
          color: '#6b7280',
          fontStyle: 'italic',
          backgroundColor: '#f9fafb'
        };
      } else if (value === 0) {
        return { 
          ...baseStyle,
          color: '#d1d5db',
          fontSize: '12px'
        };
      }
    }
    
    // Default styling for all other columns (including date columns)
    return baseStyle;
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    if (data.length === 0) return [];

    // Get all column names from the first row
    const firstRow = data[0];
    const allColumns = Object.keys(firstRow);
    
    const baseColumns: ColDef[] = [];
    
    // Track if we've added the first column (to pin it)
    let isFirstColumn = true;

    // Add all other columns dynamically
    allColumns.forEach(column => {
      // Skip unwanted columns
      if (['node_name', 'product_id', 'location_node_id', 'location_code'].includes(column)) return;
      
      const isDateColumn = column.includes('date') || column.includes('Date');
      const isNumericColumn = typeof firstRow[column] === 'number';
      
             baseColumns.push({
         headerName: column === 'metric' ? 'Métrica' : (column === 'total_demand' ? 'Demanda Total' : column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
         field: column,
                   width: isDateColumn ? 100 : (column === 'metric' ? 160 : 120),
         type: isNumericColumn ? 'numericColumn' : undefined,
         pinned: isFirstColumn ? 'left' : undefined,
         headerClass: column === 'metric' ? 'font-bold text-gray-800' : (column === 'total_demand' ? 'font-bold text-gray-800' : 'font-semibold text-gray-800'),
         autoHeight: true,
         wrapText: true,
         filter: false,
         floatingFilter: false,
        valueFormatter: (params: ValueFormatterParams) => {
          if (params.value !== null && params.value !== undefined) {
            if (isDateColumn && params.value) {
              return format(parseISO(params.value), 'dd/MM/yyyy', { locale: es });
            }
            if (isNumericColumn) {
              return formatValue(params.value);
            }
            return params.value.toString();
          }
          return '';
        },
                 cellStyle: getCellStyle,
        cellRenderer: isNumericColumn ? (params: ICellRendererParams) => {
          const value = params.value;
          const field = params.column.getColId();
          
          // Enhanced cell renderer with icons and styling
          const getIcon = () => {
            if (field === 'projected_on_hand' && value < 0) {
              return <AlertTriangle className="h-3.5 w-3.5 text-red-600 animate-pulse" />;
            }
            if (field === 'planned_arrivals' && value > 0) {
              return (
                <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              );
            }
            if (field === 'planned_orders' && value > 0) {
              return (
                <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              );
            }
            return null;
          };
          
          return (
            <div className="flex items-center justify-end h-full px-2 group">
              <span className="font-medium tabular-nums">
                {formatValue(value || 0)}
              </span>
              {getIcon() && (
                <span className="ml-2 transition-transform group-hover:scale-110">
                  {getIcon()}
                </span>
              )}
            </div>
          );
                 } : undefined
       });
       
       // Set flag to false after first column is added
       if (isFirstColumn) {
         isFirstColumn = false;
       }
     });

    return baseColumns;
  }, [data]);

  const exportToExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `supply_plan_${productId}_${locationId}_${new Date().toISOString().split('T')[0]}.csv`
      });
    }
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };



  const handleColorChange = (metric: string, color: string) => {
    setChartColors(prev => ({
      ...prev,
      [metric]: color
    }));
  };

  const resetColors = () => {
    setChartColors({
      inventarioProyectado: '#4285F4',
      demandaTotal: '#DB4437',
      stockDeSeguridad: '#FFA500'
    });
  };

  useEffect(() => {
    if (productId && locationId) {
      loadData();
    }
  }, [loadData]);

  if (!productId || !locationId) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando datos del plan de suministro...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay datos disponibles
              </h3>
              <p className="text-gray-600">
                No se encontraron datos para el producto {productId} en la ubicación {locationId}.
              </p>
            </div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Plan de Suministro
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-gray-600">Producto:</span>
                  <span className="font-semibold text-gray-900">{productId}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-medium text-gray-600">Ubicación:</span>
                  <span className="font-semibold text-gray-900">{locationId}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToExcel}
                  className="bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-all hover:shadow-sm"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">
                Gráfico de Demanda e Inventario
              </h3>
              <p className="text-sm text-gray-600">
                Visualización de Demanda Total vs Inventario Proyectado - {productId} - {locationId}
              </p>
              <p className="text-xs text-gray-500">
                Chart data points: {chartData.length} | Data rows: {data.length}
              </p>
            </div>
                         <Button 
               variant="outline"
               size="sm"
               onClick={() => setShowColorCustomization(!showColorCustomization)}
               className="bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-sm rounded-md"
             >
               <Palette className="h-4 w-4 mr-1.5" />
               Personalizar Colores
             </Button>
          </div>
          
          {/* Color Customization Panel */}
          {showColorCustomization && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">Personalizar Colores del Gráfico</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetColors}
                  className="text-xs px-2 py-1"
                >
                  Restablecer
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Inventario Proyectado</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chartColors.inventarioProyectado}
                      onChange={(e) => handleColorChange('inventarioProyectado', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{chartColors.inventarioProyectado}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Demanda Total</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chartColors.demandaTotal}
                      onChange={(e) => handleColorChange('demandaTotal', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{chartColors.demandaTotal}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Stock de Seguridad</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chartColors.stockDeSeguridad}
                      onChange={(e) => handleColorChange('stockDeSeguridad', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{chartColors.stockDeSeguridad}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Bar 
                    dataKey="inventarioProyectado" 
                    name="Inventario Proyectado"
                    fill={chartColors.inventarioProyectado} 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                                     <Line 
                     type="monotone" 
                     dataKey="demandaTotal" 
                     name="Demanda Total"
                     stroke={chartColors.demandaTotal} 
                     strokeWidth={3}
                     dot={{ fill: chartColors.demandaTotal, strokeWidth: 2, r: 4 }}
                     activeDot={{ r: 6, stroke: chartColors.demandaTotal, strokeWidth: 2, fill: '#fff' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="stockDeSeguridad" 
                     name="Stock de Seguridad"
                     stroke={chartColors.stockDeSeguridad} 
                     strokeWidth={2}
                     strokeDasharray="5 5"
                     dot={{ fill: chartColors.stockDeSeguridad, strokeWidth: 2, r: 3 }}
                     activeDot={{ r: 5, stroke: chartColors.stockDeSeguridad, strokeWidth: 2, fill: '#fff' }}
                   />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No hay datos disponibles para el gráfico</p>
                <p className="text-sm text-gray-400">
                  Se requieren las métricas "Demanda Total" e "Inventario Proyectado"
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Datos disponibles: {data.map(row => row.metric).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: "20px" }}>
        </div>
        
        {/* AG Grid Section */}
        <div className={`${agGridContainerStyles}`} style={{ height: '18vh',  margin: '0 auto' }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={data}
            defaultColDef={{
              ...commonAgGridConfig.defaultColDef,
              filter: false,
              floatingFilter: false,
              menuTabs: ['generalMenuTab', 'columnsMenuTab']
            }}
            theme={commonAgGridConfig.theme}
            pagination={false}
            paginationPageSize={20}
            suppressRowClickSelection={false}
            enableRangeSelection={true}
            suppressMenuHide={true}
            getRowClass={(params: any) => {
              const classes = [];
              if (params.node.rowIndex % 2 === 0) {
                classes.push('ag-row-even');
              } else {
                classes.push('ag-row-odd');
              }
              if (params.data?.projected_on_hand < 0) {
                classes.push('border-l-4 border-l-red-500');
              }
              return classes.join(' ');
            }}
            onGridReady={onGridReady}
          />
        </div>
      </div>
    </>
  );
}
