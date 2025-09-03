import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  recommendation_type: string;
  priority: string;
  confidence_score: number;
  suggested_action: any;
  expected_impact: string;
  status: string;
  product_id: string;
  location_id: string;
  customer_id?: string;
  vendor_id?: string;
}

interface ForecastAnalysis {
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  outliers: number;
  recommendations: string[];
}

export function useAIRecommendations(productId?: string, locationId?: string, customerId?: string, vendor_id?: string) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const analyzeData = async (forecastData: any[]) => {
    if (!forecastData.length) return null;

    // Calculate forecast accuracy
    const actualVsForecast = forecastData
      .filter(d => d.actual && d.forecast)
      .map(d => Math.abs(d.actual - d.forecast) / d.actual);
    
    const accuracy = actualVsForecast.length > 0 
      ? (1 - actualVsForecast.reduce((a, b) => a + b, 0) / actualVsForecast.length) * 100 
      : 0;

    // Detect trend with proper typing
    const recentData = forecastData.slice(-6);
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (recentData.length > 1) {
      const lastValue = recentData[recentData.length - 1].forecast || 0;
      const firstValue = recentData[0].forecast || 0;
      
      if (lastValue > firstValue) {
        trend = 'increasing';
      } else if (lastValue < firstValue) {
        trend = 'decreasing';
      }
    }

    // Calculate volatility
    const forecastValues = forecastData.map(d => d.forecast || 0).filter(v => v > 0);
    const mean = forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length;
    const variance = forecastValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / forecastValues.length;
    const volatility = Math.sqrt(variance) / mean;

    // Count outliers (values > 2 standard deviations from mean)
    const stdDev = Math.sqrt(variance);
    const outliers = forecastValues.filter(v => Math.abs(v - mean) > 2 * stdDev).length;

    return { accuracy, trend, volatility, outliers };
  };

  const generateRecommendations = async (analysis: ForecastAnalysis, productId: string, locationId: string, customerId?: string, vendor_id?: string) => {
    const recommendations: Omit<AIRecommendation, 'id'>[] = [];

    // Accuracy-based recommendations
    if (analysis.accuracy < 70) {
      recommendations.push({
        title: 'Mejorar Precisión del Pronóstico',
        description: `La precisión actual del pronóstico es del ${analysis.accuracy.toFixed(1)}%, lo cual está por debajo del objetivo del 80%.`,
        reasoning: 'Baja precisión puede indicar problemas con el modelo de pronóstico o datos históricos insuficientes.',
        recommendation_type: 'forecast_improvement',
        priority: 'high',
        confidence_score: 0.85,
        suggested_action: {
          type: 'adjust_model',
          parameters: { 'increase_smoothing': true, 'review_seasonality': true }
        },
        expected_impact: 'Incremento esperado del 15-25% en precisión del pronóstico',
        status: 'pending',
        product_id: productId,
        location_id: locationId,
        vendor_id: vendor_id
      });
    }

    // Volatility-based recommendations
    if (analysis.volatility > 0.3) {
      recommendations.push({
        title: 'Alta Volatilidad Detectada',
        description: `El producto muestra alta volatilidad (${(analysis.volatility * 100).toFixed(1)}%). Se recomienda ajustar buffer de seguridad.`,
        reasoning: 'Alta volatilidad requiere mayor stock de seguridad para evitar quiebres.',
        recommendation_type: 'inventory_adjustment',
        priority: 'medium',
        confidence_score: 0.75,
        suggested_action: {
          type: 'increase_safety_stock',
          parameters: { 'multiplier': 1.5, 'review_frequency': 'weekly' }
        },
        expected_impact: 'Reducción del 20% en riesgo de desabasto',
        status: 'pending',
        product_id: productId,
        location_id: locationId,
        vendor_id: vendor_id
      });
    }

    // Trend-based recommendations
    if (analysis.trend === 'increasing') {
      recommendations.push({
        title: 'Tendencia Creciente Identificada',
        description: 'Se detecta una tendencia creciente en la demanda. Considerar incrementar pronósticos futuros.',
        reasoning: 'Tendencia positiva sostenida puede indicar crecimiento del mercado o temporada alta.',
        recommendation_type: 'forecast_adjustment',
        priority: 'medium',
        confidence_score: 0.70,
        suggested_action: {
          type: 'increase_forecast',
          parameters: { 'percentage': 10, 'duration_months': 3 }
        },
        expected_impact: 'Mejor disponibilidad durante crecimiento de demanda',
        status: 'pending',
        product_id: productId,
        location_id: locationId,
        vendor_id: vendor_id
      });
    }

    // Outlier-based recommendations
    if (analysis.outliers > 2) {
      recommendations.push({
        title: 'Múltiples Outliers Detectados',
        description: `Se encontraron ${analysis.outliers} valores atípicos que pueden estar afectando la precisión del modelo.`,
        reasoning: 'Valores atípicos pueden distorsionar el modelo de pronóstico y reducir su efectividad.',
        recommendation_type: 'data_quality',
        priority: 'high',
        confidence_score: 0.80,
        suggested_action: {
          type: 'review_outliers',
          parameters: { 'outlier_count': analysis.outliers, 'threshold': 2 }
        },
        expected_impact: 'Mejora en estabilidad del modelo y precisión del pronóstico',
        status: 'pending',
        product_id: productId,
        location_id: locationId,
        vendor_id: vendor_id
      });
    }

    return recommendations;
  };

  const fetchAndAnalyze = async () => {
    if (!productId || !locationId || !user) return;

    setLoading(true);
    try {
      // Fetch forecast data for analysis
      let query = supabase
        .from('forecast_data')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .order('postdate', { ascending: true });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data: forecastData, error: forecastError } = await query;

      if (forecastError) {
        console.error('Error fetching forecast data:', forecastError);
        return;
      }

      if (!forecastData?.length) {
        setRecommendations([]);
        return;
      }

      // Analyze the data
      const analysis = await analyzeData(forecastData);
      if (!analysis) return;

      // Generate recommendations
      const newRecommendations = await generateRecommendations({
        accuracy: analysis.accuracy,
        trend: analysis.trend,
        volatility: analysis.volatility,
        outliers: analysis.outliers,
        recommendations: []
      }, productId, locationId, customerId);

      // Save recommendations to database
      for (const rec of newRecommendations) {
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .insert(rec);

        if (insertError) {
          console.error('Error saving recommendation:', insertError);
        }
      }

      // Fetch existing recommendations
      const { data: existingRecs, error: recsError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!recsError && existingRecs) {
        setRecommendations(existingRecs);
      }

    } catch (error) {
      console.error('Error in AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          applied_by: user?.id
        })
        .eq('id', recommendationId);

      if (!error) {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, status: 'applied' }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Error applying recommendation:', error);
    }
  };

  useEffect(() => {
    if (productId && locationId) {
      fetchAndAnalyze();
    }
  }, [productId, locationId, customerId]);

  return {
    recommendations,
    loading,
    refreshAnalysis: fetchAndAnalyze,
    applyRecommendation
  };
}
