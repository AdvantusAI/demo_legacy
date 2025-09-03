import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { RelationshipDetails } from './RelationshipDetails';
import { useSupplyNetwork } from '@/hooks/useSupplyNetwork';
import { toast } from 'sonner';

interface RelationshipEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipId: string;
}

export const RelationshipEditorModal: React.FC<RelationshipEditorModalProps> = ({
  isOpen,
  onClose,
  relationshipId,
}) => {
  const { nodes, relationships, deleteRelationship } = useSupplyNetwork();

  const relationship = relationships?.find(rel => rel.id === relationshipId);
  const sourceNode = nodes?.find(node => node.id === relationship?.source_node_id);
  const targetNode = nodes?.find(node => node.id === relationship?.target_node_id);

  const handleDeleteRelationship = () => {
    if (relationship) {
      deleteRelationship.mutate(relationship.id, {
        onSuccess: () => {
          toast.success('Relación eliminada exitosamente');
          onClose();
        },
        onError: () => {
          toast.error('Error al eliminar la relación');
        }
      });
    }
  };

  if (!relationship) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Relación</DialogTitle>
        </DialogHeader>
        
        <RelationshipDetails 
          relationship={relationship}
          sourceNode={sourceNode}
          targetNode={targetNode}
        />
        
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDeleteRelationship}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Relación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};