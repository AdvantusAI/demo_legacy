import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Filter,
  Download
} from 'lucide-react';
import { useSalesVelocityData } from '@/hooks/useSalesVelocityData';
import { useChannelPartners } from '@/hooks/useChannelPartners';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';

interface SalesVelocityReportsProps {
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

export function SalesVelocityReports({ 
  selectedProductId = '', 
  selectedLocationId = '', 
  selectedCustomerId = '',
  selectedAggregation = null 
}: SalesVelocityReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last_6_months');
  const [showHighVelocityOnly, setShowHighVelocityOnly] = useState(false);
  const [showLowVelocityOnly, setShowLowVelocityOnly] = useState(false);
  const [showUnstableMovers, setShowUnstableMovers] = useState(false);
  
  const { 
    loading, 
    velocityData,
    velocityMetrics,
    topMovers,
    alerts,
    fetchVelocityData,
    fetchVelocityMetrics,
    exportVelocityReport
  } = useSalesVelocityData();
  
  const { partners } = useChannelPartners();
  const { products } = useProducts();

  useEffect(() => {
    const filters: any = {};
    if (selectedProductId) filters.product_id = selectedProductId;
    if (selectedCustomerId) filters.channel_partner_id = selectedCustomerId;
    if (selectedLocationId) filters.location_id = selectedLocationId;
    
    // Set period filters based on selection
    const now = new Date();
    switch (selectedPeriod) {
      case 'last_3_months':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 3, 1), 'yyyy-MM-dd');
        break;
      case 'last_6_months':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 6, 1), 'yyyy-MM-dd');
        break;
      case 'last_12_months':
        filters.period_start = format(new Date(now.getFullYear(), now.getMonth() - 12, 1), 'yyyy-MM-dd');
        break;
    }
    
    fetchVelocityData(filters);
    fetchVelocityMetrics(filters);
  }, [selectedProductId, selectedCustomerId, selectedLocationId, selectedPeriod, fetchVelocityData, fetchVelocityMetrics]);

  // Calculate summary metrics
  const avgVelocityUnitsPerWeek = velocityMetrics.length > 0 
    ? velocityMetrics.reduce((sum, m) => sum + (m.velocity_units_per_week || 0), 0) / velocityMetrics.length 
    : 0;

  const topMoversCount = topMovers?.length || 0;
  const criticalAlerts = alerts?.filter(a => a.type === 'overstock' || a.type === 'replenishment')?.length || 0;
  const unstableMovers = velocityMetrics.filter(m => (m.coefficient_of_variation || 0) > 0.5).length;

  // Prepare chart data
  const velocityTrendData = velocityData
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
    .map(data => ({
      period: format(new Date(data.period), 'MMM yyyy'),
      velocityUnitsPerWeek: data.velocity_units_per_week,
      velocityUnitsPerDay: data.velocity_units_per_day,
      normalizedVelocity: data.normalized_velocity_per_location,
    }));

  // Velocity vs Inventory scatter data
  const scatterData = velocityMetrics.map(metric => {
    const partner = partners.find(p => p.id === metric.channel_partner_id);
    const product = products.find(p => p.id === metric.product_id);
    
    return {
      x: metric.velocity_units_per_week || 0,
      y: metric.weeks_of_cover || 0,
      name: `${product?.name || 'Unknown'} - ${partner?.partner_name || 'Unknown'}`,
      cv: metric.coefficient_of_variation || 0,
      recommended_order: metric.recommended_order_qty || 0,
    };
  });

  const getVelocityBadgeVariant = (velocity: number) => {
    if (velocity > 50) return 'default'; // High velocity
    if (velocity > 20) return 'secondary'; // Medium velocity
    if (velocity > 5) return 'outline'; // Low velocity
    return 'destructive'; // Critical/Very low velocity
  };

  const getStabilityBadgeVariant = (cv: number) => {
    if (cv < 0.2) return 'default'; // Stable
    if (cv < 0.5) return 'secondary'; // Moderate
    return 'destructive'; // Unstable
  };

  const handleExport = async () => {
    const filters: any = {};
    if (selectedProductId) filters.product_id = selectedProductId;
    if (selectedCustomerId) filters.channel_partner_id = selectedCustomerId;
    if (selectedLocationId) filters.location_id = selectedLocationId;
    
    await exportVelocityReport(filters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Velocidad de Ventas</h1>
          <p className="text-muted-foreground">
            Monitorear la velocidad de ventas e identificar productos de movimiento rápido/lento para mejor planificación de inventario
          </p>
        </div>
        <Button onClick={handleExport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Socio Comercial</label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.partner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch 
                id="high-velocity" 
                checked={showHighVelocityOnly}
                onCheckedChange={setShowHighVelocityOnly}
              />
              <Label htmlFor="high-velocity">High velocity only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="low-velocity" 
                checked={showLowVelocityOnly}
                onCheckedChange={setShowLowVelocityOnly}
              />
              <Label htmlFor="low-velocity">Low velocity only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="unstable-movers" 
                checked={showUnstableMovers}
                onCheckedChange={setShowUnstableMovers}
              />
              <Label htmlFor="unstable-movers">Unstable movers</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocidad Promedio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVelocityUnitsPerWeek.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">unidades/semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Principales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topMoversCount}</div>
            <p className="text-xs text-muted-foreground mt-1">SKUs más rápidos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">requieren atención</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Inestables</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unstableMovers}</div>
            <p className="text-xs text-muted-foreground mt-1">alta volatilidad</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} variant={alert.type === 'replenishment' ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.product_name}</strong> at {alert.partner_name}: {alert.message}
                {alert.recommended_action && (
                  <span className="ml-2 text-sm">→ {alert.recommended_action}</span>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Velocity Trends</TabsTrigger>
          <TabsTrigger value="velocity-matrix">Velocity Matrix</TabsTrigger>
          <TabsTrigger value="product-ranking">Product Ranking</TabsTrigger>
          <TabsTrigger value="retailer-view">Retailer Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Velocidad por Mes</CardTitle>
              <CardDescription>Seguir los cambios de velocidad de ventas a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="velocityUnitsPerWeek" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Units/Week"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="normalizedVelocity" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Normalized Velocity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="velocity-matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Velocidad vs Semanas de Cobertura</CardTitle>
              <CardDescription>Identificar oportunidades de reposición y sobrestock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Velocity (units/week)" />
                    <YAxis dataKey="y" name="Weeks of Cover" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p>Velocity: {data.x.toFixed(1)} units/week</p>
                              <p>Weeks of Cover: {data.y.toFixed(1)}</p>
                              <p>Stability CV: {data.cv.toFixed(2)}</p>
                              {data.recommended_order > 0 && (
                                <p className="text-primary">Pedido Recomendado: {data.recommended_order} unidades</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="y" fill="hsl(var(--primary))">
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.y > 8 && entry.x < 10 ? '#ef4444' : // Overstock risk
                                entry.y < 2 && entry.x > 30 ? '#f59e0b' : // Replenishment needed
                                'hsl(var(--primary))'} // Normal
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Overstock Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Replenishment Needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Normal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="product-ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Velocidad de Productos</CardTitle>
              <CardDescription>Productos clasificados por rendimiento de velocidad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {velocityMetrics
                  .sort((a, b) => (b.velocity_units_per_week || 0) - (a.velocity_units_per_week || 0))
                  .map((metric, index) => {
                    const product = products.find(p => p.id === metric.product_id);
                    const partner = partners.find(p => p.id === metric.channel_partner_id);
                    
                    return (
                      <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product?.name || 'Unknown Product'}</div>
                            <div className="text-sm text-muted-foreground">
                              {partner?.partner_name || 'Unknown Partner'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{(metric.velocity_units_per_week || 0).toFixed(1)} units/week</div>
                            <div className="text-sm text-muted-foreground">
                              CV: {(metric.coefficient_of_variation || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getVelocityBadgeVariant(metric.velocity_units_per_week || 0)}>
                              {(metric.velocity_units_per_week || 0) > 50 ? 'High' :
                               (metric.velocity_units_per_week || 0) > 20 ? 'Medium' :
                               (metric.velocity_units_per_week || 0) > 5 ? 'Low' : 'Critical'}
                            </Badge>
                            <Badge variant={getStabilityBadgeVariant(metric.coefficient_of_variation || 0)}>
                              {(metric.coefficient_of_variation || 0) < 0.2 ? 'Stable' :
                               (metric.coefficient_of_variation || 0) < 0.5 ? 'Moderate' : 'Unstable'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retailer-view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Panel de Rendimiento de Minoristas</CardTitle>
              <CardDescription>Métricas de velocidad por minorista con indicadores de estabilidad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partners.map(partner => {
                  const partnerMetrics = velocityMetrics.filter(m => m.channel_partner_id === partner.id);
                  const avgVelocity = partnerMetrics.length > 0 
                    ? partnerMetrics.reduce((sum, m) => sum + (m.velocity_units_per_week || 0), 0) / partnerMetrics.length 
                    : 0;
                  const unstableCount = partnerMetrics.filter(m => (m.coefficient_of_variation || 0) > 0.5).length;
                  
                  if (partnerMetrics.length === 0) return null;
                  
                  return (
                    <div key={partner.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{partner.partner_name}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline">{partnerMetrics.length} SKUs</Badge>
                          {unstableCount > 0 && (
                            <Badge variant="destructive">{unstableCount} Unstable</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Velocidad Promedio</div>
                                                      <div className="text-lg font-medium">{avgVelocity.toFixed(1)} unidades/semana</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Mejor Rendimiento</div>
                          <div className="text-lg font-medium">
                            {Math.max(...partnerMetrics.map(m => m.velocity_units_per_week || 0)).toFixed(1)} units/week
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Estabilidad</div>
                          <div className="text-lg font-medium">
                            {((partnerMetrics.length - unstableCount) / partnerMetrics.length * 100).toFixed(0)}% Stable
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}