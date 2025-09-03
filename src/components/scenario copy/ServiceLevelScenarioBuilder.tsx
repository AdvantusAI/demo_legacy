import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Info, AlertCircle } from 'lucide-react';
import { ScenarioDefinition } from '@/types/scenario';
import { useScenarios } from '@/hooks/useScenarios';

interface ServiceLevelScenarioBuilderProps {
  onSave: () => void;
  onCancel: () => void;
}

export const ServiceLevelScenarioBuilder: React.FC<ServiceLevelScenarioBuilderProps> = ({
  onSave,
  onCancel
}) => {
  const { createScenario, executeScenario, isCreating, isExecuting } = useScenarios();
  const [formData, setFormData] = useState({
    scenario_name: '',
    description: '',
    service_level_target: 0.95,
    scope: {
      product_ids: [] as string[],
      warehouse_ids: [] as string[],
      customer_ids: [] as string[],
      time_horizon_months: 6
    }
  });

  const handleServiceLevelChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      service_level_target: value[0] / 100
    }));
  };

  const handleSubmit = async () => {
    try {
      const scenario: Omit<ScenarioDefinition, 'id' | 'created_at' | 'updated_at'> = {
        scenario_name: formData.scenario_name,
        scenario_type: 'service',
        parameters: {
          service_level_target: formData.service_level_target
        },
        scope: {
          product_ids: formData.scope.product_ids.length > 0 ? formData.scope.product_ids : [],
          warehouse_ids: formData.scope.warehouse_ids.length > 0 ? formData.scope.warehouse_ids : [],
          customer_ids: formData.scope.customer_ids.length > 0 ? formData.scope.customer_ids : [],
          time_horizon_months: formData.scope.time_horizon_months
        },
        description: formData.description
      };

      const createdScenario = await createScenario(scenario);
      
      // Automatically execute the scenario
      if (createdScenario?.id) {
        await executeScenario(createdScenario.id);
      }
      
      onSave();
    } catch (error) {
      console.error('Error creating service level scenario:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Escenario de Nivel de Servicio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure el nivel de servicio objetivo para analizar el impacto en inventario y costos
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="scenario_name">Nombre del Escenario</Label>
              <Input
                id="scenario_name"
                value={formData.scenario_name}
                onChange={(e) => setFormData(prev => ({ ...prev, scenario_name: e.target.value }))}
                placeholder="Ej: Mejora de Nivel de Servicio Q4"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el propósito de este escenario"
              />
            </div>
          </div>

          {/* Service Level Target */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Nivel de Servicio Objetivo</Label>
              <p className="text-sm text-muted-foreground">
                Configure el nivel de servicio deseado (% de demanda satisfecha)
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label className="min-w-[100px]">Objetivo:</Label>
                <div className="flex-1">
                  <Slider
                    value={[formData.service_level_target * 100]}
                    onValueChange={handleServiceLevelChange}
                    min={85}
                    max={99.9}
                    step={0.1}
                    className="flex-1"
                  />
                </div>
                <div className="min-w-[80px] text-right">
                  <span className="text-lg font-semibold text-blue-600">
                    {(formData.service_level_target * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Impacto del Nivel de Servicio</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Un nivel de servicio más alto resultará en:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Mayor stock de seguridad</li>
                      <li>• Puntos de reorden más altos</li>
                      <li>• Menor riesgo de desabasto</li>
                      <li>• Incremento en costos de inventario</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Alcance del Escenario</Label>
              <p className="text-sm text-muted-foreground">
                Especifique qué productos y almacenes se incluirán en el análisis
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="products">Productos</Label>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFormData(prev => ({ ...prev, scope: { ...prev.scope, product_ids: [] } }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar productos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="warehouses">Almacenes</Label>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFormData(prev => ({ ...prev, scope: { ...prev.scope, warehouse_ids: [] } }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los almacenes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Consideraciones Importantes</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Este escenario calculará el impacto en base a datos reales de inventario y 
                  niveles de servicio históricos. El análisis puede tomar unos momentos para completarse.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.scenario_name || isCreating || isExecuting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creando...' : isExecuting ? 'Ejecutando...' : 'Crear y Ejecutar Escenario'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};