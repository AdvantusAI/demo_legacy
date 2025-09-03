import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditNodeForm } from './EditNodeForm';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, onClose, nodeId }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Nodo</DialogTitle>
        </DialogHeader>
        <EditNodeForm nodeId={nodeId} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
};