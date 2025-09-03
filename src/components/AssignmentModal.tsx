import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: any;
  type: 'customer' | 'product';
}

export function AssignmentModal({ isOpen, onClose, assignment, type }: AssignmentModalProps) {
  const { createCustomerAssignment, createProductAssignment, updateCustomerAssignment, updateProductAssignment, refetch } = useUserAssignments();
  const { users } = useUserProfiles();
  const { customers } = useCustomers();
  const { products } = useProducts();

  const [formData, setFormData] = useState({
    user_id: '',
    customer_id: '',
    product_id: '',
    assignment_type: 'standard',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        user_id: type === 'customer' ? assignment.commercial_user_id : assignment.user_id,
        customer_id: assignment.customer_id || '',
        product_id: assignment.product_id || '',
        assignment_type: assignment.assignment_type || 'standard',
        start_date: assignment.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: assignment.end_date?.split('T')[0] || ''
      });
    } else {
      setFormData({
        user_id: '',
        customer_id: '',
        product_id: '',
        assignment_type: 'standard',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
    }
  }, [assignment, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'customer') {
        const customerData = {
          commercial_user_id: formData.user_id,
          customer_id: formData.customer_id,
          assignment_type: formData.assignment_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null
        };

        if (assignment) {
          await updateCustomerAssignment(assignment.id, customerData);
        } else {
          await createCustomerAssignment(customerData);
        }
      } else {
        const productData = {
          user_id: formData.user_id,
          customer_id: formData.customer_id,
          product_id: formData.product_id,
          assignment_type: formData.assignment_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null
        };

        if (assignment) {
          await updateProductAssignment(assignment.id, productData);
        } else {
          await createProductAssignment(productData);
        }
      }

      await refetch();
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Editar' : 'Nueva'} Asignación de {type === 'customer' ? 'Cliente' : 'Producto'}
          </DialogTitle>
           <DialogDescription>
            Completa los campos para {assignment ? 'editar' : 'crear'} la asignación de {type === 'customer' ? 'cliente' : 'producto'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">Usuario</Label>
            <Select value={formData.user_id} onValueChange={(value) => handleChange('user_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customer_id">Cliente</Label>
            <Select value={formData.customer_id} onValueChange={(value) => handleChange('customer_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.customer_id} value={customer.customer_id || ''}>
                    {customer.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'product' && (
            <div>
              <Label htmlFor="product_id">Producto</Label>
              <Select value={formData.product_id} onValueChange={(value) => handleChange('product_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="assignment_type">Tipo de Asignación</Label>
            <Select value={formData.assignment_type} onValueChange={(value) => handleChange('assignment_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primaria</SelectItem>
                <SelectItem value="secondary">Secundaria</SelectItem>
                <SelectItem value="backup">Respaldo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">Fecha de Fin (Opcional)</Label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : assignment ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}