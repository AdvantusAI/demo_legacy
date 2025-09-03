import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplyNetwork } from '@/hooks/useSupplyNetwork';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const nodeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  nodeType: z.string().min(1, 'El tipo de nodo es requerido'),
  description: z.string().optional(),
  status: z.string().default('active'),
  address: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  capacity: z.string().optional(),
});

type NodeFormData = z.infer<typeof nodeSchema>;

interface AddNodeFormProps {
  onSuccess: () => void;
}

export const AddNodeForm: React.FC<AddNodeFormProps> = ({ onSuccess }) => {
  const { createNode } = useSupplyNetwork();
  const [nodeTypes, setNodeTypes] = useState<Array<{id: string, type_code: string, type_name: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<NodeFormData>({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      name: '',
      nodeType: '',
      description: '',
      status: 'active',
      address: '',
      contactEmail: '',
      capacity: '',
    },
  });

  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const { data, error } = await supabase.rpc('get_supply_network_node_types');
        if (error) throw error;
        setNodeTypes(data || []);
      } catch (error) {
        console.error('Error fetching node types:', error);
        toast.error('Error al cargar tipos de nodo');
      } finally {
        setLoading(false);
      }
    };

    fetchNodeTypes();
  }, []);

  const onSubmit = async (data: NodeFormData) => {
    try {
      const properties: Record<string, any> = {};
      
      if (data.description) properties.description = data.description;
      if (data.address) properties.address = data.address;
      if (data.contactEmail) properties.contact_email = data.contactEmail;
      if (data.capacity) properties.capacity = data.capacity;

      // Find the selected node type to get the type_code
      const selectedNodeType = nodeTypes.find(type => type.id === data.nodeType);
      const typeCode = selectedNodeType?.type_code || 'NODE';

      await createNode.mutateAsync({
        node_code: `${typeCode}_${Date.now()}`,
        node_name: data.name,
        node_type_id: data.nodeType,
        status: data.status,
        description: data.description || '',
        address: data.address || '',
        contact_information: properties,
      });

      toast.success('Nodo creado exitosamente');
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error creating node:', error);
      toast.error('Error al crear el nodo');
    }
  };


  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'planning', label: 'En Planificación' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el nombre del nodo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nodeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Nodo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de nodo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Cargando tipos de nodo...
                    </SelectItem>
                  ) : (
                    nodeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.type_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Ingresa una descripción (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa la dirección (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de Contacto</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ingresa el email de contacto (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa la capacidad (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createNode.isPending}>
            {createNode.isPending ? 'Creando...' : 'Crear Nodo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};