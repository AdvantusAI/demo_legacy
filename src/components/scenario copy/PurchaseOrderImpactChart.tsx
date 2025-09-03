import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';

interface PurchaseOrderImpactChartProps {
  comparisonData: Array<{
    scenario: {
      id?: string;
      scenario_name: string;
      scenario_type: string;
    };
    results: {
      total_order_count_change: number;
      total_value_change: number;
      average_lead_time_change: number;
      service_level_impact: number;
      stockout_risk_change: number;
    };
  }>;
  includeBaseline?: boolean;
}

// Mock detailed purchase order data
const mockPurchaseOrderDetails = [
  {
    product: 'PROD_001',
    current_qty: 500,
    vendor: 'VEND_A',
    current_cost: 12500,
    scenarios: {
      'scenario_1': { qty: 750, cost: 18750, change: 50 },
      'scenario_2': { qty: 400, cost: 10000, change: -20 },
      'scenario_3': { qty: 650, cost: 16250, change: 30 }
    }
  },
  {
    product: 'PROD_002',
    current_qty: 200,
    vendor: 'VEND_B',
    current_cost: 8000,
    scenarios: {
      'scenario_1': { qty: 0, cost: 0, change: -100 },
      'scenario_2': { qty: 240, cost: 9600, change: 20 },
      'scenario_3': { qty: 180, cost: 7200, change: -10 }
    }
  },
  {
    product: 'PROD_003',
    current_qty: 0,
    vendor: 'VEND_C',
    current_cost: 0,
    scenarios: {
      'scenario_1': { qty: 300, cost: 15000, change: 0 },
      'scenario_2': { qty: 0, cost: 0, change: 0 },
      'scenario_3': { qty: 450, cost: 22500, change: 0 }
    }
  },
  {
    product: 'PROD_004',
    current_qty: 350,
    vendor: 'VEND_A',
    current_cost: 7000,
    scenarios: {
      'scenario_1': { qty: 420, cost: 8400, change: 20 },
      'scenario_2': { qty: 280, cost: 5600, change: -20 },
      'scenario_3': { qty: 350, cost: 7000, change: 0 }
    }
  },
  {
    product: 'PROD_005',
    current_qty: 150,
    vendor: 'VEND_D',
    current_cost: 4500,
    scenarios: {
      'scenario_1': { qty: 225, cost: 6750, change: 50 },
      'scenario_2': { qty: 120, cost: 3600, change: -20 },
      'scenario_3': { qty: 180, cost: 5400, change: 20 }
    }
  }
];

export const PurchaseOrderImpactChart: React.FC<PurchaseOrderImpactChartProps> = ({
  comparisonData,
  includeBaseline = true
}) => {
  // Prepare chart data
  const chartData = mockPurchaseOrderDetails.map(item => {
    const dataPoint: any = {
      product: item.product,
      vendor: item.vendor,
      current: item.current_qty
    };

    comparisonData.forEach((scenario, index) => {
      const scenarioKey = `scenario_${index + 1}`;
      const scenarioData = item.scenarios[scenarioKey as keyof typeof item.scenarios];
      if (scenarioData) {
        dataPoint[scenario.scenario.scenario_name] = scenarioData.qty;
      }
    });

    return dataPoint;
  });

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Plus;
  };

  const colors = ['#0066CC', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Interactive Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Impacto en Órdenes de Compra por Producto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Producto: ${label}`}
              />
              <Legend />
              {includeBaseline && (
                <Bar dataKey="current" fill="#6B7280" name="Actual" />
              )}
              {comparisonData.map((scenario, index) => (
                <Bar
                  key={scenario.scenario.id}
                  dataKey={scenario.scenario.scenario_name}
                  fill={colors[index % colors.length]}
                  name={scenario.scenario.scenario_name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Recommendations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Detalladas de Órdenes de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium">Proveedor</th>
                  <th className="text-center p-3 font-medium">Cantidad Actual</th>
                  {comparisonData.map((scenario) => (
                    <th key={scenario.scenario.id} className="text-center p-3 font-medium">
                      {scenario.scenario.scenario_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPurchaseOrderDetails.map((item, index) => (
                  <tr key={item.product} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.product}</td>
                    <td className="p-3 text-muted-foreground">{item.vendor}</td>
                    <td className="p-3 text-center">{item.current_qty}</td>
                    {comparisonData.map((scenario, scenarioIndex) => {
                      const scenarioKey = `scenario_${scenarioIndex + 1}`;
                      const scenarioData = item.scenarios[scenarioKey as keyof typeof item.scenarios];
                      
                      if (!scenarioData) return <td key={scenario.scenario.id} className="p-3 text-center">-</td>;
                      
                      const change = scenarioData.change;
                      const ChangeIcon = getChangeIcon(change);
                      
                      return (
                        <td key={scenario.scenario.id} className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{scenarioData.qty}</span>
                            {change !== 0 && (
                              <Badge variant="outline" className={`text-xs ${getChangeColor(change)}`}>
                                <ChangeIcon className="h-3 w-3 mr-1" />
                                {change > 0 ? '+' : ''}{change}%
                              </Badge>
                            )}
                            {scenarioData.qty === 0 && item.current_qty > 0 && (
                              <Badge variant="outline" className="text-xs text-red-600 bg-red-50">
                                CANCELADO
                              </Badge>
                            )}
                            {scenarioData.qty > 0 && item.current_qty === 0 && (
                              <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">
                                NUEVO
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockPurchaseOrderDetails.reduce((acc, item) => {
                return acc + comparisonData.reduce((scenarioAcc, scenario, index) => {
                  const scenarioKey = `scenario_${index + 1}`;
                  const scenarioData = item.scenarios[scenarioKey as keyof typeof item.scenarios];
                  return scenarioAcc + (scenarioData && scenarioData.qty > item.current_qty ? 1 : 0);
                }, 0);
              }, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Órdenes Incrementadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {mockPurchaseOrderDetails.reduce((acc, item) => {
                return acc + comparisonData.reduce((scenarioAcc, scenario, index) => {
                  const scenarioKey = `scenario_${index + 1}`;
                  const scenarioData = item.scenarios[scenarioKey as keyof typeof item.scenarios];
                  return scenarioAcc + (scenarioData && scenarioData.qty < item.current_qty ? 1 : 0);
                }, 0);
              }, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Órdenes Reducidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockPurchaseOrderDetails.reduce((acc, item) => {
                return acc + comparisonData.reduce((scenarioAcc, scenario, index) => {
                  const scenarioKey = `scenario_${index + 1}`;
                  const scenarioData = item.scenarios[scenarioKey as keyof typeof item.scenarios];
                  return scenarioAcc + (scenarioData && scenarioData.qty > 0 && item.current_qty === 0 ? 1 : 0);
                }, 0);
              }, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Órdenes Nuevas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};