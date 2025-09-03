import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  DollarSign,
  Package,
  ShieldCheck
} from 'lucide-react';
import { ServiceLevelScenarioResults } from '@/services/serviceLevelScenarioService';

interface ServiceLevelResultsProps {
  results: ServiceLevelScenarioResults;
  scenarioName: string;
}

export const ServiceLevelResults: React.FC<ServiceLevelResultsProps> = ({
  results,
  scenarioName
}) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getImpactColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImpactIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return CheckCircle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Resultados del Escenario de Nivel de Servicio</h2>
          <p className="text-muted-foreground">{scenarioName}</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-800">
          <Target className="h-4 w-4 mr-1" />
          Nivel de Servicio: {formatPercentage(results.target_service_level)}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Service Level Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Mejora del Nivel de Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Actual: {formatPercentage(results.baseline_service_level)}</span>
                <span>Objetivo: {formatPercentage(results.target_service_level)}</span>
              </div>
              <Progress 
                value={results.target_service_level * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Mejora: {formatPercentage(results.target_service_level - results.baseline_service_level)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Products Affected */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos Afectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {results.summary.total_products_affected}
            </div>
            <p className="text-sm text-muted-foreground">
              Productos que requieren ajustes
            </p>
          </CardContent>
        </Card>

        {/* Cost Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Impacto en Costos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getImpactColor(results.summary.total_cost_impact)}`}>
              {formatCurrency(results.summary.total_cost_impact)}
            </div>
            <p className="text-sm text-muted-foreground">
              Incremento en costos de inventario
            </p>
          </CardContent>
        </Card>

        {/* Stockout Risk Reduction */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Reducción de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {results.summary.average_stockout_risk_reduction.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Reducción promedio del riesgo de desabasto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Product Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado por Producto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Impacto específico en cada producto y almacén
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead className="text-center">Nivel de Servicio Actual</TableHead>
                  <TableHead className="text-center">Stock de Seguridad</TableHead>
                  <TableHead className="text-center">Nuevo Stock</TableHead>
                  <TableHead className="text-center">Punto de Reorden</TableHead>
                  <TableHead className="text-center">Impacto en Costos</TableHead>
                  <TableHead className="text-center">Reducción de Riesgo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.affected_products.map((product, index) => (
                  <TableRow key={`${product.product_id}-${product.warehouse_id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{product.product_name}</div>
                        <div className="text-xs text-muted-foreground">{product.product_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.warehouse_id}</TableCell>
                    <TableCell className="text-center">
                      {formatPercentage(product.current_service_level)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {product.current_safety_stock} → {product.new_safety_stock}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getImpactColor(product.new_safety_stock - product.current_safety_stock)}`}
                        >
                          {product.new_safety_stock - product.current_safety_stock > 0 ? '+' : ''}
                          {product.new_safety_stock - product.current_safety_stock}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.new_safety_stock}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {product.current_reorder_point} → {product.new_reorder_point}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`font-medium ${getImpactColor(product.cost_impact)}`}>
                        {formatCurrency(product.cost_impact)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">
                          {product.stockout_risk_change.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resumen del Impacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Productos afectados:</span>
                <span className="font-medium">{results.summary.total_products_affected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Incremento total de inventario:</span>
                <span className="font-medium">{results.summary.total_inventory_increase} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Costo total adicional:</span>
                <span className="font-medium text-red-600">{formatCurrency(results.summary.total_cost_impact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tasa de logro del objetivo:</span>
                <span className="font-medium text-green-600">
                  {formatPercentage(results.summary.service_level_achievement_rate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {results.summary.total_cost_impact > 50000 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>El impacto en costos es significativo. Considere implementar gradualmente.</span>
                </li>
              )}
              {results.summary.service_level_achievement_rate < 0.8 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>La tasa de logro es baja. Revise los parámetros del escenario.</span>
                </li>
              )}
              {results.summary.average_stockout_risk_reduction > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Excelente reducción del riesgo de desabasto. Implemente pronto.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Monitoree el desempeño después de la implementación para ajustar parámetros.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};