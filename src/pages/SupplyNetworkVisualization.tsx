import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { commonAgGridConfig, agGridContainerStyles } from '../lib/ag-grid-config';
import { 
  Menu, 
  ChevronDown, 
  Download, 
  Filter, 
  Layout, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Settings,
  Package,
  Database
} from 'lucide-react';

const InventoryPolicyReview: React.FC = () => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('inventory-alerts');

  // Sample data mimicking the SC Master Planning screen
  const rowData = [
    {
      id: 1,
      item: 'P_5010_2',
      itemGroup: 'FinishedGoods',
      location: 'CDC_1',
      recommendedWOS: 2.7,
      targetPeriodsOfCover: 2.0,
      average3MOTIF: 96.0,
      minHistoricalWOS: 1.8,
      maxHistoricalWOS: 2.3,
      demandVarTrend: 'high',
      leadTimeVarTrend: 'stable',
      recommendedServiceLevel: 99.00,
      ruleName: 'Normal',
      weeksWithDemand: 43
    },
    {
      id: 2,
      item: 'P_5032_1',
      itemGroup: 'FinishedGoods',
      location: 'CDC_1',
      recommendedWOS: 2.5,
      targetPeriodsOfCover: 2.0,
      average3MOTIF: 85.0,
      minHistoricalWOS: 0.0,
      maxHistoricalWOS: 1.3,
      demandVarTrend: 'high',
      leadTimeVarTrend: 'stable',
      recommendedServiceLevel: 99.00,
      ruleName: 'Normal',
      weeksWithDemand: 44
    },
    {
      id: 3,
      item: 'P_5045_3',
      itemGroup: 'FinishedGoods',
      location: 'CDC_2',
      recommendedWOS: 1.0,
      targetPeriodsOfCover: 1.5,
      average3MOTIF: 95.0,
      minHistoricalWOS: 0.5,
      maxHistoricalWOS: 3.1,
      demandVarTrend: 'stable',
      leadTimeVarTrend: 'stable',
      recommendedServiceLevel: 99.00,
      ruleName: 'Normal',
      weeksWithDemand: 43
    },
    {
      id: 4,
      item: 'P_5050_1',
      itemGroup: 'FinishedGoods',
      location: 'CDC_2',
      recommendedWOS: 1.0,
      targetPeriodsOfCover: 1.5,
      average3MOTIF: 93.0,
      minHistoricalWOS: 0.3,
      maxHistoricalWOS: 2.9,
      demandVarTrend: 'stable',
      leadTimeVarTrend: 'stable',
      recommendedServiceLevel: 99.00,
      ruleName: 'Normal',
      weeksWithDemand: 43
    },
    {
      id: 5,
      item: 'P_5060_2',
      itemGroup: 'RawMaterials',
      location: 'Plant_1',
      recommendedWOS: 0.5,
      targetPeriodsOfCover: 1.0,
      average3MOTIF: 93.0,
      minHistoricalWOS: 0.1,
      maxHistoricalWOS: 2.7,
      demandVarTrend: 'stable',
      leadTimeVarTrend: 'stable',
      recommendedServiceLevel: 99.00,
      ruleName: 'Normal',
      weeksWithDemand: 35
    }
  ];

  const columnDefs: ColDef[] = [
    { headerName: 'Item', field: 'item', width: 120 },
    { headerName: 'Grupo de Item', field: 'itemGroup', width: 140 },
    { headerName: 'Ubicación', field: 'location', width: 100 },
    { 
      headerName: 'WOS Recomendado', 
      field: 'recommendedWOS', 
      width: 150,
      cellRenderer: (params: any) => {
        const value = params.value;
        let bgColor = '';
        if (value >= 2.5) bgColor = 'bg-yellow-200';
        else if (value >= 1.0) bgColor = 'bg-orange-200';
        else bgColor = 'bg-cyan-200';
        
        return (
          <div className={`px-2 py-1 rounded ${bgColor}`}>
            {value}
          </div>
        );
      }
    },
    { headerName: 'Períodos de Cobertura Objetivo', field: 'targetPeriodsOfCover', width: 180 },
    { 
      headerName: 'OTIF Promedio 3M', 
      field: 'average3MOTIF', 
      width: 150,
      cellRenderer: (params: any) => {
        const value = params.value;
        const bgColor = value < 90 ? 'bg-red-200' : '';
        return (
          <div className={`px-2 py-1 rounded ${bgColor}`}>
            {value}%
          </div>
        );
      }
    },
    { headerName: 'WOS Histórico Mín', field: 'minHistoricalWOS', width: 150 },
    { 
      headerName: 'WOS Histórico Máx', 
      field: 'maxHistoricalWOS', 
      width: 150,
      cellRenderer: (params: any) => {
        const value = params.value;
        const bgColor = value > 3.0 ? 'bg-cyan-200' : '';
        return (
          <div className={`px-2 py-1 rounded ${bgColor}`}>
            {value}
          </div>
        );
      }
    },
    { 
      headerName: 'Tendencia Var Demanda', 
      field: 'demandVarTrend', 
      width: 140,
      cellRenderer: (params: any) => {
        const value = params.value;
        if (value === 'high') {
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        } else if (value === 'stable') {
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        return <Minus className="h-4 w-4 text-gray-400" />;
      }
    },
    { 
      headerName: 'Tendencia Var Lead Time', 
      field: 'leadTimeVarTrend', 
      width: 150,
      cellRenderer: (params: any) => {
        const value = params.value;
        if (value === 'stable') {
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        return <Minus className="h-4 w-4 text-gray-400" />;
      }
    },
    { headerName: 'Nivel de Servicio Recomendado', field: 'recommendedServiceLevel', width: 180 },
    { headerName: 'Nombre de Regla', field: 'ruleName', width: 100 },
    { headerName: '# Semanas Con Demanda', field: 'weeksWithDemand', width: 180 }
  ];

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const handleRowSelection = (event: React.ChangeEvent<HTMLInputElement>, rowData: any) => {
    if (event.target.checked) {
      setSelectedRows(prev => [...prev, rowData]);
    } else {
      setSelectedRows(prev => prev.filter(row => row.id !== rowData.id));
    }
  };

  const handleApproveRecommendations = () => {
    console.log('Approve recommendations for:', selectedRows);
  };

  const handleDownload = () => {
    console.log('Download data');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revisión de Políticas de Inventario</h1>
          <p className="text-muted-foreground">Analiza y gestiona las políticas de inventario de tu cadena de suministro</p>
        </div>
      </div>

      <div className="p-2 space-y-2">
      </div>

 
      

      <div className={`${agGridContainerStyles}`} style={{ height: '30vh',  margin: '0 auto' }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              pagination={true}
              paginationPageSize={10}
              theme={commonAgGridConfig.theme}
              domLayout="autoHeight"
            />
          </div>

      {/* ===== DATA GRID ===== */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Políticas de Inventario</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPolicyReview;
