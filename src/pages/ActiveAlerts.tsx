import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Package,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ActiveInventoryAlert {
  id: string;
  alert_type: string;
  product_id: string;
  node_id: string;
  time_bucket: string;
  alert_severity: 'critical' | 'high' | 'medium' | 'low';
  alert_title: string;
  alert_description: string;
  alert_message: string;
  current_value: number;
  threshold_value: number;
  variance_percentage: number;
  context_data: any;
  alert_status: string;
  first_detected_at: string;
  last_updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  batch_run_id: string;
  processing_date: string;
  node_name: string;
  node_code: string;
  location_code: string;
  alert_name: string;
  notification_channels: string[];
  dashboard_notifications: number;
  slack_notifications: number;
}

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

export default function ActiveAlerts() {
  const [alerts, setAlerts] = useState<ActiveInventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ActiveInventoryAlert | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data: alertData, error } = await (supabase as any)
        .schema('m8_schema')
        .from('v_active_inventory_alerts')
        .select('*')
        .order('first_detected_at', { ascending: false });

      if (error) throw error;

      setAlerts(alertData || []);
    } catch (error) {
      console.error('Error loading active alerts:', error);
      toast.error('Error al cargar las alertas activas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <BellRing className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVariance = (variance: number) => {
    const isPositive = variance > 0;
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {Math.abs(variance).toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando alertas activas...</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.alert_severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.alert_severity === 'high').length;
  const mediumAlerts = alerts.filter(a => a.alert_severity === 'medium').length;
  const lowAlerts = alerts.filter(a => a.alert_severity === 'low').length;
  const totalNotifications = alerts.reduce((sum, alert) => 
    sum + alert.dashboard_notifications + alert.slack_notifications, 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas Activas</h1>
            <p className="text-gray-600">Monitoreo en tiempo real de alertas de inventario</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadAlerts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {alerts.length} Alertas Activas
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Alertas"
          value={alerts.length}
          icon={BellRing}
          variant="default"
        />
        <MetricCard
          title="Críticas"
          value={criticalAlerts}
          icon={AlertTriangle}
          variant={criticalAlerts > 0 ? 'critical' : 'default'}
        />
        <MetricCard
          title="Altas"
          value={highAlerts}
          icon={AlertTriangle}
          variant={highAlerts > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Medias"
          value={mediumAlerts}
          icon={AlertTriangle}
          variant={mediumAlerts > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Bajas"
          value={lowAlerts}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Notificaciones Enviadas"
          value={totalNotifications}
          icon={BellRing}
          variant="default"
        />
        <MetricCard
          title="Última Actualización"
          value={alerts.length > 0 ? formatDate(alerts[0].last_updated_at) : 'N/A'}
          icon={RefreshCw}
          variant="default"
        />
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalle de Alertas</h2>
          <Badge variant="outline">
            Ordenadas por severidad y fecha
          </Badge>
        </div>

        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(alert.alert_severity)}>
                      {getSeverityIcon(alert.alert_severity)}
                      <span className="ml-1 capitalize">{alert.alert_severity}</span>
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900">{alert.alert_title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600">{alert.alert_description}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Producto:</span>
                        <span className="text-gray-600">{alert.product_id}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Ubicación:</span>
                        <span className="text-gray-600">{alert.node_name} ({alert.location_code})</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Valor Actual:</span>
                        <span className="text-gray-600">{alert.current_value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <TrendingDown className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Umbral:</span>
                        <span className="text-gray-600">{alert.threshold_value.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Período:</span>
                        <span className="text-gray-600">{alert.time_bucket}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <BellRing className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Notificaciones:</span>
                        <span className="text-gray-600">
                          {alert.dashboard_notifications + alert.slack_notifications}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Variance and Status */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-600">Variación:</span>
                      {formatVariance(alert.variance_percentage)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Detectada: {formatDate(alert.first_detected_at)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay alertas activas
            </h3>
            <p className="text-gray-600">
              El sistema está funcionando correctamente sin alertas pendientes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">
                Detalles de la Alerta
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAlert.alert_title}</h3>
                  <p className="text-gray-600">{selectedAlert.alert_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Mensaje:</span>
                    <p className="text-gray-900 mt-1">{selectedAlert.alert_message}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Estado:</span>
                    <Badge className="ml-2 capitalize">{selectedAlert.alert_status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Valor Actual:</span>
                    <p className="text-gray-900">{selectedAlert.current_value.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Umbral:</span>
                    <p className="text-gray-900">{selectedAlert.threshold_value.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Variación:</span>
                    <div className="mt-1">{formatVariance(selectedAlert.variance_percentage)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Período:</span>
                    <p className="text-gray-900">{selectedAlert.time_bucket}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Primera Detección:</span>
                    <p className="text-gray-900">{formatDate(selectedAlert.first_detected_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Última Actualización:</span>
                    <p className="text-gray-900">{formatDate(selectedAlert.last_updated_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Notificaciones Dashboard:</span>
                    <p className="text-gray-900">{selectedAlert.dashboard_notifications}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Notificaciones Slack:</span>
                    <p className="text-gray-900">{selectedAlert.slack_notifications}</p>
                  </div>
                </div>

                {selectedAlert.resolution_notes && (
                  <div>
                    <span className="font-medium text-gray-600">Notas de Resolución:</span>
                    <p className="text-gray-900 mt-1">{selectedAlert.resolution_notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
