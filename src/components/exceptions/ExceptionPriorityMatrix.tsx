import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown,
  Skull,
  ArrowRight
} from 'lucide-react';
import { ExceptionDetail } from '@/services/exceptionService';

interface ExceptionPriorityMatrixProps {
  exceptions: ExceptionDetail[];
  onExceptionClick?: (exception: ExceptionDetail) => void;
}

export const ExceptionPriorityMatrix: React.FC<ExceptionPriorityMatrixProps> = ({ 
  exceptions, 
  onExceptionClick 
}) => {
  // Categorize exceptions by impact and urgency
  const categorizeExceptions = () => {
    const matrix = {
      highImpactUrgent: [] as ExceptionDetail[],
      lowImpactUrgent: [] as ExceptionDetail[],
      highImpactNotUrgent: [] as ExceptionDetail[],
      lowImpactNotUrgent: [] as ExceptionDetail[]
    };

    exceptions.forEach(exception => {
      const isHighImpact = exception.estimated_financial_impact > 5000;
      const isUrgent = exception.severity_level === 'critical' || exception.severity_level === 'high';

      if (isHighImpact && isUrgent) {
        matrix.highImpactUrgent.push(exception);
      } else if (!isHighImpact && isUrgent) {
        matrix.lowImpactUrgent.push(exception);
      } else if (isHighImpact && !isUrgent) {
        matrix.highImpactNotUrgent.push(exception);
      } else {
        matrix.lowImpactNotUrgent.push(exception);
      }
    });

    return matrix;
  };

  const matrix = categorizeExceptions();

  const getExceptionIcon = (type: string) => {
    switch (type) {
      case 'stockout_risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'excess_inventory':
        return <Package className="h-4 w-4" />;
      case 'dead_stock':
        return <Skull className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getExceptionTypeLabel = (type: string) => {
    switch (type) {
      case 'stockout_risk':
        return 'Riesgo Agotamiento';
      case 'excess_inventory':
        return 'Exceso Inventario';
      case 'dead_stock':
        return 'Inventario Muerto';
      case 'safety_stock_violation':
        return 'Stock Seguridad Bajo';
      default:
        return type;
    }
  };

  const MatrixQuadrant: React.FC<{
    title: string;
    subtitle: string;
    exceptions: ExceptionDetail[];
    bgColor: string;
    borderColor: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }> = ({ title, subtitle, exceptions: quadrantExceptions, bgColor, borderColor, priority }) => {
    return (
      <div className={`
        p-6 rounded-xl border-2 ${borderColor} ${bgColor}
        min-h-[250px] transition-all duration-300 hover:shadow-lg
      `}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <Badge 
              variant={priority === 'critical' ? 'destructive' : 
                       priority === 'high' ? 'default' :
                       priority === 'medium' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {quadrantExceptions.length} items
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto">
          {quadrantExceptions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hay excepciones en esta categoría</p>
          ) : (
            quadrantExceptions.slice(0, 5).map((exception, idx) => (
              <div
                key={exception.id}
                onClick={() => onExceptionClick?.(exception)}
                className="
                  flex items-center justify-between p-3 
                  bg-white/80 backdrop-blur-sm rounded-lg 
                  border border-gray-200 cursor-pointer
                  hover:border-gray-300 hover:shadow-sm
                  transition-all duration-200
                "
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className={`
                    p-1.5 rounded-lg
                    ${priority === 'critical' ? 'bg-red-100 text-red-600' :
                      priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'}
                  `}>
                    {getExceptionIcon(exception.exception_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {exception.product_id}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {exception.location_name} • {exception.days_of_supply.toFixed(1)} días
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            ))
          )}
          {quadrantExceptions.length > 5 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{quadrantExceptions.length - 5} más...
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          Matriz de Priorización de Excepciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* High Impact + Urgent */}
          <MatrixQuadrant
            title="CRÍTICO - Alto Impacto"
            subtitle="Acción inmediata requerida"
            exceptions={matrix.highImpactUrgent}
            bgColor="bg-gradient-to-br from-red-50/50 to-red-100/30"
            borderColor="border-red-300"
            priority="critical"
          />

          {/* Low Impact + Urgent */}
          <MatrixQuadrant
            title="URGENTE - Bajo Impacto"
            subtitle="Resolver pronto"
            exceptions={matrix.lowImpactUrgent}
            bgColor="bg-gradient-to-br from-orange-50/50 to-orange-100/30"
            borderColor="border-orange-300"
            priority="high"
          />

          {/* High Impact + Not Urgent */}
          <MatrixQuadrant
            title="MEDIO - Alto Impacto"
            subtitle="Planificar resolución"
            exceptions={matrix.highImpactNotUrgent}
            bgColor="bg-gradient-to-br from-yellow-50/50 to-yellow-100/30"
            borderColor="border-yellow-300"
            priority="medium"
          />

          {/* Low Impact + Not Urgent */}
          <MatrixQuadrant
            title="BAJO - Monitorear"
            subtitle="Revisar periódicamente"
            exceptions={matrix.lowImpactNotUrgent}
            bgColor="bg-gradient-to-br from-gray-50/50 to-gray-100/30"
            borderColor="border-gray-300"
            priority="low"
          />
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">LEYENDA:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: AlertTriangle, label: 'Riesgo Agotamiento', color: 'text-red-600' },
              { icon: Package, label: 'Exceso Inventario', color: 'text-orange-600' },
              { icon: TrendingDown, label: 'Stock Seguridad Bajo', color: 'text-yellow-600' },
              { icon: Skull, label: 'Inventario Muerto', color: 'text-gray-600' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <item.icon className={`h-3 w-3 ${item.color}`} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { BarChart3 } from 'lucide-react';