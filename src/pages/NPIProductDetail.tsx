import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Settings
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { useNPIMilestones } from "@/hooks/useNPIMilestones";
import { useNPIScenarios } from "@/hooks/useNPIScenarios";
import { format } from "date-fns";

const statusColors = {
  planning: "bg-blue-100 text-blue-600",
  pre_launch: "bg-yellow-100 text-yellow-600", 
  launch: "bg-green-100 text-green-600",
  post_launch: "bg-purple-100 text-purple-600",
  discontinued: "bg-red-100 text-red-600"
};

const statusLabels = {
  planning: "Planificación",
  pre_launch: "Pre-Lanzamiento",
  launch: "Lanzamiento",
  post_launch: "Post-Lanzamiento", 
  discontinued: "Descontinuado"
};

const milestoneStatusIcons = {
  not_started: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle
};

const milestoneStatusColors = {
  not_started: "text-gray-500",
  in_progress: "text-blue-500",
  completed: "text-green-500",
  cancelled: "text-red-500"
};

export default function NPIProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { npiProducts } = useNPIProducts();
  const { milestones } = useNPIMilestones();
  const { scenarios } = useNPIScenarios();
  
  const npiProduct = npiProducts?.find(p => p.id === id);
  const productMilestones = milestones?.filter(m => m.npi_product_id === id) || [];
  const productScenarios = scenarios?.filter(s => s.npi_product_id === id) || [];
  
  if (!npiProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Producto NPI No Encontrado</h2>
          <p className="text-muted-foreground mb-4">El producto NPI solicitado no pudo ser encontrado.</p>
          <Button onClick={() => navigate("/npi-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const completedMilestones = productMilestones.filter(m => m.milestone_status === 'completed').length;
  const totalMilestones = productMilestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/npi-dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{npiProduct.product?.product_name || 'Producto Desconocido'}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={statusColors[npiProduct.npi_status]}>
                {statusLabels[npiProduct.npi_status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Categoría: {npiProduct.product?.category_name || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">
                Planificador: {npiProduct.responsible_planner || 'Sin asignar'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Fecha de Lanzamiento</p>
                <p className="text-lg font-bold">
                  {npiProduct.launch_date ? format(new Date(npiProduct.launch_date), 'MMM dd, yyyy') : 'Por Determinar'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Confianza</p>
                <p className="text-lg font-bold">{npiProduct.launch_confidence_level || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">ROI Esperado</p>
                <p className="text-lg font-bold">{npiProduct.expected_roi || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Progreso</p>
                <p className="text-lg font-bold">{Math.round(progressPercentage)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="milestones">Hitos</TabsTrigger>
          <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Producto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Segmento de Mercado</p>
                    <p className="font-medium">{npiProduct.market_segment || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Volumen Objetivo</p>
                    <p className="font-medium">{npiProduct.launch_volume_projection?.toLocaleString() || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Semanas de Escalamiento</p>
                    <p className="font-medium">{npiProduct.ramp_up_weeks || 'Por Determinar'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Productos de Canibalización</p>
                    <p className="font-medium">{npiProduct.cannibalization_products?.length || 0} productos</p>
                  </div>
                </div>
                {npiProduct.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{npiProduct.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progreso de Hitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progreso General</span>
                    <span className="text-sm text-muted-foreground">
                      {completedMilestones}/{totalMilestones} completados
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  
                  <div className="space-y-2">
                    {productMilestones.slice(0, 5).map((milestone) => {
                      const StatusIcon = milestoneStatusIcons[milestone.milestone_status as keyof typeof milestoneStatusIcons];
                      return (
                        <div key={milestone.id} className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${milestoneStatusColors[milestone.milestone_status as keyof typeof milestoneStatusColors]}`} />
                          <span className="text-sm flex-1">{milestone.milestone_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(milestone.milestone_date), 'MMM dd')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {productMilestones.length > 5 && (
                    <Button variant="link" className="text-sm p-0">
                      Ver todos los {productMilestones.length} hitos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hitos del Proyecto</CardTitle>
                <Button>Agregar Hito</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productMilestones.map((milestone) => {
                  const StatusIcon = milestoneStatusIcons[milestone.milestone_status as keyof typeof milestoneStatusIcons];
                  return (
                    <div key={milestone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <StatusIcon className={`h-5 w-5 ${milestoneStatusColors[milestone.milestone_status as keyof typeof milestoneStatusColors]}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{milestone.milestone_name}</h4>
                          <Badge variant="outline" className={
                            milestone.milestone_priority === 'high' ? 'border-red-200 text-red-600' : 
                            milestone.milestone_priority === 'medium' ? 'border-yellow-200 text-yellow-600' : 
                            'border-green-200 text-green-600'
                          }>
                            {milestone.milestone_priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Vencimiento: {format(new Date(milestone.milestone_date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Asignado a: {milestone.responsible_person || 'Sin asignar'}
                        </p>
                        {milestone.notes && (
                          <p className="text-sm mt-2">{milestone.notes}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  );
                })}
                
                {productMilestones.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aún no se han definido hitos</p>
                    <Button className="mt-4">Crear Primer Hito</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Escenarios de Pronóstico</CardTitle>
                <Button>Agregar Escenario</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productScenarios.map((scenario) => (
                  <div key={scenario.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{scenario.scenario_name}</h4>
                      <Badge variant="outline">
                        {scenario.confidence_level || 'Sin datos'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor del Pronóstico</p>
                        <p className="font-medium">{scenario.forecast_value?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo de Escenario</p>
                        <p className="font-medium">{scenario.scenario_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha de Registro</p>
                        <p className="font-medium">
                          {scenario.postdate ? format(new Date(scenario.postdate), 'MMM yyyy') : 'Por Determinar'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nivel de Confianza</p>
                        <p className="font-medium">{scenario.confidence_level || 'N/A'}</p>
                      </div>
                    </div>
                    {scenario.assumptions && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">Suposiciones</p>
                        <p className="text-sm">{scenario.assumptions}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {productScenarios.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aún no se han definido escenarios</p>
                    <Button className="mt-4">Crear Primer Escenario</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Lanzamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">El gráfico de rendimiento irá aquí</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seguimiento de ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ROI Esperado</span>
                    <span className="font-semibold">{npiProduct.expected_roi || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ROI Actual</span>
                    <span className="font-semibold">12.5%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-center pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Inversión</p>
                      <p className="text-lg font-semibold">$250K</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retorno</p>
                      <p className="text-lg font-semibold">$31K</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}