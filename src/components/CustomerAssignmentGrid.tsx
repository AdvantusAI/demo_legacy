import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus } from 'lucide-react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useCustomers } from '@/hooks/useCustomers';
import { AssignmentModal } from './AssignmentModal';

export function CustomerAssignmentGrid() {
  const { customerAssignments, deleteCustomerAssignment, loading } = useUserAssignments();
  const { getUserName } = useUserProfiles();
  const { getCustomerName } = useCustomers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      await deleteCustomerAssignment(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Asignaciones de Clientes</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      <div className="grid gap-4">
        {customerAssignments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No hay asignaciones de clientes registradas
              </p>
            </CardContent>
          </Card>
        ) : (
          customerAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {getUserName(assignment.commercial_user_id)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {getCustomerName(assignment.customer_id)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">
                    Tipo: {assignment.assignment_type}
                  </Badge>
                  <Badge variant="outline">
                    Desde: {new Date(assignment.start_date).toLocaleDateString()}
                  </Badge>
                  {assignment.end_date && (
                    <Badge variant="outline">
                      Hasta: {new Date(assignment.end_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        assignment={editingAssignment}
        type="customer"
      />
    </div>
  );
}