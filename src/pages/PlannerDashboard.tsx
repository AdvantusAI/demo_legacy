import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingUp, DollarSign, Users, ShoppingCart, Calendar, BarChart3, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StockItem {
  product_id: string;
  current_balance: number;
  order_point: number;
  product_code: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  status: string;
  order_date: string;
}

interface ForecastAccuracy {
  product_count: number;
  avg_accuracy: number;
  locations_analyzed: number;
}

interface DashboardMetrics {
  totalProducts: number;
  activeVendors: number;
  pendingOrders: number;
  outlierProducts: number;
}

interface LowAccuracyForecast {
  product_id: string;
  customer_id: string;
  mae: number;
  product_name?: string;
  customer_name?: string;
}

export default function PlannerDashboard() {
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [forecastAccuracy, setForecastAccuracy] = useState<ForecastAccuracy | null>(null);
  const [lowAccuracyForecasts, setLowAccuracyForecasts] = useState<LowAccuracyForecast[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      //console.log('Fetching comprehensive dashboard data...');
      
      await fetchLowStockItems();
      await fetchRecentOrders();
      await fetchForecastAccuracy();
      await fetchLowAccuracyForecasts();
      await fetchDashboardMetrics();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      // Use a direct query since the RPC function might not exist
      const { data, error } = await supabase
        .from('current_inventory')
        .select('product_id, current_stock, reorder_point')
        .filter('current_stock', 'lt', 'reorder_point')
        .limit(10);
      
      if (error) {
        console.error('Error fetching low stock items:', error);
        return;
      }
      
      const mappedData: StockItem[] = (data || []).map((item: any) => ({
        product_id: item.product_id,
        current_balance: item.current_stock || 0,
        order_point: item.reorder_point || 0,
        product_code: item.product_id // Using product_id as code for now
      }));
      
      //console.log('Low stock items fetched:', mappedData.length);
      setLowStockItems(mappedData);
    } catch (error) {
      console.error('Error in fetchLowStockItems:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      // Use mock data since purchase_orders table doesn't exist
      const mockOrders = [
        { id: 1, po_number: 'PO-2024-001', status: 'PENDING', order_date: '2024-12-01', created_at: '2024-12-01T10:00:00Z' },
        { id: 2, po_number: 'PO-2024-002', status: 'APPROVED', order_date: '2024-12-02', created_at: '2024-12-02T10:00:00Z' },
        { id: 3, po_number: 'PO-2024-003', status: 'PENDING', order_date: '2024-12-03', created_at: '2024-12-03T10:00:00Z' }
      ];
      
      //console.log('Using mock purchase orders data');
      
      const mappedData: PurchaseOrder[] = mockOrders.map((item: any) => ({
        id: item.id || 0,
        po_number: item.po_number || '',
        status: item.status || 'DRAFT',
        order_date: item.order_date || new Date().toISOString()
      }));
      
      //console.log('Recent orders fetched:', mappedData.length);
      setRecentOrders(mappedData);
    } catch (error) {
      console.error('Error in fetchRecentOrders:', error);
    }
  };

  const fetchForecastAccuracy = async () => {
    try {
      const { data, error } = await supabase
       .schema('m8_schema')
        .from('forecast_error_metrics')
        .select('mae, product_id, location_id')
        .not('mae', 'is', null);
      
      if (error) {
        console.error('Error fetching forecast accuracy:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const avgAccuracy = data.reduce((sum, item) => sum + (100 - (item.mae || 0)), 0) / data.length;
        const uniqueLocations = new Set(data.map(item => item.location_id)).size;
        
        setForecastAccuracy({
          product_count: data.length,
          avg_accuracy: Math.max(0, Math.min(100, avgAccuracy)),
          locations_analyzed: uniqueLocations
        });
        
        //console.log('Forecast accuracy calculated:', { avgAccuracy, uniqueLocations, totalProducts: data.length });
      }
    } catch (error) {
      console.error('Error in fetchForecastAccuracy:', error);
    }
  };

  const fetchLowAccuracyForecasts = async () => {
    try {
      const { data, error } = await supabase
        .from('forecast_results')
        .select(`
          product_id,
          customer_id,
          mae,
          products!inner(product_name),
          customers!inner(customer_name)
        `)
        .not('mae', 'is', null)
        .gte('mae', 15) // MAE >= 15 indicates low accuracy
        .order('mae', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching low accuracy forecasts:', error);
        return;
      }

      const mappedData: LowAccuracyForecast[] = (data || []).map((item: any) => ({
        product_id: item.product_id,
        customer_id: item.customer_id,
        mae: item.mae,
        product_name: item.products?.product_name || item.product_id,
        customer_name: item.customers?.customer_name || item.customer_id
      }));

      //console.log('Low accuracy forecasts fetched:', mappedData.length);
      setLowAccuracyForecasts(mappedData);
    } catch (error) {
      console.error('Error in fetchLowAccuracyForecasts:', error);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Fetch total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      // Use mock pending orders data since purchase_orders table doesn't exist
      const pendingOrdersData = [
        { po_number: 'PO-2024-001', status: 'PENDING' },
        { po_number: 'PO-2024-002', status: 'APPROVED' }
      ];
      
      //console.log('Using mock pending orders data');
      
      // Fetch outlier products
      const { count: outlierProducts } = await supabase
       .schema('m8_schema')
        .from('demand_outliers')
        .select('*', { count: 'exact', head: true })
        .gte('postdate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      setDashboardMetrics({
        totalProducts: totalProducts || 0,
        activeVendors: 0, // Placeholder since vendors table might not exist
        pendingOrders: (pendingOrdersData || []).length,
        outlierProducts: outlierProducts || 0
      });
      
      
    } catch (error) {
      console.error('Error in fetchDashboardMetrics:', error);
    }
  };

  const criticalItems = lowStockItems.filter(item => 
    item.current_balance <= (item.order_point * 0.5)
  );

  const warningItems = lowStockItems.filter(item => 
    item.current_balance > (item.order_point * 0.5) && item.current_balance <= item.order_point
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-700', label: 'Borrador' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
      'APPROVED': { color: 'bg-blue-100 text-blue-700', label: 'Aprobada' },
      'SENT': { color: 'bg-green-100 text-green-700', label: 'Enviada' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard del Planificador</h1>
          <p className="text-muted-foreground">Resumen del estado del inventario y análisis de demanda</p>
        </div>
        <Button onClick={fetchDashboardData}>
          <Package className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Low Accuracy Forecasts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Pronósticos con Baja Precisión
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Top 5 productos con mayor error de pronóstico (MAE ≥ 15%)
          </p>
        </CardHeader>
        <CardContent>
          {lowAccuracyForecasts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No se encontraron pronósticos con baja precisión</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowAccuracyForecasts.map((forecast, index) => (
                <div 
                  key={`${forecast.product_id}-${forecast.customer_id}`} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/demand-forecast?product_id=${forecast.product_id}&customer_id=${forecast.customer_id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{forecast.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {forecast.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {forecast.product_id} | Customer: {forecast.customer_id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      MAE: {forecast.mae.toFixed(1)}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Click para revisar
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Stock &lt; 50% del punto de reorden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos en Advertencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Stock por debajo del punto de reorden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Productos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Órdenes por procesar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics?.activeVendors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Outliers: {dashboardMetrics?.outlierProducts || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Accuracy & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Accuracy */}
        {forecastAccuracy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Precisión de Pronósticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Precisión Promedio</span>
                  <span className="font-semibold text-lg">
                    {forecastAccuracy.avg_accuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Productos Analizados</span>
                  <span className="font-medium">{forecastAccuracy.product_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ubicaciones</span>
                  <span className="font-medium">{forecastAccuracy.locations_analyzed}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${forecastAccuracy.avg_accuracy}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Órdenes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay órdenes recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{order.po_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(order.order_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mt-1">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items */}
      <Card>
        <CardHeader>
          <CardTitle>Productos con Stock Bajo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Productos que requieren reabastecimiento inmediato
          </p>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Todos los productos tienen stock adecuado</h3>
              <p className="text-muted-foreground">
                No hay productos por debajo del punto de reorden en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.slice(0, 10).map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.current_balance <= (item.order_point * 0.5) ? (
                        <Badge className="bg-red-100 text-red-700">Crítico</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Advertencia</Badge>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.product_code}</div>
                      <div className="text-sm text-muted-foreground">ID: {item.product_id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      Stock: {item.current_balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Punto de reorden: {item.order_point.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 10 && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    Y {lowStockItems.length - 10} productos más...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
