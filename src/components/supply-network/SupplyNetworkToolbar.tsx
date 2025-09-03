import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw, Download, Upload, Settings, Network } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddNodeForm } from './AddNodeForm';
import { RelationshipForm } from './RelationshipForm';
import { toast } from 'sonner';

export const SupplyNetworkToolbar: React.FC = () => {
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);



  return (
    <Card className="absolute top-4 left-4 z-10 p-2">
      <div className="flex items-center gap-2">
        <Dialog open={isAddNodeOpen} onOpenChange={setIsAddNodeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 mr-1" />
              Añadir Nodo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Nodo de Red</DialogTitle>
            </DialogHeader>
            <AddNodeForm onSuccess={() => setIsAddNodeOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={isAddRelationshipOpen} onOpenChange={setIsAddRelationshipOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Network className="h-4 w-4 mr-1" />
              Añadir Relación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Relación</DialogTitle>
            </DialogHeader>
            <RelationshipForm
              onSuccess={() => setIsAddRelationshipOpen(false)}
              onCancel={() => setIsAddRelationshipOpen(false)}
            />
          </DialogContent>
        </Dialog>

       
       
      </div>
    </Card>
  );
};