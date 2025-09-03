import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Download, 
  BarChart3,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { ScenarioDefinition } from '@/types/scenario';
import { PurchaseOrderImpactChart } from './PurchaseOrderImpactChart';

interface ScenarioComparisonProps {
  scenarios: ScenarioDefinition[];
  isLoading?: boolean;
}

interface ComparisonData {
  scenario: ScenarioDefinition;
  results: {
    total_order_count_change: number;
    total_value_change: number;
    average_lead_time_change: number;
    service_level_impact: number;
    stockout_risk_change: number;
  };
}

const mockBaselineData = {
  total_orders: 847,
  total_value: 2400000,
  avg_lead_time: 14.2,
  service_level: 98.2,
  stockout_risk: 2.1
};

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  isLoading = false
}) => {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [includeBaseline, setIncludeBaseline] = useState(true);

  // Mock results for demonstration - in real implementation, this would come from API
  const mockResults = useMemo(() => {
    return scenarios.map(scenario => ({
      scenario,
      results: {
        total_order_count_change: Math.random() * 40 - 20,
        total_value_change: Math.random() * 500000 - 250000,
        average_lead_time_change: Math.random() * 20 - 10,
        service_level_impact: Math.random() * 4 - 2,
        stockout_risk_change: Math.random() * 20 - 10
      }
    }));
  }, [scenarios]);

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const selectedComparisonData = mockResults.filter(data => 
    selectedScenarios.includes(data.scenario.id || '')
  );

  const getImpactColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImpactIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return Minus;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateScenarioValue = (baseValue: number, changePercent: number) => {
    return Math.round(baseValue * (1 + changePercent / 100));
  };

  const handleExport = () => {
    if (selectedComparisonData.length === 0) {
      ////console.log('No scenarios selected for export');
      return;
    }

    // Prepare export data
    const exportData = {
      timestamp: new Date().toISOString(),
      baseline_data: includeBaseline ? mockBaselineData : null,
      scenarios: selectedComparisonData.map(data => ({
        name: data.scenario.scenario_name,
        type: data.scenario.scenario_type,
        metrics: {
          total_orders: {
            current: mockBaselineData.total_orders,
            scenario: calculateScenarioValue(mockBaselineData.total_orders, data.results.total_order_count_change),
            change: data.results.total_order_count_change
          },
          total_value: {
            current: mockBaselineData.total_value,
            scenario: calculateScenarioValue(mockBaselineData.total_value, data.results.total_value_change / mockBaselineData.total_value * 100),
            change: data.results.total_value_change
          },
          avg_lead_time: {
            current: mockBaselineData.avg_lead_time,
            scenario: mockBaselineData.avg_lead_time * (1 + data.results.average_lead_time_change / 100),
            change: data.results.average_lead_time_change
          },
          service_level: {
            current: mockBaselineData.service_level,
            scenario: mockBaselineData.service_level + data.results.service_level_impact,
            change: data.results.service_level_impact
          },
          stockout_risk: {
            current: mockBaselineData.stockout_risk,
            scenario: mockBaselineData.stockout_risk + data.results.stockout_risk_change,
            change: data.results.stockout_risk_change
          }
        }
      }))
    };

    // Convert to CSV format
    const csvData = [
      ['Metric', 'Current', ...selectedComparisonData.map(d => d.scenario.scenario_name)],
      ['Total Orders', mockBaselineData.total_orders, ...selectedComparisonData.map(d => 
        calculateScenarioValue(mockBaselineData.total_orders, d.results.total_order_count_change)
      )],
      ['Total Value ($)', mockBaselineData.total_value, ...selectedComparisonData.map(d => 
        calculateScenarioValue(mockBaselineData.total_value, d.results.total_value_change / mockBaselineData.total_value * 100)
      )],
      ['Avg Lead Time (days)', mockBaselineData.avg_lead_time, ...selectedComparisonData.map(d => 
        (mockBaselineData.avg_lead_time * (1 + d.results.average_lead_time_change / 100)).toFixed(1)
      )],
      ['Service Level (%)', mockBaselineData.service_level, ...selectedComparisonData.map(d => 
        (mockBaselineData.service_level + d.results.service_level_impact).toFixed(1)
      )],
      ['Stockout Risk (%)', mockBaselineData.stockout_risk, ...selectedComparisonData.map(d => 
        (mockBaselineData.stockout_risk + d.results.stockout_risk_change).toFixed(1)
      )]
    ];

    // Create CSV content
    const csvContent = csvData.map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scenario_comparison_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ////console.log('Comparison data exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Comparación de Escenarios</h2>
          <p className="text-muted-foreground">
            Compare múltiples escenarios para identificar la mejor estrategia
          </p>
        </div>
        <Button 
          onClick={handleExport} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={selectedComparisonData.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scenario Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Selección de Escenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Baseline Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="baseline"
                checked={includeBaseline}
                onCheckedChange={(checked) => setIncludeBaseline(!!checked)}
              />
              <label htmlFor="baseline" className="text-sm font-medium cursor-pointer">
                Línea Base Actual
              </label>
              <Badge variant="outline" className="bg-gray-50">
                Base
              </Badge>
            </div>

            {/* Scenario Options */}
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={scenario.id}
                    checked={selectedScenarios.includes(scenario.id || '')}
                    onCheckedChange={() => handleScenarioToggle(scenario.id || '')}
                  />
                  <label htmlFor={scenario.id} className="text-sm cursor-pointer flex-1">
                    {scenario.scenario_name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {scenario.scenario_type}
                  </Badge>
                </div>
              ))}
            </div>

            {scenarios.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No hay escenarios disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        <div className="lg:col-span-3 space-y-6">
          {selectedScenarios.length > 0 || includeBaseline ? (
            <>
              {/* Key Metrics Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Comparación de Métricas Clave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Métrica</TableHead>
                          {includeBaseline && <TableHead className="text-center">Actual</TableHead>}
                          {selectedComparisonData.map((data) => (
                            <TableHead key={data.scenario.id} className="text-center">
                              {data.scenario.scenario_name}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Total Orders */}
                        <TableRow>
                          <TableCell className="font-medium">Total de Órdenes</TableCell>
                          {includeBaseline && (
                            <TableCell className="text-center">{mockBaselineData.total_orders}</TableCell>
                          )}
                          {selectedComparisonData.map((data) => {
                            const newValue = calculateScenarioValue(
                              mockBaselineData.total_orders,
                              data.results.total_order_count_change
                            );
                            return (
                              <TableCell key={data.scenario.id} className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{newValue}</span>
                                  <span className={`text-xs ${getImpactColor(data.results.total_order_count_change)}`}>
                                    {formatPercentage(data.results.total_order_count_change)}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* Total Value */}
                        <TableRow>
                          <TableCell className="font-medium">Valor Total</TableCell>
                          {includeBaseline && (
                            <TableCell className="text-center">{formatCurrency(mockBaselineData.total_value)}</TableCell>
                          )}
                          {selectedComparisonData.map((data) => {
                            const newValue = calculateScenarioValue(
                              mockBaselineData.total_value,
                              data.results.total_value_change / mockBaselineData.total_value * 100
                            );
                            return (
                              <TableCell key={data.scenario.id} className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{formatCurrency(newValue)}</span>
                                  <span className={`text-xs ${getImpactColor(data.results.total_value_change)}`}>
                                    {formatCurrency(data.results.total_value_change)}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* Average Lead Time */}
                        <TableRow>
                          <TableCell className="font-medium">Tiempo Promedio de Entrega</TableCell>
                          {includeBaseline && (
                            <TableCell className="text-center">{mockBaselineData.avg_lead_time}d</TableCell>
                          )}
                          {selectedComparisonData.map((data) => {
                            const newValue = (mockBaselineData.avg_lead_time * (1 + data.results.average_lead_time_change / 100)).toFixed(1);
                            return (
                              <TableCell key={data.scenario.id} className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{newValue}d</span>
                                  <span className={`text-xs ${getImpactColor(data.results.average_lead_time_change)}`}>
                                    {formatPercentage(data.results.average_lead_time_change)}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* Service Level */}
                        <TableRow>
                          <TableCell className="font-medium">Nivel de Servicio</TableCell>
                          {includeBaseline && (
                            <TableCell className="text-center">{mockBaselineData.service_level}%</TableCell>
                          )}
                          {selectedComparisonData.map((data) => {
                            const newValue = (mockBaselineData.service_level + data.results.service_level_impact).toFixed(1);
                            return (
                              <TableCell key={data.scenario.id} className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{newValue}%</span>
                                  <span className={`text-xs ${getImpactColor(data.results.service_level_impact)}`}>
                                    {formatPercentage(data.results.service_level_impact)}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* Stockout Risk */}
                        <TableRow>
                          <TableCell className="font-medium">Riesgo de Desabasto</TableCell>
                          {includeBaseline && (
                            <TableCell className="text-center">{mockBaselineData.stockout_risk}%</TableCell>
                          )}
                          {selectedComparisonData.map((data) => {
                            const newValue = (mockBaselineData.stockout_risk + data.results.stockout_risk_change).toFixed(1);
                            return (
                              <TableCell key={data.scenario.id} className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{newValue}%</span>
                                  <span className={`text-xs ${getImpactColor(-data.results.stockout_risk_change)}`}>
                                    {formatPercentage(data.results.stockout_risk_change)}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Impact Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedComparisonData.map((data) => (
                  <Card key={data.scenario.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {data.scenario.scenario_name}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {data.scenario.scenario_type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Impacto en Valor</span>
                        <div className="flex items-center gap-1">
                          {React.createElement(getImpactIcon(data.results.total_value_change), {
                            className: `h-4 w-4 ${getImpactColor(data.results.total_value_change)}`
                          })}
                          <span className={`font-medium ${getImpactColor(data.results.total_value_change)}`}>
                            {formatCurrency(data.results.total_value_change)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Cambio en Órdenes</span>
                        <span className={`font-medium ${getImpactColor(data.results.total_order_count_change)}`}>
                          {formatPercentage(data.results.total_order_count_change)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Riesgo de Desabasto</span>
                        <div className="flex items-center gap-1">
                          {data.results.stockout_risk_change > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`font-medium ${getImpactColor(-data.results.stockout_risk_change)}`}>
                            {formatPercentage(data.results.stockout_risk_change)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Purchase Order Impact Analysis */}
              {selectedComparisonData.length > 0 && (
                <PurchaseOrderImpactChart 
                  comparisonData={selectedComparisonData}
                  includeBaseline={includeBaseline}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seleccione Escenarios para Comparar</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Elija uno o más escenarios de la lista lateral para ver una comparación detallada.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};