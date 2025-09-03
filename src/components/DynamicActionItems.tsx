
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { useInterpretabilityData } from "@/hooks/useInterpretabilityData";

interface DynamicActionItemsProps {
  selectedProductId?: string;
  selectedLocationId?: string;
}

export function DynamicActionItems({ selectedProductId, selectedLocationId }: DynamicActionItemsProps) {
  const { data, loading } = useInterpretabilityData(selectedProductId, selectedLocationId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acciones Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Cargando acciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allActions = data.flatMap(item => item.recommended_actions || []).slice(0, 3);
  const allRisks = data.flatMap(item => item.risk_factors || []).slice(0, 2);

  if (!allActions.length && !allRisks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acciones Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">No hay acciones recomendadas disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (index: number) => {
    const icons = [AlertTriangle, Calendar, CheckCircle];
    const colors = ['text-red-500', 'text-yellow-500', 'text-green-500'];
    const backgrounds = ['bg-red-50', 'bg-yellow-50', 'bg-green-50'];
    
    const IconComponent = icons[index % icons.length];
    const colorClass = colors[index % colors.length];
    const bgClass = backgrounds[index % backgrounds.length];
    
    return { IconComponent, colorClass, bgClass };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Recomendadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allActions.map((action, index) => {
          const { IconComponent, colorClass, bgClass } = getActionIcon(index);
          
          return (
            <div key={index} className={`flex items-start gap-3 p-3 ${bgClass} rounded-lg`}>
              <IconComponent className={`h-5 w-5 ${colorClass} mt-0.5`} />
              <div>
                <p className="text-sm font-medium">
                  {action.length > 60 ? action.substring(0, 60) + '...' : action}
                </p>
                <p className="text-xs text-muted-foreground">
                  Basado en análisis de interpretabilidad del modelo
                </p>
              </div>
            </div>
          );
        })}
        
        {allRisks.map((risk, index) => (
          <div key={`risk-${index}`} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Mitigar Riesgo Identificado</p>
              <p className="text-xs text-muted-foreground">
                {risk.length > 80 ? risk.substring(0, 80) + '...' : risk}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
