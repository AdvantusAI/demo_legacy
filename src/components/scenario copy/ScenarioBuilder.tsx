// File: src/components/scenario/ScenarioBuilder.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Play, Save, X, TrendingUp, AlertTriangle, DollarSign, Target, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParameterControls } from './ParameterControls';
import { ScopeSelector } from './ScopeSelector';
import { useScenarios } from '@/hooks/useScenarios';
import { ScenarioDefinition, ScenarioType, ScenarioParameters, ScenarioScope } from '@/types/scenario';

interface ScenarioBuilderProps {
  initialScenario?: ScenarioDefinition;
  onSave?: (scenario: ScenarioDefinition) => void;
  onCancel?: () => void;
}

const SCENARIO_TYPES = [
  {
    type: 'demand' as ScenarioType,
    label: 'Cambio de demanda',
    description: 'Modelo de cambios en las demandas de los clientes',
    icon: TrendingUp,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    type: 'supply' as ScenarioType,
    label: 'Disrupción de suministro',
    description: 'Simular la disponibilidad de los proveedores y los problemas de tiempo de entrega',
    icon: AlertTriangle,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  {
    type: 'cost' as ScenarioType,
    label: 'Fluctuación de costos',
    description: 'Analizar el impacto de los cambios de precios',
    icon: DollarSign,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    type: 'service' as ScenarioType,
    label: 'Cambio de nivel de servicio',
    description: 'Ajustar los niveles de servicio y las políticas de stock',
    icon: Target,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  {
    type: 'capacity' as ScenarioType,
    label: 'Restricciones de capacidad',
    description: 'Modelo de restricciones de capacidad de los almacenes y la producción',
    icon: Zap,
    color: 'bg-red-50 border-red-200 text-red-800'
  }
];

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({
  initialScenario,
  onSave,
  onCancel
}) => {
  const { createScenario, updateScenario, executeScenario, isCreating, isUpdating, isExecuting } = useScenarios();

  // Form state
  const [scenarioName, setScenarioName] = useState(initialScenario?.scenario_name || '');
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(initialScenario?.scenario_type || null);
  const [parameters, setParameters] = useState<ScenarioParameters>(initialScenario?.parameters || {});
  const [scope, setScope] = useState<ScenarioScope>(initialScenario?.scope || {
    time_horizon_months: 6,
    product_ids: [],
    customer_ids: [],
    warehouse_ids: []
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!scenarioName.trim()) {
      newErrors.push('Scenario name is required');
    }

    if (!selectedType) {
      newErrors.push('Please select a scenario type');
    }

    if (scope.time_horizon_months < 1 || scope.time_horizon_months > 12) {
      newErrors.push('Time horizon must be between 1 and 12 months');
    }

    // Type-specific validations
    if (selectedType === 'demand' && (!parameters.demand_multiplier || parameters.demand_multiplier < 0.1 || parameters.demand_multiplier > 5.0)) {
      newErrors.push('Demand multiplier must be between 0.1 and 5.0');
    }

    if (selectedType === 'cost' && parameters.cost_change_percentage !== undefined && (parameters.cost_change_percentage < -50 || parameters.cost_change_percentage > 100)) {
      newErrors.push('Cost change must be between -50% and +100%');
    }

    if (selectedType === 'service' && parameters.service_level_target !== undefined && (parameters.service_level_target < 0.8 || parameters.service_level_target > 0.99)) {
      newErrors.push('Service level target must be between 80% and 99%');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) return;

    const scenario: Omit<ScenarioDefinition, 'id' | 'created_at' | 'updated_at'> = {
      scenario_name: scenarioName,
      scenario_type: selectedType!,
      parameters,
      scope
    };

    try {
      if (initialScenario?.id) {
        await updateScenario({ id: initialScenario.id, ...scenario });
      } else {
        await createScenario(scenario);
      }
      
      onSave?.(scenario as ScenarioDefinition);
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  // Handle preview execution
  const handlePreview = async () => {
    if (!validateForm()) return;

    // For preview, we'll just validate and show a preview dialog
    // In real implementation, this would trigger a quick calculation
    ////console.log('Preview scenario:', { scenarioName, selectedType, parameters, scope });
  };

  // Handle full execution
  const handleExecute = async () => {
    if (!validateForm()) return;

    try {
      let scenarioId = initialScenario?.id;
      
      // Save scenario first if it's new
      if (!scenarioId) {
        const scenario: Omit<ScenarioDefinition, 'id' | 'created_at' | 'updated_at'> = {
          scenario_name: scenarioName,
          scenario_type: selectedType!,
          parameters,
          scope
        };
        
        const savedScenario = await createScenario(scenario);
        scenarioId = savedScenario.id;
      }

      // Then execute it
      if (scenarioId) {
        await executeScenario(scenarioId);
      }
    } catch (error) {
      console.error('Error executing scenario:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {initialScenario ? 'Editar escenario' : 'Constructor de escenarios'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea y configura escenarios para analizar el impacto de las ventas
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        )}
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Scenario Name */}
      <Card>
        <CardHeader>
          <CardTitle>Información del escenario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Nombre del escenario *</Label>
            <Input
              id="scenario-name"
              placeholder="p.e., Q4 pico estacional"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scenario Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de escenario *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIO_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.type;
              
              return (
                <div
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 p-4 transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`rounded-md border p-2 ${type.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {type.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-primary">Seleccionado</Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scope & Filters */}
      <ScopeSelector scope={scope} onScopeChange={setScope} />

      {/* Parameter Controls */}
      {selectedType && (
        <ParameterControls
          scenarioType={selectedType}
          parameters={parameters}
          onParametersChange={setParameters}
        />
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!selectedType || isCreating || isUpdating || isExecuting}
          >
            <Play className="h-4 w-4 mr-2" />
            Previsualizar impacto
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!selectedType || isCreating || isUpdating}
            className="bg-[#0066CC] hover:bg-[#0052A3]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating || isUpdating ? 'Guardando...' : 'Guardar escenario'}
          </Button>
        </div>

        <Button
          onClick={handleExecute}
          disabled={!selectedType || isExecuting}
          className="bg-[#10B981] hover:bg-[#059669]"
        >
          <Play className="h-4 w-4 mr-2" />
          {isExecuting ? 'Ejecutando análisis...' : 'Ejecutar análisis completo'}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-4">
        <p className="font-medium mb-2">Guía rápida:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Previsualizar impacto:</strong> Validación rápida y previsualización de parámetros</li>
          <li>• <strong>Guardar escenario:</strong> Almacenar configuración para uso posterior o compartición</li>
          <li>• <strong>Ejecutar análisis completo:</strong> Ejecutar cálculo completo del escenario y ver resultados</li>
        </ul>
      </div>
    </div>
  );
};