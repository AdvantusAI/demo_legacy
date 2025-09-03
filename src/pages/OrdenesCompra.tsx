import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Eye, Plus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderFilters } from "@/components/OrderFilters";

interface PurchaseOrderSuggestion {
  id: string;
  product_id: string;
  warehouse_id: number;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  current_stock: number;
  available_stock: number;
  reorder_point: number;
  safety_stock: number;
  suggested_quantity: number;
  unit_cost: number;
  total_cost: number;
  lead_time_days: number;
  reason: string;
  demand_forecast: number;
  bracket_info: any;
  status: string;
  created_at: string;
  updated_at: string;
  order_date: string;
  days_until_stockout: number;
  recommended_order_urgency: string;
}

interface PurchaseOrderCalculation {
  id: string;
  purchase_order_suggestion_id: string;
  calculation_step: string;
  step_order: number;
  step_data: any;
}

export default function OrdenesCompra() {
  const [replenishmentOrders, setReplenishmentOrders] = useState<PurchaseOrderSuggestion[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderSuggestion | null>(null);
  const [orderCalculations, setOrderCalculations] = useState<PurchaseOrderCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [calculationsLoading, setCalculationsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  const [filters, setFilters] = useState({
    vendorFilter: '',
    productFilter: '',
    statusFilter: '',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined
  });

  useEffect(() => {
    fetchReplenishmentOrders();
  }, []);

  const fetchReplenishmentOrders = async () => {
    try {
      setLoading(true);
      //console.log('Fetching purchase order suggestions...');
      
      const { data, error } = await supabase
        .from('purchase_order_suggestions' as any)
        .select('*')
        .order('order_date', { ascending: false });

      //console.log('Purchase order suggestions query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setReplenishmentOrders((data as any) || []);
    } catch (error) {
      console.error('Error fetching purchase order suggestions:', error);
      toast.error('Error al cargar órdenes de reabastecimiento: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (order: PurchaseOrderSuggestion) => {
    try {
      setDetailsLoading(true);
      setSelectedOrder(order);
      setShowCalculations(false);
      setOrderCalculations([]);
      //console.log('Fetching details for order:', order.id);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error al cargar detalles de la orden');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchOrderCalculations = async (order: PurchaseOrderSuggestion) => {
    try {
      setCalculationsLoading(true);
      //console.log('Fetching calculations for order:', order.id);
      
      const { data, error } = await supabase
        .from('purchase_order_calculations' as any)
        .select('*')
        .eq('purchase_order_suggestion_id', order.id);

      //console.log('Purchase order calculations query result:', { data, error });

      if (error) {
        console.error('Error fetching order calculations:', error);
        toast.error('Error al cargar cálculos de la orden');
        setOrderCalculations([]);
      } else {
        setOrderCalculations((data as any) || []);
      }
    } catch (error) {
      console.error('Error fetching calculations:', error);
      toast.error('Error al cargar cálculos de la orden');
      setOrderCalculations([]);
    } finally {
      setCalculationsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-700', label: 'Borrador' },
      'pending': { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
      'approved': { color: 'bg-blue-100 text-blue-700', label: 'Aprobada' },
      'sent': { color: 'bg-green-100 text-green-700', label: 'Enviada' },
      'received': { color: 'bg-purple-100 text-purple-700', label: 'Recibida' },
      'cancelled': { color: 'bg-red-100 text-red-700', label: 'Cancelada' }
    };
    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || statusConfig['pending'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter the orders based on active filters
  const filteredOrders = useMemo(() => {
    return replenishmentOrders.filter(order => {
      // Vendor filter
      if (filters.vendorFilter && !order.vendor_name.toLowerCase().includes(filters.vendorFilter.toLowerCase())) {
        return false;
      }

      // Status filter - handle "all" value properly
      if (filters.statusFilter && filters.statusFilter !== 'all' && order.status !== filters.statusFilter) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const orderDate = new Date(order.order_date);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const orderDate = new Date(order.order_date);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [replenishmentOrders, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando órdenes de reabastecimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Reabastecimiento</h1>
          <p className="text-muted-foreground">Gestiona y monitorea las órdenes de reabastecimiento</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Filters */}
      <OrderFilters filters={filters} onFiltersChange={setFilters} />

      {/* Replenishment Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Órdenes de Reabastecimiento ({filteredOrders.length}
            {filteredOrders.length !== replenishmentOrders.length && ` de ${replenishmentOrders.length}`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {replenishmentOrders.length === 0 
                  ? "No hay órdenes de reabastecimiento" 
                  : "No se encontraron órdenes con los filtros aplicados"
                }
              </h3>
              <p className="text-muted-foreground">
                {replenishmentOrders.length === 0
                  ? "No se encontraron órdenes de reabastecimiento en el sistema."
                  : "Intenta ajustar los filtros para encontrar las órdenes que buscas."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cantidad Sugerida</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.product_id}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatCurrency(order.total_cost)}</TableCell>
                      <TableCell>{order.suggested_quantity.toLocaleString()}</TableCell>
                      <TableCell>{order.vendor_name}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.recommended_order_urgency === 'urgent' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }>
                          {order.recommended_order_urgency === 'urgent' ? 'Urgente' : 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchOrderDetails(order)}
                          disabled={detailsLoading}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de Orden - {selectedOrder?.product_id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de la Orden</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">{formatCurrency(selectedOrder.total_cost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Orden</p>
                      <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Días hasta agotamiento</p>
                      <p className="font-medium">{selectedOrder.days_until_stockout} días</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Proveedor</p>
                      <p className="font-medium">{selectedOrder.vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Actual</p>
                      <p className="font-medium">{selectedOrder.current_stock.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Punto de Reorden</p>
                      <p className="font-medium">{selectedOrder.reorder_point.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo de Entrega</p>
                      <p className="font-medium">{selectedOrder.lead_time_days} días</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Razón</p>
                    <p className="mt-1">{selectedOrder.reason}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {showCalculations ? 'Detalles del Cálculo' : 'Detalles del Producto'}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={!showCalculations ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowCalculations(false)}
                    >
                      Detalles del Producto
                    </Button>
                    <Button
                      variant={showCalculations ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowCalculations(true);
                        if (selectedOrder && orderCalculations.length === 0) {
                          fetchOrderCalculations(selectedOrder);
                        }
                      }}
                      disabled={calculationsLoading}
                    >
                      {calculationsLoading ? 'Cargando...' : 'Detalles del Cálculo'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!showCalculations ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Producto ID</p>
                        <p className="font-medium">{selectedOrder.product_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cantidad Sugerida</p>
                        <p className="font-medium">{selectedOrder.suggested_quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Precio Unitario</p>
                        <p className="font-medium">{formatCurrency(selectedOrder.unit_cost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Disponible</p>
                        <p className="font-medium">{selectedOrder.available_stock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock de Seguridad</p>
                        <p className="font-medium">{selectedOrder.safety_stock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pronóstico de Demanda</p>
                        <p className="font-medium">{selectedOrder.demand_forecast.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {calculationsLoading ? (
                        <div className="text-center py-4">
                          <p>Cargando cálculos...</p>
                        </div>
                      ) : orderCalculations.length === 0 ? (
                        <p className="text-muted-foreground">No se encontraron cálculos para esta orden.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Paso de Cálculo</TableHead>
                                <TableHead>Orden del Paso</TableHead>
                                <TableHead>Datos del Paso</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orderCalculations.map((calc) => (
                                <TableRow key={calc.id}>
                                  <TableCell className="font-medium">{calc.id}</TableCell>
                                  <TableCell>{calc.calculation_step}</TableCell>
                                  <TableCell>{calc.step_order}</TableCell>
                                  <TableCell className="max-w-xs">
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                      {JSON.stringify(calc.step_data, null, 2)}
                                    </pre>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
