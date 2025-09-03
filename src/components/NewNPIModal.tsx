import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";

interface NewNPIModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewNPIModal({ open, onClose }: NewNPIModalProps) {
  const { createNPIProduct, loading } = useNPIProducts();
  const { products } = useProducts();
  
  const [formData, setFormData] = useState({
    product_id: "",
    npi_status: "planning",
    launch_date: "",
    market_segment: "",
    confidence_level: "",
    responsible_planner: "",
    description: "",
    target_revenue: "",
    investment_amount: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      toast.error("Please select a product");
      return;
    }

    try {
      const npiData = {
        product_id: formData.product_id,
        npi_status: formData.npi_status as any,
        launch_date: formData.launch_date || null,
        market_segment: formData.market_segment || null,
        confidence_level: formData.confidence_level ? parseInt(formData.confidence_level) : null,
        responsible_planner: formData.responsible_planner || null,
        description: formData.description || null,
        target_revenue: formData.target_revenue ? parseFloat(formData.target_revenue) : null,
        investment_amount: formData.investment_amount ? parseFloat(formData.investment_amount) : null
      };

      await createNPIProduct(npiData);
      
      // Reset form
      setFormData({
        product_id: "",
        npi_status: "planning",
        launch_date: "",
        market_segment: "",
        confidence_level: "",
        responsible_planner: "",
        description: "",
        target_revenue: "",
        investment_amount: ""
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating NPI product:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New NPI Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select value={formData.product_id} onValueChange={(value) => handleInputChange("product_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npi_status">NPI Status</Label>
              <Select value={formData.npi_status} onValueChange={(value) => handleInputChange("npi_status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="pre_launch">Pre-Launch</SelectItem>
                  <SelectItem value="launch">Launch</SelectItem>
                  <SelectItem value="post_launch">Post-Launch</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="launch_date">Launch Date</Label>
              <Input
                id="launch_date"
                type="date"
                value={formData.launch_date}
                onChange={(e) => handleInputChange("launch_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_segment">Market Segment</Label>
              <Input
                id="market_segment"
                value={formData.market_segment}
                onChange={(e) => handleInputChange("market_segment", e.target.value)}
                placeholder="e.g., Premium, Mass Market"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence_level">Confidence Level (%)</Label>
              <Input
                id="confidence_level"
                type="number"
                min="0"
                max="100"
                value={formData.confidence_level}
                onChange={(e) => handleInputChange("confidence_level", e.target.value)}
                placeholder="0-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_planner">Responsible Planner</Label>
              <Input
                id="responsible_planner"
                value={formData.responsible_planner}
                onChange={(e) => handleInputChange("responsible_planner", e.target.value)}
                placeholder="Planner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_revenue">Target Revenue ($)</Label>
              <Input
                id="target_revenue"
                type="number"
                step="0.01"
                value={formData.target_revenue}
                onChange={(e) => handleInputChange("target_revenue", e.target.value)}
                placeholder="Expected revenue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_amount">Investment Amount ($)</Label>
              <Input
                id="investment_amount"
                type="number"
                step="0.01"
                value={formData.investment_amount}
                onChange={(e) => handleInputChange("investment_amount", e.target.value)}
                placeholder="Investment required"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the NPI project"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create NPI"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}