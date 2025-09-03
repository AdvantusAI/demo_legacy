import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplyNetworkFlow } from '@/components/supply-network/SupplyNetworkFlow';
import { Badge } from '@/components/ui/badge';
import { Network, Info } from 'lucide-react';

const SupplyNetworkVisualization: React.FC = () => {
  return (
     
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gemelo digital</h1>
          <p className="text-muted-foreground">Visualiza y gestiona tu red de la cadena de suministro en tiempo real</p>
        </div>
      </div>
    
   
      

      <Card className="border-border">
        <CardHeader className="pb-4">

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p><strong>Interacciones:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Arrastra los nodos para reposicionarlos</li>
                <li>Conecta nodos arrastrando desde el controlador de un nodo a otro</li>
                <li>Doble clic en las conexiones para eliminar relaciones</li>
                <li>Usa la barra de herramientas para añadir nuevos nodos</li>
              </ul>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SupplyNetworkFlow />
        </CardContent>
      </Card>
    </div>

  );
};

export default SupplyNetworkVisualization;