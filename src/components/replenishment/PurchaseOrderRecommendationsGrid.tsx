import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { commonAgGridConfig, agGridContainerStyles } from '../../lib/ag-grid-config';

interface PurchaseOrderRecommendation {
  id: string;
  product_id: string;
  product_name?: string;
  supplier_id: string;
  supplier_name?: string;
  location_node_id: string;
  location_name?: string;
  recommended_quantity: number;
  unit_cost: number;
  total_cost: number;
  lead_time_days: number;
  safety_stock_requirement: number;
  current_inventory: number;
  demand_forecast: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendation_reason: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderRecommendationsGridProps {
  productId?: string;
  locationId?: string;
}

export const PurchaseOrderRecommendationsGrid: React.FC<PurchaseOrderRecommendationsGridProps> = ({
  productId,
  locationId
}) => {
  const [rowData, setRowData] = useState<PurchaseOrderRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .schema('m8_schema')
        .from('v_purchase_order_recommendations')
        .select('*');

      // Apply filters if provided
      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (locationId) {
        query = query.eq('location_code', locationId);
      }

      const { data, error } = await query.order('urgency', { ascending: false });

      if (error) throw error;

      setRowData(data || []);
    } catch (error) {
      console.error('Error loading purchase order recommendations:', error);
      toast.error('Error al cargar las recomendaciones de órdenes de compra');
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId, locationId]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#d97706'; // amber-600
      case 'low': return '#059669'; // emerald-600
      default: return '#6b7280'; // gray-500
    }
  };

  const getUrgencyBackgroundColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#fef2f2'; // red-50
      case 'high': return '#fff7ed'; // orange-50
      case 'medium': return '#fffbeb'; // amber-50
      case 'low': return '#f0fdf4'; // emerald-50
      default: return '#f9fafb'; // gray-50
    }
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Localidad',
      field: 'location_code',
      pinned: 'left',
      width: 150,
      headerClass: 'font-bold',
      cellStyle: { fontWeight: 'bold', backgroundColor: 'transparent' }
    },
    {
      headerName: 'Proveedor',
      field: 'vendor_name',
      width: 210,
      cellStyle: { textAlign: 'left' }
    },
    {
      headerName: 'Fecha solicitud PO.',
      field: 'recommended_order_date',
      width: 200,
      type: 'dateColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'Fecha de recepción esperada',
      field: 'required_delivery_date',
      width: 200,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'Lead time',
      field: 'lead_time_days',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'Cantidad recomendada',
      field: 'recommended_quantity',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'Costo Unit.',
      field: 'unit_cost',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'costo_total',
      field: 'total_cost',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    },
    {
      headerName: 'Prioridad',
      field: 'urgency',
      width: 120,
      type: 'textColumn',
      cellStyle: (params: any) => {
        const value = params.value;
        let backgroundColor = 'transparent';
        
        if (value === 'normal') {
          backgroundColor = '#e5fae3';
        } else if (value === 'urgente') {
          backgroundColor = '#ffe1e0';
        }
        
        return {
          textAlign: 'right',
          backgroundColor
        };
      }
    },
    {
      headerName: 'Estatus',
      field: 'status',
      width: 120,
      cellStyle: (params: any) => {
        const value = params.value;
        let backgroundColor = 'transparent';
        
        if (value === 'normal') {
          backgroundColor = '#e5fae3';
        } else if (value === 'pending') {
          backgroundColor = '#ffe1e0';
        }
        
        return {
          textAlign: 'right',
          backgroundColor
        };
      }
    },
    {
      headerName: 'Justificación',
      field: 'reasoning',
      width: 700,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? params.value.toLocaleString('es-MX') : '0';
      }
    }
    
  ], []);

  const defaultColDef = useMemo(() => ({
    ...commonAgGridConfig.defaultColDef,
    sortable: false,
    filter: false,
    resizable: true,
    floatingFilter: false,
    menuTabs: [],
    cellStyle: (params: any) => {
      const metric = params.data?.metric;
      
      // Row highlighting based on metric
      if (metric === 'Demanda Total') {
        return { backgroundColor: '#ffe3bd' };
      }
      
      if (metric === 'Órdenes Planificadas') {
        return { backgroundColor: '#e1f7e4' };
      }

      // Conditional highlighting for "Inventario Proyectado"
      if (metric === 'Inventario Proyectado') {
        const currentValue = params.value;
        const safetyStockValue = params.data?.safety_stock_value;
        
        if (currentValue <= safetyStockValue) {
          return { backgroundColor: '#faaaae' };
        }
      }

      return {};
    }
  }), []);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const handleExport = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `purchase_order_recommendations_${new Date().toISOString().split('T')[0]}.csv`
      });
      toast.success('Datos exportados correctamente');
    }
  };

 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  return (
    
    <div className="space-y-4">
      
      {/* Header */}


      {/* AG Grid */}
      <div className={`${agGridContainerStyles}`} style={{ height: '30vh',  margin: '0 auto' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          suppressRowClickSelection={false}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          
          enableRangeSelection={false}
          defaultColDef={{
            ...commonAgGridConfig.defaultColDef,
            filter: false,
            floatingFilter: false,
            menuTabs: ['generalMenuTab', 'columnsMenuTab']
          }}
          theme={commonAgGridConfig.theme}
          onGridReady={onGridReady}
          getRowClass={(params: any) => {
            const classes = [];
            if (params.node.rowIndex % 2 === 0) {
              classes.push('ag-row-even');
            } else {
              classes.push('ag-row-odd');
            }
            if (params.data?.projected_on_hand < 0) {
              classes.push('border-l-4 border-l-red-500');
            }
            return classes.join(' ');
          }}


          domLayout="normal"

        />
      </div>
    </div>
  );
};
