
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, Search, Edit, Trash2, Rocket, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-enterprise';

import 'ag-grid-enterprise';
import '../styles/ag-grid-custom.css';
import { configureAGGridLicense, defaultGridOptions } from '@/lib/ag-grid-config';

interface Product {
  product_id: string;
  product_name: string;
  category_name: string | null;
  category_id: string | null;
  subcategory_name: string | null;
  subcategory_id: string | null;
  class_name: string | null;
  class_id: string | null;
  subclass_name: string | null;
  subclass_id: string | null;
  is_npi: boolean | null;
  npi_status: string | null;
  npi_launch_date: string | null;
}

interface ProductForm {
  product_id: string;
  product_name: string;
  category_name?: string;
  category_id?: string;
  subcategory_name?: string;
  subcategory_id?: string;
  class_name?: string;
  class_id?: string;
  subclass_name?: string;
  subclass_id?: string;
  is_npi: boolean;
  npi_status: string;
  npi_launch_date: string;
}

// Database row type for mapping
interface ProductRow {
  id: string;
  code: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  category_id: string | null;
  subcategory_name: string | null;
  subcategory_id: string | null;
  class_name: string | null;
  class_id: string | null;
  subclass_name: string | null;
  subclass_id: string | null;
  is_npi: boolean | null;
  npi_status: string | null;
  npi_launch_date: string | null;
}

export default function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNPIOnly, setShowNPIOnly] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [formData, setFormData] = useState<ProductForm>({
    product_id: "",
    product_name: "",
    category_name: "",
    category_id: "",
    subcategory_name: "",
    subcategory_id: "",
    class_name: "",
    class_id: "",
    subclass_name: "",
    subclass_id: "",
    is_npi: false,
    npi_status: "",
    npi_launch_date: ""
  });

  useEffect(() => {
    configureAGGridLicense();
    fetchProducts();
  }, []);

  const getNPIStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'pre_launch':
        return 'bg-yellow-100 text-yellow-800';
      case 'launch':
        return 'bg-green-100 text-green-800';
      case 'post_launch':
        return 'bg-purple-100 text-purple-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNPIStatusLabel = (status: string | null) => {
    if (!status) return 'Sin Estado';
    switch (status) {
      case 'planning':
        return 'Planificación';
      case 'pre_launch':
        return 'Pre-Lanzamiento';
      case 'launch':
        return 'Lanzamiento';
      case 'post_launch':
        return 'Post-Lanzamiento';
      case 'discontinued':
        return 'Descontinuado';
      default:
        return status;
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
      .schema('m8_schema') 
        .from('products')
        .select('*')
        .order('product_id');

      if (error) throw error;
      
      // Map the data to our interface
      const mappedData: Product[] = (data || []).map((item: ProductRow) => ({
        product_id: item.product_id || item.code, // Use product_id if available, otherwise use code
        product_name: item.product_name || '',
        category_name: item.category_name,
        category_id: item.category_id,
        subcategory_name: item.subcategory_name,
        subcategory_id: item.subcategory_id,
        class_name: item.class_name,
        class_id: item.class_id,
        subclass_name: item.subclass_name,
        subclass_id: item.subclass_id,
        is_npi: item.is_npi || false,
        npi_status: item.npi_status,
        npi_launch_date: item.npi_launch_date
      }));
      
      setProducts(mappedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const generateShortId = () => {
    // Generate a short 8-character ID for the code field
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        const updateData = {
          product_name: formData.product_name,
          category_name: formData.category_name || null,
          category_id: formData.category_id || null,
          subcategory_name: formData.subcategory_name || null,
          subcategory_id: formData.subcategory_id || null,
          class_name: formData.class_name || null,
          class_id: formData.class_id || null,
          subclass_name: formData.subclass_name || null,
          subclass_id: formData.subclass_id || null,
          is_npi: formData.is_npi,
          npi_status: formData.is_npi ? formData.npi_status || null : null,
          npi_launch_date: formData.is_npi ? formData.npi_launch_date || null : null
        };
        
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('product_id', editingProduct.product_id);
        
        if (error) throw error;
        toast.success('Producto actualizado exitosamente');
      } else {
        // Transform formData to match database schema
        const insertData = {
          id: formData.product_id.substring(0, 10), // Ensure code is max 10 characters//crypto.randomUUID(), // Generate a proper UUID for the id field
          code: formData.product_id.substring(0, 10), // Ensure code is max 10 characters
          product_id: formData.product_id,
          product_name: formData.product_name,
          category_name: formData.category_name || null,
          category_id: formData.category_id || null,
          subcategory_name: formData.subcategory_name || null,
          subcategory_id: formData.subcategory_id || null,
          class_name: formData.class_name || null,
          class_id: formData.class_id || null,
          subclass_name: formData.subclass_name || null,
          subclass_id: formData.subclass_id || null,
          is_npi: formData.is_npi,
          npi_status: formData.is_npi ? formData.npi_status || null : null,
          npi_launch_date: formData.is_npi ? formData.npi_launch_date || null : null
        };
        
        const { error } = await supabase
        .schema('m8_schema') 
          .from('products')
          .insert(insertData);
        
        if (error) throw error;
        toast.success('Producto creado exitosamente');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_id: product.product_id,
      product_name: product.product_name,
      category_name: product.category_name || "",
      category_id: product.category_id || "",
      subcategory_name: product.subcategory_name || "",
      subcategory_id: product.subcategory_id || "",
      class_name: product.class_name || "",
      class_id: product.class_id || "",
      subclass_name: product.subclass_name || "",
      subclass_id: product.subclass_id || "",
      is_npi: product.is_npi || false,
      npi_status: product.npi_status || "",
      npi_launch_date: product.npi_launch_date || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;

    try {
      const { error } = await supabase
      .schema('m8_schema') 
        .from('products')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;
      toast.success('Producto eliminado exitosamente');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      product_name: "",
      category_name: "",
      category_id: "",
      subcategory_name: "",
      subcategory_id: "",
      class_name: "",
      class_id: "",
      subclass_name: "",
      subclass_id: "",
      is_npi: false,
      npi_status: "",
      npi_launch_date: ""
    });
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const NPIStatusBadgeRenderer = (props: any) => {
    const status = props.value;
    if (!status) return null;
    
    return (
      <Badge className={getNPIStatusColor(status)}>
        {getNPIStatusLabel(status)}
      </Badge>
    );
  };

  const NPILaunchDateRenderer = (props: any) => {
    const date = props.value;
    if (!date) return '-';
    
    return (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {new Date(date).toLocaleDateString()}
      </div>
    );
  };

  const ActionCellRenderer = (props: any) => {
    const product = props.data;
    
    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEdit(product)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDelete(product.product_id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: "ID",
      field: "product_id",
      sortable: true,
      filter: true,
      width: 120,
      resizable: true
    },
    {
      headerName: "Nombre",
      field: "product_name",
      sortable: true,
      filter: true,
      flex: 1,
      resizable: true
    },
    {
      headerName: "Categoría",
      field: "category_name",
      sortable: true,
      filter: true,
      width: 150,
      resizable: true,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: "Subcategoría",
      field: "subcategory_name",
      sortable: true,
      filter: true,
      width: 150,
      resizable: true,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: "NPI",
      field: "is_npi",
      sortable: true,
      filter: true,
      width: 80,
      resizable: true,
      valueFormatter: (params) => params.value ? 'Sí' : 'No'
    },
    {
      headerName: "Estado NPI",
      field: "npi_status",
      sortable: true,
      filter: true,
      width: 150,
      resizable: true,
      cellRenderer: NPIStatusBadgeRenderer
    },
    {
      headerName: "Fecha Lanzamiento",
      field: "npi_launch_date",
      sortable: true,
      filter: true,
      width: 160,
      resizable: true,
      cellRenderer: NPILaunchDateRenderer
    },
    {
      headerName: "Acciones",
      field: "actions",
      cellRenderer: ActionCellRenderer,
      width: 150,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right'
    }
  ], []);

  // Filter data based on search term and NPI filter
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.subcategory_name && product.subcategory_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesNPIFilter = !showNPIOnly || product.is_npi;
      
      return matchesSearch && matchesNPIFilter;
    });
  }, [products, searchTerm, showNPIOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
          <p className="text-muted-foreground">Gestiona tu inventario de productos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Modifica la información del producto existente.' 
                  : 'Completa la información para crear un nuevo producto en el catálogo.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_id">ID del Producto</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    required
                    disabled={!!editingProduct}
                    maxLength={10}
                    placeholder="Máximo 10 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="product_name">Nombre del Producto</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_name">Categoría</Label>
                  <Input
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="subcategory_name">Subcategoría</Label>
                  <Input
                    id="subcategory_name"
                    value={formData.subcategory_name}
                    onChange={(e) => setFormData({...formData, subcategory_name: e.target.value})}
                  />
                </div>
              </div>

              {/* NPI Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  Configuración NPI
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_npi"
                    checked={formData.is_npi}
                    onCheckedChange={(checked) => setFormData({...formData, is_npi: checked as boolean})}
                  />
                  <Label htmlFor="is_npi" className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-500" />
                    Es producto NPI (New Product Introduction)
                  </Label>
                </div>
                
                {formData.is_npi && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="npi_status">Estado NPI</Label>
                      <Select 
                        value={formData.npi_status} 
                        onValueChange={(value) => setFormData({...formData, npi_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planificación</SelectItem>
                          <SelectItem value="pre_launch">Pre-Lanzamiento</SelectItem>
                          <SelectItem value="launch">Lanzamiento</SelectItem>
                          <SelectItem value="post_launch">Post-Lanzamiento</SelectItem>
                          <SelectItem value="discontinued">Descontinuado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="npi_launch_date">Fecha de Lanzamiento</Label>
                      <Input
                        id="npi_launch_date"
                        type="date"
                        value={formData.npi_launch_date}
                        onChange={(e) => setFormData({...formData, npi_launch_date: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="npi-filter"
                checked={showNPIOnly}
                onCheckedChange={(checked) => setShowNPIOnly(checked as boolean)}
              />
              <Label htmlFor="npi-filter" className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-500" />
                Mostrar solo productos NPI
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-quartz ag-theme-custom" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              rowData={filteredProducts}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              {...defaultGridOptions}
              rowHeight={40}
              getRowId={(params) => params.data.product_id}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
