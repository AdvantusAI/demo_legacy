
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCommercialCollaboration } from '@/hooks/useCommercialCollaboration';

interface MarketIntelligenceFormProps {
  assignments: any[];
  onClose: () => void;
}

export function MarketIntelligenceForm({ assignments, onClose }: MarketIntelligenceFormProps) {
  const { addMarketIntelligence } = useCommercialCollaboration();
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    location_id: '',
    intelligence_type: 'competitive',
    impact_assessment: 'neutral',
    confidence_level: 'medium',
    time_horizon: 'short_term',
    description: '',
    quantitative_impact: '',
    effective_from: '',
    effective_to: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await addMarketIntelligence({
      ...formData,
      quantitative_impact: formData.quantitative_impact ? parseFloat(formData.quantitative_impact) : null,
      effective_from: formData.effective_from || null,
      effective_to: formData.effective_to || null
    } as any);

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Inteligencia de Mercado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">Cliente</Label>
            <Select 
              value={formData.customer_id}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.customer_id} value={assignment.customer_id}>
                    {assignment.customer_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_id">Producto ID</Label>
              <Input
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                placeholder="ID del producto"
              />
            </div>
            <div>
              <Label htmlFor="location_id">Ubicación ID</Label>
              <Input
                id="location_id"
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                placeholder="ID de ubicación"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="intelligence_type">Tipo</Label>
              <Select 
                value={formData.intelligence_type} 
                onValueChange={(value) => setFormData({ ...formData, intelligence_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competitive">Competitivo</SelectItem>
                  <SelectItem value="promotional">Promocional</SelectItem>
                  <SelectItem value="seasonal">Estacional</SelectItem>
                  <SelectItem value="economic">Económico</SelectItem>
                  <SelectItem value="regulatory">Regulatorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="impact_assessment">Impacto</Label>
              <Select 
                value={formData.impact_assessment} 
                onValueChange={(value) => setFormData({ ...formData, impact_assessment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe la inteligencia de mercado..."
              rows={3}
              required
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
