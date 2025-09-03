import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, XCircle, BarChart3, Calendar, Package, Truck, MapPin, Users, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductFilter } from "@/components/ProductFilter";
import { LocationFilter } from "@/components/LocationFilter";
import { ForecastDataTable } from "@/components/ForecastDataTable";
import { ForecastChart } from "@/components/ForecastChart";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { DynamicUpcomingChallenges } from "@/components/DynamicUpcomingChallenges";
import { DynamicActionItems } from "@/components/DynamicActionItems";
import { AIRecommendationsPanel } from "@/components/AIRecommendationsPanel";
import { AIScenarioBuilder } from "@/components/AIScenarioBuilder";
import { ProductSelectionModal } from "@/components/ProductSelectionModal";
import { LocationSelectionModal } from "@/components/LocationSelectionModal";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useInterpretabilityData } from "@/hooks/useInterpretabilityData";
import { useProducts } from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import OutliersTab from "@/components/OutliersTab";

export default function RetailForecast() {
  const [searchParams] = useSearchParams();
  const [selectedProductId, setSelectedProductId] = useState<string>(searchParams.get('product_id') || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(searchParams.get('location_id') || '');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const { data: interpretabilityData } = useInterpretabilityData(selectedProductId, selectedLocationId);
  const { getProductName } = useProducts();
  const { getLocationName } = useLocations();

  // Update state when URL parameters change
  useEffect(() => {
    const productParam = searchParams.get('product_id');
    const locationParam = searchParams.get('location_id');
    
    if (productParam && productParam !== selectedProductId) {
      setSelectedProductId(productParam);
    }
    if (locationParam && locationParam !== selectedLocationId) {
      setSelectedLocationId(locationParam);
    }
  }, [searchParams]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    //console.log('Producto seleccionado en Retail Forecast:', productId);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    //console.log('Ubicación seleccionada en Retail Forecast:', locationId);
  };

  const handleForecastDataUpdate = (data: any[]) => {
    setChartData(data);
  };

  const handleClearFilters = () => {
    setSelectedProductId('');
    setSelectedLocationId('');
    //console.log('Filtros limpiados');
  };

  // Calculate dynamic collaboration metrics from interpretability data
  const calculateCollaborationMetrics = () => {
    if (!interpretabilityData.length) {
      return {
        forecastAccuracy: 85,
        responseTime: "3.2 días",
        compliance: 82,
        marketAlignment: 78
      };
    }

    const avgAccuracy = interpretabilityData.reduce((sum, item) => sum + (item.interpretability_score || 0), 0) / interpretabilityData.length;
    const highConfidenceCount = interpretabilityData.filter(item => item.confidence_level === 'Alta').length;
    const confidenceRatio = (highConfidenceCount / interpretabilityData.length) * 100;

    return {
      forecastAccuracy: Math.round(avgAccuracy),
      responseTime: avgAccuracy > 80 ? "2.1 días" : "3.5 días",
      compliance: Math.round(confidenceRatio),
      marketAlignment: Math.round((avgAccuracy + confidenceRatio) / 2)
    };
  };

  const collaborationMetrics = calculateCollaborationMetrics();

  return (
    <div className="space-y-6">
      {/* Always visible filter info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Producto:</span>
                {selectedProductId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedProductId}</Badge>
                    <Badge variant="secondary">{getProductName(selectedProductId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionado (obligatorio)</span>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsProductModalOpen(true)}
                  className="ml-2"
                >
                  Seleccionar Producto
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Ubicación:</span>
                {selectedLocationId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedLocationId}</Badge>
                    <Badge variant="secondary">{getLocationName(selectedLocationId)}</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No seleccionada (obligatorio)</span>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="ml-2"
                >
                  Seleccionar Ubicación
                </Button>
              </div>
              
            </div>
            
            {(selectedProductId || selectedLocationId) && (
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

      {/* Tab Interface */}
      <Tabs defaultValue="plan-demanda" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plan-demanda">Plan de la demanda</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        <TabsContent value="plan-demanda" className="space-y-6 mt-6">
          {/* Product Filter Row */}
          <div className="space-y-6 mt-6">
            
            {/* Chart Card - spans 4 columns on large screens */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Gráfico de Pronósticos Retail</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualización de datos de pronóstico retail vs. valores reales
                  {!selectedProductId ? 
                    " - Selecciona producto para ver datos" : 
                    `${selectedLocationId ? ` - Ubicación: ${selectedLocationId}` : ' - Todas las ubicaciones'}`
                  }
                </p>
              </CardHeader>
              <CardContent>
                <ForecastChart data={chartData} />
              </CardContent>
            </Card>
          </div>

            {/* Forecast Data Table - spans remaining columns */}
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle>Tabla de Datos de Pronóstico Retail</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Datos detallados retail con capacidad de edición para Demand Planner
                  {!selectedProductId ? 
                    " - Selecciona producto para ver datos" : 
                    `${selectedLocationId ? ` - Ubicación: ${selectedLocationId}` : ' - Todas las ubicaciones'}`
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ForecastDataTable 
                  selectedProductId={selectedProductId}
                  selectedLocationId={selectedLocationId}
                  selectedCustomerId=""
                  onDataUpdate={handleForecastDataUpdate}
                />
              </CardContent>
            </Card>

        </TabsContent>

        <TabsContent value="metricas" className="space-y-6 mt-6">
          <MetricsDashboard 
            selectedProductId={selectedProductId}
            selectedLocationId={selectedLocationId}
            selectedCustomerId=""
          />
        </TabsContent>

        <TabsContent value="outliers" className="space-y-6 mt-6">
          <OutliersTab 
            selectedProductId={selectedProductId}
            selectedCustomerId=""
            selectedLocationId={selectedLocationId}
          />
        </TabsContent>

        <TabsContent value="colaboracion" className="space-y-6 mt-6">
          {!selectedProductId ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Selecciona Producto</h3>
                    <p className="text-sm text-muted-foreground">
                      Para ver la información de colaboración, selecciona un producto.
                    </p>
                    <Button 
                      onClick={() => setIsProductModalOpen(true)}
                      className="mt-2"
                    >
                      Seleccionar Producto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Dynamic Upcoming Challenges */}
              <div className="grid grid-cols-1 gap-6">
                <DynamicUpcomingChallenges 
                  selectedProductId={selectedProductId}
                  selectedLocationId={selectedLocationId}
                />
              </div>

              {/* Action Items and Collaboration Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DynamicActionItems 
                  selectedProductId={selectedProductId}
                  selectedLocationId={selectedLocationId}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Colaboración Retail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ventas - Precisión Compartida</span>
                        <span className="font-semibold">{collaborationMetrics.forecastAccuracy}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Compras - Tiempo de Respuesta</span>
                        <span className="font-semibold">{collaborationMetrics.responseTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Supply Chain - Cumplimiento</span>
                        <span className="font-semibold">{collaborationMetrics.compliance}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Marketing - Alineación Promocional</span>
                        <span className="font-semibold">{collaborationMetrics.marketAlignment}%</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button className="w-full">
                        <Truck className="h-4 w-4 mr-2" />
                        Generar Reporte S&OP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
      />

      {/* Location Selection Modal */}
      <LocationSelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  );
}