import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useForecastCollaboration } from '@/hooks/useForecastCollaboration';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { pivotTableConfig, agGridContainerStyles } from '../lib/ag-grid-config';

interface ForecastData {
  id?: string;
  postdate: string;
  forecast?: number;
  sales_plan?: number;
  commercial_input?: number;
  collaboration_status?: string;
  commercial_confidence?: string;
  commercial_notes?: string;
  commercial_reviewed_by?: string;
  commercial_reviewed_at?: string;
  market_intelligence?: string;
  promotional_activity?: string;
  competitive_impact?: string;
}

interface ForecastPivotTableProps {
  data: ForecastData[];
  comments: unknown[];
}

interface PivotRowData {
  metric: string;
  [key: string]: string | number; // Dynamic date columns
}

export const ForecastPivotTable: React.FC<ForecastPivotTableProps> = ({
  data,
  comments
}) => {
  const {
    updateForecastCollaboration
  } = useForecastCollaboration();
  const [pendingUpdates, setPendingUpdates] = useState<{
    [key: string]: number;
  }>({});
  const [showInputDialog, setShowInputDialog] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<{
    date: string;
    commercial_input?: string;
    commercial_confidence?: string;
    commercial_notes?: string;
    commercial_reviewed_by?: string;
    commercial_reviewed_at?: string;
    market_intelligence?: string;
    promotional_activity?: string;
    competitive_impact?: string;
  } | null>(null);

  // Filter dates for last 2 months and until December 31st of current year
  const getFilteredDates = () => {
    const today = new Date();
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31st of current year
    return data.filter(item => {
      const itemDate = new Date(item.postdate);
      return itemDate >= twoMonthsAgo && itemDate <= endOfYear;
    }).map(item => item.postdate);
  };

  // Get unique dates and sort them (filtered)
  const uniqueDates = [...new Set(getFilteredDates())].sort();

  // Helper function to get data for a specific date
  const getDataForDate = (date: string): ForecastData => {
    return data.find(item => item.postdate === date) || {} as ForecastData;
  };

  // Helper function to format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Transform data for AG Grid pivot format
  const pivotData = useMemo(() => {
    const rows: PivotRowData[] = [
      { metric: 'Forecast (M8.predict)' },
      { metric: 'Plan Comercial' },
      { metric: 'Mi Input' }
    ];
    
    ////console.log(data);
    // Add date columns to each row
    uniqueDates.forEach(date => {
      const dayData = getDataForDate(date);
      const formattedDate = formatDate(date);
      
      // Pronóstico IA
      rows[0][formattedDate] = dayData.forecast !== null && dayData.forecast !== undefined ? 
        (typeof dayData.forecast === 'number' ? dayData.forecast : parseFloat(dayData.forecast) || '-') : 
        '-';
      
      // Plan Comercial
      rows[1][formattedDate] = dayData.sales_plan !== null && dayData.sales_plan !== undefined ? 
        (typeof dayData.sales_plan === 'number' ? dayData.sales_plan : parseFloat(dayData.sales_plan) || '') : 
        '';
      
      // Mi Input
      const currentValue = pendingUpdates[`input-${date}`] !== undefined 
        ? pendingUpdates[`input-${date}`] 
        : dayData.commercial_input;
      rows[2][formattedDate] = currentValue !== null && currentValue !== undefined ? 
        (typeof currentValue === 'number' ? currentValue : parseFloat(currentValue) || '-') : 
        '-';
    });

    return rows;
  }, [data, uniqueDates, pendingUpdates]);

  // Create column definitions for AG Grid
  const columnDefs = useMemo(() => {
    const cols: ColDef[] = [
      {
        field: 'metric',
        headerName: 'Métrica',
        width: 200,
        pinned: 'left',
        cellStyle: { 
          fontWeight: 'bold',
          backgroundColor: '#f1f5f9'
        }
      }
    ];

    // Add date columns
    uniqueDates.forEach(date => {
      const formattedDate = formatDate(date);
      cols.push({
        field: formattedDate,
        headerName: formattedDate,
        width: 120,
        valueFormatter: (params) => {
          // Handle empty values for Plan Comercial
          if (params.data?.metric === 'Plan Comercial' && (params.value === null || params.value === undefined || params.value === '')) {
            return '';
          }
          // Handle empty values for other rows
          if (params.value === null || params.value === undefined || params.value === '') {
            return '-';
          }
          // Format Forecast (M8.predict) with mileage separator
          if (params.data?.metric === 'Forecast (M8.predict)' && typeof params.value === 'number') {
            return params.value.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
          }
          return params.value;
        },
        cellStyle: (params) => {
          if (params.data?.metric === 'Mi Input') {
            return { 
              backgroundColor: '#fef3c7',
              cursor: 'pointer'
            };
          }
          // Right align Forecast (M8.predict) row
          if (params.data?.metric === 'Forecast (M8.predict)') {
            return { 
              textAlign: 'right'
            };
          }
          return {};
        },
        onCellClicked: (params) => {
          if (params.data?.metric === 'Mi Input') {
            const dayData = getDataForDate(date);
            const currentValue = pendingUpdates[`input-${date}`] !== undefined 
              ? pendingUpdates[`input-${date}`] 
              : dayData.commercial_input;
            handleInputDialogOpen(date, currentValue?.toString() || '');
          }
        }
      });
    });

    return cols;
  }, [uniqueDates, pendingUpdates]);

  const handleInputDialogOpen = (date: string, value: string) => {
    const dayData = getDataForDate(date);
    setDialogData({
      date,
      commercial_input: value,
      commercial_confidence: dayData.commercial_confidence || '',
      commercial_notes: dayData.commercial_notes || '',
      commercial_reviewed_by: dayData.commercial_reviewed_by || '',
      commercial_reviewed_at: dayData.commercial_reviewed_at || '',
      market_intelligence: dayData.market_intelligence || '',
      promotional_activity: dayData.promotional_activity || '',
      competitive_impact: dayData.competitive_impact || '',
    });
    setShowInputDialog(date);
  };

  const handleInputDialogSave = async () => {
    if (!dialogData) return;

    const { date, ...updatedValues } = dialogData;
    const dayData = getDataForDate(date);

    if (dayData.id) {
      const success = await updateForecastCollaboration(dayData.id, {
        ...updatedValues,
        commercial_input: parseFloat(updatedValues.commercial_input) || 0,
        collaboration_status: 'reviewed',
      });
      if (success) {
        setPendingUpdates(prev => ({
          ...prev,
          [`input-${date}`]: parseFloat(updatedValues.commercial_input) || 0,
        }));
        setShowInputDialog(null);
        setDialogData(null);
      }
    }
  };

  const handleInputDialogCancel = () => {
    setShowInputDialog(null);
    setDialogData(null);
  };

  if (!data || data.length === 0) {
    return <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No hay datos disponibles para mostrar en la tabla pivote.
          </p>
        </CardContent>
      </Card>;
  }

  return (
    <Card>
      <CardHeader>
        
      </CardHeader>
      <CardContent>
        <div className={agGridContainerStyles}>
          <AgGridReact
            rowData={pivotData}
            columnDefs={columnDefs}
            defaultColDef={pivotTableConfig.defaultColDef}
            animateRows={pivotTableConfig.animateRows}
            headerHeight={pivotTableConfig.headerHeight}
            rowHeight={pivotTableConfig.rowHeight}
            theme={pivotTableConfig.theme}
            pagination={pivotTableConfig.pagination}
            statusBar={pivotTableConfig.statusBar}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          />
        </div>
      </CardContent>
      {showInputDialog && dialogData && (
        <Dialog open onOpenChange={() => setShowInputDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Mi Input</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Input Comercial</label>
                <Input
                  value={dialogData.commercial_input || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, commercial_input: e.target.value } : prev)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confianza Comercial</label>
                <select
                  value={dialogData.commercial_confidence || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, commercial_confidence: e.target.value } : prev)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas Comerciales</label>
                <Textarea
                  value={dialogData.commercial_notes || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, commercial_notes: e.target.value } : prev)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inteligencia de Mercado</label>
                <Input
                  value={dialogData.market_intelligence || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, market_intelligence: e.target.value } : prev)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Actividad Promocional</label>
                <Input
                  value={dialogData.promotional_activity || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, promotional_activity: e.target.value } : prev)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Impacto Competitivo</label>
                <Input
                  value={dialogData.competitive_impact || ''}
                  onChange={e => setDialogData(prev => prev ? { ...prev, competitive_impact: e.target.value } : prev)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleInputDialogCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleInputDialogSave}>
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};