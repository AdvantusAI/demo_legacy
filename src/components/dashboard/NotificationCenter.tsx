
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from "lucide-react";

export function NotificationCenter() {
  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Stock crítico detectado',
      message: 'Producto ABC-123 en ubicación CDMX-01 tiene solo 2 días de inventario',
      time: '5 min',
      urgent: true
    },
    {
      id: 2,
      type: 'info',
      title: 'Pronóstico actualizado',
      message: 'Nuevos pronósticos disponibles para la categoría Electrónicos',
      time: '15 min',
      urgent: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Orden de compra aprobada',
      message: 'PO-2024-001 por $45,000 MXN ha sido aprobada automáticamente',
      time: '1 hora',
      urgent: false
    },
    {
      id: 4,
      type: 'warning',
      title: 'Desviación en demanda',
      message: 'Producto XYZ-456 muestra demanda 25% superior al pronóstico',
      time: '2 horas',
      urgent: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Centro de Notificaciones
          <Badge variant="outline">{notifications.filter(n => n.urgent).length} urgentes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              notification.urgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                {notification.urgent && (
                  <Badge className="bg-red-100 text-red-700 text-xs">Urgente</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">hace {notification.time}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Marcar leído
            </Button>
          </div>
        ))}
        
        <div className="text-center pt-2">
          <Button variant="outline" size="sm">
            Ver todas las notificaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
