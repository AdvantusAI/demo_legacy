import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Send,
  Filter,
  Search,
  DollarSign,
  Calendar,
  Truck,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Edit3
} from 'lucide-react';
import { MRPService, PurchaseOrderRecommendation, MRPPlan } from '@/services/mrpService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchaseOrderGridRow extends PurchaseOrderRecommendation {
  product_name?: string;
  location_name?: string;
  days_until_order?: number;
  urgency_level?: 'immediate' | 'urgent' | 'normal' | 'future';
}

export const PurchaseOrdersGrid: React.FC = () => {
  const [rowData, setRowData] = useState<PurchaseOrderGridRow[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [activePlan, setActivePlan] = useState<MRPPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<PurchaseOrderGridRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Load purchase order recommendations
  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Get active plan
      const plan = await MRPService.getActivePlan();
      if (!plan) {
        toast.info('No hay un plan MRP activo');
        return;
      }
      setActivePlan(plan);

      // Get purchase order recommendations
      const recommendations = await MRPService.getPurchaseOrderRecommendations(plan.id);
      
      // Transform and enrich data
      const enrichedData = recommendations.map(rec => {
        const orderDate = new Date(rec.recommended_order_date || '');
        const today = new Date();
        const daysUntilOrder = Math.floor((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgencyLevel: 'immediate' | 'urgent' | 'normal' | 'future' = 'normal';
        if (daysUntilOrder <= 0) urgencyLevel = 'immediate';
        else if (daysUntilOrder <= 3) urgencyLevel = 'urgent';
        else if (daysUntilOrder > 14) urgencyLevel = 'future';

        return {
          ...rec,
          product_name: rec.product_id, // Would be joined with product name
          location_name: rec.location_node_id, // Would be joined with location name
          days_until_order: daysUntilOrder,
          urgency_level: urgencyLevel
        };
      });

      setRowData(enrichedData);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  // Define column definitions
  useEffect(() => {
    const columns: ColDef[] = [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        pinned: 'left'
      },
      {
        field: 'urgency_level',
        headerName: 'Urgencia',
        width: 100,
        pinned: 'left',
        cellRenderer: (params: ICellRendererParams) => {
          const urgency = params.value;
          const config = {
            immediate: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Inmediato' },
            urgent: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Urgente' },
            normal: { color: 'bg-blue-100 text-blue-800', icon: Calendar, label: 'Normal' },
            future: { color: 'bg-gray-100 text-gray-800', icon: Calendar, label: 'Futuro' }
          };
          const { color, icon: Icon, label } = config[urgency as keyof typeof config] || config.normal;
          
          return (
            <Badge className={`${color} flex items-center gap-1`}>
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          );
        }
      },
      {
        field: 'recommendation_id',
        headerName: 'ID Recomendación',
        width: 140
      },
      {
        field: 'product_id',
        headerName: 'SKU',
        width: 100
      },
      {
        field: 'product_name',
        headerName: 'Producto',
        width: 200
      },
      {
        field: 'location_node_id',
        headerName: 'CEDIS',
        width: 100
      },
      {
        field: 'supplier_name',
        headerName: 'Proveedor',
        width: 150,
        cellRenderer: (params: ICellRendererParams) => {
          return params.value || <span className="text-gray-400">Sin asignar</span>;
        }
      },
      {
        field: 'recommended_quantity',
        headerName: 'Cant. Recomendada',
        width: 140,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0'
      },
      {
        field: 'final_order_quantity',
        headerName: 'Cant. Final',
        width: 110,
        editable: true,
        cellClass: 'bg-blue-50',
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0'
      },
      {
        field: 'unit_cost',
        headerName: 'Costo Unit.',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? `$${params.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00'
      },
      {
        field: 'total_value',
        headerName: 'Valor Total',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? `$${params.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00',
        cellClass: (params: any) => {
          if (params.value > 50000) return 'font-bold text-red-600';
          if (params.value > 10000) return 'font-semibold text-orange-600';
          return '';
        }
      },
      {
        field: 'recommended_order_date',
        headerName: 'Fecha Orden',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? format(new Date(params.value), 'dd/MM/yyyy', { locale: es }) : ''
      },
      {
        field: 'expected_delivery_date',
        headerName: 'Fecha Entrega',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? format(new Date(params.value), 'dd/MM/yyyy', { locale: es }) : ''
      },
      {
        field: 'lead_time_days',
        headerName: 'Lead Time',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? `${params.value} días` : '0 días'
      },
      {
        field: 'approval_status',
        headerName: 'Estado',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.value;
          const config = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pendiente' },
            approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobado' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rechazado' },
            modified: { color: 'bg-blue-100 text-blue-800', icon: Edit3, label: 'Modificado' },
            converted: { color: 'bg-purple-100 text-purple-800', icon: FileText, label: 'Convertido' }
          };
          const { color, icon: Icon, label } = config[status as keyof typeof config] || config.pending;
          
          return (
            <Badge className={`${color} flex items-center gap-1`}>
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
          );
        }
      },
      {
        field: 'approval_threshold_exceeded',
        headerName: 'Requiere Aprob.',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => {
          if (params.value) {
            return (
              <Badge className="bg-orange-100 text-orange-800">
                <DollarSign className="h-3 w-3 mr-1" />
                Sí
              </Badge>
            );
          }
          return <span className="text-gray-400">No</span>;
        }
      },
      {
        field: 'po_number',
        headerName: 'Número OC',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          return params.value || <span className="text-gray-400">-</span>;
        }
      },
      {
        field: 'notes',
        headerName: 'Notas',
        width: 200,
        editable: true,
        cellClass: 'bg-gray-50'
      }
    ];

    setColumnDefs(columns);
  }, []);

  // Handle grid ready
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Handle selection changed
  const onSelectionChanged = () => {
    if (gridApi) {
      const selected = gridApi.getSelectedRows();
      setSelectedRows(selected);
    }
  };

  // Approve selected orders
  const approveSelectedOrders = async () => {
    if (selectedRows.length === 0) {
      toast.warning('Seleccione órdenes para aprobar');
      return;
    }

    setLoading(true);
    try {
      const promises = selectedRows
        .filter(row => row.approval_status === 'pending')
        .map(row => MRPService.approveRecommendation(row.id));
      
      await Promise.all(promises);
      toast.success(`${promises.length} órdenes aprobadas`);
      await loadPurchaseOrders();
    } catch (error) {
      console.error('Error approving orders:', error);
      toast.error('Error al aprobar órdenes');
    } finally {
      setLoading(false);
    }
  };

  // Reject selected orders
  const rejectSelectedOrders = async () => {
    if (selectedRows.length === 0) {
      toast.warning('Seleccione órdenes para rechazar');
      return;
    }

    setLoading(true);
    try {
      const promises = selectedRows
        .filter(row => row.approval_status === 'pending')
        .map(row => MRPService.updateRecommendation(row.id, { approval_status: 'rejected' }));
      
      await Promise.all(promises);
      toast.success(`${promises.length} órdenes rechazadas`);
      await loadPurchaseOrders();
    } catch (error) {
      console.error('Error rejecting orders:', error);
      toast.error('Error al rechazar órdenes');
    } finally {
      setLoading(false);
    }
  };

  // Convert to purchase orders
  const convertToPurchaseOrders = async () => {
    const approvedOrders = selectedRows.filter(row => row.approval_status === 'approved');
    
    if (approvedOrders.length === 0) {
      toast.warning('Seleccione órdenes aprobadas para convertir');
      return;
    }

    setLoading(true);
    try {
      // Here you would integrate with your actual PO system
      const promises = approvedOrders.map(row => 
        MRPService.updateRecommendation(row.id, { 
          approval_status: 'converted',
          po_number: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        })
      );
      
      await Promise.all(promises);
      toast.success(`${approvedOrders.length} órdenes convertidas a OC`);
      await loadPurchaseOrders();
    } catch (error) {
      console.error('Error converting orders:', error);
      toast.error('Error al convertir órdenes');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `Ordenes_Compra_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`,
        sheetName: 'Órdenes de Compra'
      });
    }
  };

  // Filter data
  useEffect(() => {
    if (gridApi) {
      if (filterStatus === 'all') {
        gridApi.setFilterModel(null);
      } else {
        gridApi.setFilterModel({
          approval_status: {
            type: 'equals',
            filter: filterStatus
          }
        });
      }
    }
  }, [filterStatus, gridApi]);

  // Search filter
  useEffect(() => {
    if (gridApi) {
      gridApi.setQuickFilter(searchText);
    }
  }, [searchText, gridApi]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Órdenes de Compra
            </CardTitle>
            {activePlan && (
              <Badge variant="outline" className="bg-blue-50">
                Plan: {activePlan.plan_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border-r pr-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                  <SelectItem value="modified">Modificados</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={approveSelectedOrders}
                disabled={loading || selectedRows.length === 0}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Aprobar ({selectedRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectSelectedOrders}
                disabled={loading || selectedRows.length === 0}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={convertToPurchaseOrders}
                disabled={loading || selectedRows.filter(r => r.approval_status === 'approved').length === 0}
              >
                <Send className="h-4 w-4 mr-1" />
                Convertir a OC
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
        {selectedRows.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedRows.length} órdenes seleccionadas • 
            Valor total: ${selectedRows.reduce((sum, row) => sum + (row.total_value || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 280px)', width: '100%' }}>
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
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            enableRangeSelection={true}
            statusBar={{
              statusPanels: [
                { statusPanel: 'agTotalRowCountComponent', align: 'left' },
                { statusPanel: 'agFilteredRowCountComponent' },
                { statusPanel: 'agSelectedRowCountComponent' },
                { statusPanel: 'agAggregationComponent' }
              ]
            }}
            loading={loading}
            overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Cargando órdenes de compra...</span>'}
            overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">No hay órdenes de compra</span>'}
          />
        </div>
      </CardContent>
    </Card>
  );
};