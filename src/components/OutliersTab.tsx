import React from 'react';
import { useOutliersData } from '@/hooks/useOutliersData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info, AlertCircle } from 'lucide-react';

interface OutliersTabProps {
  selectedProductId?: string;
  selectedCustomerId?: string;
  selectedLocationId?: string;
}

export const OutliersTab: React.FC<OutliersTabProps> = ({
  selectedProductId,
  selectedCustomerId,
  selectedLocationId
}) => {
  const { data: outliers, isLoading, error } = useOutliersData(
    selectedProductId,
    selectedCustomerId,
    selectedLocationId
  );

  // Show message when required filters aren't selected
  if (!selectedProductId || !selectedCustomerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center py-8">
              <div className="space-y-2">
                <Info className="h-6 w-6 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Selecciona Filtros</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Para ver el análisis de outliers, selecciona un producto y un cliente. 
                  La ubicación es opcional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando análisis de outliers...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center py-8">
              <div className="space-y-2">
                <AlertCircle className="h-6 w-6 mx-auto text-destructive" />
                <h3 className="text-lg font-medium">Error al cargar datos</h3>
                <p className="text-sm text-muted-foreground">
                  No se pudieron cargar los datos de outliers. Intenta de nuevo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!outliers || outliers.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center py-8">
              <div className="space-y-2">
                <Info className="h-6 w-6 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Sin Outliers Detectados</h3>
                <p className="text-sm text-muted-foreground">
                  No se encontraron outliers para los filtros seleccionados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'alto':
        return 'destructive';
      case 'medium':
      case 'medio':
        return 'secondary';
      case 'low':
      case 'bajo':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Outliers de Demanda</CardTitle>
          <p className="text-sm text-muted-foreground">
            Se encontraron {outliers.length} outliers en los datos de demanda
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Valor Original</TableHead>
                  <TableHead>Valor Esperado</TableHead>
                  <TableHead>Valor Ajustado</TableHead>
                  <TableHead>Desviación</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Explicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outliers.map((outlier) => (
                  <TableRow key={outlier.id}>
                    <TableCell>{outlier.postdate}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(outlier.severity)}>
                        {outlier.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {outlier.original_value.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {outlier.expected_value.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {outlier.capped_value.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {outlier.percentage_deviation.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {outlier.detection_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={outlier.explanation}>
                        {outlier.explanation}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutliersTab;