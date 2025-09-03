import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { MRPService, PlanningException, MRPPlan } from '@/services/mrpService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlanningExceptionGridRow extends PlanningException {
  // Additional computed fields
  age_days: number;
  priority_score: number;
}

export const PlanningExceptions: React.FC = () => {
  const [rowData, setRowData] = useState<PlanningExceptionGridRow[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [activePlan, setActivePlan] = useState<MRPPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [gridApi, setGridApi] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedException, setSelectedException] = useState<PlanningExceptionGridRow | null>(null);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);

  // Load active MRP plan and planning exceptions
  const loadPlanningExceptions = useCallback(async () => {
    setLoading(true);
    try {
      // Get active plan
      const plan = await MRPService.getActivePlan();
      if (!plan) {
        toast.info('No hay un plan MRP activo.');
        return;
      }
      setActivePlan(plan);

      // Get planning exceptions
      const filters: any = {};
      if (selectedSeverity !== 'all') filters.severity = selectedSeverity;
      if (selectedStatus !== 'all') filters.resolution_status = selectedStatus;
      
      const exceptions = await MRPService.getPlanningExceptions(plan.id, filters);
      
      // Transform data for grid
      const transformedData = transformExceptionData(exceptions);
      setRowData(transformedData);

    } catch (error) {
      console.error('Error loading planning exceptions:', error);
      toast.error('Error al cargar excepciones de planificación');
    } finally {
      setLoading(false);
    }
  }, [selectedSeverity, selectedStatus]);

  // Transform exception data for grid display
  const transformExceptionData = (
    exceptions: PlanningException[]
  ): PlanningExceptionGridRow[] => {
    return exceptions.map(exc => {
      const createdDate = new Date(exc.exception_date || '');
      const today = new Date();
      const ageDays = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate priority score based on severity, age, and type
      let priorityScore = 0;
      switch (exc.severity) {
        case 'critical': priorityScore += 100; break;
        case 'high': priorityScore += 75; break;
        case 'medium': priorityScore += 50; break;
        case 'low': priorityScore += 25; break;
      }
      
      switch (exc.exception_type) {
        case 'stockout': priorityScore += 50; break;
        case 'below_safety_stock': priorityScore += 30; break;
        case 'order_urgency': priorityScore += 40; break;
        case 'forecast_deviation': priorityScore += 20; break;
        case 'excess_inventory': priorityScore += 10; break;
      }
      
      priorityScore += Math.min(ageDays * 2, 50); // Age factor (max 25 days worth)

      return {
        ...exc,
        age_days: ageDays,
        priority_score: priorityScore
      };
    }).sort((a, b) => b.priority_score - a.priority_score);
  };

  // Generate column definitions
  const generateColumnDefs = (): ColDef[] => {
    return [
      {
        field: 'product_id',
        headerName: 'SKU',
        pinned: 'left',
        width: 120,
        cellClass: 'font-medium'
      },
      {
        field: 'location_node_id',
        headerName: 'CEDIS',
        pinned: 'left',
        width: 100
      },
      {
        field: 'exception_type',
        headerName: 'Tipo',
        width: 150,
        cellRenderer: (params: ICellRendererParams) => {
          const type = params.value;
          const config = {
            stockout: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Agotamiento' },
            excess_inventory: { icon: TrendingUp, color: 'text-purple-600 bg-purple-100', label: 'Exceso Inventario' },
            below_safety_stock: { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', label: 'Bajo Stock Seguridad' },
            order_urgency: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Urgencia Pedido' },
            forecast_deviation: { icon: TrendingDown, color: 'text-yellow-600 bg-yellow-100', label: 'Desviación Pronóstico' }
          };
          
          const typeConfig = config[type as keyof typeof config] || config.stockout;
          const Icon = typeConfig.icon;
          
          return (
            <div className="flex items-center space-x-2">
              <Icon className={`h-4 w-4 ${typeConfig.color.split(' ')[0]}`} />
              <span className="text-sm font-medium">{typeConfig.label}</span>
            </div>
          );
        }
      },
      {
        field: 'severity',
        headerName: 'Severidad',
        width: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const severity = params.value;
          const colors = {
            critical: 'bg-red-100 text-red-800 border-red-300',
            high: 'bg-orange-100 text-orange-800 border-orange-300',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            low: 'bg-green-100 text-green-800 border-green-300'
          };
          const labels = {
            critical: 'Crítica',
            high: 'Alta',
            medium: 'Media',
            low: 'Baja'
          };
          return (
            <Badge className={`${colors[severity as keyof typeof colors]} border`}>
              {labels[severity as keyof typeof labels]}
            </Badge>
          );
        }
      },
      {
        field: 'priority_score',
        headerName: 'Prioridad',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => params.value?.toFixed(0) || '0',
        cellClass: (params: any) => {
          const score = params.value || 0;
          if (score >= 150) return 'bg-red-50 text-red-900 font-bold';
          if (score >= 100) return 'bg-orange-50 text-orange-900 font-semibold';
          if (score >= 75) return 'bg-yellow-50 text-yellow-900 font-medium';
          return '';
        }
      },
      {
        field: 'age_days',
        headerName: 'Días',
        width: 80,
        valueFormatter: (params: ValueFormatterParams) => `${params.value || 0}d`,
        cellClass: (params: any) => {
          const age = params.value || 0;
          if (age >= 7) return 'bg-red-50 text-red-900 font-semibold';
          if (age >= 3) return 'bg-orange-50 text-orange-900 font-medium';
          return '';
        }
      },
      {
        field: 'exception_date',
        headerName: 'Fecha Excepción',
        width: 130,
        valueFormatter: (params: ValueFormatterParams) => {
          if (!params.value) return '-';
          return format(new Date(params.value), 'dd/MM/yyyy', { locale: es });
        }
      },
      {
        field: 'current_inventory',
        headerName: 'Inv. Actual',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0',
        cellClass: 'text-right font-medium'
      },
      {
        field: 'projected_inventory',
        headerName: 'Inv. Proyectado',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0',
        cellClass: (params: any) => {
          const value = params.value || 0;
          let className = 'text-right font-medium ';
          if (value < 0) className += 'text-red-700 bg-red-50';
          else if (value < (params.data?.safety_stock || 0)) className += 'text-orange-700 bg-orange-50';
          return className;
        }
      },
      {
        field: 'safety_stock',
        headerName: 'Stock Seguridad',
        width: 120,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '0',
        cellClass: 'text-right'
      },
      {
        field: 'shortage_quantity',
        headerName: 'Faltante',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '-',
        cellClass: 'text-right font-medium text-red-700'
      },
      {
        field: 'excess_quantity',
        headerName: 'Exceso',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => 
          params.value ? params.value.toLocaleString('es-MX') : '-',
        cellClass: 'text-right font-medium text-purple-700'
      },
      {
        field: 'resolution_status',
        headerName: 'Estado',
        width: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.value;
          const colors = {
            open: 'bg-red-100 text-red-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            resolved: 'bg-green-100 text-green-800',
            ignored: 'bg-gray-100 text-gray-800'
          };
          const labels = {
            open: 'Abierta',
            in_progress: 'En Progreso',
            resolved: 'Resuelta',
            ignored: 'Ignorada'
          };
          return (
            <Badge className={colors[status as keyof typeof colors]}>
              {labels[status as keyof typeof labels]}
            </Badge>
          );
        }
      },
      {
        field: 'recommended_action',
        headerName: 'Acción Recomendada',
        width: 300,
        cellClass: 'text-sm'
      },
      {
        headerName: 'Acciones',
        width: 150,
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.data.resolution_status;
          return (
            <div className="flex items-center space-x-1">
              {status === 'open' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartResolution(params.data)}
                    className="h-7 px-2"
                  >
                    <Clock className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveException(params.data)}
                    className="h-7 px-2"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
              {status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolveException(params.data)}
                  className="h-7 px-2"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(params.data)}
                className="h-7 px-2"
              >
                <Eye className="h-3 w-3" />
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

  // Action handlers
  const handleStartResolution = async (exception: PlanningExceptionGridRow) => {
    try {
      await MRPService.updateException(exception.id, { resolution_status: 'in_progress' });
      toast.success(`Excepción ${exception.product_id} marcada como en progreso`);
      await loadPlanningExceptions();
    } catch (error) {
      toast.error('Error al actualizar excepción');
    }
  };

  const handleResolveException = (exception: PlanningExceptionGridRow) => {
    setSelectedException(exception);
    setResolutionNotes('');
    setIsResolutionDialogOpen(true);
  };

  const handleConfirmResolution = async () => {
    if (!selectedException) return;
    
    try {
      await MRPService.resolveException(selectedException.id, resolutionNotes);
      toast.success(`Excepción ${selectedException.product_id} resuelta`);
      setIsResolutionDialogOpen(false);
      setSelectedException(null);
      setResolutionNotes('');
      await loadPlanningExceptions();
    } catch (error) {
      toast.error('Error al resolver excepción');
    }
  };

  const handleViewDetails = (exception: PlanningExceptionGridRow) => {
    // TODO: Open details modal
    toast.info(`Ver detalles de excepción ${exception.product_id} (funcionalidad pendiente)`);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `Planning_Exceptions_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`,
        sheetName: 'Planning Exceptions'
      });
    }
  };

  useEffect(() => {
    loadPlanningExceptions();
  }, [loadPlanningExceptions]);

  useEffect(() => {
    setColumnDefs(generateColumnDefs());
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      total: rowData.length,
      critical: rowData.filter(r => r.severity === 'critical').length,
      high: rowData.filter(r => r.severity === 'high').length,
      stockouts: rowData.filter(r => r.exception_type === 'stockout').length,
      aged: rowData.filter(r => r.age_days >= 7).length
    };
  }, [rowData]);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="open">Abiertas</TabsTrigger>
              <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
              <TabsTrigger value="resolved">Resueltas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="critical">Críticas</TabsTrigger>
              <TabsTrigger value="high">Altas</TabsTrigger>
            </TabsList>
          </Tabs>
          {activePlan && (
            <Badge variant="outline" className="bg-blue-50">
              Plan: {activePlan.plan_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{summaryStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-600">Críticas</p>
                <p className="text-2xl font-bold text-red-900">{summaryStats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Altas</p>
                <p className="text-2xl font-bold text-orange-900">{summaryStats.high}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Agotamientos</p>
                <p className="text-2xl font-bold text-purple-900">{summaryStats.stockouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Vencidas (&gt;7d)</p>
                <p className="text-2xl font-bold text-yellow-900">{summaryStats.aged}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 450px)', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true
          }}
          onGridReady={onGridReady}
          animateRows={true}
          enableRangeSelection={true}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalRowCountComponent', align: 'left' },
              { statusPanel: 'agAggregationComponent' }
            ]
          }}
          loading={loading}
          overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Cargando excepciones...</span>'}
          overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">No hay excepciones para mostrar</span>'}
        />
      </div>

      {/* Resolution Dialog */}
      <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Excepción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedException && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedException.product_id} - {selectedException.location_node_id}</p>
                <p className="text-sm text-gray-600">{selectedException.recommended_action}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas de Resolución
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describa las acciones tomadas para resolver esta excepción..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsResolutionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmResolution}
                disabled={!resolutionNotes.trim()}
              >
                Resolver Excepción
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};