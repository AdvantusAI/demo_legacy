
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, Target } from "lucide-react";

interface MetricsData {
  totalProducts: number;
  lowStockItems: number;
  pendingOrders: number;
  forecastAccuracy: number;
  criticalAlerts: number;
  excessInventory: number;
}

interface PlannerMetricsCardsProps {
  data: MetricsData;
}

export function PlannerMetricsCards({ data }: PlannerMetricsCardsProps) {
  const metrics = [
    {
      title: "Productos Totales",
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      trend: "+2.3%",
      trendUp: true,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Stock Bajo",
      value: data.lowStockItems.toString(),
      icon: AlertTriangle,
      trend: "-5.1%",
      trendUp: false,
      color: "bg-orange-100 text-orange-600"
    },
    {
      title: "Órdenes Pendientes",
      value: data.pendingOrders.toString(),
      icon: ShoppingCart,
      trend: "+8.2%",
      trendUp: true,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Precisión Pronóstico",
      value: `${data.forecastAccuracy}%`,
      icon: Target,
      trend: "+1.4%",
      trendUp: true,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Alertas Críticas",
      value: data.criticalAlerts.toString(),
      icon: AlertTriangle,
      trend: "-12.3%",
      trendUp: false,
      color: "bg-red-100 text-red-600"
    },
    {
      title: "Exceso Inventario",
      value: data.excessInventory.toString(),
      icon: Package,
      trend: "-3.7%",
      trendUp: false,
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <div className={`p-2 rounded-lg ${metric.color}`}>
              <metric.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center gap-1 mt-2">
              {metric.trendUp ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${metric.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {metric.trend}
              </span>
              <span className="text-sm text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
