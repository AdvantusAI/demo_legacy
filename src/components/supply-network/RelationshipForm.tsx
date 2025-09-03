import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, X, Truck, Plane, Ship, Train, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSupplyNetwork } from '@/hooks/useSupplyNetwork';
import { supabase } from '@/integrations/supabase/client';

const transportationMethods = [
  { value: 'truck', label: 'Camión', icon: Truck },
  { value: 'rail', label: 'Ferrocarril', icon: Train },
  { value: 'air', label: 'Aéreo', icon: Plane },
  { value: 'sea', label: 'Marítimo', icon: Ship },
  { value: 'pipeline', label: 'Tubería', icon: Zap },
];

const costUnits = [
  { value: 'per_unit', label: 'Por unidad' },
  { value: 'per_kg', label: 'Por kilogramo' },
  { value: 'per_shipment', label: 'Por envío' },
  { value: 'per_km', label: 'Por kilómetro' },
];

const alternateSourceSchema = z.object({
  node_id: z.string().min(1, 'El nodo es requerido'),
  priority: z.number().min(1, 'La prioridad debe ser mayor a 0'),
  capacity_percentage: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
  lead_time_days: z.number().min(0, 'Los días de entrega deben ser mayor o igual a 0'),
});

const relationshipSchema = z.object({
  relationship_code: z.string().min(1, 'El código es requerido'),
  description: z.string().optional(),
  source_node_id: z.string().min(1, 'El nodo origen es requerido'),
  target_node_id: z.string().min(1, 'El nodo destino es requerido'),
  relationship_type_id: z.string().min(1, 'El tipo de relación es requerido'),
  lead_time_days: z.number().min(1, 'Los días de entrega deben ser mayor a 0'),
  primary_transport_method: z.string().min(1, 'El método de transporte primario es requerido'),
  primary_transport_cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  cost_unit: z.string().min(1, 'La unidad de costo es requerida'),
  alternate_transport_method: z.string().optional(),
  alternate_lead_time_days: z.union([z.number().min(0), z.nan(), z.undefined()]).optional(),
  alternate_transport_cost: z.union([z.number().min(0), z.nan(), z.undefined()]).optional(),
  capacity_constraint: z.union([z.number().min(0), z.nan(), z.undefined()]).optional(),
  is_bidirectional: z.boolean().default(false),
  priority_rank: z.number().min(1, 'El rango de prioridad debe ser mayor a 0'),
});

type RelationshipFormData = z.infer<typeof relationshipSchema>;
type AlternateSource = z.infer<typeof alternateSourceSchema>;

interface RelationshipFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RelationshipForm: React.FC<RelationshipFormProps> = ({ onSuccess, onCancel }) => {
  const { nodes, createRelationship } = useSupplyNetwork();
  const [alternateSources, setAlternateSources] = useState<AlternateSource[]>([]);
  const [isAddingAlternate, setIsAddingAlternate] = useState(false);
  const [relationshipTypes, setRelationshipTypes] = useState<Array<{id: string, type_code: string, type_name: string}>>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      is_bidirectional: false,
      priority_rank: 1,
      lead_time_days: 1,
      primary_transport_cost: 0,
    },
  });

  useEffect(() => {
    const fetchRelationshipTypes = async () => {
      try {
        const { data, error } = await supabase.rpc('get_supply_network_relationship_types');
        if (error) throw error;
        setRelationshipTypes(data || []);
      } catch (error) {
        console.error('Error fetching relationship types:', error);
        toast.error('Error al cargar tipos de relación');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationshipTypes();
  }, []);

  const watchedSourceNode = watch('source_node_id');
  const watchedTargetNode = watch('target_node_id');

  const availableTargetNodes = nodes.filter(node => 
    node.id !== watchedSourceNode && 
    !alternateSources.some(alt => alt.node_id === node.id)
  );

  const availableAlternateNodes = nodes.filter(node => 
    node.id !== watchedSourceNode && 
    node.id !== watchedTargetNode &&
    !alternateSources.some(alt => alt.node_id === node.id)
  );

  const handleAddAlternateSource = () => {
    if (availableAlternateNodes.length === 0) {
      toast.error('No hay nodos disponibles para fuentes alternas');
      return;
    }
    setIsAddingAlternate(true);
  };

  const handleSaveAlternateSource = (data: AlternateSource) => {
    setAlternateSources(prev => [...prev, data]);
    setIsAddingAlternate(false);
    toast.success('Fuente alterna agregada');
  };

  const handleRemoveAlternateSource = (index: number) => {
    setAlternateSources(prev => prev.filter((_, i) => i !== index));
    toast.success('Fuente alterna eliminada');
  };

  const onSubmit = async (data: RelationshipFormData) => {
    try {
      const relationshipData = {
        relationship_code: data.relationship_code,
        description: data.description,
        source_node_id: data.source_node_id,
        target_node_id: data.target_node_id,
        relationship_type_id: data.relationship_type_id,
        lead_time_days: data.lead_time_days,
        primary_transport_method: data.primary_transport_method,
        primary_transport_cost: data.primary_transport_cost,
        cost_unit: data.cost_unit,
        alternate_transport_method: data.alternate_transport_method,
        alternate_lead_time_days: data.alternate_lead_time_days,
        alternate_transport_cost: data.alternate_transport_cost,
        capacity_constraint: data.capacity_constraint,
        is_bidirectional: data.is_bidirectional,
        priority_rank: data.priority_rank,
        alternate_sources: alternateSources,
        status: 'active' as const,
        effective_from: new Date().toISOString().split('T')[0],
      };

      await createRelationship.mutateAsync(relationshipData);
      toast.success('Relación creada exitosamente');
      reset();
      setAlternateSources([]);
      onSuccess?.();
    } catch (error) {
      toast.error('Error al crear la relación');
      console.error('Error creating relationship:', error);
    }
  };

  const getTransportIcon = (method: string) => {
    const transport = transportationMethods.find(t => t.value === method);
    return transport?.icon || Truck;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Relación de Red de Suministro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="relationship_code">Código de Relación</Label>
                <Input
                  id="relationship_code"
                  {...register('relationship_code')}
                  placeholder="REL-001"
                />
                {errors.relationship_code && (
                  <p className="text-sm text-destructive mt-1">{errors.relationship_code.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="relationship_type_id">Tipo de Relación</Label>
                <Select onValueChange={(value) => setValue('relationship_type_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Cargando tipos de relación...
                      </SelectItem>
                    ) : (
                      relationshipTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.type_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.relationship_type_id && (
                  <p className="text-sm text-destructive mt-1">{errors.relationship_type_id.message}</p>
                )}
              </div>
            </div>

            {/* Node Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source_node_id">Nodo Origen</Label>
                <Select onValueChange={(value) => setValue('source_node_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nodo origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.node_name} ({node.node_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.source_node_id && (
                  <p className="text-sm text-destructive mt-1">{errors.source_node_id.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="target_node_id">Nodo Destino</Label>
                <Select onValueChange={(value) => setValue('target_node_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nodo destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargetNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.node_name} ({node.node_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.target_node_id && (
                  <p className="text-sm text-destructive mt-1">{errors.target_node_id.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Transportation Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalles de Transporte</h3>
              
              {/* Primary Transportation */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_transport_method">Método Primario</Label>
                  <Select onValueChange={(value) => setValue('primary_transport_method', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportationMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {method.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.primary_transport_method && (
                    <p className="text-sm text-destructive mt-1">{errors.primary_transport_method.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="1"
                    {...register('lead_time_days', { valueAsNumber: true })}
                  />
                  {errors.lead_time_days && (
                    <p className="text-sm text-destructive mt-1">{errors.lead_time_days.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="priority_rank">Rango de Prioridad</Label>
                  <Input
                    id="priority_rank"
                    type="number"
                    min="1"
                    {...register('priority_rank', { valueAsNumber: true })}
                  />
                  {errors.priority_rank && (
                    <p className="text-sm text-destructive mt-1">{errors.priority_rank.message}</p>
                  )}
                </div>
              </div>

              {/* Transportation Costs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_transport_cost">Costo de Transporte Primario</Label>
                  <Input
                    id="primary_transport_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('primary_transport_cost', { valueAsNumber: true })}
                  />
                  {errors.primary_transport_cost && (
                    <p className="text-sm text-destructive mt-1">{errors.primary_transport_cost.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cost_unit">Unidad de Costo</Label>
                  <Select onValueChange={(value) => setValue('cost_unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {costUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cost_unit && (
                    <p className="text-sm text-destructive mt-1">{errors.cost_unit.message}</p>
                  )}
                </div>
              </div>

              {/* Alternate Transportation */}
              <div className="space-y-4">
                <h4 className="font-medium">Transporte Alterno (Opcional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="alternate_transport_method">Método Alterno</Label>
                    <Select onValueChange={(value) => setValue('alternate_transport_method', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método alterno" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportationMethods.map((method) => {
                          const Icon = method.icon;
                          return (
                            <SelectItem key={method.value} value={method.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {method.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="alternate_lead_time_days">Tiempo de Entrega Alterno (días)</Label>
                    <Input
                      id="alternate_lead_time_days"
                      type="number"
                      min="0"
                      {...register('alternate_lead_time_days', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternate_transport_cost">Costo de Transporte Alterno</Label>
                    <Input
                      id="alternate_transport_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('alternate_transport_cost', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity_constraint">Restricción de Capacidad</Label>
                  <Input
                    id="capacity_constraint"
                    type="number"
                    min="0"
                    placeholder="Unidades por período"
                    {...register('capacity_constraint', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_bidirectional"
                    onCheckedChange={(checked) => setValue('is_bidirectional', checked)}
                  />
                  <Label htmlFor="is_bidirectional">Relación Bidireccional</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Alternate Sources */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Fuentes Alternas</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAlternateSource}
                  disabled={availableAlternateNodes.length === 0}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Agregar Fuente Alterna
                </Button>
              </div>

              {alternateSources.length > 0 && (
                <div className="space-y-2">
                  {alternateSources.map((source, index) => {
                    const node = nodes.find(n => n.id === source.node_id);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">#{source.priority}</Badge>
                          <span className="font-medium">{node?.node_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {source.capacity_percentage}% capacidad, {source.lead_time_days} días
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAlternateSource(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAddingAlternate && (
                <AlternateSourceForm
                  availableNodes={availableAlternateNodes}
                  onSave={handleSaveAlternateSource}
                  onCancel={() => setIsAddingAlternate(false)}
                />
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción de la relación..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={createRelationship.isPending}>
                {createRelationship.isPending ? 'Creando...' : 'Crear Relación'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Alternate Source Form Component
interface AlternateSourceFormProps {
  availableNodes: any[];
  onSave: (data: AlternateSource) => void;
  onCancel: () => void;
}

const AlternateSourceForm: React.FC<AlternateSourceFormProps> = ({ availableNodes, onSave, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AlternateSource>({
    resolver: zodResolver(alternateSourceSchema),
    defaultValues: {
      priority: 1,
      capacity_percentage: 100,
      lead_time_days: 1,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Agregar Fuente Alterna</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="node_id">Nodo</Label>
              <Select onValueChange={(value) => setValue('node_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nodo" />
                </SelectTrigger>
                <SelectContent>
                  {availableNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.node_name} ({node.node_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.node_id && (
                <p className="text-sm text-destructive mt-1">{errors.node_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                {...register('priority', { valueAsNumber: true })}
              />
              {errors.priority && (
                <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity_percentage">Porcentaje de Capacidad</Label>
              <Input
                id="capacity_percentage"
                type="number"
                min="0"
                max="100"
                {...register('capacity_percentage', { valueAsNumber: true })}
              />
              {errors.capacity_percentage && (
                <p className="text-sm text-destructive mt-1">{errors.capacity_percentage.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lead_time_days">Días de Entrega</Label>
              <Input
                id="lead_time_days"
                type="number"
                min="0"
                {...register('lead_time_days', { valueAsNumber: true })}
              />
              {errors.lead_time_days && (
                <p className="text-sm text-destructive mt-1">{errors.lead_time_days.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Guardar</Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};