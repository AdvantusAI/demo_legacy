import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, Plane, Ship, Train, Zap, Clock, DollarSign, TrendingUp, Package } from 'lucide-react';

interface RelationshipDetailsProps {
  relationship: any;
  sourceNode?: any;
  targetNode?: any;
}

export const RelationshipDetails: React.FC<RelationshipDetailsProps> = ({
  relationship,
  sourceNode,
  targetNode,
}) => {
  const getTransportIcon = (method: string) => {
    switch (method) {
      case 'truck': return Truck;
      case 'rail': return Train;
      case 'air': return Plane;
      case 'sea': return Ship;
      case 'pipeline': return Zap;
      default: return Truck;
    }
  };

  const getTransportLabel = (method: string) => {
    switch (method) {
      case 'truck': return 'Camión';
      case 'rail': return 'Ferrocarril';
      case 'air': return 'Aéreo';
      case 'sea': return 'Marítimo';
      case 'pipeline': return 'Tubería';
      default: return method;
    }
  };

  const getCostUnitLabel = (unit: string) => {
    switch (unit) {
      case 'per_unit': return 'por unidad';
      case 'per_kg': return 'por kilogramo';
      case 'per_shipment': return 'por envío';
      case 'per_km': return 'por kilómetro';
      default: return unit;
    }
  };

  const PrimaryIcon = getTransportIcon(relationship.primary_transport_method);
  const AlternateIcon = relationship.alternate_transport_method 
    ? getTransportIcon(relationship.alternate_transport_method)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {relationship.relationship_code}
              {relationship.is_bidirectional && (
                <Badge variant="secondary">Bidireccional</Badge>
              )}
            </CardTitle>
            <Badge variant={relationship.status === 'active' ? 'default' : 'secondary'}>
              {relationship.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          {relationship.description && (
            <p className="text-sm text-muted-foreground">{relationship.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Nodes Information */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nodo Origen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{sourceNode?.node_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{sourceNode?.node_code || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nodo Destino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{targetNode?.node_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{targetNode?.node_code || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transportation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Detalles de Transporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Transportation */}
          <div>
            <h4 className="font-medium mb-3">Transporte Primario</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <PrimaryIcon className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">
                    {getTransportLabel(relationship.primary_transport_method)}
                  </p>
                  <p className="text-xs text-muted-foreground">Método</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">{relationship.lead_time_days} días</p>
                  <p className="text-xs text-muted-foreground">Tiempo de entrega</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">
                    ${relationship.primary_transport_cost?.toFixed(2) || '0.00'} {getCostUnitLabel(relationship.cost_unit)}
                  </p>
                  <p className="text-xs text-muted-foreground">Costo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alternate Transportation */}
          {relationship.alternate_transport_method && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Transporte Alterno</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {AlternateIcon && <AlternateIcon className="w-4 h-4" />}
                    <div>
                      <p className="text-sm font-medium">
                        {getTransportLabel(relationship.alternate_transport_method)}
                      </p>
                      <p className="text-xs text-muted-foreground">Método alterno</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">
                        {relationship.alternate_lead_time_days || 'N/A'} días
                      </p>
                      <p className="text-xs text-muted-foreground">Tiempo de entrega</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">
                        ${relationship.alternate_transport_cost?.toFixed(2) || '0.00'} {getCostUnitLabel(relationship.cost_unit)}
                      </p>
                      <p className="text-xs text-muted-foreground">Costo alterno</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Prioridad y Capacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Rango de Prioridad</p>
              <p className="text-lg font-bold">#{relationship.priority_rank}</p>
            </div>
            {relationship.capacity_constraint && (
              <div>
                <p className="text-sm font-medium">Restricción de Capacidad</p>
                <p className="text-lg font-bold">{relationship.capacity_constraint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Información Adicional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Fecha Efectiva</p>
              <p className="text-sm">{relationship.effective_from || 'N/A'}</p>
            </div>
            {relationship.effective_to && (
              <div>
                <p className="text-sm font-medium">Fecha de Finalización</p>
                <p className="text-sm">{relationship.effective_to}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alternate Sources */}
      {relationship.alternate_sources && relationship.alternate_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fuentes Alternas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relationship.alternate_sources.map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Prioridad #{source.priority}</Badge>
                    <span className="font-medium">{source.node_id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{source.capacity_percentage}% capacidad</span>
                    <span>{source.lead_time_days} días</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};