import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Eye, 
  ShoppingCart, 
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  MapPin,
  MoreVertical,
  FileText,
  Send,
  CheckCircle
} from 'lucide-react';
import { ExceptionDetail } from '@/services/exceptionService';
import { toast } from 'sonner';

interface ExceptionListProps {
  exceptions: ExceptionDetail[];
  loading?: boolean;
  onExceptionSelect?: (exception: ExceptionDetail) => void;
  onActionTaken?: (exception: ExceptionDetail, action: string) => void;
}

export const ExceptionList: React.FC<ExceptionListProps> = ({ 
  exceptions, 
  loading,
  onExceptionSelect,
  onActionTaken
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      critical: { variant: 'destructive', className: 'bg-red-500' },
      high: { variant: 'default', className: 'bg-orange-500' },
      medium: { variant: 'secondary', className: 'bg-yellow-500' },
      low: { variant: 'outline', className: '' }
    };

    return (
      <Badge 
        variant={variants[severity]?.variant || 'outline'}
        className={`${variants[severity]?.className} text-white font-semibold`}
      >
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getExceptionIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'stockout_risk': <AlertTriangle className="h-4 w-4 text-red-500" />,
      'excess_inventory': <Package className="h-4 w-4 text-orange-500" />,
      'safety_stock_violation': <Clock className="h-4 w-4 text-yellow-500" />,
      'dead_stock': <Package className="h-4 w-4 text-gray-500" />
    };
    return icons[type] || <AlertTriangle className="h-4 w-4 text-gray-500" />;
  };

  const getExceptionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'stockout_risk': 'Riesgo Agotamiento',
      'excess_inventory': 'Exceso Inventario',
      'safety_stock_violation': 'Stock Seguridad',
      'dead_stock': 'Inventario Muerto'
    };
    return labels[type] || type;
  };

  const handleAction = (exception: ExceptionDetail, action: string) => {
    if (action === 'view_plan') {
      // Navigate to replenishment dashboard with product and location parameters
      const searchParams = new URLSearchParams({
        product_id: exception.product_id,
        location_node_id: exception.location_code
      });
      navigate(`/replenishment-dashboard?${searchParams.toString()}`);
      toast.success(`Navegando al plan de suministro para ${exception.product_name}`);
    } else {
      toast.success(`Acción "${action}" iniciada para ${exception.exception_code}`);
      onActionTaken?.(exception, action);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Excepciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Lista de Excepciones - Datos Reales del Sistema
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {exceptions.length} excepciones activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Código</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ubicación</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Severidad</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Días Supply</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Impacto</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exception) => (
                <React.Fragment key={exception.id}>
                  <tr 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onExceptionSelect?.(exception)}
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {exception.exception_code}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getExceptionIcon(exception.exception_type)}
                        <span className="text-sm font-medium">
                          {getExceptionTypeLabel(exception.exception_type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{exception.product_id}</p>
                        <p className="text-xs text-gray-500">{exception.product_name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{exception.location_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getSeverityBadge(exception.severity_level)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className={`text-sm font-semibold ${
                          exception.days_of_supply < 7 ? 'text-red-600' :
                          exception.days_of_supply < 14 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {exception.days_of_supply.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          ${exception.estimated_financial_impact.toLocaleString('es-MX', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            Acciones
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Acciones Disponibles</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {exception.severity_level === 'critical' && (
                            <DropdownMenuItem
                              onClick={() => handleAction(exception, 'reorder_urgent')}
                              className="text-red-600"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Reordenar Urgente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleAction(exception, 'view_plan')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Plan Detallado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction(exception, 'monitor')}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Monitorear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction(exception, 'transfer')}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Transferir Stock
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction(exception, 'resolve')}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Resuelta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  {expandedRows.has(exception.id) && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Stock Actual</p>
                            <p className="text-sm">{exception.current_stock.toFixed(0)} unidades</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Demanda Semanal</p>
                            <p className="text-sm">{exception.weekly_demand.toFixed(0)} unidades</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Stock de Seguridad</p>
                            <p className="text-sm">{exception.safety_stock_requirement.toFixed(0)} unidades</p>
                          </div>
                          <div className="md:col-span-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Descripción</p>
                            <p className="text-sm text-gray-700">{exception.alert_description}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {exceptions.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No hay excepciones activas en este momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};