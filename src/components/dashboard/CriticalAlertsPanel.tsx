
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown, Clock, CheckCircle } from "lucide-react";

export function CriticalAlertsPanel() {
  const criticalAlerts = [
    {
      id: 1,
      type: 'stockout',
      severity: 'critical',
      title: 'Riesgo de Agotamiento',
      description: 'Producto ABC-123 en CDMX-01 se agotará en 2 días',
      impact: 'Posible pérdida de ventas de $25,000 MXN',
      action: 'Acelerar orden de compra',
      timeLeft: '2 días',
      status: 'pending'
    },
    {
      id: 2,
      type: 'forecast',
      severity: 'high',
      title: 'Desviación Significativa',
      description: 'Demanda real 40% superior al pronóstico en categoría Electrónicos',
      impact: 'Ajuste necesario en planificación',
      action: 'Revisar modelo de pronóstico',
      timeLeft: '1 semana',
      status: 'in_progress'
    },
    {
      id: 3,
      type: 'supplier',
      severity: 'medium',
      title: 'Retraso de Proveedor',
      description: 'Proveedor XYZ reporta retraso de 5 días en entrega',
      impact: 'Posible impacto en nivel de servicio',
      action: 'Buscar proveedor alternativo',
      timeLeft: '3 días',
      status: 'pending'
    },
    {
      id: 4,
      type: 'quality',
      severity: 'high',
      title: 'Problema de Calidad',
      description: 'Lote recibido con defectos del proveedor ABC',
      impact: 'Retorno de mercancía requerido',
      action: 'Activar protocolo de calidad',
      timeLeft: '1 día',
      status: 'resolved'
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medio</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">En Proceso</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resuelto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'stockout':
        return <Package className="h-5 w-5 text-red-500" />;
      case 'forecast':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'supplier':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alertas Críticas</h3>
        <Badge variant="outline">
          {criticalAlerts.filter(alert => alert.status !== 'resolved').length} activas
        </Badge>
      </div>

      <div className="grid gap-4">
        {criticalAlerts.map((alert) => (
          <Card key={alert.id} className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {getIcon(alert.type)}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-orange-600 font-medium">
                        📊 {alert.impact}
                      </p>
                      <p className="text-sm text-blue-600">
                        🎯 {alert.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        ⏱️ Tiempo límite: {alert.timeLeft}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {alert.status === 'resolved' ? (
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resuelto
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        Posponer
                      </Button>
                      <Button size="sm">
                        Atender
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
