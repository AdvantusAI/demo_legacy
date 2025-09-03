
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCommercialCollaboration } from '@/hooks/useCommercialCollaboration';

interface CommercialProfileFormProps {
  profile: any;
  onClose: () => void;
}

export function CommercialProfileForm({ profile, onClose }: CommercialProfileFormProps) {
  const { updateProfile } = useCommercialCollaboration();
  const [formData, setFormData] = useState({
    territory: profile?.territory || '',
    region: profile?.region || '',
    specialization: profile?.specialization || '',
    phone: profile?.phone || '',
    manager_level: profile?.manager_level || 'junior',
    customer_segments: profile?.customer_segments?.join(', ') || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await updateProfile({
      ...formData,
      customer_segments: formData.customer_segments.split(',').map(s => s.trim()).filter(s => s)
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Perfil Comercial' : 'Crear Perfil Comercial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="territory">Territorio</Label>
              <Input
                id="territory"
                value={formData.territory}
                onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                placeholder="Ej: Norte, Sur, Centro"
                required
              />
            </div>
            <div>
              <Label htmlFor="region">Región</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ej: CDMX, Guadalajara"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialization">Especialización</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="Ej: Retail, B2B, Exportación"
            />
          </div>

          <div>
            <Label htmlFor="manager_level">Nivel de Gestión</Label>
            <Select 
              value={formData.manager_level} 
              onValueChange={(value) => setFormData({ ...formData, manager_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="director">Director</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+52 55 1234 5678"
            />
          </div>

          <div>
            <Label htmlFor="customer_segments">Segmentos de Cliente</Label>
            <Textarea
              id="customer_segments"
              value={formData.customer_segments}
              onChange={(e) => setFormData({ ...formData, customer_segments: e.target.value })}
              placeholder="Retail, Mayoreo, Institucional (separados por comas)"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
