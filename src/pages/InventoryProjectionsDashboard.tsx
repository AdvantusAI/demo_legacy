import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Warehouse, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useInventoryProjections } from '@/hooks/useInventoryProjections';
import { ProductFilter } from '@/components/ProductFilter';
import { LocationFilter } from '@/components/LocationFilter';
import { toast } from '@/hooks/use-toast';

interface ProjectionData {
  product_id: string;
  location_id: string;
  warehouse_id: number;
  projections: Array<{
    date: string;
    projected_inventory: number;
    forecast_demand: number;
    safety_stock: number;
    reorder_point: number;
    status: string;
  }>;
}

interface SummaryStats {
  totalProducts: number;
  totalLocations: number;
  averageStockoutRisk: number;
  highRiskItems: number;
  negativeInventoryItems: number;
  totalProjections: number;
}

interface HighRiskItem {
  product_id: string;
  location_id: string;
  stockout_risk_percentage: number;
  projected_ending_inventory: number;
}

export default function InventoryProjectionsDashboard() {
  const [projectionResults, setProjectionResults] = useState<ProjectionData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [highRiskItems, setHighRiskItems] = useState<HighRiskItem[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');
  
  // Filters
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available filter options
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  const { loading, calculateProjections, getProjectionSummary } = useInventoryProjections();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Calculate projections for all products and locations to get overview data
      const results = await calculateProjections({
        projection_days: 365 // Full year projections
      });
      
      setProjectionResults(results);
      
      // Extract unique products and locations for filters
      const products = Array.from(new Set(results.map(r => r.product_id))).sort();
      const locations = Array.from(new Set(results.map(r => r.location_id))).sort();
      
      setAvailableProducts(products);
      setAvailableLocations(locations);
      
      // Calculate summary stats and high-risk items
      calculateSummaryStats(results);
      calculateHighRiskItems(results);

    } catch (error) {
      console.error('Error fetching inventory projections:', error);
      toast({
        title: "Error de conexión",
        description: "Hubo un problema al calcular las proyecciones de inventario.",
        variant: "destructive"
      });
    }
  };

  const calculateSummaryStats = (data: ProjectionData[]) => {
    if (data.length === 0) {
      setSummaryStats({
        totalProducts: 0,
        totalLocations: 0,
        averageStockoutRisk: 0,
        highRiskItems: 0,
        negativeInventoryItems: 0,
        totalProjections: 0
      });
      return;
    }

    const uniqueProducts = new Set(data.map(p => p.product_id)).size;
    const uniqueLocations = new Set(data.map(p => p.location_id)).size;
    
    // Calculate risk metrics from all projections
    let totalRisk = 0;
    let highRiskCount = 0;
    let negativeInventoryCount = 0;
    let totalProjectionsCount = 0;

    data.forEach(result => {
      result.projections.forEach(projection => {
        totalProjectionsCount++;
        
        // Calculate risk based on status
        const risk = projection.status === 'stockout' ? 100 : 
                    projection.status === 'critical' ? 80 :
                    projection.status === 'warning' ? 40 : 10;
        
        totalRisk += risk;
        
        if (risk > 20) highRiskCount++;
        if (projection.projected_inventory < 0) negativeInventoryCount++;
      });
    });

    const averageStockoutRisk = totalProjectionsCount > 0 ? totalRisk / totalProjectionsCount : 0;

    setSummaryStats({
      totalProducts: uniqueProducts,
      totalLocations: uniqueLocations,
      averageStockoutRisk,
      highRiskItems: highRiskCount,
      negativeInventoryItems: negativeInventoryCount,
      totalProjections: totalProjectionsCount
    });
  };

  const calculateHighRiskItems = (data: ProjectionData[]) => {
    const highRisk: HighRiskItem[] = [];

    data.forEach(result => {
      // Find the worst projection for each product/location combination
      let worstProjection = result.projections[0];
      let maxRisk = 0;

      result.projections.forEach(projection => {
        const risk = projection.status === 'stockout' ? 100 : 
                    projection.status === 'critical' ? 80 :
                    projection.status === 'warning' ? 40 : 10;
        
        if (risk > maxRisk || projection.projected_inventory < worstProjection.projected_inventory) {
          maxRisk = risk;
          worstProjection = projection;
        }
      });

      if (maxRisk > 20 || worstProjection.projected_inventory < 0) {
        highRisk.push({
          product_id: result.product_id,
          location_id: result.location_id,
          stockout_risk_percentage: maxRisk,
          projected_ending_inventory: worstProjection.projected_inventory
        });
      }
    });

    // Sort by risk and take top 10
    highRisk.sort((a, b) => b.stockout_risk_percentage - a.stockout_risk_percentage);
    setHighRiskItems(highRisk.slice(0, 10));
  };

  const getFilteredResults = () => {
    let filtered = projectionResults;

    if (selectedProductId) {
      filtered = filtered.filter(r => r.product_id === selectedProductId);
    }

    if (selectedLocationId) {
      filtered = filtered.filter(r => r.location_id === selectedLocationId);
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const formatChartData = (projections: ProjectionData['projections']) => {
    return projections.map(p => ({
      date: new Date(p.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      projectedInventory: p.projected_inventory,
      forecastDemand: p.forecast_demand,
      safetyStock: p.safety_stock,
      reorderPoint: p.reorder_point,
      status: p.status
    }));
  };

  const getRiskBadge = (risk: number) => {
    if (risk <= 10) return <Badge className="bg-green-100 text-green-700">Bajo</Badge>;
    if (risk <= 20) return <Badge className="bg-yellow-100 text-yellow-700">Medio</Badge>;
    return <Badge className="bg-red-100 text-red-700">Alto</Badge>;
  };

  const clearFilters = () => {
    setSelectedProductId('');
    setSelectedLocationId('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 animate-spin" />
          <span>Cargando proyecciones de inventario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Proyecciones de Inventario</h1>
          <p className="text-muted-foreground">
            Análisis y visualización de proyecciones futuras de inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'outline'}
            onClick={() => setSelectedView('overview')}
          >
            Resumen
          </Button>
          <Button
            variant={selectedView === 'detailed' ? 'default' : 'outline'}
            onClick={() => setSelectedView('detailed')}
          >
            Vista Detallada
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Producto</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los productos</SelectItem>
                  {availableProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ubicación</label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ubicaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las ubicaciones</SelectItem>
                  {availableLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedView === 'overview' && (
        <>
          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                      <p className="text-2xl font-bold">{summaryStats.totalProducts}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Ubicaciones</p>
                      <p className="text-2xl font-bold">{summaryStats.totalLocations}</p>
                    </div>
                    <Warehouse className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Riesgo Promedio</p>
                      <p className="text-2xl font-bold">{summaryStats.averageStockoutRisk.toFixed(1)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Items Alto Riesgo</p>
                      <p className="text-2xl font-bold text-red-600">{summaryStats.highRiskItems}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inventario Negativo</p>
                      <p className="text-2xl font-bold text-red-600">{summaryStats.negativeInventoryItems}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Proyecciones</p>
                      <p className="text-2xl font-bold">{summaryStats.totalProjections}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* High-Risk Items Alert */}
          {highRiskItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Items de Alto Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Producto</th>
                        <th className="text-left p-2">Ubicación</th>
                        <th className="text-left p-2">Riesgo de Agotamiento</th>
                        <th className="text-left p-2">Inventario Proyectado</th>
                        <th className="text-left p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskItems.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{item.product_id}</td>
                          <td className="p-2">{item.location_id}</td>
                          <td className="p-2">{item.stockout_risk_percentage.toFixed(1)}%</td>
                          <td className="p-2">
                            <span className={item.projected_ending_inventory < 0 ? 'text-red-600 font-bold' : ''}>
                              {item.projected_ending_inventory.toFixed(0)}
                            </span>
                          </td>
                          <td className="p-2">
                            {getRiskBadge(item.stockout_risk_percentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedView === 'detailed' && (
        <>
          {/* Detailed Charts and Analysis */}
          {(selectedProductId && selectedLocationId) ? (() => {
            const selectedProjection = projectionResults.find(
              p => p.product_id === selectedProductId && p.location_id === selectedLocationId
            );
            
            if (!selectedProjection) {
              return (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron datos</h3>
                    <p className="text-muted-foreground">
                      No hay proyecciones disponibles para el producto y ubicación seleccionados.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-6">
                {/* Interactive Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Proyección Detallada - {selectedProductId} ({selectedLocationId})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        projectedInventory: { label: "Inventario Proyectado", color: "hsl(var(--primary))" },
                        safetyStock: { label: "Stock de Seguridad", color: "hsl(var(--destructive))" },
                        forecastDemand: { label: "Demanda Pronosticada", color: "hsl(var(--secondary))" },
                        reorderPoint: { label: "Punto de Reorden", color: "hsl(var(--accent))" }
                      }}
                      className="h-96"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formatChartData(selectedProjection.projections)}>
                        <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="projectedInventory" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            name="Inventario Proyectado"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="safetyStock" 
                            stroke="hsl(var(--destructive))" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Stock de Seguridad"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecastDemand" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={2}
                            name="Demanda Pronosticada"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="reorderPoint" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={2}
                            name="Punto de Reorden"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Detailed Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Datos Detallados por Mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Inventario Proyectado</th>
                            <th className="text-left p-2">Demanda Pronosticada</th>
                            <th className="text-left p-2">Stock de Seguridad</th>
                            <th className="text-left p-2">Punto de Reorden</th>
                            <th className="text-left p-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProjection.projections.map((projection, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2">{new Date(projection.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}</td>
                              <td className={`p-2 ${projection.projected_inventory < 0 ? 'text-red-600 font-bold' : 
                                projection.projected_inventory < projection.safety_stock ? 'text-orange-600 font-semibold' : ''}`}>
                                {projection.projected_inventory.toFixed(0)}
                              </td>
                              <td className="p-2">{projection.forecast_demand.toFixed(0)}</td>
                              <td className="p-2">{projection.safety_stock.toFixed(0)}</td>
                              <td className="p-2">{projection.reorder_point.toFixed(0)}</td>
                              <td className="p-2">
                                <Badge variant={projection.status === 'stockout' ? 'destructive' : 
                                  projection.status === 'critical' ? 'secondary' : 'default'}>
                                  {projection.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })() : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona un Producto y Ubicación</h3>
                <p className="text-muted-foreground">
                  Para ver el análisis detallado, selecciona tanto un producto como una ubicación específica.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {projectionResults.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyecciones disponibles</h3>
            <p className="text-muted-foreground">
              No se encontraron datos de proyecciones de inventario en la base de datos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}