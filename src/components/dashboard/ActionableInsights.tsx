
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, TrendingUp, Package, ShoppingCart, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ActionableInsights() {
  const navigate = useNavigate();

  const insights = [
    {
      id: 1,
      title: "Optimizar Stock de Productos Estacionales",
      description: "12 productos muestran patrones estacionales que requieren ajuste en los niveles de inventario",
      priority: "Alta",
      impact: "Reducción de costos del 15%",
      action: "Ajustar niveles de stock",
      icon: Package,
      color: "bg-red-100 text-red-700",
      route: "/projected-inventory"
    },
    {
      id: 2,
      title: "Mejorar Precisión de Pronósticos",
      description: "3 categorías de productos tienen precisión por debajo del 70%",
      priority: "Media",
      impact: "Mejora de servicio del 8%",
      action: "Revisar modelo de pronóstico",
      icon: Target,
      color: "bg-yellow-100 text-yellow-700",
      route: "/demand-forecast"
    },
    {
      id: 3,
      title: "Consolidar Órdenes de Compra",
      description: "Oportunidad de consolidar 25 órdenes pequeñas para reducir costos",
      priority: "Media",
      impact: "Ahorro de $15,000 MXN",
      action: "Consolidar órdenes",
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-700",
      route: "/purchase-orders"
    },
    {
      id: 4,
      title: "Revisar Productos de Baja Rotación",
      description: "34 productos con menos de 2 rotaciones anuales necesitan evaluación",
      priority: "Baja",
      impact: "Liberación de capital",
      action: "Evaluar descontinuación",
      icon: TrendingUp,
      color: "bg-green-100 text-green-700",
      route: "/products"
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return <Badge className="bg-red-100 text-red-700">Alta</Badge>;
      case 'Media':
        return <Badge className="bg-yellow-100 text-yellow-700">Media</Badge>;
      case 'Baja':
        return <Badge className="bg-green-100 text-green-700">Baja</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Insights Accionables</h3>
        <Badge variant="outline">{insights.length} recomendaciones</Badge>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${insight.color}`}>
                    <insight.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{insight.title}</h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 font-medium">💰 {insight.impact}</span>
                      <span className="text-blue-600">📋 {insight.action}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(insight.route)}
                  >
                    Ver Detalles
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Implementar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
