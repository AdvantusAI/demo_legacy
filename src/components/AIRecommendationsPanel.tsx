
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

interface AIRecommendationsPanelProps {
  selectedProductId?: string;
  selectedLocationId?: string;
  //selectedCustomerId?: string;
  selectedVendorId?: string;
}

export function AIRecommendationsPanel({
  selectedProductId,
  selectedLocationId,
  selectedVendorId
}: AIRecommendationsPanelProps) {
  const { recommendations, loading, refreshAnalysis, applyRecommendation } = useAIRecommendations(
    selectedProductId,
    selectedLocationId,
    selectedVendorId
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'forecast_improvement': return <TrendingUp className="h-4 w-4" />;
      case 'inventory_adjustment': return <AlertTriangle className="h-4 w-4" />;
      case 'data_quality': return <Brain className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (!selectedProductId || !selectedVendorId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">IA Asistente de Pronósticos</h3>
          <p className="text-muted-foreground">
            Selecciona un producto y ubicación para obtener recomendaciones inteligentes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <CardTitle>IA Asistente - Recomendaciones</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAnalysis}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Actualizar Análisis'
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Análisis inteligente para {selectedProductId} en {selectedLocationId}
          {selectedVendorId && ` (Proveedor: ${selectedVendorId})`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analizando datos...</span>
          </div>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <Alert key={rec.id} className="border-l-4 border-l-blue-500">
              <div className="flex items-start gap-3">
                {getTypeIcon(rec.recommendation_type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(rec.confidence_score * 100)}% confianza
                      </Badge>
                    </div>
                  </div>
                  
                  <AlertDescription className="text-sm">
                    {rec.description}
                  </AlertDescription>
                  
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <strong>Razonamiento:</strong> {rec.reasoning}
                  </div>
                  
                  {rec.expected_impact && (
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                      <strong>Impacto esperado:</strong> {rec.expected_impact}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => applyRecommendation(rec.id)}
                      disabled={rec.status === 'applied'}
                    >
                      {rec.status === 'applied' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicada
                        </>
                      ) : (
                        'Aplicar Recomendación'
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            </Alert>
          ))
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Excelente! No se encontraron problemas críticos en los datos actuales.
              El sistema continuará monitoreando para nuevas oportunidades de mejora.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
