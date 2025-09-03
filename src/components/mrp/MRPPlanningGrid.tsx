import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams, CellValueChangedEvent } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Save,
  Play,
  Settings
} from 'lucide-react';
import { MRPService, DemandExplosionResult, MRPPlan } from '@/services/mrpService';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

interface MRPGridRow {
  id: string;
  product_id: string;
  product_name: string;
  location_node_id: string;
  location_name: string;
  inventory_status: 'optimal' | 'warning' | 'critical' | 'stockout';
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  lead_time_days: number;
  [key: string]: any; // For dynamic week columns
}

interface WeekColumn {
  field: string;
  headerName: string;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
}

export const MRPPlanningGrid: React.FC = () => {
  const [rowData, setRowData] = useState<MRPGridRow[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [activePlan, setActivePlan] = useState<MRPPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'demand' | 'supply' | 'inventory' | 'orders'>('inventory');
  const [gridApi, setGridApi] = useState<any>(null);
  const [columnApi, setColumnApi] = useState<any>(null);

  // Generate week columns
  const generateWeekColumns = useCallback((horizonWeeks: number): WeekColumn[] => {
    const columns: WeekColumn[] = [];
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 });

    for (let i = 0; i < horizonWeeks; i++) {
      const weekStart = addWeeks(startDate, i);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      columns.push({
        field: `week_${i + 1}`,
        headerName: `Sem ${i + 1}`,
        weekStart,
        weekEnd,
        weekNumber: i + 1
      });
    }

    return columns;
  }, []);

  // Load active MRP plan and data
  const loadMRPData = useCallback(async () => {
    setLoading(true);
    try {
      // Get active plan
      const plan = await MRPService.getActivePlan();
      if (!plan) {
        toast.info('No hay un plan MRP activo. Cree uno nuevo para comenzar.');
        return;
      }
      setActivePlan(plan);

      // Get MRP explosion results
      const results = await MRPService.getMRPExplosionResults(plan.id);
      
      // Transform data for grid
      const transformedData = transformMRPDataForGrid(results, plan.planning_horizon_weeks);
      setRowData(transformedData);

      // Generate column definitions
      const weekColumns = generateWeekColumns(plan.planning_horizon_weeks);
      const columns = generateColumnDefs(weekColumns, selectedView);
      setColumnDefs(columns);

    } catch (error) {
      console.error('Error loading MRP data:', error);
      toast.error('Error al cargar datos MRP');
    } finally {
      setLoading(false);
    }
  }, [selectedView, generateWeekColumns]);

  // Transform MRP data for grid display
  const transformMRPDataForGrid = (
    results: DemandExplosionResult[],
    horizonWeeks: number
  ): MRPGridRow[] => {
    // Group by product and location
    const grouped = results.reduce((acc, result) => {
      const key = `${result.product_id}_${result.location_node_id}`;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          product_id: result.product_id,
          product_name: result.product_id, // Would be joined with product name
          location_node_id: result.location_node_id,
          location_name: result.location_node_id, // Would be joined with location name
          inventory_status: 'optimal',
          current_stock: 0,
          safety_stock: result.safety_stock,
          reorder_point: result.reorder_point,
          lead_time_days: 14, // Default, would come from MRP parameters
          weeks: {}
        };
      }

      // Add week data
      const weekNum = result.week_number;
      acc[key].weeks[`week_${weekNum}`] = {
        beginning_inventory: result.beginning_inventory,
        gross_requirements: result.gross_requirements,
        scheduled_receipts: result.scheduled_receipts,
        projected_available: result.projected_available,
        net_requirements: result.net_requirements,
        planned_order_receipts: result.planned_order_receipts,
        planned_order_releases: result.planned_order_releases
      };

      // Update inventory status based on projected available
      if (result.projected_available <= 0) {
        acc[key].inventory_status = 'stockout';
      } else if (result.projected_available < result.safety_stock) {
        if (acc[key].inventory_status !== 'stockout') {
          acc[key].inventory_status = 'critical';
        }
      } else if (result.projected_available < result.reorder_point) {
        if (acc[key].inventory_status === 'optimal') {
          acc[key].inventory_status = 'warning';
        }
      }

      // Set current stock from first week
      if (weekNum === 1) {
        acc[key].current_stock = result.beginning_inventory;
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and flatten week data based on selected view
    return Object.values(grouped).map((item: any) => {
      const row: MRPGridRow = {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        location_node_id: item.location_node_id,
        location_name: item.location_name,
        inventory_status: item.inventory_status,
        current_stock: item.current_stock,
        safety_stock: item.safety_stock,
        reorder_point: item.reorder_point,
        lead_time_days: item.lead_time_days
      };

      // Add week data based on selected view
      for (let i = 1; i <= horizonWeeks; i++) {
        const weekData = item.weeks[`week_${i}`] || {};
        
        switch (selectedView) {
          case 'demand':
            row[`week_${i}`] = weekData.gross_requirements || 0;
            break;
          case 'supply':
            row[`week_${i}`] = (weekData.scheduled_receipts || 0) + (weekData.planned_order_receipts || 0);
            break;
          case 'inventory':
            row[`week_${i}`] = weekData.projected_available || 0;
            break;
          case 'orders':
            row[`week_${i}`] = weekData.planned_order_receipts || 0;
            break;
        }
      }

      return row;
    });
  };

  // Generate column definitions
  const generateColumnDefs = (weekColumns: WeekColumn[], view: string): ColDef[] => {
    const baseColumns: ColDef[] = [
      {
        field: 'product_id',
        headerName: 'SKU',
        pinned: 'left',
        width: 120,
        cellClass: 'font-medium'
      },
      {
        field: 'product_name',
        headerName: 'Producto',
        pinned: 'left',
        width: 200,
        cellClass: 'font-medium'
      },
      {
        field: 'location_node_id',
        headerName: 'CEDIS',
        pinned: 'left',
        width: 100
      },
      {
        field: 'inventory_status',
        headerName: 'Estado',
        pinned: 'left',
        width: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.value;
          const colors = {
            optimal: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            critical: 'bg-orange-100 text-orange-800',
            stockout: 'bg-red-100 text-red-800'
          };
          const labels = {
            optimal: 'Óptimo',
            warning: 'Atención',
            critical: 'Crítico',
            stockout: 'Sin Stock'
          };
          return (
            <Badge className={colors[status as keyof typeof colors]}>
              {labels[status as keyof typeof labels]}
            </Badge>
          );
        }
      },
      {
        field: 'current_stock',
        headerName: 'Stock Actual',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0'
      },
      {
        field: 'safety_stock',
        headerName: 'Stock Seguridad',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0'
      }
    ];

    // Add week columns
    const weekColumnDefs: ColDef[] = weekColumns.map(week => ({
      field: week.field,
      headerName: week.headerName,
      headerTooltip: `${format(week.weekStart, 'dd/MM', { locale: es })} - ${format(week.weekEnd, 'dd/MM', { locale: es })}`,
      width: 100,
      editable: view === 'orders', // Only orders view is editable
      cellClass: (params: any) => {
        const value = params.value || 0;
        if (view === 'inventory') {
          if (value <= 0) return 'bg-red-50 text-red-900';
          if (value < params.data.safety_stock) return 'bg-yellow-50 text-yellow-900';
        }
        if (view === 'orders' && value > 0) {
          return 'bg-blue-50 text-blue-900 font-semibold';
        }
        return '';
      },
      valueFormatter: (params: ValueFormatterParams) => {
        const value = params.value || 0;
        return value.toLocaleString('es-MX', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        });
      },
      cellRenderer: (params: ICellRendererParams) => {
        const value = params.value || 0;
        if (view === 'orders' && value > 0) {
          return (
            <div className="flex items-center justify-between">
              <span>{value.toLocaleString('es-MX')}</span>
              <Package className="h-3 w-3 text-blue-600" />
            </div>
          );
        }
        return value.toLocaleString('es-MX');
      }
    }));

    return [...baseColumns, ...weekColumnDefs];
  };

  // Handle grid ready
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  // Handle cell value changed
  const onCellValueChanged = async (event: CellValueChangedEvent) => {
    if (selectedView === 'orders' && activePlan) {
      // Update the planned order in the database
      const weekMatch = event.colDef.field?.match(/week_(\d+)/);
      if (weekMatch) {
        const weekNumber = parseInt(weekMatch[1]);
        try {
          // Here you would update the demand_explosion_results table
          toast.success('Orden actualizada');
        } catch (error) {
          toast.error('Error al actualizar orden');
          // Revert the change
          event.node.setDataValue(event.colDef.field!, event.oldValue);
        }
      }
    }
  };

  // Run MRP calculation
  const runMRPCalculation = async () => {
    if (!activePlan) {
      toast.error('No hay un plan MRP activo');
      return;
    }

    setLoading(true);
    try {
      await MRPService.runMRPCalculation(activePlan.id);
      toast.success('Cálculo MRP completado exitosamente');
      await loadMRPData();
    } catch (error) {
      console.error('Error running MRP calculation:', error);
      toast.error('Error al ejecutar cálculo MRP');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `MRP_Plan_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`,
        sheetName: 'MRP Planning'
      });
    }
  };

  // Auto-size all columns
  const autoSizeColumns = () => {
    if (columnApi) {
      const allColumnIds: string[] = [];
      columnApi.getColumns()?.forEach((column: any) => {
        allColumnIds.push(column.getId());
      });
      columnApi.autoSizeColumns(allColumnIds, false);
    }
  };

  useEffect(() => {
    loadMRPData();
  }, [loadMRPData]);

  useEffect(() => {
    if (gridApi) {
      autoSizeColumns();
    }
  }, [columnDefs]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">Planificación MRP</CardTitle>
            {activePlan && (
              <Badge variant="outline" className="bg-blue-50">
                Plan: {activePlan.plan_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
              <TabsList>
                <TabsTrigger value="inventory" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Inventario
                </TabsTrigger>
                <TabsTrigger value="demand" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Demanda
                </TabsTrigger>
                <TabsTrigger value="supply" className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Suministro
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Órdenes
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="border-l pl-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runMRPCalculation}
                disabled={loading}
              >
                <Play className="h-4 w-4 mr-1" />
                Ejecutar MRP
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMRPData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-1" />
                Configurar
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 250px)', width: '100%' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              floatingFilter: false
            }}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            enableRangeSelection={true}
            enableCharts={true}
            statusBar={{
              statusPanels: [
                { statusPanel: 'agTotalRowCountComponent', align: 'left' },
                { statusPanel: 'agFilteredRowCountComponent' },
                { statusPanel: 'agSelectedRowCountComponent' },
                { statusPanel: 'agAggregationComponent' }
              ]
            }}
            sideBar={{
              toolPanels: [
                {
                  id: 'filters',
                  labelDefault: 'Filtros',
                  labelKey: 'filters',
                  iconKey: 'filter',
                  toolPanel: 'agFiltersToolPanel'
                }
              ],
              defaultToolPanel: ''
            }}
            loading={loading}
            overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Cargando datos MRP...</span>'}
            overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">No hay datos para mostrar</span>'}
          />
        </div>
      </CardContent>
    </Card>
  );
};