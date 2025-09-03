
import React, { useState, useEffect } from 'react';
import { Building2, Upload, Save, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { CompanyConfigForm } from '@/components/CompanyConfigForm';
import { FileUpload } from '@/components/FileUpload';

interface CompanyConfig {
  id: number;
  company_name: string | null;
  company_logo: string | null;
}

const CompanyConfig = () => {
  const [configs, setConfigs] = useState<CompanyConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CompanyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
      .schema('m8_schema')
        .from('company_config')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching company configs:', error);
        toast.error('Error al cargar las configuraciones');
        return;
      }

      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching company configs:', error);
      toast.error('Error al cargar las configuraciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      const { error } = await supabase
      .schema('m8_schema')
        .from('company_config')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting config:', error);
        toast.error('Error al eliminar la configuración');
        return;
      }

      toast.success('Configuración eliminada exitosamente');
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Error al eliminar la configuración');
    }
  };

  const handleEditConfig = (config: CompanyConfig) => {
    setEditingConfig(config);
    setIsDialogOpen(true);
  };

  const handleNewConfig = () => {
    setEditingConfig(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    fetchConfigs();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de la Compañía</h1>
          <p className="text-muted-foreground">
            Gestiona la información y configuración de la empresa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewConfig} className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nueva Configuración
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Editar Configuración' : 'Nueva Configuración de Compañía'}
              </DialogTitle>
            </DialogHeader>
            <CompanyConfigForm 
              config={editingConfig} 
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configuraciones de Compañía ({configs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando configuraciones...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay configuraciones</h3>
              <p className="text-muted-foreground mb-4">
                Crea la primera configuración de tu compañía
              </p>
              <Button onClick={handleNewConfig}>
                <Building2 className="h-4 w-4 mr-2" />
                Crear Primera Configuración
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre de la Compañía</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.id}</TableCell>
                    <TableCell>{config.company_name || '-'}</TableCell>
                    <TableCell>
                      {config.company_logo ? (
                        <img 
                          src={config.company_logo} 
                          alt="Logo" 
                          className="h-10 w-10 object-contain rounded"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyConfig;
