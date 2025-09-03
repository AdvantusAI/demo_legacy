import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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
}

interface PivotData {
  node_name: string;
  dates: string[];
  metrics: {
    [date: string]: {
      forecast: number;
      actual: number;
      total_demand: number;
      planned_arrivals: number;
      planned_orders: number;
      projected_on_hand: number;
      safety_stock: number;
    };
  };
}

interface SupplyPlanDataTableProps {
  productId: string;
  locationId: string;
}

const METRICS = [
  { key: 'projected_on_hand', label: 'Inventario Proyectado', primary: true },
  { key: 'forecast', label: 'Forecast' },
  { key: 'actual', label: 'Actual' },
  { key: 'total_demand', label: 'Demanda Total' },
  { key: 'planned_arrivals', label: 'Llegadas Planificadas' },
  { key: 'planned_orders', label: 'Órdenes Planificadas' },
  { key: 'safety_stock', label: 'Stock de Seguridad' }
];

export function SupplyPlanDataTable({ productId, locationId }: SupplyPlanDataTableProps) {
  const [data, setData] = useState<PivotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('projected_on_hand');
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const loadData = async () => {
    if (!productId || !locationId) return;

    setLoading(true);
    try {
      const { data: rawData, error } = await (supabase as any)
        .schema('m8_schema')
        .from('v_meio_supply_plan')
        .select('*')
        .eq('product_id', productId)
        .eq('location_code', locationId)
        .order('postdate')
        .order('node_name');

      if (error) throw error;

      if (!rawData || rawData.length === 0) {
        setData([]);
        toast.info('No se encontraron datos para los filtros seleccionados');
        return;
      }

      // Pivot the data
      const pivoted = pivotData(rawData);
      setData(pivoted);
    } catch (error) {
      console.error('Error loading supply plan data:', error);
      toast.error('Error al cargar datos del plan de suministro');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const pivotData = (rawData: any[]): PivotData[] => {
    const grouped = rawData.reduce((acc, row) => {
      const key = row.node_name || 'Sin Nodo';
      if (!acc[key]) {
        acc[key] = {
          node_name: key,
          dates: [],
          metrics: {}
        };
      }
      
      const date = row.postdate;
      if (!acc[key].dates.includes(date)) {
        acc[key].dates.push(date);
      }
      
      acc[key].metrics[date] = {
        forecast: row.forecast || 0,
        actual: row.actual || 0,
        total_demand: row.total_demand || 0,
        planned_arrivals: row.planned_arrivals || 0,
        planned_orders: row.planned_orders || 0,
        projected_on_hand: row.projected_on_hand || 0,
        safety_stock: row.safety_stock || 0
      };
      
      return acc;
    }, {});

    // Get all unique dates and sort them
    const allDates = [...new Set(rawData.map(r => r.postdate))].sort();
    
    // Ensure all nodes have all dates
    return Object.values(grouped).map((node: any) => ({
      ...node,
      dates: allDates,
      metrics: allDates.reduce((acc, date) => {
        acc[date] = node.metrics[date] || {
          forecast: 0,
          actual: 0,
          total_demand: 0,
          planned_arrivals: 0,
          planned_orders: 0,
          projected_on_hand: 0,
          safety_stock: 0
        };
        return acc;
      }, {})
    }));
  };

  const getCellStyle = (value: number, metricKey: string, safetyStock?: number) => {
    let className = "min-w-20 p-2 border-r border-gray-200 text-right text-sm ";
    
    if (metricKey === 'projected_on_hand') {
      if (value < 0) {
        className += "bg-red-100 text-red-900 font-bold";
      } else if (safetyStock && value < safetyStock) {
        className += "bg-yellow-100 text-yellow-800 font-medium";
      } else {
        className += "bg-green-50 text-green-800";
      }
    } else if (metricKey === 'total_demand' && value > 0) {
      className += "text-red-700 font-medium";
    } else if (['planned_arrivals', 'planned_orders'].includes(metricKey) && value > 0) {
      className += "text-green-700 font-medium";
    } else if (value === 0) {
      className += "text-gray-400";
    } else {
      className += "text-gray-700";
    }
    
    return className;
  };

  const formatValue = (value: number) => {
    if (value < 0) {
      return `(${Math.abs(value).toLocaleString('es-MX')})`;
    }
    return value.toLocaleString('es-MX');
  };

  const exportToExcel = () => {
    toast.success('Función de exportación en desarrollo');
  };

  useEffect(() => {
    loadData();
  }, [productId, locationId]);

  if (!productId || !locationId) {
    return null; // Don't show table when filters not selected
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

  const allDates = data[0]?.dates || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Plan de Suministro por Nodo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Producto: {productId} | Ubicación: {locationId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map(metric => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllMetrics(!showAllMetrics)}
            >
              {showAllMetrics ? 'Vista Simple' : 'Todas las Métricas'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {/* Header Row */}
            <div className="flex bg-gray-100 border-b border-gray-200">
              <div className="w-48 p-3 font-semibold text-gray-800 border-r border-gray-200 sticky left-0 z-20 bg-gray-100 shadow-sm">
                Nodo
              </div>
              <div className="flex">
                {allDates.map(date => (
                  <div key={date} className="min-w-20 p-3 border-r border-gray-200 text-center">
                    <div className="font-semibold text-gray-800 text-xs">
                      {format(parseISO(date), 'dd/MM', { locale: es })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(parseISO(date), 'yyyy', { locale: es })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Rows */}
            {data.map(node => (
              <div key={node.node_name} className="flex border-b border-gray-100">
                {/* Node Name Column */}
                <div className="w-48 p-3 font-medium text-gray-800 border-r border-gray-200 sticky left-0 z-20 bg-white flex items-center shadow-sm">
                  <Package className="h-4 w-4 mr-2 text-blue-500" />
                  {node.node_name}
                </div>
                
                {/* Data Columns */}
                <div className="flex">
                  {allDates.map(date => {
                    const metrics = node.metrics[date];
                    const primaryValue = metrics[selectedMetric as keyof typeof metrics];
                    const safetyStock = metrics.safety_stock;
                    
                    return (
                      <div 
                        key={`${node.node_name}-${date}`}
                        className="min-w-20 border-r border-gray-200 relative"
                      >
                        {showAllMetrics ? (
                          <div className="p-1 space-y-1">
                            {METRICS.map(metric => {
                              const value = metrics[metric.key as keyof typeof metrics];
                              return (
                                <div 
                                  key={metric.key}
                                  className={`text-xs p-1 rounded ${
                                    metric.key === selectedMetric ? 'bg-blue-100 font-medium' : 'bg-gray-50'
                                  }`}
                                  title={metric.label}
                                >
                                  {formatValue(value)}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div 
                            className={getCellStyle(primaryValue, selectedMetric, safetyStock)}
                            title={`${METRICS.find(m => m.key === selectedMetric)?.label}: ${formatValue(primaryValue)}`}
                          >
                            {formatValue(primaryValue)}
                            {selectedMetric === 'projected_on_hand' && primaryValue < 0 && (
                              <AlertTriangle className="inline h-3 w-3 ml-1 text-red-600" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}