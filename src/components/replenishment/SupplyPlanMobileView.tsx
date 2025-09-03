import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
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

interface SupplyPlanMobileViewProps {
  data: SupplyPlanData[];
  productId: string;
  locationId: string;
}

export const SupplyPlanMobileView: React.FC<SupplyPlanMobileViewProps> = ({
  data,
  productId,
  locationId
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'inventory' | 'demand' | 'supply'>('inventory');

  // Process data
  const { dates, nodes, currentData, previousData } = useMemo(() => {
    if (!data.length) return { dates: [], nodes: [], currentData: null, previousData: null };

    const uniqueDates = [...new Set(data.map(d => d.postdate))].sort();
    const uniqueNodes = [...new Set(data.map(d => d.node_name))].sort();

    // Set initial selections
    const currentDate = selectedDate || uniqueDates[0];
    const currentNode = selectedNode || uniqueNodes[0];

    // Find current and previous period data
    const current = data.find(d => d.postdate === currentDate && d.node_name === currentNode);
    const dateIndex = uniqueDates.indexOf(currentDate);
    const prevDate = dateIndex > 0 ? uniqueDates[dateIndex - 1] : null;
    const previous = prevDate ? 
      data.find(d => d.postdate === prevDate && d.node_name === currentNode) : 
      null;

    return {
      dates: uniqueDates,
      nodes: uniqueNodes,
      currentData: current,
      previousData: previous
    };
  }, [data, selectedDate, selectedNode]);

  // Navigation handlers
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = dates.indexOf(selectedDate || dates[0]);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(dates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < dates.length - 1) {
      setSelectedDate(dates[currentIndex + 1]);
    }
  };

  // Calculate metrics
  const calculateTrend = (current: number, previous?: number) => {
    if (!previous) return { trend: 'stable' as const, percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' as const,
      percentage: Math.abs(change)
    };
  };

  const getAlertLevel = (data: SupplyPlanData) => {
    if (data.projected_on_hand <= 0) return 'critical';
    if (data.projected_on_hand < data.safety_stock) return 'warning';
    return 'normal';
  };

  if (!currentData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const alertLevel = getAlertLevel(currentData);

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('prev')}
              disabled={dates.indexOf(selectedDate || dates[0]) === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {format(parseISO(selectedDate || dates[0]), 'dd MMMM yyyy', { locale: es })}
              </div>
              <div className="text-sm text-gray-500">
                {format(parseISO(selectedDate || dates[0]), 'EEEE', { locale: es })}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('next')}
              disabled={dates.indexOf(selectedDate || dates[0]) === dates.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Node Selector */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {nodes.map(node => (
            <Button
              key={node}
              variant={selectedNode === node || (!selectedNode && node === nodes[0]) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNode(node)}
              className="whitespace-nowrap"
            >
              {node}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Alert Status */}
      {alertLevel !== 'normal' && (
        <Card className={cn(
          "border-2",
          alertLevel === 'critical' ? "border-red-400 bg-red-50" : "border-yellow-400 bg-yellow-50"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                alertLevel === 'critical' ? "text-red-600" : "text-yellow-600"
              )} />
              <span className={cn(
                "font-medium",
                alertLevel === 'critical' ? "text-red-900" : "text-yellow-900"
              )}>
                {alertLevel === 'critical' ? 
                  'Inventario Crítico - Riesgo de quiebre de stock' : 
                  'Inventario Bajo - Por debajo del stock de seguridad'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Tabs */}
      <Tabs value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="demand">Demanda</TabsTrigger>
          <TabsTrigger value="supply">Suministro</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-3">
          <MetricCard
            title="Inventario Proyectado"
            value={currentData.projected_on_hand}
            previousValue={previousData?.projected_on_hand}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-amber-600"
            critical={currentData.projected_on_hand < currentData.safety_stock}
          />
          <MetricCard
            title="Stock de Seguridad"
            value={currentData.safety_stock}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-red-600"
            showTrend={false}
          />
        </TabsContent>

        <TabsContent value="demand" className="space-y-3">
          <MetricCard
            title="Pronóstico"
            value={currentData.forecast}
            previousValue={previousData?.forecast}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-blue-600"
          />
          <MetricCard
            title="Demanda Real"
            value={currentData.actual}
            previousValue={previousData?.actual}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-green-600"
          />
          <MetricCard
            title="Demanda Total"
            value={currentData.total_demand}
            previousValue={previousData?.total_demand}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-purple-600"
          />
        </TabsContent>

        <TabsContent value="supply" className="space-y-3">
          <MetricCard
            title="Llegadas Planeadas"
            value={currentData.planned_arrivals}
            previousValue={previousData?.planned_arrivals}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-cyan-600"
          />
          <MetricCard
            title="Órdenes Planeadas"
            value={currentData.planned_orders}
            previousValue={previousData?.planned_orders}
            format={(v) => v.toLocaleString('es-MX')}
            color="text-indigo-600"
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumen Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {currentData.projected_on_hand.toLocaleString('es-MX')}
              </div>
              <div className="text-xs text-gray-500">Inventario Actual</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((currentData.projected_on_hand / Math.max(currentData.total_demand, 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Cobertura</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format: (value: number) => string;
  color: string;
  critical?: boolean;
  showTrend?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  format,
  color,
  critical = false,
  showTrend = true
}) => {
  const trend = showTrend && previousValue !== undefined ? 
    (value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable') : 
    null;

  const TrendIcon = trend === 'up' ? ArrowUpRight : 
                   trend === 'down' ? ArrowDownRight : 
                   Minus;

  const percentage = previousValue ? 
    Math.abs(((value - previousValue) / previousValue) * 100) : 
    0;

  return (
    <Card className={cn(
      "transition-all",
      critical && "border-red-400 bg-red-50"
    )}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className={cn("text-2xl font-bold", critical ? "text-red-700" : color)}>
              {format(value)}
            </div>
          </div>
          {showTrend && trend && (
            <div className="text-right">
              <TrendIcon className={cn(
                "h-5 w-5 mb-1",
                trend === 'up' ? "text-green-500" : 
                trend === 'down' ? "text-red-500" : 
                "text-gray-400"
              )} />
              {percentage > 0 && (
                <div className={cn(
                  "text-xs font-medium",
                  trend === 'up' ? "text-green-600" : 
                  trend === 'down' ? "text-red-600" : 
                  "text-gray-500"
                )}>
                  {percentage.toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplyPlanMobileView;