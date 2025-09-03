import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, CellFocusedEvent } from 'ag-grid-community';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { configureAGGridLicense, defaultGridOptions } from '@/lib/ag-grid-config';
import { useProducts } from '@/hooks/useProducts';
import '@/styles/ag-grid-custom.css';

// Configure AG Grid license
configureAGGridLicense();

interface HistoryData {
  id: number;
  product_id: string | null;
  location_id: string | null;
  customer_id: string | null;
  quantity: number | null;
  type: string | null;
  postdate: string | null;
  normalized_quantity: number | null;
  event_adjusted_quantity: number | null;
  is_outlier: boolean | null;
  outlier_method: string | null;
  has_event: boolean | null;
  event_ids: number[] | null;
  created_at: string;
  updated_at: string | null;
  product_name?: string;
  location_name?: string;
  customer_name?: string;
  customers?: {
    customer_name: string;
  } | null;
}


const HistoryDataView: React.FC = () => {
  const [inventory, setInventory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getProductName } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('history')
        .select(`
          *,
          customers(customer_name)
        `)
        .order('postdate', { ascending: false });

      if (error) throw error;

      setInventory((data as unknown as HistoryData[]) || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };



  const columnDefs: ColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      sortable: true, 
      filter: true, 
      flex: 0.8, 
      minWidth: 80
    },
    { 
      field: 'product_id', 
      headerName: 'ID Producto', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120
    },
    { 
      headerName: 'Producto', 
      field: 'producto',
      tooltipField: 'producto', // Shows on hover
      cellStyle: {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },
      sortable: true, 
      filter: true, 
      flex: 1.5, 
      minWidth: 180,
      valueGetter: (params) => getProductName(params.data?.product_id || '')
    },
    { 
      field: 'customer_id', 
      headerName: 'ID Cliente', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120
    },
    { 
      headerName: 'Nombre Cliente', 
      sortable: true, 
      filter: true, 
      flex: 1.5, 
      minWidth: 180,
      valueGetter: (params) => params.data?.customers?.customer_name || 'N/A',
      tooltipField: 'customers.customer_name',
      cellStyle: {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }
    },
    { 
      field: 'type', 
      headerName: 'Tipo', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 100
    },
    { 
      field: 'quantity', 
      headerName: 'Cantidad', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 100,
      valueFormatter: (params) => params.value != null ? params.value.toLocaleString() : ''
    },
    { 
      field: 'normalized_quantity', 
      headerName: 'Cant. Normalizada', 
      sortable: true, 
      filter: true, 
      flex: 1.2, 
      minWidth: 140,
      valueFormatter: (params) => params.value != null ? params.value.toFixed(2) : ''
    },
    { 
      field: 'event_adjusted_quantity', 
      headerName: 'Cant. Ajustada', 
      sortable: true, 
      filter: true, 
      flex: 1.2, 
      minWidth: 140,
      valueFormatter: (params) => params.value != null ? params.value.toLocaleString() : ''
    },
    { 
      field: 'postdate', 
      headerName: 'Fecha', 
      sortable: true, 
      filter: true, 
      flex: 1.2, 
      minWidth: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : ''
    }
  ];

  const filteredInventoryForGrid = useMemo(() => {
    if (!searchTerm) return inventory;
    
    return inventory.filter(item =>
      item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Datos</h1>
          <p className="text-muted-foreground">Consulta el historial de transacciones con capacidades de análisis pivot</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar por producto, ubicación o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
          </div>
        </div>
       
      </div>


      <Card>
        <CardContent className="p-0">
          <div className="ag-theme-custom h-[950px] w-full">
         

          
            <AgGridReact
            enableBrowserTooltips={true}
              rowData={filteredInventoryForGrid}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={20}
              suppressMenuHide={true}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              animateRows={true}
              rowSelection={'single'}
              suppressRowClickSelection={true}
              enableRangeSelection={true}
              suppressCopyRowsToClipboard={false}
              enableCharts={false}
              enableRangeHandle={true}
              enableFillHandle={true}
              getRowClass={(params) => {
                const classes = [];
                if (params.node.rowIndex % 2 === 0) {
                  classes.push('ag-row-even');
                } else {
                  classes.push('ag-row-odd');
                }
                if (params.node.isSelected()) {
                  classes.push('ag-row-selected');
                }
                if (
                  params.api.getFocusedCell() &&
                  params.api.getFocusedCell()!.rowIndex === params.node.rowIndex
                ) {
                  classes.push('ag-row-focused');
                }
                return classes;
              }}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: false,
              }}
              onCellFocused={(params) => {
                params.api.refreshCells({ force: true });
              }}
              rowGroupPanelShow={'always'}
              pivotPanelShow={'always'}
              pivotMode={false}
              suppressRowGroupHidesColumns={true}
              suppressMakeColumnVisibleAfterUnGroup={true}
              sideBar={{
                toolPanels: [
                  {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel',
                    toolPanelParams: {
                      suppressRowGroups: false,
                      suppressValues: false,
                      suppressPivots: false,
                      suppressPivotMode: false,
                      suppressColumnFilter: false,
                      suppressColumnSelectAll: false,
                      suppressColumnExpandAll: false
                    }
                  },
                  {
                    id: 'filters',
                    labelDefault: 'Filters',
                    labelKey: 'filters',
                    iconKey: 'filter',
                    toolPanel: 'agFiltersToolPanel',
                  },
                ]
              }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
                // Clear any existing row groups
                params.api.setRowGroupColumns([]);
              }}
            />
            </div>
    
        </CardContent>
      </Card>

      
    </div>
  );
};

export default HistoryDataView;