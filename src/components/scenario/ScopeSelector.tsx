// File: src/components/scenario/ScopeSelector.tsx
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ScenarioScope } from '@/types/scenario';
import { supabase } from '@/integrations/supabase/client';

interface ScopeSelectorProps {
  scope: ScenarioScope;
  onScopeChange: (scope: ScenarioScope) => void;
}

interface SelectionOption {
  id: string;
  name: string;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  scope,
  onScopeChange
}) => {
  const [products, setProducts] = useState<SelectionOption[]>([]);
  const [vendors, setVendors] = useState<SelectionOption[]>([]);
  const [locations, setLocations] = useState<SelectionOption[]>([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('product_id, product_name')
        .limit(100);
      
      if (productsData && !productsError) {
        setProducts(productsData.map(p => ({ id: p.product_id, name: p.product_name || p.product_id })));
      } else if (productsError) {
        console.warn('Productos no disponibles:', productsError);
        setProducts([
          { id: 'PROD_001', name: 'Sample Product A' },
          { id: 'PROD_002', name: 'Sample Product B' },
          { id: 'PROD_003', name: 'Sample Product C' }
        ]);
      }

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('code, name')
        .limit(100);
      
      if (vendorsData && !vendorsError) {
        setVendors(vendorsData.map(v => ({ id: v.code, name: v.name || v.code })));
      } else if (vendorsError) {
        console.warn('Proveedores no disponibles:', vendorsError);
        setVendors([
          { id: 'VENDOR_A', name: 'Vendor Alpha' },
          { id: 'VENDOR_B', name: 'Vendor Beta' },
          { id: 'VENDOR_C', name: 'Vendor Gamma' }
        ]);
      }

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .schema('m8_schema')
        .from('locations')
        .select('location_id, location_name')
        .limit(100);
      
      if (locationsData && !locationsError) {
        setLocations(locationsData.map(l => ({ id: l.location_id, name: l.location_name || l.location_id })));
      } else if (locationsError) {
        console.warn('Almacenes no disponibles:', locationsError);
        setLocations([
          { id: 'WH_001', name: 'Main Warehouse' },
          { id: 'WH_002', name: 'Distribution Center' },
          { id: 'WH_003', name: 'Regional Hub' }
        ]);
      }
    } catch (error) {
      console.error('Error al obtener las opciones de scope:', error);
      // Set fallback data
      setProducts([
        { id: 'PROD_001', name: 'Sample Product A' },
        { id: 'PROD_002', name: 'Sample Product B' }
      ]);
      setVendors([
        { id: 'VENDOR_A', name: 'Vendor Alpha' },
        { id: 'VENDOR_B', name: 'Vendor Beta' }
      ]);
      setLocations([
        { id: 'WH_001', name: 'Main Warehouse' },
        { id: 'WH_002', name: 'Distribution Center' }
      ]);
    }
  };

  const updateScope = <K extends keyof ScenarioScope>(
    key: K,
    value: ScenarioScope[K]
  ) => {
    onScopeChange({
      ...scope,
      [key]: value
    });
  };

  const addToSelection = (type: 'product_ids' | 'customer_ids' | 'warehouse_ids', id: string) => {
    const currentIds = scope[type] || [];
    if (!currentIds.includes(id)) {
      updateScope(type, [...currentIds, id]);
    }
  };

  const removeFromSelection = (type: 'product_ids' | 'customer_ids' | 'warehouse_ids', id: string) => {
    const currentIds = scope[type] || [];
    updateScope(type, currentIds.filter(item => item !== id));
  };

  const getSelectedItems = (type: 'product_ids' | 'customer_ids' | 'warehouse_ids') => {
    const selectedIds = scope[type] || [];
    const options = type === 'product_ids' ? products : 
                   type === 'customer_ids' ? vendors : locations;
    
    return selectedIds.map(id => {
      const option = options.find(opt => opt.id === id);
      return { id, name: option?.name || id };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope y filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Horizon */}
        <div className="space-y-2">
          <Label htmlFor="time-horizon">Período de tiempo</Label>
          <Select
            value={scope.time_horizon_months?.toString() || "6"}
            onValueChange={(value) => updateScope('time_horizon_months', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar período de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mes</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        <div className="space-y-2">
          <Label htmlFor="products">Productos</Label>
          <Select onValueChange={(value) => addToSelection('product_ids', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Añadir productos..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {getSelectedItems('product_ids').map((item) => (
              <Badge key={item.id} variant="secondary" className="gap-1">
                {item.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFromSelection('product_ids', item.id)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Vendors */}
        <div className="space-y-2">
          <Label htmlFor="vendors">Proveedores</Label>
          <Select onValueChange={(value) => addToSelection('customer_ids', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Añadir proveedores..." />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {getSelectedItems('customer_ids').map((item) => (
              <Badge key={item.id} variant="secondary" className="gap-1">
                {item.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFromSelection('customer_ids', item.id)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Warehouses */}
        <div className="space-y-2">
            <Label htmlFor="warehouses">Almacenes</Label>
          <Select onValueChange={(value) => addToSelection('warehouse_ids', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Añadir almacenes..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {getSelectedItems('warehouse_ids').map((item) => (
              <Badge key={item.id} variant="secondary" className="gap-1">
                {item.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFromSelection('warehouse_ids', item.id)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};