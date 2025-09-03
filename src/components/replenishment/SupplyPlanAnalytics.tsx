import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Package,
  Truck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupplyPlanData {
  postdate: string;
  node_name: string;
  product_id: string;
  forecast: number;
  actual: number;
  total_demand: number;
  planned_arrivals: number;
  planned_orders: number;
  projected_on_hand: number;
  safety_stock: number;
}

interface SupplyPlanAnalyticsProps {
  data: SupplyPlanData[];
  productId: string;
  locationId: string;
}

interface MetricInsight {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  description?: string;
  icon: React.ElementType;
  color: string;
}

export const SupplyPlanAnalytics: React.FC<SupplyPlanAnalyticsProps> = ({
  data,
  productId,
  locationId
}) => {
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (!data.length) return null;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.postdate).getTime() - new Date(b.postdate).getTime()
    );

    // Basic metrics
    const totalDemand = data.reduce((sum, d) => sum + d.total_demand, 0);
    const totalSupply = data.reduce((sum, d) => sum + d.planned_arrivals + d.planned_orders, 0);
    const avgInventory = data.reduce((sum, d) => sum + d.projected_on_hand, 0) / data.length;
    const avgSafetyStock = data.reduce((sum, d) => sum + d.safety_stock, 0) / data.length;

    // Critical period analysis
    const stockoutPeriods = data.filter(d => d.projected_on_hand <= 0);
    const belowSafetyPeriods = data.filter(d => 
      d.projected_on_hand > 0 && d.projected_on_hand < d.safety_stock
    );
    const criticalNodes = [...new Set(stockoutPeriods.map(d => d.node_name))];

    // Find first stockout date
    const firstStockout = stockoutPeriods.length > 0 ? 
      stockoutPeriods.sort((a, b) => 
        new Date(a.postdate).getTime() - new Date(b.postdate).getTime()
      )[0] : null;

    // Calculate days until stockout
    const daysUntilStockout = firstStockout ? 
      differenceInDays(parseISO(firstStockout.postdate), new Date()) : null;

    // Forecast accuracy
    const periodsWithActual = data.filter(d => d.actual > 0);
    const forecastAccuracy = periodsWithActual.length > 0 ?
      (1 - Math.abs(
        periodsWithActual.reduce((sum, d) => sum + Math.abs(d.forecast - d.actual), 0) /
        periodsWithActual.reduce((sum, d) => sum + d.forecast, 0)
      )) * 100 : null;

    // Service level
    const serviceLevel = ((data.length - stockoutPeriods.length) / data.length) * 100;

    // Inventory turnover approximation
    const avgDemand = totalDemand / data.length;
    const inventoryTurnover = avgInventory > 0 ? (avgDemand * 365) / avgInventory : 0;

    // Coverage days
    const coverageDays = avgInventory > 0 ? (avgInventory / avgDemand) : 0;

    // Supply-demand balance
    const supplyDemandBalance = totalSupply - totalDemand;
    const balancePercentage = totalDemand > 0 ? (supplyDemandBalance / totalDemand) * 100 : 0;

    // Node performance
    const nodeMetrics = [...new Set(data.map(d => d.node_name))].map(node => {
      const nodeData = data.filter(d => d.node_name === node);
      const nodeStockouts = nodeData.filter(d => d.projected_on_hand <= 0).length;
      const nodeAvgInventory = nodeData.reduce((sum, d) => sum + d.projected_on_hand, 0) / nodeData.length;
      const nodeServiceLevel = ((nodeData.length - nodeStockouts) / nodeData.length) * 100;
      
      return {
        node,
        stockouts: nodeStockouts,
        avgInventory: nodeAvgInventory,
        serviceLevel: nodeServiceLevel,
        status: nodeStockouts > 0 ? 'critical' : 
                nodeData.some(d => d.projected_on_hand < d.safety_stock) ? 'warning' : 
                'good'
      };
    });

    return {
      totalDemand,
      totalSupply,
      avgInventory,
      avgSafetyStock,
      stockoutPeriods: stockoutPeriods.length,
      belowSafetyPeriods: belowSafetyPeriods.length,
      criticalNodes,
      firstStockout,
      daysUntilStockout,
      forecastAccuracy,
      serviceLevel,
      inventoryTurnover,
      coverageDays,
      supplyDemandBalance,
      balancePercentage,
      nodeMetrics
    };
  }, [data]);

  if (!analytics) {
    return null;
  }

  // Key insights generation
  const keyInsights: MetricInsight[] = [
    {
      label: 'Nivel de Servicio',
      value: `${analytics.serviceLevel.toFixed(1)}%`,
      trend: analytics.serviceLevel >= 95 ? 'up' : analytics.serviceLevel >= 90 ? 'stable' : 'down',
      status: analytics.serviceLevel >= 95 ? 'good' : analytics.serviceLevel >= 90 ? 'warning' : 'critical',
      description: `${data.length - analytics.stockoutPeriods} de ${data.length} períodos sin quiebre`,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: 'Riesgo de Quiebre',
      value: analytics.daysUntilStockout ? `${analytics.daysUntilStockout} días` : 'Sin riesgo',
      status: analytics.daysUntilStockout && analytics.daysUntilStockout < 7 ? 'critical' :
              analytics.daysUntilStockout && analytics.daysUntilStockout < 14 ? 'warning' : 'good',
      description: analytics.firstStockout ? 
        `Primera fecha crítica: ${format(parseISO(analytics.firstStockout.postdate), 'dd/MM', { locale: es })}` :
        'No se detectan quiebres en el horizonte',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      label: 'Cobertura Promedio',
      value: `${Math.round(analytics.coverageDays)} días`,
      trend: analytics.coverageDays > 30 ? 'up' : analytics.coverageDays > 15 ? 'stable' : 'down',
      status: analytics.coverageDays > 30 ? 'good' : analytics.coverageDays > 15 ? 'warning' : 'critical',
      description: `Inventario promedio: ${analytics.avgInventory.toLocaleString('es-MX', { maximumFractionDigits: 0 })} unidades`,
      icon: Package,
      color: 'text-amber-600'
    },
    {
      label: 'Balance Oferta/Demanda',
      value: `${analytics.balancePercentage > 0 ? '+' : ''}${analytics.balancePercentage.toFixed(1)}%`,
      trend: Math.abs(analytics.balancePercentage) < 5 ? 'stable' : 
             analytics.balancePercentage > 0 ? 'up' : 'down',
      status: Math.abs(analytics.balancePercentage) < 5 ? 'good' :
              Math.abs(analytics.balancePercentage) < 15 ? 'warning' : 'critical',
      description: `Diferencia: ${Math.abs(analytics.supplyDemandBalance).toLocaleString('es-MX', { maximumFractionDigits: 0 })} unidades`,
      icon: Activity,
      color: 'text-green-600'
    }
  ];

  // Forecast accuracy if available
  if (analytics.forecastAccuracy !== null) {
    keyInsights.push({
      label: 'Precisión del Pronóstico',
      value: `${analytics.forecastAccuracy.toFixed(1)}%`,
      trend: analytics.forecastAccuracy >= 90 ? 'up' : 
             analytics.forecastAccuracy >= 80 ? 'stable' : 'down',
      status: analytics.forecastAccuracy >= 90 ? 'good' :
              analytics.forecastAccuracy >= 80 ? 'warning' : 'critical',
      icon: BarChart3,
      color: 'text-purple-600'
    });
  }

  return (
    <div className="space-y-6">
      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {keyInsights.map((insight, index) => (
          <Card key={index} className={cn(
            "transition-all hover:shadow-lg",
            insight.status === 'critical' && "border-red-400",
            insight.status === 'warning' && "border-yellow-400"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <insight.icon className={cn("h-5 w-5", insight.color)} />
                {insight.trend && (
                  <Badge variant={
                    insight.trend === 'up' ? 'default' :
                    insight.trend === 'down' ? 'destructive' :
                    'secondary'
                  } className="text-xs">
                    {insight.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                     insight.trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">{insight.label}</p>
                <p className={cn(
                  "text-2xl font-bold",
                  insight.status === 'critical' ? "text-red-700" :
                  insight.status === 'warning' ? "text-yellow-700" :
                  "text-gray-900"
                )}>
                  {insight.value}
                </p>
                {insight.description && (
                  <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nodes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nodes">Por Nodo</TabsTrigger>
              <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="space-y-4">
              <div className="space-y-3">
                {analytics.nodeMetrics.map(node => (
                  <div key={node.node} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        node.status === 'good' ? "bg-green-500" :
                        node.status === 'warning' ? "bg-yellow-500" :
                        "bg-red-500"
                      )} />
                      <div>
                        <p className="font-medium">{node.node}</p>
                        <p className="text-xs text-gray-500">
                          Nivel de servicio: {node.serviceLevel.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {node.avgInventory.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">Inv. Promedio</p>
                      </div>
                      {node.stockouts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {node.stockouts} quiebres
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Períodos Críticos Detectados</p>
                {analytics.stockoutPeriods > 0 ? (
                  <div className="space-y-2">
                    {data.filter(d => d.projected_on_hand <= 0)
                      .slice(0, 5)
                      .map((period, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">
                              {format(parseISO(period.postdate), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-700">{period.node_name}</p>
                            <p className="text-xs text-red-600">
                              Faltante: {Math.abs(period.projected_on_hand).toLocaleString('es-MX')}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      No se detectan quiebres de stock en el horizonte de planificación
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-3">
                {analytics.stockoutPeriods > 0 && (
                  <RecommendationCard
                    type="critical"
                    title="Acción Urgente Requerida"
                    description={`Se detectaron ${analytics.stockoutPeriods} períodos con quiebre de stock. Acelere las órdenes planificadas o incremente las cantidades.`}
                    action="Revisar órdenes de compra"
                  />
                )}
                {analytics.balancePercentage < -10 && (
                  <RecommendationCard
                    type="warning"
                    title="Déficit de Suministro"
                    description={`La demanda supera al suministro en ${Math.abs(analytics.balancePercentage).toFixed(1)}%. Considere aumentar las órdenes planificadas.`}
                    action="Ajustar plan de suministro"
                  />
                )}
                {analytics.coverageDays < 15 && (
                  <RecommendationCard
                    type="warning"
                    title="Baja Cobertura de Inventario"
                    description={`La cobertura promedio es de solo ${Math.round(analytics.coverageDays)} días. Considere aumentar los niveles de inventario de seguridad.`}
                    action="Revisar políticas de inventario"
                  />
                )}
                {analytics.forecastAccuracy && analytics.forecastAccuracy < 80 && (
                  <RecommendationCard
                    type="info"
                    title="Mejorar Precisión del Pronóstico"
                    description={`La precisión actual es del ${analytics.forecastAccuracy.toFixed(1)}%. Revise los modelos de pronóstico para reducir la variabilidad.`}
                    action="Optimizar modelos predictivos"
                  />
                )}
                {analytics.stockoutPeriods === 0 && analytics.balancePercentage > -5 && analytics.balancePercentage < 5 && (
                  <RecommendationCard
                    type="success"
                    title="Plan Balanceado"
                    description="El plan de suministro está bien balanceado con la demanda. Mantenga el monitoreo regular."
                    action="Continuar monitoreo"
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Recommendation Card Component
interface RecommendationCardProps {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  type,
  title,
  description,
  action
}) => {
  const config = {
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
        <div className="flex-1 space-y-1">
          <p className={cn("font-medium", config.textColor)}>{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {action}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for missing imports
const Minus: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const Info: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default SupplyPlanAnalytics;