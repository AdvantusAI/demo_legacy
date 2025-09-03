import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Calendar, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Palette } from 'lucide-react';
import { useSellInOutData } from '@/hooks/useSellInOutData';
import { useChannelPartners } from '@/hooks/useChannelPartners';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';

interface SellThroughAnalyticsDashboardProps {
  selectedProductId?: string;
  selectedLocationId?: string;
  selectedCustomerId?: string;
  selectedAggregation?: {
    type: 'category' | 'subcategory' | 'product';
    id: string;
    name: string;
    productCount?: number;
  } | null;
}

export function SellThroughAnalyticsDashboard({ 
  selectedProductId = '', 
  selectedLocationId = '', 
  selectedCustomerId = '',
  selectedAggregation = null 
}: SellThroughAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last_3_months');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);
  const [weeksOfCoverColor, setWeeksOfCoverColor] = useState<string>('#3b82f6'); // Default blue color
  
  const { 
    loading, 
    sellThroughMetrics, 
    fetchSellThroughMetrics, 
    refreshSellThroughRates 
  } = useSellInOutData();
  
  const { partners } = useChannelPartners();
  const { products } = useProducts();

  useEffect(() => {
    const filters: any = {};
    if (selectedProductId) filters.product_id = selectedProductId;
    if (selectedCustomerId) filters.customer_id = selectedCustomerId;
    if (selectedLocationId) filters.location_id = selectedLocationId;
    
    // Set period filters based on selection
    const now = new Date();
    switch (selectedPeriod) {
      case 'last_month':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd');
        break;
      case 'last_3_months':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 3, 1), 'yyyy-MM-dd');
        break;
      case 'last_6_months':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 6, 1), 'yyyy-MM-dd');
        break;
    }
    
    fetchSellThroughMetrics(filters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedProductId, selectedCustomerId, selectedLocationId, selectedPeriod, fetchSellThroughMetrics]);

  const handleRefreshRates = async () => {
    await refreshSellThroughRates();
    // Refetch metrics after refresh
    const filters: any = {};
    if (selectedProductId) filters.product_id = selectedProductId;
    if (selectedCustomerId) filters.customer_id = selectedCustomerId;
    if (selectedLocationId) filters.location_id = selectedLocationId;
    fetchSellThroughMetrics(filters);
  };

  // Calculate summary metrics
  const avgSellThroughRate = sellThroughMetrics.length > 0 
    ? sellThroughMetrics.reduce((sum, m) => sum + (m.sell_through_rate_pct || 0), 0) / sellThroughMetrics.length 
    : 0;

  const avgWeeksOfCover = sellThroughMetrics.length > 0
    ? sellThroughMetrics.reduce((sum, m) => sum + (m.weeks_of_cover || 0), 0) / sellThroughMetrics.length
    : 0;

  const potentialStockouts = sellThroughMetrics.filter(m => m.potential_stockout).length;
  const promotionalActivity = sellThroughMetrics.filter(m => m.any_promo).length;

  // Prepare aggregated chart data by month
  const monthlyAggregation = sellThroughMetrics.reduce((acc, metric) => {
    const monthKey = format(new Date(metric.period_month), 'yyyy-MM');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        period: format(new Date(metric.period_month), 'MMM yyyy'),
        sellThroughRates: [],
        weeksOfCoverValues: [],
        sellInUnits: 0,
        sellOutUnits: 0,
        eomInventory: 0,
        recordCount: 0
      };
    }
    
    acc[monthKey].sellThroughRates.push(metric.sell_through_rate_pct || 0);
    acc[monthKey].weeksOfCoverValues.push(metric.weeks_of_cover || 0);
    acc[monthKey].sellInUnits += metric.sell_in_units || 0;
    acc[monthKey].sellOutUnits += metric.sell_out_units || 0;
    acc[monthKey].eomInventory += metric.eom_inventory_units || 0;
    acc[monthKey].recordCount += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.keys(monthlyAggregation)
    .sort()
    .map(monthKey => {
      const data = monthlyAggregation[monthKey];
      return {
        period: data.period,
        sellThroughRate: data.sellThroughRates.reduce((sum: number, rate: number) => sum + rate, 0) / data.sellThroughRates.length,
        weeksOfCover: data.weeksOfCoverValues.reduce((sum: number, weeks: number) => sum + weeks, 0) / data.weeksOfCoverValues.length,
        sellInUnits: data.sellInUnits,
        sellOutUnits: data.sellOutUnits,
        eomInventory: data.eomInventory,
        recordCount: data.recordCount
      };
    });

  const getPerformanceBadgeVariant = (sellThroughRate: number | null) => {
    if (!sellThroughRate) return 'secondary';
    if (sellThroughRate >= 90) return 'default';
    if (sellThroughRate >= 70) return 'secondary';
    if (sellThroughRate >= 50) return 'outline';
    return 'destructive';
  };

  const getPerformanceCategory = (sellThroughRate: number | null) => {
    if (!sellThroughRate) return 'No Data';
    if (sellThroughRate >= 90) return 'High';
    if (sellThroughRate >= 70) return 'Medium';
    if (sellThroughRate >= 50) return 'Low';
    return 'Critical';
  };

  // Pagination logic
  const totalPages = Math.ceil(sellThroughMetrics.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sellThroughMetrics.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Promedio de Ventas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSellThroughRate.toFixed(1)}%</div>
            <Progress value={avgSellThroughRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio de Semanas de Cobertura</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWeeksOfCover.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgWeeksOfCover > 4 ? 'Altos niveles de inventario' : 'Inventario saludable'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Promocional</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotionalActivity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Períodos con promociones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agotamientos Potenciales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{potentialStockouts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Inventario cero con demanda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="performance">Matriz de Rendimiento</TabsTrigger>
          <TabsTrigger value="details">Métricas Detalladas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Tasa de Ventas</CardTitle>
              <CardDescription>Seguimiento del rendimiento de ventas a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sellThroughRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Tasa de Ventas (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Semanas de Cobertura</CardTitle>
                <CardDescription>Monitorear la cobertura de inventario a través de períodos</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Color:</label>
                <input
                  type="color"
                  value={weeksOfCoverColor}
                  onChange={(e) => setWeeksOfCoverColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  title="Seleccionar color para el gráfico"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="weeksOfCover" 
                      fill={weeksOfCoverColor}
                      name="Weeks of Cover"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['High', 'Medium', 'Low', 'Critical'].map((category) => {
              const count = sellThroughMetrics.filter(m => getPerformanceCategory(m.sell_through_rate_pct) === category).length;
              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category} Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <Badge variant={getPerformanceBadgeVariant(category === 'High' ? 90 : category === 'Medium' ? 70 : category === 'Low' ? 50 : 30)} className="mt-2">
                      {category.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas</CardTitle>
              <CardDescription>
                Desglose completo del rendimiento de ventas - Mostrando {startIndex + 1}-{Math.min(endIndex, sellThroughMetrics.length)} de {sellThroughMetrics.length} registros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">Cliente</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">Producto</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900">Período</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-900">Unidades Entrada</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-900">Unidades Salida</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-900">Inventario FDM</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-900">Tasa de Ventas</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-900">Semanas Cobertura</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-900">Rendimiento</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-900">Promo</th>
                      <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-900">Riesgo Agotamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((metric, index) => {
                      const partner = partners.find(p => p.customer_id === metric.customer_id);
                      const product = products.find(p => p.id === metric.product_id);
                      
                      return (
                        <tr key={`${metric.product_id}-${metric.customer_id}-${metric.period_month}-${startIndex + index}`} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            {partner?.customer_name || 'Cliente Desconocido'}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            {product?.name || metric.product_id}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            {format(new Date(metric.period_month), 'MMM yyyy')}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                            {metric.sell_in_units.toLocaleString()}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                            {metric.sell_out_units.toLocaleString()}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                            {metric.eom_inventory_units.toLocaleString()}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                            <span className="font-medium">{(metric.sell_through_rate_pct || 0).toFixed(1)}%</span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                            {(metric.weeks_of_cover || 0).toFixed(1)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-center">
                            <Badge variant={getPerformanceBadgeVariant(metric.sell_through_rate_pct)} className="text-xs">
                              {getPerformanceCategory(metric.sell_through_rate_pct)}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-center">
                            {metric.any_promo ? (
                              <Badge variant="default" className="text-xs">Sí</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No</Badge>
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-center">
                            {metric.potential_stockout ? (
                              <Badge variant="destructive" className="text-xs">Alto Riesgo</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Bajo Riesgo</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, sellThroughMetrics.length)} de {sellThroughMetrics.length} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}