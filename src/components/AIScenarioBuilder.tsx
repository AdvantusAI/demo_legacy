
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Save, Calculator, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIScenarioBuilderProps {
  selectedProductId?: string;
  selectedLocationId?: string;
  selectedVendorId?: string;
}

interface ScenarioResults {
  originalForecast: number;
  adjustedForecast: number;
  impact: number;
  impactPercentage: number;
  inventoryImpact?: number;
  serviceLevelImpact?: number;
}

export function AIScenarioBuilder({
  selectedProductId,
  selectedLocationId,
  selectedVendorId
}: AIScenarioBuilderProps) {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioType, setScenarioType] = useState('forecast_adjustment');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState<any>({});
  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }));
  };

  const calculateScenario = async () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Selecciona un producto para crear escenarios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Build query conditions
      let query = supabase
        .from('forecast_data')
        .select('forecast, sales_plan, demand_planner')
        .eq('product_id', selectedProductId)
        .order('postdate', { ascending: false })
        .limit(1);

      // Add location filter if provided
      if (selectedLocationId) {
        query = query.eq('location_id', selectedLocationId);
      }

      // Add vendor filter if provided - Note: vendor_id may not exist in forecast_data
      if (selectedVendorId && selectedLocationId) {
        query = query.eq('customer_id', selectedVendorId);
      }

      const { data: forecastData, error } = await query;

      if (error) {
        console.error('Error fetching forecast data:', error);
        toast({
          title: "Error",
          description: "Error al obtener datos de pronóstico",
          variant: "destructive"
        });
        return;
      }

      if (!forecastData || forecastData.length === 0) {
        toast({
          title: "Sin datos",
          description: `No se encontraron datos de pronóstico para el producto ${selectedProductId}${selectedLocationId ? ` en ${selectedLocationId}` : ''}`,
          variant: "destructive"
        });
        return;
      }

      // If multiple records, aggregate them (when no location is specified)
      let originalForecast: number;
      if (forecastData.length > 1) {
        originalForecast = forecastData.reduce((sum, item) => {
          return sum + (item.forecast || item.sales_plan || item.demand_planner || 0);
        }, 0) / forecastData.length;
      } else {
        originalForecast = forecastData[0].forecast || forecastData[0].sales_plan || forecastData[0].demand_planner || 0;
      }

      let adjustedForecast = originalForecast;

      // Apply scenario logic based on type and parameters
      switch (scenarioType) {
        case 'forecast_adjustment':
          if (parameters.percentage) {
            adjustedForecast = originalForecast * (1 + parameters.percentage / 100);
          } else if (parameters.absolute) {
            adjustedForecast = originalForecast + parameters.absolute;
          }
          break;
        
        case 'seasonal_impact':
          const seasonalMultiplier = parameters.multiplier || 1.2;
          adjustedForecast = originalForecast * seasonalMultiplier;
          break;
        
        case 'promotional_impact':
          const promoLift = parameters.lift || 0.3;
          adjustedForecast = originalForecast * (1 + promoLift);
          break;
        
        case 'supply_disruption':
          const disruptionImpact = parameters.reduction || 0.2;
          adjustedForecast = originalForecast * (1 - disruptionImpact);
          break;
      }

      const impact = adjustedForecast - originalForecast;
      const impactPercentage = originalForecast > 0 ? (impact / originalForecast) * 100 : 0;

      // Calculate secondary impacts
      const inventoryImpact = impact * 1.2; // Assume 20% buffer
      const serviceLevelImpact = impact > 0 ? 2 : -5; // Positive forecast increases service level

      const scenarioResults: ScenarioResults = {
        originalForecast,
        adjustedForecast,
        impact,
        impactPercentage,
        inventoryImpact,
        serviceLevelImpact
      };

      setResults(scenarioResults);

    } catch (error) {
      console.error('Error calculating scenario:', error);
      toast({
        title: "Error",
        description: "Error al calcular el escenario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveScenario = async () => {
    if (!user || !selectedProductId || !results) return;

    try {
      const { error } = await supabase
        .from('what_if_scenarios')
        .insert({
          scenario_name: scenarioName,
          scenario_type: scenarioType,
          product_id: selectedProductId,
          location_id: selectedLocationId || null,
          vendor_id: selectedVendorId || null,
          created_by: user.id,
          description,
          parameters,
          results: {
            ...results,
            calculated_at: new Date().toISOString()
          },
          baseline_values: {
            original_forecast: results.originalForecast
          },
          status: 'draft'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Escenario Guardado",
        description: `El escenario "${scenarioName}" ha sido guardado exitosamente.`,
      });

    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Error",
        description: "Error al guardar el escenario",
        variant: "destructive"
      });
    }
  };

  if (!selectedProductId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Constructor de Escenarios</h3>
          <p className="text-muted-foreground">
            Selecciona un producto para crear escenarios what-if
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Constructor de Escenarios What-If
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Crea y analiza diferentes escenarios para {selectedProductId}
          {selectedLocationId ? ` en ${selectedLocationId}` : ' (todas las ubicaciones)'}
          {selectedVendorId && ` - Proveedor: ${selectedVendorId}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Nombre del Escenario</Label>
            <Input
              id="scenario-name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Ej: Promoción Black Friday"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenario-type">Tipo de Escenario</Label>
            <Select value={scenarioType} onValueChange={setScenarioType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forecast_adjustment">Ajuste de Pronóstico</SelectItem>
                <SelectItem value="seasonal_impact">Impacto Estacional</SelectItem>
                <SelectItem value="promotional_impact">Impacto Promocional</SelectItem>
                <SelectItem value="supply_disruption">Disrupción de Suministro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el escenario..."
            rows={2}
          />
        </div>

        {/* Dynamic parameters based on scenario type */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium">Parámetros del Escenario</h4>
          
          {scenarioType === 'forecast_adjustment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentage">Ajuste Porcentual (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  value={parameters.percentage || ''}
                  onChange={(e) => handleParameterChange('percentage', e.target.value)}
                  placeholder="Ej: 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="absolute">Ajuste Absoluto</Label>
                <Input
                  id="absolute"
                  type="number"
                  value={parameters.absolute || ''}
                  onChange={(e) => handleParameterChange('absolute', e.target.value)}
                  placeholder="Ej: 100"
                />
              </div>
            </div>
          )}

          {scenarioType === 'seasonal_impact' && (
            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplicador Estacional</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                value={parameters.multiplier || ''}
                onChange={(e) => handleParameterChange('multiplier', e.target.value)}
                placeholder="Ej: 1.3"
              />
            </div>
          )}

          {scenarioType === 'promotional_impact' && (
            <div className="space-y-2">
              <Label htmlFor="lift">Incremento Promocional (%)</Label>
              <Input
                id="lift"
                type="number"
                step="0.1"
                value={parameters.lift ? parameters.lift * 100 : ''}
                onChange={(e) => handleParameterChange('lift', (parseFloat(e.target.value) / 100).toString())}
                placeholder="Ej: 25"
              />
            </div>
          )}

          {scenarioType === 'supply_disruption' && (
            <div className="space-y-2">
              <Label htmlFor="reduction">Reducción de Suministro (%)</Label>
              <Input
                id="reduction"
                type="number"
                step="0.1"
                value={parameters.reduction ? parameters.reduction * 100 : ''}
                onChange={(e) => handleParameterChange('reduction', (parseFloat(e.target.value) / 100).toString())}
                placeholder="Ej: 20"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateScenario} disabled={loading}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {loading ? 'Calculando...' : 'Ejecutar Escenario'}
          </Button>
          
          {results && (
            <Button onClick={saveScenario} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Guardar Escenario
            </Button>
          )}
        </div>

        {/* Results Display */}
        {results && (
          <div className="mt-6 p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resultados del Escenario
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {results.originalForecast.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Pronóstico Original</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {results.adjustedForecast.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Pronóstico Ajustado</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${results.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.impact >= 0 ? '+' : ''}{results.impact.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Impacto Absoluto</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${results.impactPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.impactPercentage >= 0 ? '+' : ''}{results.impactPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Impacto Porcentual</div>
              </div>
            </div>

            {(results.inventoryImpact || results.serviceLevelImpact) && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2">Impactos Secundarios</h5>
                <div className="flex gap-4 text-sm">
                  {results.inventoryImpact && (
                    <Badge variant="outline">
                      Inventario: {results.inventoryImpact >= 0 ? '+' : ''}{results.inventoryImpact.toFixed(0)} unidades
                    </Badge>
                  )}
                  {results.serviceLevelImpact && (
                    <Badge variant="outline">
                      Nivel de Servicio: {results.serviceLevelImpact >= 0 ? '+' : ''}{results.serviceLevelImpact.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
