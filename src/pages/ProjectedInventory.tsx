import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  Warehouse, 
  Building2, 
  TrendingUp, 
  Calendar,
  BarChart3,
  MapPin,
  Users,
  X
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { ProductFilter } from "@/components/ProductFilter";
import { LocationFilter } from "@/components/LocationFilter";
import { CustomerFilter } from "@/components/CustomerFilter";


export default function ProjectedInventory() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("12-months");
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    //console.log('Producto seleccionado en Projected Inventory:', productId);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    //console.log('Ubicación seleccionada en Projected Inventory:', locationId);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    //console.log('Cliente seleccionado en Projected Inventory:', customerId);
  };

  const handleClearFilters = () => {
    setSelectedProductId('');
    setSelectedLocationId('');
    setSelectedCustomerId('');
    //console.log('Filtros limpiados en Projected Inventory');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return <Badge className="bg-green-100 text-green-700">Óptimo</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Advertencia</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Alta</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-700">Normal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

   {/*
  const totalForecast = projectedData.reduce((sum, item) => sum + item.forecast, 0);
  const totalOnOrder = projectedData.reduce((sum, item) => sum + item.onOrder, 0);
  const totalOnHand = projectedData.reduce((sum, item) => sum + item.onHand, 0);
  const totalShipments = projectedData.reduce((sum, item) => sum + item.shipments, 0);
*/}
  return (
    <div className="space-y-6">
       {/* Always visible filter info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {selectedProductId ? (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Producto:</span>
                  <Badge variant="outline">{selectedProductId}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Producto: No seleccionado (obligatorio)</span>
                </div>
              )}
              {selectedLocationId ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Ubicación:</span>
                  <Badge variant="outline">{selectedLocationId}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Ubicación: No seleccionada (obligatorio)</span>
                </div>
              )}
              {selectedCustomerId ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Cliente:</span>
                  <Badge variant="outline">{selectedCustomerId}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Cliente: No seleccionado (opcional)</span>
                </div>
              )}
            </div>
            
            {(selectedProductId || selectedLocationId || selectedCustomerId) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
            
             
                {/* Product Filter Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <Card>
                    <ProductFilter
                      onProductSelect={handleProductSelect}
                      selectedProductId={selectedProductId} />
                  </Card>
                  
                  {/* Chart Card - spans 4 columns on large screens */}
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Gráfico de Pronósticos</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Visualización de datos de pronóstico vs. valores reales
                        {!selectedProductId || !selectedLocationId ? 
                          " - Selecciona producto y ubicación para ver datos" : 
                          selectedCustomerId ? ` - Filtrado por cliente ${selectedCustomerId}` : " - Cliente: todos"
                        }
                      </p>
                    </CardHeader>
                    <CardContent>
                     
                    </CardContent>
                  </Card>
                </div>
      
                {/* Location Filter Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <Card>
                    <LocationFilter
                      onLocationSelect={handleLocationSelect}
                      selectedLocationId={selectedLocationId} />
                  </Card>
                  
                  {/* Forecast Data Table - spans remaining columns */}
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Tabla de Datos de Pronóstico</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Datos detallados con capacidad de edición para Demand Planner
                        {!selectedProductId || !selectedLocationId ? 
                          " - Selecciona producto y ubicación para ver datos" : 
                          selectedCustomerId ? ` - Filtrado por cliente ${selectedCustomerId}` : " - Cliente: todos"
                        }
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    </CardContent>
                  </Card>
                </div>
      
                {/* Customer Filter Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <Card>
                    <CustomerFilter
                      onCustomerSelect={handleCustomerSelect}
                      selectedCustomerId={selectedCustomerId} />
                  </Card>
                  
                  {/* Empty space to maintain layout consistency */}
                  <div className="lg:col-span-4"></div>
                </div>

    </div>
    
  );
}
