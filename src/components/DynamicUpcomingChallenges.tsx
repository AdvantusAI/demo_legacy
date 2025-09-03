import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { useInterpretabilityData } from "@/hooks/useInterpretabilityData";

interface DynamicUpcomingChallengesProps {
  selectedProductId?: string;
  selectedLocationId?: string;
}

export function DynamicUpcomingChallenges({ selectedProductId, selectedLocationId }: DynamicUpcomingChallengesProps) {
  const { data, loading } = useInterpretabilityData(selectedProductId, selectedLocationId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alto': return 'text-red-600 bg-red-50';
      case 'Medio': return 'text-yellow-600 bg-yellow-50';
      case 'Bajo': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const generateChallengesFromRiskFactors = (riskFactors: string[], confidenceLevel: string) => {
    return riskFactors.slice(0, 3).map((risk, index) => {
      const priorities = ['Alto', 'Medio', 'Bajo'];
      const priority = confidenceLevel === 'Alta' ? priorities[2] : 
                     confidenceLevel === 'Media' ? priorities[1] : priorities[0];
      
      const deadlines = ['7 días', '15 días', '30 días'];
      const impacts = ['Costo ±15%', 'Precisión +8%', 'Inventario -12%'];
      
      return {
        title: risk, // Remove text truncation here
        priority,
        deadline: deadlines[index] || '15 días',
        impact: impacts[index] || 'Impacto +5%',
        status: index === 0 ? 'urgent' : index === 1 ? 'in-progress' : 'planning'
      };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Desafíos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Cargando desafíos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Desafíos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">No hay desafíos identificados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allChallenges = data.flatMap(item => 
    generateChallengesFromRiskFactors(
      item.risk_factors || [], 
      item.confidence_level || 'Media'
    )
  ).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Desafíos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allChallenges.map((challenge, index) => (
            <div key={index} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm leading-relaxed break-words">{challenge.title}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {challenge.deadline}
                    </span>
                    <span className="whitespace-nowrap">{challenge.impact}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={getPriorityColor(challenge.priority)}>
                  {challenge.priority}
                </Badge>
                <Badge variant={challenge.status === 'urgent' ? 'destructive' : 'outline'}>
                  {challenge.status === 'urgent' ? 'Urgente' : 
                   challenge.status === 'in-progress' ? 'En Progreso' : 'Planeando'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
