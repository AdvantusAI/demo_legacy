import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SafetyStockCalculation } from '@/services/safetyStockService';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';

interface SafetyStockAnalysisPanelProps {
  analysis: SafetyStockCalculation;
}

export const SafetyStockAnalysisPanel: React.FC<SafetyStockAnalysisPanelProps> = ({ analysis }) => {
  const getMethodIcon = (method: SafetyStockCalculation['calculation_method']) => {
    switch (method) {
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'trend_based': return <TrendingUp className="h-4 w-4" />;
      case 'service_level': return <AlertTriangle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: SafetyStockCalculation['calculation_method']) => {
    switch (method) {
      case 'seasonal': return 'bg-blue-500';
      case 'trend_based': return 'bg-green-500';
      case 'service_level': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const changePercentage = analysis.current_safety_stock > 0 
    ? ((analysis.recommended_safety_stock - analysis.current_safety_stock) / analysis.current_safety_stock) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Enhanced Safety Stock Analysis
        </CardTitle>
        <CardDescription>
          Advanced calculation using {analysis.calculation_method} method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs Recommended */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Safety Stock</p>
            <p className="text-2xl font-bold">{analysis.current_safety_stock.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recommended Safety Stock</p>
            <p className="text-2xl font-bold text-blue-600">{analysis.recommended_safety_stock.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              {changePercentage > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(changePercentage).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Method and Confidence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Calculation Method</span>
            <Badge variant="secondary" className="gap-1">
              {getMethodIcon(analysis.calculation_method)}
              {analysis.calculation_method.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence Level</span>
              <span className="text-sm text-muted-foreground">{analysis.confidence_interval}%</span>
            </div>
            <Progress value={analysis.confidence_interval} className="h-2" />
          </div>
        </div>

        {/* Variability Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Demand Variability</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${analysis.demand_variability > 0.3 ? 'bg-red-500' : analysis.demand_variability > 0.15 ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">{(analysis.demand_variability * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Lead Time Variability</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${analysis.lead_time_variability > 0.2 ? 'bg-red-500' : analysis.lead_time_variability > 0.1 ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">{(analysis.lead_time_variability * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Seasonal Factors */}
        {analysis.seasonal_factors && analysis.seasonal_factors.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Seasonal Factors</p>
            <div className="grid grid-cols-6 gap-1">
              {analysis.seasonal_factors.slice(0, 12).map((factor, index) => (
                <div key={factor.month} className="text-center">
                  <div className={`h-8 w-full rounded-sm flex items-center justify-center text-xs font-medium text-white ${getMethodColor('seasonal')}`} 
                       style={{ opacity: 0.3 + (factor.factor * 0.7) }}>
                    {factor.factor.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(2024, index, 1).toLocaleDateString('en', { month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Impact */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Estimated Cost Impact</p>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${analysis.cost_impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(analysis.cost_impact).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              {analysis.cost_impact > 0 ? 'Additional Investment' : 'Cost Savings'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};