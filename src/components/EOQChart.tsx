
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';

interface EOQChartProps {
  annualDemand: number;
  orderingCost: number;
  holdingCostRate: number;
  unitCost: number;
  classicEOQ: number;
  selectedQuantity: number;
}

export function EOQChart({ 
  annualDemand, 
  orderingCost, 
  holdingCostRate, 
  unitCost, 
  classicEOQ, 
  selectedQuantity 
}: EOQChartProps) {
  // Calculate costs for the selected quantity
  const selectedOrderingCost = (annualDemand / selectedQuantity) * orderingCost;
  const selectedHoldingCost = (selectedQuantity / 2) * unitCost * holdingCostRate;
  const selectedTotalCost = selectedOrderingCost + selectedHoldingCost;

  // Calculate costs for the EOQ
  const eoqOrderingCost = (annualDemand / classicEOQ) * orderingCost;
  const eoqHoldingCost = (classicEOQ / 2) * unitCost * holdingCostRate;
  const eoqTotalCost = eoqOrderingCost + eoqHoldingCost;

  // Calculate cost difference
  const costDifference = selectedTotalCost - eoqTotalCost;
  const costDifferencePercentage = ((costDifference / eoqTotalCost) * 100);

  // Generate data points for the cost curves
  const generateDataPoints = () => {
    const points = [];
    const maxQuantity = Math.max(classicEOQ * 2, selectedQuantity * 1.5, 1000);
    const step = maxQuantity / 50;

    for (let q = step; q <= maxQuantity; q += step) {
      const orderingCostValue = (annualDemand / q) * orderingCost;
      const holdingCostValue = (q / 2) * unitCost * holdingCostRate;
      const totalCost = orderingCostValue + holdingCostValue;

      points.push({
        quantity: Math.round(q),
        orderingCost: orderingCostValue,
        holdingCost: holdingCostValue,
        totalCost: totalCost
      });
    }

    return points;
  };

  const data = generateDataPoints();

  const chartConfig = {
    orderingCost: {
      label: "Costo de Pedido",
      color: "#EF4444"
    },
    holdingCost: {
      label: "Costo de Almacenamiento", 
      color: "#3B82F6"
    },
    totalCost: {
      label: "Costo Total",
      color: "#10B981"
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Mathematical Formula and Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Fórmula Matemática del EOQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-center text-lg font-mono mb-4">
                EOQ = √(2 × D × S / H)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Donde:</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• D = Demanda anual ({annualDemand.toLocaleString()} unidades)</li>
                    <li>• S = Costo por pedido ({formatCurrency(orderingCost)})</li>
                    <li>• H = Costo de mantener inventario por unidad</li>
                    <li>• H = Costo unitario × Tasa de mantenimiento</li>
                  </ul>
                </div>
                <div>
                  <strong>Cálculo paso a paso:</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• H = {formatCurrency(unitCost)} × {(holdingCostRate * 100).toFixed(1)}% = {formatCurrency(unitCost * holdingCostRate)}</li>
                    <li>• 2 × D × S = 2 × {annualDemand.toLocaleString()} × {formatCurrency(orderingCost)} = {formatCurrency(2 * annualDemand * orderingCost)}</li>
                    <li>• (2 × D × S) / H = {formatCurrency(2 * annualDemand * orderingCost)} / {formatCurrency(unitCost * holdingCostRate)} = {((2 * annualDemand * orderingCost) / (unitCost * holdingCostRate)).toLocaleString()}</li>
                    <li>• EOQ = √{((2 * annualDemand * orderingCost) / (unitCost * holdingCostRate)).toLocaleString()} = <strong>{classicEOQ.toLocaleString()} unidades</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">EOQ Óptimo ({classicEOQ.toLocaleString()} unidades)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Costo de Pedido:</span>
                  <span>{formatCurrency(eoqOrderingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de Almacenamiento:</span>
                  <span>{formatCurrency(eoqHoldingCost)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Costo Total Anual:</span>
                  <span>{formatCurrency(eoqTotalCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">Cantidad Seleccionada ({selectedQuantity.toLocaleString()} unidades)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Costo de Pedido:</span>
                  <span>{formatCurrency(selectedOrderingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de Almacenamiento:</span>
                  <span>{formatCurrency(selectedHoldingCost)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Costo Total Anual:</span>
                  <span>{formatCurrency(selectedTotalCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600">Diferencia de Costos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Diferencia Absoluta:</span>
                  <span className={costDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                    {costDifference > 0 ? '+' : ''}{formatCurrency(costDifference)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Diferencia Porcentual:</span>
                  <span className={costDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                    {costDifference > 0 ? '+' : ''}{costDifferencePercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {costDifference > 0 
                    ? `La cantidad seleccionada genera un sobrecosto de ${formatCurrency(costDifference)} anuales`
                    : costDifference < 0 
                    ? `La cantidad seleccionada genera un ahorro de ${formatCurrency(Math.abs(costDifference))} anuales`
                    : 'La cantidad seleccionada es igual al EOQ óptimo'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Rationale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            ¿Por qué el Sistema Seleccionó Esta Cantidad?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Principios del EOQ:</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Balance de Costos:</strong> El EOQ encuentra el punto donde los costos de pedido y almacenamiento se equilibran</li>
                <li>• <strong>Minimización de Costos:</strong> En el punto EOQ, el costo total anual es el mínimo posible</li>
                <li>• <strong>Trade-off:</strong> Pedidos más grandes reducen costos de pedido pero aumentan costos de almacenamiento</li>
                <li>• <strong>Pedidos más pequeños:</strong> Reducen costos de almacenamiento pero aumentan la frecuencia y costo de pedidos</li>
              </ul>
            </div>

            {Math.abs(selectedQuantity - classicEOQ) > classicEOQ * 0.1 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Posibles razones para la desviación del EOQ:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Restricciones del proveedor:</strong> Cantidad mínima o máxima de pedido</li>
                  <li>• <strong>Descuentos por volumen:</strong> Precio unitario más bajo en cantidades mayores</li>
                  <li>• <strong>Consideraciones de inventario:</strong> Stock de seguridad o nivel de servicio requerido</li>
                  <li>• <strong>Restricciones de almacenamiento:</strong> Capacidad limitada del almacén</li>
                  <li>• <strong>Políticas empresariales:</strong> Estrategias específicas de compra</li>
                  <li>• <strong>Variabilidad de la demanda:</strong> Ajustes por incertidumbre en la demanda</li>
                </ul>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Impacto de la Desviación:</h4>
              <p className="text-sm">
                {Math.abs(costDifferencePercentage) < 5 
                  ? `La diferencia de costo es mínima (${Math.abs(costDifferencePercentage).toFixed(2)}%), lo que indica que la cantidad seleccionada está cerca del óptimo.`
                  : Math.abs(costDifferencePercentage) < 15
                  ? `La diferencia de costo es moderada (${Math.abs(costDifferencePercentage).toFixed(2)}%), pero puede estar justificada por factores operacionales.`
                  : `La diferencia de costo es significativa (${Math.abs(costDifferencePercentage).toFixed(2)}%). Se recomienda revisar los factores que llevaron a esta selección.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EOQ Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Análisis EOQ</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualización de las curvas de costo y el punto óptimo de pedido
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="quantity" 
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                    labelFormatter={(value) => `Cantidad: ${Number(value).toLocaleString()}`}
                  />} 
                />
                
                {/* Cost curves */}
                <Line 
                  type="monotone" 
                  dataKey="orderingCost" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Costo de Pedido"
                />
                <Line 
                  type="monotone" 
                  dataKey="holdingCost" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                  name="Costo de Almacenamiento"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCost" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={false}
                  name="Costo Total"
                />
                
                {/* Reference lines for EOQ and selected quantity */}
                <ReferenceLine 
                  x={classicEOQ} 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <ReferenceLine 
                  x={selectedQuantity} 
                  stroke="#8B5CF6" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500"></div>
                <span>EOQ Óptimo: {classicEOQ.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span>Cantidad Seleccionada: {selectedQuantity.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span>Costo de Pedido (decrece con cantidad)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Costo de Almacenamiento (crece con cantidad)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span>Costo Total (mínimo en EOQ)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
