import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Plus,
  Edit
} from 'lucide-react';
import { MRPService, PurchaseOrderRecommendation, MRPPlan } from '@/services/mrpService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchaseOrderGridRow extends PurchaseOrderRecommendation {
  // Additional computed fields
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  days_until_order: number;
  cost_category: 'low' | 'medium' | 'high' | 'very_high';
}

export const PurchaseOrderManagement: React.FC = () => {
  const [rowData, setRowData] = useState<PurchaseOrderGridRow[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [activePlan, setActivePlan] = useState<MRPPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [gridApi, setGridApi] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<PurchaseOrderGridRow[]>([]);

  // Load active MRP plan and purchase order recommendations
  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Get active plan
      const plan = await MRPService.getActivePlan();
      if (!plan) {
        toast.info('No hay un plan MRP activo.');
        return;
      }
      setActivePlan(plan);

      // Get purchase order recommendations
      const filters = selectedStatus !== 'all' ? { approval_status: selectedStatus } : {};
      const recommendations = await MRPService.getPurchaseOrderRecommendations(plan.id, filters);
      
      // Transform data for grid
      const transformedData = transformPurchaseOrderData(recommendations);
      setRowData(transformedData);

    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  // Transform purchase order data for grid display
  const transformPurchaseOrderData = (
    recommendations: PurchaseOrderRecommendation[]
  ): PurchaseOrderGridRow[] => {
    return recommendations.map(rec => {
      const orderDate = new Date(rec.recommended_order_date || '');
      const today = new Date();
      const daysUntilOrder = Math.ceil((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (daysUntilOrder < 0) urgencyLevel = 'critical';
      else if (daysUntilOrder <= 2) urgencyLevel = 'high';
      else if (daysUntilOrder <= 7) urgencyLevel = 'medium';

      let costCategory: 'low' | 'medium' | 'high' | 'very_high' = 'low';
      const totalValue = rec.total_value || 0;
      if (totalValue > 100000) costCategory = 'very_high';
      else if (totalValue > 50000) costCategory = 'high';
      else if (totalValue > 10000) costCategory = 'medium';

      return {
        ...rec,
        urgency_level: urgencyLevel,
        days_until_order: daysUntilOrder,
        cost_category: costCategory
      };
    });
  };

  // Generate column definitions
  const generateColumnDefs = (): ColDef[] => {
    return [
      {
        field: 'product_id',
        headerName: 'SKU',
        pinned: 'left',
        width: 120,
        cellClass: 'font-medium',
        checkboxSelection: true,
        headerCheckboxSelection: true
      },
      {
        field: 'location_node_id',
        headerName: 'CEDIS',
        pinned: 'left',
        width: 100
      },
      {
        field: 'supplier_name',
        headerName: 'Proveedor',
        width: 180,
        cellRenderer: (params: ICellRendererParams) => {
          const supplier = params.value || 'No asignado';
          return (
            <div className="flex items-center space-x-2">
              <span>{supplier}</span>
              {!params.value && (
                <Badge variant="outline" className="text-xs bg-yellow-50">
                  Sin proveedor
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        field: 'urgency_level',
        headerName: 'Urgencia',
        width: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const urgency = params.value;
          const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
          };
          const labels = {
            low: 'Baja',
            medium: 'Media',
            high: 'Alta',
            critical: 'Crítica'
          };
          return (
            <Badge className={colors[urgency as keyof typeof colors]}>
              {labels[urgency as keyof typeof labels]}
            </Badge>
          );
        }
      },
      {
        field: 'recommended_order_date',
        headerName: 'Fecha Pedido',
        width: 130,
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return '-';
          return format(new Date(params.value), 'dd/MM/yyyy', { locale: es });
        },
        cellClass: (params: any) => {
          const daysUntil = params.data?.days_until_order || 0;
          if (daysUntil < 0) return 'bg-red-50 text-red-900 font-semibold';
          if (daysUntil <= 2) return 'bg-orange-50 text-orange-900 font-semibold';
          return '';
        }
      },
      {
        field: 'expected_delivery_date',
        headerName: 'Fecha Entrega',
        width: 130,
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return '-';
          return format(new Date(params.value), 'dd/MM/yyyy', { locale: es });
        }
      },
      {
        field: 'recommended_quantity',
        headerName: 'Cantidad',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0',
        cellClass: 'font-medium text-right'
      },
      {
        field: 'unit_cost',
        headerName: 'Costo Unit.',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? `$${params.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-',
        cellClass: 'text-right'
      },
      {
        field: 'total_value',
        headerName: 'Valor Total',
        width: 130,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? `$${params.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-',
        cellClass: (params: any) => {
          const value = params.value || 0;
          let className = 'font-semibold text-right ';
          if (value > 100000) className += 'text-purple-700';
          else if (value > 50000) className += 'text-blue-700';
          else if (value > 10000) className += 'text-green-700';
          return className;
        }
      },
      {
        field: 'approval_status',
        headerName: 'Estado',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.value;
          const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            modified: 'bg-blue-100 text-blue-800',
            converted: 'bg-purple-100 text-purple-800'
          };
          const labels = {
            pending: 'Pendiente',
            approved: 'Aprobada',
            rejected: 'Rechazada',
            modified: 'Modificada',
            converted: 'Convertida'
          };
          return (
            <Badge className={colors[status as keyof typeof colors]}>
              {labels[status as keyof typeof labels]}
            </Badge>
          );
        }
      },
      {
        field: 'approval_threshold_exceeded',
        headerName: 'Req. Aprobación',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => {
          return params.value ? (
            <Badge className="bg-orange-100 text-orange-800">
              <DollarSign className="h-3 w-3 mr-1" />
              Sí
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              No
            </Badge>
          );
        }
      },
      {
        headerName: 'Acciones',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.data.approval_status;
          return (
            <div className="flex items-center space-x-1">
              {status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveOrder(params.data)}
                    className="h-7 px-2"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectOrder(params.data)}
                    className="h-7 px-2"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditOrder(params.data)}
                className="h-7 px-2"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          );
        }
      }
    ];
  };

  // Handle grid ready
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Handle selection change
  const onSelectionChanged = () => {
    if (gridApi) {
      const selectedNodes = gridApi.getSelectedNodes();
      setSelectedRows(selectedNodes.map((node: any) => node.data));
    }
  };

  // Action handlers
  const handleApproveOrder = async (order: PurchaseOrderGridRow) => {
    try {
      await MRPService.approveRecommendation(order.id);
      toast.success(`Orden ${order.product_id} aprobada`);
      await loadPurchaseOrders();
    } catch (error) {
      toast.error('Error al aprobar orden');
    }
  };

  const handleRejectOrder = async (order: PurchaseOrderGridRow) => {
    try {
      await MRPService.updateRecommendation(order.id, { approval_status: 'rejected' });
      toast.success(`Orden ${order.product_id} rechazada`);
      await loadPurchaseOrders();
    } catch (error) {
      toast.error('Error al rechazar orden');
    }
  };

  const handleEditOrder = (order: PurchaseOrderGridRow) => {
    // TODO: Open edit dialog
    toast.info(`Editar orden ${order.product_id} (funcionalidad pendiente)`);
  };

  const handleBulkApprove = async () => {
    try {
      const pendingOrders = selectedRows.filter(order => order.approval_status === 'pending');
      for (const order of pendingOrders) {
        await MRPService.approveRecommendation(order.id);
      }
      toast.success(`${pendingOrders.length} órdenes aprobadas`);
      await loadPurchaseOrders();
    } catch (error) {
      toast.error('Error en aprobación masiva');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `Purchase_Orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`,
        sheetName: 'Purchase Orders'
      });
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  useEffect(() => {
    setColumnDefs(generateColumnDefs());
  }, []);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="approved">Aprobadas</TabsTrigger>
              <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
            </TabsList>
          </Tabs>
          {activePlan && (
            <Badge variant="outline" className="bg-blue-50">
              Plan: {activePlan.plan_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkApprove}
              disabled={selectedRows.filter(r => r.approval_status === 'pending').length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar Seleccionadas ({selectedRows.filter(r => r.approval_status === 'pending').length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Órdenes</p>
                <p className="text-2xl font-bold text-blue-900">{rowData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {rowData.filter(r => r.approval_status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-900">
                  {rowData.filter(r => r.approval_status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${rowData.reduce((sum, r) => sum + (r.total_value || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true
          }}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          rowSelection="multiple"
          animateRows={true}
          enableRangeSelection={true}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalRowCountComponent', align: 'left' },
              { statusPanel: 'agSelectedRowCountComponent' },
              { statusPanel: 'agAggregationComponent' }
            ]
          }}
          loading={loading}
          overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Cargando órdenes de compra...</span>'}
          overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">No hay órdenes para mostrar</span>'}
        />
      </div>
    </div>
  );
};