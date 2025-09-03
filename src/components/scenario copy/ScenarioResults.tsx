import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { ScenarioResults as ScenarioResultsType } from '@/types/scenario';
import { ServiceLevelResults } from './ServiceLevelResults';

interface ScenarioResultsProps {
  results: ScenarioResultsType | any; // Allow for extended results with service level data
  scenarioName: string;
}

export const ScenarioResults: React.FC<ScenarioResultsProps> = ({
  results,
  scenarioName
}) => {
  ////console.log('🔍 resultados:', { results, scenarioName });
  
  // Check if this is a service level scenario
  if (results.scenario_type === 'service' && results.service_level_results) {
    return (
      <ServiceLevelResults 
        results={results.service_level_results} 
        scenarioName={scenarioName} 
      />
    );
  }

  const { impact_summary } = results || {};
  
  ////console.log('📊 resumen de impacto:', impact_summary);
  
  // If impact_summary is not available, show loading or fallback
  if (!impact_summary) {
    ////console.log('⚠️ No se encontró impact_summary, mostrando mensaje de no datos');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center max-w-md">
          <div className="text-muted-foreground mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
          <p className="text-muted-foreground mb-4">
            Este escenario aún no tiene resultados calculados. Para ver los resultados:
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Ejecuta el escenario desde el constructor de escenarios</p>
            <p>• O crea un nuevo escenario con parámetros específicos</p>
          </div>
        </div>
      </div>
    );
  }

  const getImpactColor = (value: number | undefined) => {
    if (typeof value !== 'number') return 'text-gray-600';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImpactIcon = (value: number | undefined) => {
    if (typeof value !== 'number') return CheckCircle;
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return CheckCircle;
  };

  const formatPercentage = (value: number | undefined) => {
    if (typeof value !== 'number') return '0.0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Resultados del escenario</h2>
          <p className="text-muted-foreground">{scenarioName}</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Completado
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Count Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Impacto en el número de pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {React.createElement(getImpactIcon(impact_summary.total_order_count_change), {
                className: `h-5 w-5 ${getImpactColor(impact_summary.total_order_count_change)}`
              })}
              <span className={`text-2xl font-bold ${getImpactColor(impact_summary.total_order_count_change)}`}>
                {formatPercentage(impact_summary.total_order_count_change)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cambio en el número total de pedidos
            </p>
          </CardContent>
        </Card>

        {/* Value Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Impacto en el valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {React.createElement(getImpactIcon(impact_summary.total_value_change), {
                className: `h-5 w-5 ${getImpactColor(impact_summary.total_value_change)}`
              })}
              <span className={`text-2xl font-bold ${getImpactColor(impact_summary.total_value_change)}`}>
                {formatCurrency(impact_summary.total_value_change)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
                Cambio en el valor total
            </p>
          </CardContent>
        </Card>

        {/* Lead Time Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Impacto en el tiempo de entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {React.createElement(getImpactIcon(impact_summary.average_lead_time_change), {
                className: `h-5 w-5 ${getImpactColor(impact_summary.average_lead_time_change)}`
              })}
              <span className={`text-2xl font-bold ${getImpactColor(impact_summary.average_lead_time_change)}`}>
                {formatPercentage(impact_summary.average_lead_time_change)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cambio en el tiempo de entrega promedio
            </p>
          </CardContent>
        </Card>

        {/* Service Level Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Impacto en el nivel de servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {React.createElement(getImpactIcon(impact_summary.service_level_impact), {
                className: `h-5 w-5 ${getImpactColor(impact_summary.service_level_impact)}`
              })}
              <span className={`text-2xl font-bold ${getImpactColor(impact_summary.service_level_impact)}`}>
                {formatPercentage(impact_summary.service_level_impact)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cambio en el nivel de servicio
            </p>
          </CardContent>
        </Card>

        {/* Stockout Risk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Riesgo de stockout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {impact_summary.stockout_risk_change > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span className={`text-2xl font-bold ${getImpactColor(impact_summary.stockout_risk_change)}`}>
                {formatPercentage(impact_summary.stockout_risk_change)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cambio en el riesgo de stockout
            </p>
          </CardContent>
        </Card>

        {/* Overall Impact Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Puntuación de impacto general</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Puntuación de impacto</span>
                <span className="font-medium">
                  {Math.abs((impact_summary.total_value_change || 0) / 1000).toFixed(1)}/10
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs((impact_summary.total_value_change || 0) / 1000), 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Basado en el impacto en el valor total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Cambios clave</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Frecuencia de pedidos ajustada por {formatPercentage(impact_summary.total_order_count_change)}</li>
                  <li>• Tiempos de entrega modificados por {formatPercentage(impact_summary.average_lead_time_change)}</li>
                  <li>• Impacto en el objetivo de nivel de servicio: {formatPercentage(impact_summary.service_level_impact)}</li>
                  <li>• Variación en el riesgo de stockout: {formatPercentage(impact_summary.stockout_risk_change)}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recomendaciones</h4>
                <ul className="space-y-1 text-sm">
                  {(impact_summary.total_value_change || 0) > 0 && (
                    <li>• Considera implementar este escenario - impacto positivo en el valor</li>
                  )}
                  {(impact_summary.stockout_risk_change || 0) > 5 && (
                    <li>• Monitoriza los niveles de inventario - aumento del riesgo de stockout</li>
                  )}
                  {(impact_summary.service_level_impact || 0) < -2 && (
                    <li>• Revisa los objetivos de nivel de servicio - posible degradación</li>
                  )}
                  {Math.abs(impact_summary.average_lead_time_change || 0) > 10 && (
                      <li>• Ajusta los horizontes de planificación - impacto significativo en el tiempo de entrega</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};