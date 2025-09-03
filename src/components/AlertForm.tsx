import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Save, 
  AlertTriangle, 
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  Trash2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AlertConfiguration {
  id?: string;
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

interface AlertFormProps {
  alert?: AlertConfiguration;
  onSave: (alert: AlertConfiguration) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ALERT_TYPES = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Smartphone },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
  { value: 'in_app', label: 'In-App', icon: BellRing },
  { value: 'webhook', label: 'Webhook', icon: AlertTriangle }
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Bajo', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alto', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-800' }
];

const OPERATORS = [
  { value: '<=', label: 'Menor o igual que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '=', label: 'Igual a' },
  { value: '<', label: 'Menor que' },
  { value: '>', label: 'Mayor que' },
  { value: '!=', label: 'Diferente de' }
];

const EVALUATION_FREQUENCIES = [
  { value: 'real_time', label: 'Tiempo Real' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' }
];

const NOTIFICATION_CHANNELS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'slack', label: 'Slack' },
  { value: 'webhook', label: 'Webhook' }
];

export function AlertForm({ alert, onSave, onCancel, isOpen }: AlertFormProps) {
  const [formData, setFormData] = useState<AlertConfiguration>({
    alert_type: 'email',
    alert_name: '',
    alert_description: '',
    default_severity: 'medium',
    is_active: true,
    notification_channels: ['dashboard'],
    batch_processing_enabled: true,
    real_time_enabled: false,
    business_rules: []
  });
  const [loading, setLoading] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alert) {
      setFormData(alert);
    } else {
      setFormData({
        alert_type: 'email',
        alert_name: '',
        alert_description: '',
        default_severity: 'medium',
        is_active: true,
        notification_channels: ['dashboard'],
        batch_processing_enabled: true,
        real_time_enabled: false,
        business_rules: []
      });
    }
    setErrors({});
  }, [alert, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.alert_name.trim()) {
      newErrors.alert_name = 'El nombre es requerido';
    }

    if (!formData.alert_type.trim()) {
      newErrors.alert_type = 'El tipo de alerta es requerido';
    }

    if (formData.notification_channels.length === 0) {
      newErrors.notification_channels = 'Al menos un canal de notificación es requerido';
    }

    if (formData.business_rules.length === 0) {
      newErrors.business_rules = 'Al menos una regla de negocio es requerida';
    }

    // Validate business rules
    formData.business_rules.forEach((rule, index) => {
      if (!rule.rule_name) {
        newErrors[`business_rules.${index}.rule_name`] = 'Nombre de regla requerido';
      }
      if (!rule.threshold_value && rule.threshold_value !== 0) {
        newErrors[`business_rules.${index}.threshold_value`] = 'Valor requerido';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      let savedAlert: AlertConfiguration;

      if (alert?.id) {
        // Update existing alert
        const { data, error } = await (supabase as any)
          .schema('m8_schema')
          .from('alert_configurations')
          .update({
            alert_type: formData.alert_type,
            alert_name: formData.alert_name,
            alert_description: formData.alert_description,
            default_severity: formData.default_severity,
            is_active: formData.is_active,
            notification_channels: formData.notification_channels,
            batch_processing_enabled: formData.batch_processing_enabled,
            real_time_enabled: formData.real_time_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', alert.id)
          .select()
          .single();

        if (error) throw error;

        // Update business rules - delete existing ones for this alert type
        await (supabase as any)
          .schema('m8_schema')
          .from('alert_business_rules')
          .delete()
          .eq('alert_type', formData.alert_type);

        // Insert new business rules
        if (formData.business_rules.length > 0) {
          const businessRulesData = formData.business_rules.map(rule => ({
            alert_type: formData.alert_type,
            rule_name: rule.rule_name,
            rule_description: rule.rule_description,
            threshold_value: rule.threshold_value,
            threshold_operator: rule.threshold_operator,
            threshold_unit: rule.threshold_unit,
            time_horizon_days: rule.time_horizon_days,
            evaluation_frequency: rule.evaluation_frequency,
            critical_threshold: rule.critical_threshold,
            high_threshold: rule.high_threshold,
            medium_threshold: rule.medium_threshold,
            low_threshold: rule.low_threshold,
            additional_parameters: rule.additional_parameters || {},
            is_active: rule.is_active
          }));

          const { error: rulesError } = await (supabase as any)
            .schema('m8_schema')
            .from('alert_business_rules')
            .insert(businessRulesData);

          if (rulesError) throw rulesError;
        }

        savedAlert = { ...formData, id: alert.id };
        toast.success('Alerta actualizada correctamente');
      } else {
        // Create new alert
        const { data, error } = await (supabase as any)
          .schema('m8_schema')
          .from('alert_configurations')
          .insert({
            alert_type: formData.alert_type,
            alert_name: formData.alert_name,
            alert_description: formData.alert_description,
            default_severity: formData.default_severity,
            is_active: formData.is_active,
            notification_channels: formData.notification_channels,
            batch_processing_enabled: formData.batch_processing_enabled,
            real_time_enabled: formData.real_time_enabled
          })
          .select()
          .single();

        if (error) throw error;

        // Insert business rules
        if (formData.business_rules.length > 0) {
          const businessRulesData = formData.business_rules.map(rule => ({
            alert_type: formData.alert_type,
            rule_name: rule.rule_name,
            rule_description: rule.rule_description,
            threshold_value: rule.threshold_value,
            threshold_operator: rule.threshold_operator,
            threshold_unit: rule.threshold_unit,
            time_horizon_days: rule.time_horizon_days,
            evaluation_frequency: rule.evaluation_frequency,
            critical_threshold: rule.critical_threshold,
            high_threshold: rule.high_threshold,
            medium_threshold: rule.medium_threshold,
            low_threshold: rule.low_threshold,
            additional_parameters: rule.additional_parameters || {},
            is_active: rule.is_active
          }));

          const { error: rulesError } = await (supabase as any)
            .schema('m8_schema')
            .from('alert_business_rules')
            .insert(businessRulesData);

          if (rulesError) throw rulesError;
        }

        savedAlert = { ...formData, id: data.id };
        toast.success('Alerta creada correctamente');
      }

      onSave(savedAlert);
    } catch (error) {
      console.error('Error saving alert:', error);
      toast.error('Error al guardar la alerta');
    } finally {
      setLoading(false);
    }
  };

  const addNotificationChannel = () => {
    if (newChannel.trim() && !formData.notification_channels.includes(newChannel.trim())) {
      setFormData(prev => ({
        ...prev,
        notification_channels: [...prev.notification_channels, newChannel.trim()]
      }));
      setNewChannel('');
    }
  };

  const removeNotificationChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      notification_channels: prev.notification_channels.filter(c => c !== channel)
    }));
  };

  const addBusinessRule = () => {
    setFormData(prev => ({
      ...prev,
      business_rules: [
        ...prev.business_rules,
        {
          alert_type: prev.alert_type,
          rule_name: '',
          rule_description: '',
          threshold_value: 0,
          threshold_operator: '<=',
          threshold_unit: '',
          time_horizon_days: 28,
          evaluation_frequency: 'daily',
          critical_threshold: 0,
          high_threshold: 0,
          medium_threshold: 0,
          low_threshold: 0,
          additional_parameters: {},
          is_active: true
        }
      ]
    }));
  };

  const updateBusinessRule = (index: number, field: keyof AlertBusinessRule, value: any) => {
    setFormData(prev => ({
      ...prev,
      business_rules: prev.business_rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const removeBusinessRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      business_rules: prev.business_rules.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            {alert ? 'Editar Alerta' : 'Nueva Alerta'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert_name">Nombre de la Alerta *</Label>
              <Input
                id="alert_name"
                value={formData.alert_name}
                onChange={(e) => setFormData(prev => ({ ...prev, alert_name: e.target.value }))}
                placeholder="Ej: Stock Bajo"
                className={errors.alert_name ? 'border-red-500' : ''}
              />
              {errors.alert_name && <p className="text-sm text-red-500">{errors.alert_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert_type">Tipo de Alerta *</Label>
              <Select
                value={formData.alert_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, alert_type: value }))}
              >
                <SelectTrigger className={errors.alert_type ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.alert_type && <p className="text-sm text-red-500">{errors.alert_type}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert_description">Descripción</Label>
            <Textarea
              id="alert_description"
              value={formData.alert_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, alert_description: e.target.value }))}
              placeholder="Describe el propósito de esta alerta..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_severity">Severidad por Defecto</Label>
              <Select
                value={formData.default_severity}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, default_severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Alerta Activa</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="batch_processing_enabled"
                checked={formData.batch_processing_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, batch_processing_enabled: checked }))}
              />
              <Label htmlFor="batch_processing_enabled">Procesamiento por Lotes</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="real_time_enabled"
              checked={formData.real_time_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, real_time_enabled: checked }))}
            />
            <Label htmlFor="real_time_enabled">Tiempo Real</Label>
          </div>

          {/* Notification Channels */}
          <div className="space-y-3">
            <Label>Canales de Notificación *</Label>
            <div className="flex space-x-2">
              <Select
                value={newChannel}
                onValueChange={(value) => setNewChannel(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar canal" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CHANNELS.map(channel => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addNotificationChannel} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.notification_channels && <p className="text-sm text-red-500">{errors.notification_channels}</p>}
            
            <div className="flex flex-wrap gap-2">
              {formData.notification_channels.map((channel, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{channel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNotificationChannel(channel)}
                    className="h-auto p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Business Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Reglas de Negocio *</Label>
              <Button type="button" onClick={addBusinessRule} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Regla
              </Button>
            </div>
            {errors.business_rules && <p className="text-sm text-red-500">{errors.business_rules}</p>}

            {formData.business_rules.map((rule, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Regla {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBusinessRule(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nombre de la Regla *</Label>
                    <Input
                      value={rule.rule_name}
                      onChange={(e) => updateBusinessRule(index, 'rule_name', e.target.value)}
                      placeholder="Ej: Stock Mínimo"
                      className={errors[`business_rules.${index}.rule_name`] ? 'border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Descripción</Label>
                    <Input
                      value={rule.rule_description || ''}
                      onChange={(e) => updateBusinessRule(index, 'rule_description', e.target.value)}
                      placeholder="Descripción de la regla"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Valor Umbral *</Label>
                    <Input
                      type="number"
                      value={rule.threshold_value || ''}
                      onChange={(e) => updateBusinessRule(index, 'threshold_value', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={errors[`business_rules.${index}.threshold_value`] ? 'border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Operador</Label>
                    <Select
                      value={rule.threshold_operator}
                      onValueChange={(value: any) => updateBusinessRule(index, 'threshold_operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Unidad</Label>
                    <Input
                      value={rule.threshold_unit || ''}
                      onChange={(e) => updateBusinessRule(index, 'threshold_unit', e.target.value)}
                      placeholder="Ej: unidades, días, %"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Horizonte Temporal (días)</Label>
                    <Input
                      type="number"
                      value={rule.time_horizon_days || 28}
                      onChange={(e) => updateBusinessRule(index, 'time_horizon_days', parseInt(e.target.value) || 28)}
                      placeholder="28"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Frecuencia de Evaluación</Label>
                    <Select
                      value={rule.evaluation_frequency}
                      onValueChange={(value: any) => updateBusinessRule(index, 'evaluation_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVALUATION_FREQUENCIES.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => updateBusinessRule(index, 'is_active', checked)}
                    />
                    <Label>Regla Activa</Label>
                  </div>
                </div>

                {/* Threshold Levels */}
                <div className="mt-4 space-y-3">
                  <Label className="text-sm font-medium">Niveles de Umbral</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Crítico</Label>
                      <Input
                        type="number"
                        value={rule.critical_threshold || ''}
                        onChange={(e) => updateBusinessRule(index, 'critical_threshold', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Alto</Label>
                      <Input
                        type="number"
                        value={rule.high_threshold || ''}
                        onChange={(e) => updateBusinessRule(index, 'high_threshold', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Medio</Label>
                      <Input
                        type="number"
                        value={rule.medium_threshold || ''}
                        onChange={(e) => updateBusinessRule(index, 'medium_threshold', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bajo</Label>
                      <Input
                        type="number"
                        value={rule.low_threshold || ''}
                        onChange={(e) => updateBusinessRule(index, 'low_threshold', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {alert ? 'Actualizar' : 'Crear'} Alerta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
