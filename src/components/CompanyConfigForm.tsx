
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileUpload } from '@/components/FileUpload';

interface CompanyConfig {
  id: number;
  company_name: string | null;
  company_logo: string | null;
}

interface CompanyConfigFormProps {
  config: CompanyConfig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CompanyConfigForm: React.FC<CompanyConfigFormProps> = ({
  config,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    company_name: config?.company_name || '',
    company_logo: config?.company_logo || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast.error('El nombre de la compañía es requerido');
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        company_name: formData.company_name,
        company_logo: formData.company_logo || null,
      };


      if (config) {
        // Update existing config
        const { error } = await supabase
        .schema('m8_schema')
          .from('company_config')
          .update(updateData)
          .eq('id', config.id);

        if (error) {
          console.error('Error updating config:', error);
          toast.error('Error al actualizar la configuración');
          return;
        }

        toast.success('Configuración actualizada exitosamente');
      } else {
        // Create new config
        const { error } = await supabase
        .schema('m8_schema')
          .from('company_config')
          .insert(updateData as any);

        if (error) {
          console.error('Error creating config:', error);
          toast.error('Error al crear la configuración');
          return;
        }

        toast.success('Configuración creada exitosamente');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = (url: string) => {
    setFormData({ ...formData, company_logo: url });
  };

  const handleLogoRemove = () => {
    setFormData({ ...formData, company_logo: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="company_name">Nombre de la Compañía *</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          placeholder="Ej: Mi Empresa S.A."
          required
        />
      </div>

      <div>
        <Label>Logo de la Compañía</Label>
        <FileUpload
          onUpload={handleLogoUpload}
          accept="image/*"
          bucket="company-assets"
          folder="logos"
          currentUrl={formData.company_logo}
        />
        {formData.company_logo && (
          <div className="mt-2">
            <img
              src={formData.company_logo}
              alt="Logo preview"
              className="h-20 w-20 object-contain border rounded"
              onError={(e) => {
                console.error('Error loading image:', formData.company_logo);
                e.currentTarget.style.display = 'none';
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogoRemove}
              className="mt-2"
            >
              Remover Logo
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? 'Guardando...' 
            : config 
              ? 'Actualizar Configuración' 
              : 'Crear Configuración'
          }
        </Button>
      </div>
    </form>
  );
};
