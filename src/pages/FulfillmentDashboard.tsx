import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, 
  Package, 
  AlertTriangle, 
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Settings
} from 'lucide-react';
import { MRPPlanningGrid } from '@/components/mrp/MRPPlanningGrid';
import { PurchaseOrderManagement } from '@/components/fulfillment/PurchaseOrderManagement';
import { PlanningExceptions } from '@/components/fulfillment/PlanningExceptions';
import { PurchaseOrderParametersDashboard } from '@/components/fulfillment/PurchaseOrderParametersDashboard';
import { SupplyNetworkFlow } from '@/components/supply-network/SupplyNetworkFlow';

interface FulfillmentMetrics {
  activePlan: string;
  totalSKUs: number;
  criticalItems: number;
  pendingOrders: number;
  openExceptions: number;
  fillRate: number;
  onTimeDelivery: number;
  inventoryTurns: number;
}

const FulfillmentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mrp-planning');

  // Mock metrics - would come from actual data
  const metrics: FulfillmentMetrics = {
    activePlan: 'MRP-Plan-2025-W01',
    totalSKUs: 2847,
    criticalItems: 23,
    pendingOrders: 156,
    openExceptions: 12,
    fillRate: 96.8,
    onTimeDelivery: 94.2,
    inventoryTurns: 8.4
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    suffix?: string;
    variant?: 'default' | 'warning' | 'critical' | 'success';
  }> = ({ title, value, icon: Icon, trend, suffix = '', variant = 'default' }) => {
    const variantStyles = {
      default: 'border-gray-200 bg-white',
      warning: 'border-yellow-200 bg-yellow-50',
      critical: 'border-red-200 bg-red-50',
      success: 'border-green-200 bg-green-50'
    };

    return (
      <Card className={`${variantStyles[variant]} transition-all hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                variant === 'critical' ? 'bg-red-100' :
                variant === 'warning' ? 'bg-yellow-100' :
                variant === 'success' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Icon className={`h-5 w-5 ${
                  variant === 'critical' ? 'text-red-600' :
                  variant === 'warning' ? 'text-yellow-600' :
                  variant === 'success' ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
                  <span className="text-sm font-normal text-gray-500">{suffix}</span>
                </p>
              </div>
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowUpRight className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                <span className="text-sm font-medium">
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Factory className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logística</h1>
            <p className="text-gray-600">Planificación y gestión de suministro integrada</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50">
            Plan Activo: {metrics.activePlan}
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sistema Operativo
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="SKUs Planificados"
          value={metrics.totalSKUs}
          icon={Package}
          trend={2.1}
          variant="default"
        />
        <MetricCard
          title="Items Críticos"
          value={metrics.criticalItems}
          icon={AlertTriangle}
          variant={metrics.criticalItems > 20 ? 'critical' : 'warning'}
        />
        <MetricCard
          title="Órdenes Pendientes"
          value={metrics.pendingOrders}
          icon={ShoppingCart}
          trend={-5.2}
          variant="default"
        />
        <MetricCard
          title="Excepciones Abiertas"
          value={metrics.openExceptions}
          icon={Clock}
          variant={metrics.openExceptions > 15 ? 'critical' : 'warning'}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Fill Rate"
          value={metrics.fillRate}
          icon={TrendingUp}
          suffix="%"
          trend={1.2}
          variant="success"
        />
        <MetricCard
          title="Entregas a Tiempo"
          value={metrics.onTimeDelivery}
          icon={CheckCircle}
          suffix="%"
          trend={-0.8}
          variant="success"
        />
        <MetricCard
          title="Rotación Inventario"
          value={metrics.inventoryTurns}
          icon={ArrowUpRight}
          suffix="x"
          trend={3.5}
          variant="success"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mrp-planning" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Planificación MRP
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Órdenes de Compra
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Excepciones
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Parámetros PO
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Red de Suministro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mrp-planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Planificación MRP - Vista Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MRPPlanningGrid />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Gestión de Órdenes de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PurchaseOrderManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Excepciones de Planificación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PlanningExceptions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Parámetros de Órdenes de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PurchaseOrderParametersDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Red de Suministro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <SupplyNetworkFlow />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FulfillmentDashboard;