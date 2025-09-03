// File: src/pages/WhatIfAnalysis.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Brain, Library, BarChart, Trash2 } from 'lucide-react';
import { ScenarioBuilder } from '@/components/scenario/ScenarioBuilder';
import { ScenarioResults } from '@/components/scenario/ScenarioResults';
import { ScenarioComparison } from '@/components/scenario/ScenarioComparison';
import { ServiceLevelScenarioBuilder } from '@/components/scenario/ServiceLevelScenarioBuilder';
import { useScenarios } from '@/hooks/useScenarios';
import { createSampleScenarios } from '@/utils/sampleScenarios';

const WhatIfAnalysis = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const { scenarios, isLoading, deleteScenario, isDeleting } = useScenarios();

  const handleNewScenario = () => {
    setShowBuilder(true);
    setActiveTab('builder');
  };

  const handleScenarioSaved = () => {
    setShowBuilder(false);
    setActiveTab('library');
  };

  const handleViewScenario = (scenarioId: string) => {
    //console.log('🔍 Viewing scenario:', scenarioId);
    //console.log('📊 Available scenarios:', scenarios);
    const selectedScenarioData = scenarios?.find(s => s.id === selectedScenario);
    //console.log('🎯 Selected scenario data:', selectedScenarioData);
    setSelectedScenario(scenarioId);
    setActiveTab('library');
  };

  const handleCreateSampleScenarios = async () => {
    try {
      await createSampleScenarios();
      // Refresh the scenarios list
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample scenarios:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis What-If</h1>
          <p className="text-muted-foreground">
            Simule escenarios y analice el impacto en las recomendaciones de compra
          </p>
        </div>
        <Button onClick={handleNewScenario} className="bg-[#0066CC] hover:bg-[#0052A3]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Escenario
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Constructor
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Biblioteca de Escenarios
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Comparación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          {showBuilder ? (
            <ScenarioBuilder
              onSave={handleScenarioSaved}
              onCancel={() => setShowBuilder(false)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Crear Nuevo Escenario</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Configure parámetros y simule diferentes condiciones de mercado para 
                  optimizar sus decisiones de compra.
                </p>
                <Button onClick={handleNewScenario} className="bg-[#0066CC] hover:bg-[#0052A3]">
                  <Plus className="h-4 w-4 mr-2" />
                  Comenzar Nuevo Escenario
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {selectedScenario ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedScenario(null)}
                >
                  ← Volver a Biblioteca
                </Button>
              </div>
              {(() => {
                const scenarioData = scenarios?.find(s => s.id === selectedScenario);
                const results = scenarioData?.results || {
                  id: '1',
                  scenario_execution_id: selectedScenario,
                  impact_summary: {
                    total_order_count_change: 15.2,
                    total_value_change: 125000,
                    average_lead_time_change: -8.5,
                    service_level_impact: 2.1,
                    stockout_risk_change: -12.3
                  },
                  detailed_changes: []
                };
                //console.log('🎯 Passing results to ScenarioResults:', results);
                return (
                  <ScenarioResults 
                    results={results}
                    scenarioName={scenarioData?.scenario_name || 'Scenario'}
                  />
                );
              })()}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Biblioteca de Escenarios</span>
                  <Badge variant="outline">
                    {isLoading ? '...' : scenarios?.length || 0} escenarios
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : scenarios && scenarios.length > 0 ? (
                  <div className="space-y-4">
                    {scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{scenario.scenario_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {scenario.scenario_type} • 
                              Creado: {new Date(scenario.created_at || '').toLocaleDateString()}
                            </p>
                          </div>
                           <div className="flex items-center space-x-2">
                             <Badge variant="outline">
                               {scenario.scenario_type}
                             </Badge>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => handleViewScenario(scenario.id || '')}
                             >
                               Ver Detalles
                             </Button>
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if (confirm('¿Está seguro de que desea eliminar este escenario?')) {
                                   deleteScenario(scenario.id || '');
                                 }
                               }}
                               disabled={isDeleting}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Library className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">No hay escenarios guardados</h3>
                    <p className="text-muted-foreground mb-4">
                      Cree su primer escenario para comenzar con el análisis what-if.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleNewScenario} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primer Escenario
                      </Button>
                      <Button onClick={handleCreateSampleScenarios} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Escenarios de Prueba
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <ScenarioComparison 
            scenarios={scenarios || []} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatIfAnalysis;
