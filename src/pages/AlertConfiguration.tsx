import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Trash2,
  Edit,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertForm } from '@/components/AlertForm';

interface AlertConfig {
  id: string;
  alert_type: string;
  alert_name: string;
  alert_description?: string;
  default_severity: 'critical' | 'high' | 'medium' | 'low';
  is_active: boolean;
  notification_channels: string[];
  batch_processing_enabled: boolean;
  real_time_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  business_rules: AlertBusinessRule[];
}

interface AlertBusinessRule {
  id?: string;
  alert_type: string;
  rule_name: string;
  rule_description?: string;
  threshold_value?: number;
  threshold_operator: '<=' | '>=' | '=' | '<' | '>' | '!=';
  threshold_unit?: string;
  time_horizon_days?: number;
  evaluation_frequency: 'real_time' | 'daily' | 'weekly';
  critical_threshold?: number;
  high_threshold?: number;
  medium_threshold?: number;
  low_threshold?: number;
  additional_parameters?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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

export default function AlertConfiguration() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Load alert configurations
      const { data: alertConfigs, error: configError } = await (supabase as any)
        .schema('m8_schema')
        .from('alert_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (configError) throw configError;

      // Load business rules for each alert type
      const alertsWithRules = await Promise.all(
        alertConfigs.map(async (alert: any) => {
          const { data: rules, error: rulesError } = await (supabase as any)
            .schema('m8_schema')
            .from('alert_business_rules')
            .select('*')
            .eq('alert_type', alert.alert_type);

          if (rulesError) throw rulesError;

          return {
            ...alert,
            business_rules: rules || []
          };
        })
      );

      setAlerts(alertsWithRules);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleSaveAlert = (alert: AlertConfig) => {
    setAlerts(prev => {
      if (alert.id) {
        // Update existing alert
        return prev.map(a => a.id === alert.id ? alert : a);
      } else {
        // Add new alert
        return [alert, ...prev];
      }
    });
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleEditAlert = (alert: AlertConfig) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta alerta?')) {
      return;
    }

    try {
      // Get the alert type before deleting
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) throw new Error('Alert not found');

      // Delete business rules first
      await (supabase as any)
        .schema('m8_schema')
        .from('alert_business_rules')
        .delete()
        .eq('alert_type', alert.alert_type);

      // Delete alert configuration
      const { error } = await (supabase as any)
        .schema('m8_schema')
        .from('alert_configurations')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta eliminada correctamente');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error al eliminar la alerta');
    }
  };

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any)
        .schema('m8_schema')
        .from('alert_configurations')
        .update({ is_active: enabled, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_active: enabled } : alert
      ));
      toast.success('Estado de alerta actualizado');
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Error al actualizar el estado de la alerta');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'in_app': return <BellRing className="h-4 w-4" />;
      case 'webhook': return <AlertTriangle className="h-4 w-4" />;
      default: return <BellRing className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-50';
      case 'sms': return 'text-green-600 bg-green-50';
      case 'slack': return 'text-purple-600 bg-purple-50';
      case 'in_app': return 'text-orange-600 bg-orange-50';
      case 'webhook': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.is_active).length;
  const inactiveAlerts = alerts.filter(a => !a.is_active).length;
  const criticalAlerts = alerts.filter(a => a.default_severity === 'critical').length;
  const totalBusinessRules = alerts.reduce((sum, alert) => sum + alert.business_rules.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Alertas</h1>
          <p className="text-gray-600">
            Gestiona las notificaciones y alertas del sistema de planificación
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingAlert(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Alerta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Alertas"
          value={alerts.length}
          icon={BellRing}
          variant="default"
        />
        <MetricCard
          title="Alertas Activas"
          value={activeAlerts}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Alertas Inactivas"
          value={inactiveAlerts}
          icon={AlertTriangle}
          variant={inactiveAlerts > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Alertas Críticas"
          value={criticalAlerts}
          icon={AlertTriangle}
          variant={criticalAlerts > 0 ? 'critical' : 'default'}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Reglas de Negocio"
          value={totalBusinessRules}
          icon={Settings}
          variant="default"
        />
        <MetricCard
          title="Última Actualización"
          value={alerts.length > 0 ? formatDate(alerts[0].updated_at || alerts[0].created_at || '') : 'N/A'}
          icon={RefreshCw}
          variant="default"
        />
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(alert.alert_type)}`}>
                    {getTypeIcon(alert.alert_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{alert.alert_name}</CardTitle>
                    <p className="text-sm text-gray-600">{alert.alert_description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAlert(alert)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Tipo:</span>
                  <span className="ml-2 text-gray-900 capitalize">{alert.alert_type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Severidad:</span>
                  <Badge className={getSeverityColor(alert.default_severity)}>
                    {alert.default_severity}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-600 text-sm">Canales de Notificación:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {alert.notification_channels.map((channel, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-600 text-sm">Reglas de Negocio:</span>
                <div className="mt-1 space-y-1">
                  {alert.business_rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <span>
                        {rule.rule_name} {rule.threshold_operator} {rule.threshold_value} {rule.threshold_unit}
                      </span>
                      <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={alert.is_active ? "default" : "secondary"}>
                  {alert.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
                <span className="text-xs text-gray-500">
                  Creada: {formatDate(alert.created_at || '')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BellRing className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay alertas configuradas
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primera alerta para recibir notificaciones importantes
            </p>
            <Button onClick={() => {
              setEditingAlert(null);
              setShowForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Alerta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert Form Modal */}
      <AlertForm
        alert={editingAlert || undefined}
        onSave={handleSaveAlert}
        onCancel={() => {
          setShowForm(false);
          setEditingAlert(null);
        }}
        isOpen={showForm}
      />
    </div>
  );
}
