import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { configureAGGridLicense, defaultGridOptions } from '@/lib/ag-grid-config';
import { useProducts } from '@/hooks/useProducts';
import '@/styles/ag-grid-custom.css';

// Configure AG Grid license
configureAGGridLicense();

interface InventoryData {
  inventory_id: string;
  product_id: string;
  warehouse_id: number;
  current_stock: number;
  available_stock: number;
  committed_stock: number;
  safety_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  economic_order_quantity: number;
  unit_cost: number;
  holding_cost_rate: number;
  stockout_cost_per_unit: number;
  lead_time_days: number;
  last_count_date: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  warehouse_name?: string;
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
}

interface InventoryForm {
  product_id: string;
  warehouse_id: number;
  current_stock: number;
  available_stock: number;
  committed_stock: number;
  safety_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  economic_order_quantity: number;
  unit_cost: number;
  holding_cost_rate: number;
  stockout_cost_per_unit: number;
  lead_time_days: number;
}

const InventoryCatalog: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const { products, getProductName } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryData | null>(null);
  const [formData, setFormData] = useState<InventoryForm>({
    product_id: '',
    warehouse_id: 1,
    current_stock: 0,
    available_stock: 0,
    committed_stock: 0,
    safety_stock: 0,
    min_stock: 0,
    max_stock: 1000,
    reorder_point: 0,
    economic_order_quantity: 100,
    unit_cost: 0,
    holding_cost_rate: 0.25,
    stockout_cost_per_unit: 0,
    lead_time_days: 14,
  });

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('current_inventory')
        .select('*')
        .order('product_id', { ascending: true });

      if (error) throw error;

      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('warehouses')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Error al cargar almacenes');
    }
  };

  const getWarehouseName = (warehouseId: number): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || `Almacén ${warehouseId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingInventory) {
        // Update existing inventory
        const { error } = await supabase
         .schema('m8_schema')
          .from('current_inventory')
          .update(formData)
          .eq('inventory_id', editingInventory.inventory_id);

        if (error) throw error;
        toast.success('Inventario actualizado exitosamente');
      } else {
        // Create new inventory
        const { error } = await supabase
         .schema('m8_schema')
          .from('current_inventory')
          .insert([formData]);

        if (error) throw error;
        toast.success('Inventario creado exitosamente');
      }

      setDialogOpen(false);
      setEditingInventory(null);
      setFormData({
        product_id: '',
        warehouse_id: 1,
        current_stock: 0,
        available_stock: 0,
        committed_stock: 0,
        safety_stock: 0,
        min_stock: 0,
        max_stock: 1000,
        reorder_point: 0,
        economic_order_quantity: 100,
        unit_cost: 0,
        holding_cost_rate: 0.25,
        stockout_cost_per_unit: 0,
        lead_time_days: 14,
      });
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast.error('Error al guardar el inventario');
    }
  };

  const handleEdit = (inventory: InventoryData) => {
    setEditingInventory(inventory);
    setFormData({
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      current_stock: inventory.current_stock,
      available_stock: inventory.available_stock || 0,
      committed_stock: inventory.committed_stock,
      safety_stock: inventory.safety_stock,
      min_stock: inventory.min_stock,
      max_stock: inventory.max_stock,
      reorder_point: inventory.reorder_point || 0,
      economic_order_quantity: inventory.economic_order_quantity,
      unit_cost: inventory.unit_cost,
      holding_cost_rate: inventory.holding_cost_rate,
      stockout_cost_per_unit: inventory.stockout_cost_per_unit,
      lead_time_days: inventory.lead_time_days,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (inventoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este inventario?')) return;

    try {
      const { error } = await supabase
        .from('current_inventory')
        .delete()
        .eq('inventory_id', inventoryId);

      if (error) throw error;

      toast.success('Inventario eliminado exitosamente');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Error al eliminar el inventario');
    }
  };

  const ActionCellRenderer = (props: ICellRendererParams) => {
    return (
      <div className="flex gap-2 h-full items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(props.data)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(props.data.inventory_id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const columnDefs: ColDef[] = [
    { 
      field: 'product_id', 
      headerName: 'ID Producto', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120
    },
    { 
      headerName: 'Producto', 
      sortable: true, 
      filter: true, 
      flex: 1.5, 
      minWidth: 180,
      valueGetter: (params) => getProductName(params.data?.product_id || '')
    },
    { 
      field: 'warehouse_id', 
      headerName: 'ID Almacén', 
      sortable: true, 
      filter: true, 
      flex: 0.8, 
      minWidth: 100
    },
    { 
      headerName: 'Almacén', 
      sortable: true, 
      filter: true, 
      flex: 1.2, 
      minWidth: 120,
      valueGetter: (params) => getWarehouseName(params.data?.warehouse_id || 0)
    },
    { field: 'current_stock', headerName: 'Stock Actual', sortable: true, filter: true, flex: 1, minWidth: 120, valueFormatter: (params) => params.value?.toLocaleString() },
    { field: 'available_stock', headerName: 'Stock Disponible', sortable: true, filter: true, flex: 1.2, minWidth: 140, valueFormatter: (params) => params.value?.toLocaleString() },
    { field: 'safety_stock', headerName: 'Stock Seguridad', sortable: true, filter: true, flex: 1.1, minWidth: 130, valueFormatter: (params) => params.value?.toLocaleString() },
    { field: 'reorder_point', headerName: 'Punto Reorden', sortable: true, filter: true, flex: 1.1, minWidth: 130, valueFormatter: (params) => params.value?.toLocaleString() },
    { field: 'unit_cost', headerName: 'Costo Unitario', sortable: true, filter: true, flex: 1.1, minWidth: 130, valueFormatter: (params) => `$${params.value?.toFixed(2)}` },
    { field: 'lead_time_days', headerName: 'Tiempo Entrega', sortable: true, filter: true, flex: 1.1, minWidth: 130 },
    {
      headerName: 'Acciones',
      cellRenderer: ActionCellRenderer,
      width: 120,
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    }
  ];

  const filteredInventoryForGrid = useMemo(() => {
    if (!searchTerm) return inventory;
    
    return inventory.filter(item =>
      item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_id.toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventarios</h1>
          <p className="text-muted-foreground">Gestiona los inventarios actuales</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Inventario
        </Button>
      </div>


      <Card>
        <CardContent className="p-0">
          <div className="ag-theme-custom h-[600px] w-full">
            <AgGridReact
              rowData={filteredInventoryForGrid}
              columnDefs={columnDefs}
              {...defaultGridOptions}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInventory ? 'Editar Inventario' : 'Agregar Nuevo Inventario'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_id">ID Producto</Label>
                <Input
                  id="product_id"
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="warehouse_id">ID Almacén</Label>
                <Input
                  id="warehouse_id"
                  type="number"
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({...formData, warehouse_id: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_stock">Stock Actual</Label>
                <Input
                  id="current_stock"
                  type="number"
                  step="0.01"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="available_stock">Stock Disponible</Label>
                <Input
                  id="available_stock"
                  type="number"
                  step="0.01"
                  value={formData.available_stock}
                  onChange={(e) => setFormData({...formData, available_stock: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="committed_stock">Stock Comprometido</Label>
                <Input
                  id="committed_stock"
                  type="number"
                  step="0.01"
                  value={formData.committed_stock}
                  onChange={(e) => setFormData({...formData, committed_stock: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="safety_stock">Stock de Seguridad</Label>
                <Input
                  id="safety_stock"
                  type="number"
                  step="0.01"
                  value={formData.safety_stock}
                  onChange={(e) => setFormData({...formData, safety_stock: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({...formData, min_stock: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_stock">Stock Máximo</Label>
                <Input
                  id="max_stock"
                  type="number"
                  step="0.01"
                  value={formData.max_stock}
                  onChange={(e) => setFormData({...formData, max_stock: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reorder_point">Punto de Reorden</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  step="0.01"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({...formData, reorder_point: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="economic_order_quantity">Cantidad Económica de Pedido</Label>
                <Input
                  id="economic_order_quantity"
                  type="number"
                  step="0.01"
                  value={formData.economic_order_quantity}
                  onChange={(e) => setFormData({...formData, economic_order_quantity: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_cost">Costo Unitario</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="holding_cost_rate">Tasa de Costo de Almacenamiento</Label>
                <Input
                  id="holding_cost_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.holding_cost_rate}
                  onChange={(e) => setFormData({...formData, holding_cost_rate: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stockout_cost_per_unit">Costo de Ruptura por Unidad</Label>
                <Input
                  id="stockout_cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.stockout_cost_per_unit}
                  onChange={(e) => setFormData({...formData, stockout_cost_per_unit: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
                <Input
                  id="lead_time_days"
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({...formData, lead_time_days: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingInventory ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryCatalog;