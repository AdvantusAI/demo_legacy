
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VendorFilter } from '@/components/VendorFilter';

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vendorId: string) => void;
  selectedProductId?: string;
}

export function VendorSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedProductId
}: VendorSelectionModalProps) {
  const handleVendorSelect = (vendorId: string) => {
    onSelect(vendorId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Seleccionar Proveedor</DialogTitle>
          <DialogDescription>
            Selecciona un proveedor para el producto elegido desde la lista filtrada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
        <div className="overflow-y-auto">
          <VendorFilter 
            onVendorSelect={handleVendorSelect} 
            selectedProductId={selectedProductId}
          />
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
