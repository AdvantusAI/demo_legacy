import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  ArrowLeft,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { useNPIMilestones } from "@/hooks/useNPIMilestones";
import { useNPIScenarios } from "@/hooks/useNPIScenarios";
import { format, subMonths, isAfter, isBefore } from "date-fns";
import { useNavigate } from "react-router-dom";

const statusColors = {
  planning: "bg-blue-100 text-blue-600",
  pre_launch: "bg-yellow-100 text-yellow-600", 
  launch: "bg-green-100 text-green-600",
  post_launch: "bg-purple-100 text-purple-600",
  discontinued: "bg-red-100 text-red-600"
};

export default function NPIAnalytics() {
  const navigate = useNavigate();
  const { npiProducts } = useNPIProducts();
  const { milestones } = useNPIMilestones();
  const { scenarios } = useNPIScenarios();

  // Calculate analytics metrics
  const getAnalyticsData = () => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    
    // Launch performance
    const launchedProducts = npiProducts?.filter(p => p.npi_status === 'post_launch') || [];
    const launchInProgress = npiProducts?.filter(p => p.npi_status === 'launch') || [];
    const preLaunch = npiProducts?.filter(p => p.npi_status === 'pre_launch') || [];
    
    // Revenue metrics
    const totalExpectedRevenue = scenarios?.reduce((sum, s) => sum + (s.forecast_value || 0), 0) || 0;
    const averageConfidence = scenarios?.length || 0;
    
    // Milestone performance
    const totalMilestones = milestones?.length || 0;
    const completedMilestones = milestones?.filter(m => m.milestone_status === 'completed').length || 0;
    const overdueMilestones = milestones?.filter(m => 
      m.milestone_status === 'not_started' && isBefore(new Date(m.milestone_date), now)
    ).length || 0;
    
    // Time to launch analysis
    const timeToLaunch = npiProducts?.map(p => {
      if (p.launch_date && p.created_at) {
        const launchDate = new Date(p.launch_date);
        const createdDate = new Date(p.created_at);
        const timeDiff = launchDate.getTime() - createdDate.getTime();
        return timeDiff / (1000 * 3600 * 24); // Convert to days
      }
      return null;
    }).filter(t => t !== null) || [];
    
    const averageTimeToLaunch = timeToLaunch.length > 0 
      ? timeToLaunch.reduce((sum, t) => sum + t, 0) / timeToLaunch.length 
      : 0;
    
    // Success rate calculation
    const successfulLaunches = launchedProducts.length;
    const totalLaunches = successfulLaunches + (npiProducts?.filter(p => p.npi_status === 'discontinued').length || 0);
    const successRate = totalLaunches > 0 ? (successfulLaunches / totalLaunches) * 100 : 0;
    
    return {
      totalProducts: npiProducts?.length || 0,
      launchedProducts: launchedProducts.length,
      launchInProgress: launchInProgress.length,
      preLaunch: preLaunch.length,
      totalExpectedRevenue,
      averageConfidence,
      totalMilestones,
      completedMilestones,
      overdueMilestones,
      averageTimeToLaunch,
      successRate,
      milestoneCompletionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
    };
  };

  const analytics = getAnalyticsData();

  // Get status distribution
  const getStatusDistribution = () => {
    const distribution = npiProducts?.reduce((acc, product) => {
      acc[product.npi_status] = (acc[product.npi_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return [
      { name: 'Planificación', value: distribution.planning || 0, color: '#3b82f6' },
      { name: 'Pre-Lanzamiento', value: distribution.pre_launch || 0, color: '#eab308' },
      { name: 'Lanzamiento', value: distribution.launch || 0, color: '#22c55e' },
      { name: 'Post-Lanzamiento', value: distribution.post_launch || 0, color: '#8b5cf6' },
      { name: 'Descontinuado', value: distribution.discontinued || 0, color: '#ef4444' }
    ];
  };

  const statusDistribution = getStatusDistribution();

  // Get top performers
  const getTopPerformers = () => {
    return npiProducts?.map(product => ({
      ...product,
      scenario: scenarios?.find(s => s.npi_product_id === product.id),
      milestoneCount: milestones?.filter(m => m.npi_product_id === product.id).length || 0,
      completedMilestones: milestones?.filter(m => m.npi_product_id === product.id && m.milestone_status === 'completed').length || 0
    }))
    .sort((a, b) => (b.scenario?.forecast_value || 0) - (a.scenario?.forecast_value || 0))
    .slice(0, 5) || [];
  };

  const topPerformers = getTopPerformers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/npi-dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analíticas NPI</h1>
            <p className="text-muted-foreground">Métricas de rendimiento e insights</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Rango de Fechas
          </Button>
          <Button variant="outline">
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Productos NPI</p>
                <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+12%</span>
                  <span className="text-sm text-muted-foreground">vs trimestre anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+5.2%</span>
                  <span className="text-sm text-muted-foreground">vs trimestre anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Esperados</p>
                <p className="text-2xl font-bold">${(analytics.totalExpectedRevenue / 1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+18%</span>
                  <span className="text-sm text-muted-foreground">vs trimestre anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo Promedio a Lanzamiento</p>
                <p className="text-2xl font-bold">{Math.round(analytics.averageTimeToLaunch)}d</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">+15d</span>
                  <span className="text-sm text-muted-foreground">vs trimestre anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="milestones">Hitos</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({analytics.totalProducts > 0 ? Math.round((item.value / analytics.totalProducts) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Milestone Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Progreso de Hitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completado General</span>
                    <span className="text-sm font-medium">
                      {analytics.completedMilestones}/{analytics.totalMilestones}
                    </span>
                  </div>
                  <Progress value={analytics.milestoneCompletionRate} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Completados</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">{analytics.completedMilestones}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Pendientes</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {analytics.totalMilestones - analytics.completedMilestones - analytics.overdueMilestones}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Atrasados</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">{analytics.overdueMilestones}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos con Mejor Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{product.product?.product_name || 'Producto Desconocido'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusColors[product.npi_status]}>
                            {product.npi_status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {product.completedMilestones}/{product.milestoneCount} hitos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(product.scenario?.forecast_value || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Ingresos Esperados</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Completado de Hitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico de completado de hitos irá aquí</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Hitos por Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['high', 'medium', 'low'].map((priority) => {
                    const priorityMilestones = milestones?.filter(m => m.milestone_priority === priority) || [];
                    const completed = priorityMilestones.filter(m => m.milestone_status === 'completed').length;
                    const total = priorityMilestones.length;
                    const percentage = total > 0 ? (completed / total) * 100 : 0;
                    
                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">Prioridad {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}</span>
                          <span className="text-sm text-muted-foreground">{completed}/{total}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Proyecciones de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico de proyecciones de ingresos irá aquí</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ROI Promedio Esperado</span>
                    <span className="text-sm font-medium">15.2%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Inversión Total</p>
                      <p className="text-lg font-bold">${analytics.totalProducts * 250}K</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Retorno Esperado</p>
                      <p className="text-lg font-bold">${Math.round(analytics.totalExpectedRevenue / 1000)}K</p>
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