import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerAssignmentGrid } from '@/components/CustomerAssignmentGrid';
import { ProductAssignmentGrid } from '@/components/ProductAssignmentGrid';
import { Users, Package } from 'lucide-react';

export default function UserAssignments() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Asignaciones de Usuario</h1>
        <p className="text-muted-foreground">
          Gestiona las asignaciones de clientes y productos para los usuarios del sistema.
        </p>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Asignaciones de Clientes
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Asignaciones de Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones de Clientes</CardTitle>
              <CardDescription>
                Asigna usuarios comerciales a clientes específicos. Los usuarios solo podrán 
                ver datos relacionados con sus clientes asignados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerAssignmentGrid />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones de Productos</CardTitle>
              <CardDescription>
                Restringe el acceso a productos específicos dentro del contexto de los 
                clientes asignados. Esto permite un control granular sobre qué productos 
                puede ver cada usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductAssignmentGrid />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}