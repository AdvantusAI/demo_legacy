import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Package, 
  Truck,
  Calculator,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SafetyStockParameter {
  id: string;
  product_id?: string;
  location_node_id?: string;
  category_id?: string;
  service_level_target: number;
  z_score: number;
  calculation_method: 'fixed' | 'dynamic' | 'service_level';
  minimum_safety_stock: number;
  maximum_safety_stock?: number;
  lead_time_variability_factor: number;
  active: boolean;
}

interface VendorSourcingOption {
  id: string;
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  product_id: string;
  node_id: string;
  lead_time_days: number;
  minimum_order_quantity: number;
  maximum_order_quantity?: number;
  order_multiple: number;
  unit_cost: number;
  setup_cost: number;
  priority: number;
  is_preferred: boolean;
  reliability_score: number;
  quality_rating: number;
  yield_percentage: number;
}

interface LotSizingParameter {
  id: string;
  product_id: string;
  node_id: string;
  lot_sizing_method: 'EOQ' | 'LOT_FOR_LOT' | 'FIXED_PERIOD' | 'MIN_MAX';
  economic_order_quantity?: number;
  fixed_period_quantity?: number;
  minimum_order_quantity: number;
  maximum_order_quantity?: number;
  order_multiple: number;
  holding_cost_percentage: number;
  setup_cost: number;
  active: boolean;
}

export const PurchaseOrderParametersDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('safety-stock');
  const [loading, setLoading] = useState(false);
  const [safetyStockParams, setSafetyStockParams] = useState<SafetyStockParameter[]>([]);
  const [vendorSourcingOptions, setVendorSourcingOptions] = useState<VendorSourcingOption[]>([]);
  const [lotSizingParams, setLotSizingParams] = useState<LotSizingParameter[]>([]);
  const [editingParam, setEditingParam] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadSafetyStockParams();
    loadVendorSourcingOptions();
    loadLotSizingParams();
  }, []);

  const loadSafetyStockParams = async () => {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('safety_stock_parameters')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSafetyStockParams(data || []);
    } catch (error) {
      console.error('Error loading safety stock parameters:', error);
      toast.error('Error al cargar parámetros de stock de seguridad');
    }
  };

  const loadVendorSourcingOptions = async () => {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('v_active_product_suppliers')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setVendorSourcingOptions(data || []);
    } catch (error) {
      console.error('Error loading vendor sourcing options:', error);
      toast.error('Error al cargar opciones de proveedores');
    }
  };

  const loadLotSizingParams = async () => {
    try {
      // This would come from a lot sizing parameters table
      // For now, we'll use mock data
      setLotSizingParams([]);
    } catch (error) {
      console.error('Error loading lot sizing parameters:', error);
      toast.error('Error al cargar parámetros de tamaño de lote');
    }
  };

  const updateSafetyStockParam = async (param: SafetyStockParameter) => {
    try {
      const { error } = await supabase
        .schema('m8_schema')
        .from('safety_stock_parameters')
        .update({
          service_level_target: param.service_level_target,
          z_score: param.z_score,
          calculation_method: param.calculation_method,
          minimum_safety_stock: param.minimum_safety_stock,
          maximum_safety_stock: param.maximum_safety_stock,
          lead_time_variability_factor: param.lead_time_variability_factor
        })
        .eq('id', param.id);

      if (error) throw error;
      
      toast.success('Parámetro actualizado correctamente');
      setEditingParam(null);
      loadSafetyStockParams();
    } catch (error) {
      console.error('Error updating safety stock parameter:', error);
      toast.error('Error al actualizar parámetro');
    }
  };

  const updateVendorSourcingOption = async (option: VendorSourcingOption) => {
    try {
      const { error } = await supabase
        .schema('m8_schema')
        .from('v_active_product_suppliers')
        .update({
          lead_time_days: option.lead_time_days,
          minimum_order_quantity: option.minimum_order_quantity,
          maximum_order_quantity: option.maximum_order_quantity,
          order_multiple: option.order_multiple,
          unit_cost: option.unit_cost,
          setup_cost: option.setup_cost,
          priority: option.priority,
          is_preferred: option.is_preferred
        })
        .eq('id', option.id);

      if (error) throw error;
      
      toast.success('Opción de proveedor actualizada correctamente');
      setEditingParam(null);
      loadVendorSourcingOptions();
    } catch (error) {
      console.error('Error updating vendor sourcing option:', error);
      toast.error('Error al actualizar opción de proveedor');
    }
  };

  const getServiceLevelZScore = (serviceLevel: number): number => {
    const zScores: { [key: number]: number } = {
      90: 1.28,
      95: 1.65,
      98: 1.96,
      99: 2.33,
      99.5: 2.58,
      99.9: 3.09
    };
    return zScores[serviceLevel] || 1.65;
  };

  const getCalculationMethodColor = (method: string) => {
    switch (method) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'dynamic': return 'bg-green-100 text-green-800';
      case 'service_level': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parámetros de Órdenes de Compra</h1>
          <p className="text-gray-600 mt-2">
            Configuración de parámetros críticos para la optimización de órdenes de compra
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Parámetros SS</p>
                <p className="text-2xl font-bold text-gray-900">{safetyStockParams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{vendorSourcingOptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Config. Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{lotSizingParams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Críticos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {safetyStockParams.filter(p => p.service_level_target >= 99).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="safety-stock">Stock de Seguridad</TabsTrigger>
          <TabsTrigger value="vendor-sourcing">Sourcing de Proveedores</TabsTrigger>
          <TabsTrigger value="lot-sizing">Tamaño de Lotes</TabsTrigger>
        </TabsList>

        {/* Safety Stock Parameters Tab */}
        <TabsContent value="safety-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Parámetros de Stock de Seguridad</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safetyStockParams.map((param) => (
                  <div key={param.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">
                          {param.product_id ? `Producto ${param.product_id}` : 
                           param.location_node_id ? `Ubicación ${param.location_node_id}` :
                           param.category_id ? `Categoría ${param.category_id}` : 'Global'}
                        </Badge>
                        <Badge className={getCalculationMethodColor(param.calculation_method)}>
                          {param.calculation_method}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={editingParam === param.id ? "default" : "outline"}
                        onClick={() => setEditingParam(editingParam === param.id ? null : param.id)}
                      >
                        {editingParam === param.id ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                      </Button>
                    </div>

                    {editingParam === param.id ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Nivel de Servicio (%)</Label>
                          <Select
                            value={param.service_level_target.toString()}
                            onValueChange={(value) => {
                              const newParam = { ...param, service_level_target: parseFloat(value) };
                              newParam.z_score = getServiceLevelZScore(newParam.service_level_target);
                              setSafetyStockParams(safetyStockParams.map(p => p.id === param.id ? newParam : p));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="90">90%</SelectItem>
                              <SelectItem value="95">95%</SelectItem>
                              <SelectItem value="98">98%</SelectItem>
                              <SelectItem value="99">99%</SelectItem>
                              <SelectItem value="99.5">99.5%</SelectItem>
                              <SelectItem value="99.9">99.9%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Z-Score</Label>
                          <Input
                            value={param.z_score}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label>Stock Mínimo</Label>
                          <Input
                            type="number"
                            value={param.minimum_safety_stock}
                            onChange={(e) => {
                              const newParam = { ...param, minimum_safety_stock: parseFloat(e.target.value) };
                              setSafetyStockParams(safetyStockParams.map(p => p.id === param.id ? newParam : p));
                            }}
                          />
                        </div>

                        <div>
                          <Label>Stock Máximo</Label>
                          <Input
                            type="number"
                            value={param.maximum_safety_stock || ''}
                            onChange={(e) => {
                              const newParam = { ...param, maximum_safety_stock: parseFloat(e.target.value) || undefined };
                              setSafetyStockParams(safetyStockParams.map(p => p.id === param.id ? newParam : p));
                            }}
                          />
                        </div>

                        <div className="col-span-2">
                          <Button
                            onClick={() => updateSafetyStockParam(param)}
                            className="w-full"
                          >
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Nivel Servicio:</span>
                          <p className="text-gray-600">{param.service_level_target}%</p>
                        </div>
                        <div>
                          <span className="font-medium">Z-Score:</span>
                          <p className="text-gray-600">{param.z_score}</p>
                        </div>
                        <div>
                          <span className="font-medium">Stock Mín:</span>
                          <p className="text-gray-600">{param.minimum_safety_stock}</p>
                        </div>
                        <div>
                          <span className="font-medium">Stock Máx:</span>
                          <p className="text-gray-600">{param.maximum_safety_stock || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Factor LT:</span>
                          <p className="text-gray-600">{param.lead_time_variability_factor}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Sourcing Tab */}
        <TabsContent value="vendor-sourcing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Opciones de Sourcing de Proveedores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorSourcingOptions.map((option) => (
                  <div key={option.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">
                          {option.product_id}
                        </Badge>
                        <Badge variant="outline">
                          {option.vendor_name}
                        </Badge>
                        {option.is_preferred && (
                          <Badge className="bg-green-100 text-green-800">
                            Preferido
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800">
                          Prioridad {option.priority}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={editingParam === option.id ? "default" : "outline"}
                        onClick={() => setEditingParam(editingParam === option.id ? null : option.id)}
                      >
                        {editingParam === option.id ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                      </Button>
                    </div>

                    {editingParam === option.id ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Lead Time (días)</Label>
                          <Input
                            type="number"
                            value={option.lead_time_days}
                            onChange={(e) => {
                              const newOption = { ...option, lead_time_days: parseInt(e.target.value) };
                              setVendorSourcingOptions(vendorSourcingOptions.map(o => o.id === option.id ? newOption : o));
                            }}
                          />
                        </div>

                        <div>
                          <Label>MOQ</Label>
                          <Input
                            type="number"
                            value={option.minimum_order_quantity}
                            onChange={(e) => {
                              const newOption = { ...option, minimum_order_quantity: parseFloat(e.target.value) };
                              setVendorSourcingOptions(vendorSourcingOptions.map(o => o.id === option.id ? newOption : o));
                            }}
                          />
                        </div>

                        <div>
                          <Label>Múltiplo de Orden</Label>
                          <Input
                            type="number"
                            value={option.order_multiple}
                            onChange={(e) => {
                              const newOption = { ...option, order_multiple: parseFloat(e.target.value) };
                              setVendorSourcingOptions(vendorSourcingOptions.map(o => o.id === option.id ? newOption : o));
                            }}
                          />
                        </div>

                        <div>
                          <Label>Prioridad</Label>
                          <Select
                            value={option.priority.toString()}
                            onValueChange={(value) => {
                              const newOption = { ...option, priority: parseInt(value) };
                              setVendorSourcingOptions(vendorSourcingOptions.map(o => o.id === option.id ? newOption : o));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Más Alta</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5 - Más Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Button
                            onClick={() => updateVendorSourcingOption(option)}
                            className="w-full"
                          >
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Lead Time:</span>
                          <p className="text-gray-600">{option.lead_time_days} días</p>
                        </div>
                        <div>
                          <span className="font-medium">MOQ:</span>
                          <p className="text-gray-600">{option.minimum_order_quantity}</p>
                        </div>
                        <div>
                          <span className="font-medium">Múltiplo:</span>
                          <p className="text-gray-600">{option.order_multiple}</p>
                        </div>
                        <div>
                          <span className="font-medium">Costo Unit:</span>
                          <p className="text-gray-600">${option.unit_cost}</p>
                        </div>
                        <div>
                          <span className="font-medium">Costo Setup:</span>
                          <p className="text-gray-600">${option.setup_cost}</p>
                        </div>
                        <div>
                          <span className="font-medium">Confiabilidad:</span>
                          <p className="text-gray-600">{(option.reliability_score * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lot Sizing Tab */}
        <TabsContent value="lot-sizing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Parámetros de Tamaño de Lotes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Configuración de parámetros de tamaño de lotes</p>
                <p className="text-sm">Esta funcionalidad estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
