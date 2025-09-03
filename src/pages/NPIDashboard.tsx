import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Rocket, 
  Clock, 
  Target, 
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Users
} from "lucide-react";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { useNPIMilestones } from "@/hooks/useNPIMilestones";
import { useNPIScenarios } from "@/hooks/useNPIScenarios";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import NewNPIModal from "@/components/NewNPIModal";

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

export default function NPIDashboard() {
  const { npiProducts, loading: productsLoading } = useNPIProducts();
  const { milestones, loading: milestonesLoading } = useNPIMilestones();
  const { scenarios, loading: scenariosLoading } = useNPIScenarios();
  const [showNewNPIModal, setShowNewNPIModal] = useState(false);

  const upcomingMilestones = milestones?.filter(m => 
    m.milestone_status === 'not_started' && 
    new Date(m.milestone_date) > new Date()
  ).slice(0, 5) || [];

  const overdueMilestones = milestones?.filter(m => 
    m.milestone_status === 'not_started' && 
    new Date(m.milestone_date) <= new Date()
  ) || [];

  const getStatusStats = () => {
    const stats = npiProducts?.reduce((acc, product) => {
      acc[product.npi_status] = (acc[product.npi_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return [
      {
        title: "Planificación",
        value: stats.planning || 0,
        change: "+2",
        period: "Este Mes",
        trend: "up" as const,
        icon: Target,
        color: "bg-blue-100 text-blue-600"
      },
      {
        title: "Pre-Lanzamiento",
        value: stats.pre_launch || 0,
        change: "+3",
        period: "Este Mes",
        trend: "up" as const,
        icon: Clock,
        color: "bg-yellow-100 text-yellow-600"
      },
      {
        title: "Lanzamiento",
        value: stats.launch || 0,
        change: "+1",
        period: "Esta Semana",
        trend: "up" as const,
        icon: Rocket,
        color: "bg-green-100 text-green-600"
      },
      {
        title: "Post-Lanzamiento",
        value: stats.post_launch || 0,
        change: "+5",
        period: "Este Trimestre",
        trend: "up" as const,
        icon: CheckCircle,
        color: "bg-purple-100 text-purple-600"
      }
    ];
  };

  const statsCards = getStatusStats();

  if (productsLoading || milestonesLoading || scenariosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Panel NPI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel NPI</h1>
          <p className="text-muted-foreground">Resumen del Pipeline de Introducción de Nuevos Productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analítica
          </Button>
          <Button onClick={() => setShowNewNPIModal(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            Nuevo NPI
          </Button>
        </div>
      </div>

      {/* Alert for Overdue Milestones */}
      {overdueMilestones.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                {overdueMilestones.length} hito{overdueMilestones.length > 1 ? 's' : ''} vencido{overdueMilestones.length > 1 ? 's' : ''} requiere{overdueMilestones.length > 1 ? 'n' : ''} atención
              </span>
              <Button variant="link" className="text-red-600 p-0 h-auto ml-auto">
                Revisar Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(stat => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground">{stat.period}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <Button variant="link" className="p-0 h-auto text-sm text-primary mt-2">
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Launch Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pipeline de Lanzamiento</CardTitle>
              <Button variant="outline" size="sm">
                Ver Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {npiProducts?.slice(0, 8).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium truncate">{product.product?.product_name || 'Unknown Product'}</p>
                      <Badge variant="outline" className={statusColors[product.npi_status]}>
                        {statusLabels[product.npi_status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Lanzamiento: {product.launch_date ? format(new Date(product.launch_date), 'MMM dd, yyyy') : 'PD'}</span>
                      <span>Planificador: {product.responsible_planner || 'Sin asignar'}</span>
                      {product.launch_confidence_level && (
                        <span>Confianza: {product.launch_confidence_level}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/npi-product/${product.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Hitos
              </CardTitle>
              <Button variant="link" className="text-primary p-0 h-auto">
                Ver Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{milestone.milestone_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vencimiento: {format(new Date(milestone.milestone_date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {milestone.responsible_person || 'Sin asignar'}
                  </p>
                </div>
                <Badge variant="outline" className={milestone.milestone_priority === 'high' ? 'border-red-200 text-red-600' : 
                                                 milestone.milestone_priority === 'medium' ? 'border-yellow-200 text-yellow-600' : 
                                                 'border-green-200 text-green-600'}>
                  {milestone.milestone_priority}
                </Badge>
              </div>
            ))}
            {upcomingMilestones.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay próximos hitos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Éxito de Lanzamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">87.5%</span>
              </div>
              <p className="text-sm text-muted-foreground">Tasa de Éxito General</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Este Trimestre</p>
                  <p className="text-lg font-semibold">92%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último Trimestre</p>
                  <p className="text-lg font-semibold">83%</p>
                </div>
              </div>
              <Button variant="link" className="text-primary">Ver Detalles</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impacto en Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ingresos Esperados</span>
                <span className="font-semibold">$2.4M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ingresos Reales</span>
                <span className="font-semibold">$1.8M</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Logro</span>
                <span className="font-medium">75% del objetivo</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Este Año</p>
                  <p className="text-lg font-semibold">$1.8M</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                  <p className="text-lg font-semibold">$2.4M</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewNPIModal 
        open={showNewNPIModal} 
        onClose={() => setShowNewNPIModal(false)} 
      />
    </div>
  );
}