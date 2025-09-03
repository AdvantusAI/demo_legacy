import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Calendar, 
  Filter,
  AlertTriangle,
  TrendingUp,
  Clock,
  Download,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useExceptions, useExceptionStats } from '@/hooks/useExceptions';
import { ExceptionKPICards } from './ExceptionKPICards';
import { ExceptionPriorityMatrix } from './ExceptionPriorityMatrix';
import { ExceptionList } from './ExceptionList';
import { ExceptionDetail } from '@/services/exceptionService';
import { toast } from 'sonner';

export function ExceptionDashboard() {
  const {
    summary,
    exceptions,
    loading,
    filters,
    setFilters,
    refreshData,
    selectException,
    updateExceptionStatus
  } = useExceptions();

  const stats = useExceptionStats(exceptions);
  const [selectedTab, setSelectedTab] = useState<'list' | 'matrix'>('list');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleRefresh = async () => {
    toast.info('Actualizando datos...');
    await refreshData();
    toast.success('Datos actualizados exitosamente');
  };

  const handleExceptionSelect = (exception: ExceptionDetail) => {
    selectException(exception);
    // Could open a modal or navigate to detail view
    toast.info(`Excepción ${exception.exception_code} seleccionada`);
  };

  const handleActionTaken = async (exception: ExceptionDetail, action: string) => {
    if (action === 'resolve') {
      await updateExceptionStatus(exception.id, 'resolved', 'Resuelta desde el dashboard');
    } else if (action === 'acknowledge') {
      await updateExceptionStatus(exception.id, 'acknowledged');
    }
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value);
    if (value === 'all') {
      const { severity, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({ ...filters, severity: value });
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    if (value === 'all') {
      const { type, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({ ...filters, type: value });
    }
  };

  const handleExportData = () => {
    // Convert exceptions to CSV
    const headers = ['Código', 'Tipo', 'Producto', 'Ubicación', 'Severidad', 'Días Supply', 'Impacto'];
    const rows = exceptions.map(e => [
      e.exception_code,
      e.exception_type,
      e.product_id,
      e.location_name,
      e.severity_level,
      e.days_of_supply.toFixed(1),
      e.estimated_financial_impact.toFixed(0)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excepciones_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Datos exportados exitosamente');
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Excepciones de Supply Chain
              </h1>
              <p className="text-sm text-gray-600">
                {format(new Date(), 'EEEE d \'de\' MMMM, yyyy', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Rango de Fechas
            </Button>
            
            <Button
              onClick={handleExportData}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-600">
              {summary.critical_count} Excepciones Críticas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-sm font-semibold text-orange-600">
              {summary.high_count} Altas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              {summary.total_count} Total
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Última actualización: {format(new Date(), 'HH:mm:ss')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <ExceptionKPICards summary={summary} loading={loading} />

      {/* Filters Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <Select value={severityFilter} onValueChange={handleSeverityFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Severidades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de Excepción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                <SelectItem value="stockout_risk">Riesgo Agotamiento</SelectItem>
                <SelectItem value="excess_inventory">Exceso Inventario</SelectItem>
                <SelectItem value="safety_stock_violation">Stock Seguridad</SelectItem>
                <SelectItem value="dead_stock">Inventario Muerto</SelectItem>
              </SelectContent>
            </Select>
            
            {(severityFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeverityFilter('all');
                  setTypeFilter('all');
                  setFilters({});
                }}
              >
                Limpiar Filtros
              </Button>
            )}
            
            <div className="ml-auto">
              <Badge variant="outline" className="text-sm">
                {exceptions.length} excepciones activas
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedTab === 'list' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('list')}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Vista Lista
        </Button>
        <Button
          variant={selectedTab === 'matrix' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('matrix')}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Matriz de Priorización
        </Button>
      </div>

      {/* Main Content */}
      {selectedTab === 'matrix' ? (
        <ExceptionPriorityMatrix 
          exceptions={exceptions} 
          onExceptionClick={handleExceptionSelect}
        />
      ) : (
        <ExceptionList 
          exceptions={exceptions} 
          loading={loading}
          onExceptionSelect={handleExceptionSelect}
          onActionTaken={handleActionTaken}
        />
      )}

      {/* Statistics Summary */}
      {stats.criticalProducts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Productos Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.criticalProducts.map((product) => (
                <div key={product.productId} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-sm text-gray-900">{product.productId}</p>
                  <p className="text-xs text-gray-600 mb-2">{product.productName}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Excepciones:</span>
                    <span className="font-medium">{product.exceptionsCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Impacto:</span>
                    <span className="font-medium text-red-600">
                      ${product.totalImpact.toLocaleString('es-MX', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Ubicaciones afectadas:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.locations.slice(0, 3).map((loc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {loc}
                        </Badge>
                      ))}
                      {product.locations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.locations.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { BarChart3 } from 'lucide-react';