import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Flag
} from "lucide-react";
import { useNPIMilestones } from "@/hooks/useNPIMilestones";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const milestoneStatusIcons = {
  not_started: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle
};

const milestoneStatusColors = {
  not_started: "text-gray-500 bg-gray-100",
  in_progress: "text-blue-500 bg-blue-100",
  completed: "text-green-500 bg-green-100",
  cancelled: "text-red-500 bg-red-100"
};

const priorityColors = {
  high: "border-red-200 text-red-600 bg-red-50",
  medium: "border-yellow-200 text-yellow-600 bg-yellow-50",
  low: "border-green-200 text-green-600 bg-green-50"
};

type FilterType = 'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'upcoming';

export default function NPIMilestones() {
  const navigate = useNavigate();
  const { milestones, loading } = useNPIMilestones();
  const { npiProducts } = useNPIProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const now = new Date();
  
  const filteredMilestones = milestones?.filter(milestone => {
    const matchesSearch = milestone.milestone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.responsible_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const dueDate = new Date(milestone.milestone_date);
    
    switch (filter) {
      case 'not_started':
        return milestone.milestone_status === 'not_started';
      case 'in_progress':
        return milestone.milestone_status === 'in_progress';
      case 'completed':
        return milestone.milestone_status === 'completed';
      case 'overdue':
        return milestone.milestone_status === 'not_started' && isBefore(dueDate, now);
      case 'upcoming':
        return milestone.milestone_status === 'not_started' && isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 7));
      default:
        return true;
    }
  }) || [];

  const getProductName = (productId: string) => {
    const product = npiProducts?.find(p => p.id === productId);
    return product?.product?.product_name || 'Producto Desconocido';
  };

  const getStatusStats = () => {
    const stats = milestones?.reduce((acc, milestone) => {
      acc[milestone.milestone_status] = (acc[milestone.milestone_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const overdue = milestones?.filter(m => 
      m.milestone_status === 'not_started' && isBefore(new Date(m.milestone_date), now)
    ).length || 0;

    const upcoming = milestones?.filter(m => 
      m.milestone_status === 'not_started' && 
      isAfter(new Date(m.milestone_date), now) && 
      isBefore(new Date(m.milestone_date), addDays(now, 7))
    ).length || 0;

    return {
      total: milestones?.length || 0,
      not_started: stats.not_started || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      overdue,
      upcoming
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando hitos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/npi-dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Hitos NPI</h1>
            <p className="text-muted-foreground">Seguimiento y gestión de hitos del proyecto</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Hito
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.not_started}</p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            <p className="text-sm text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-muted-foreground">Atrasados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.upcoming}</p>
            <p className="text-sm text-muted-foreground">Próximos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar hitos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'not_started' ? 'default' : 'outline'}
            onClick={() => setFilter('not_started')}
            size="sm"
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilter('overdue')}
            size="sm"
          >
            Atrasados
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Próximos
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completados
          </Button>
        </div>
      </div>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hitos ({filteredMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMilestones.map((milestone) => {
              const StatusIcon = milestoneStatusIcons[milestone.milestone_status as keyof typeof milestoneStatusIcons];
              const dueDate = new Date(milestone.milestone_date);
              const isOverdue = milestone.milestone_status === 'not_started' && isBefore(dueDate, now);
              const isUpcoming = milestone.milestone_status === 'not_started' && 
                               isAfter(dueDate, now) && 
                               isBefore(dueDate, addDays(now, 7));
              
              return (
                <div key={milestone.id} className={`p-4 border rounded-lg ${
                  isOverdue ? 'border-red-200 bg-red-50' : 
                  isUpcoming ? 'border-yellow-200 bg-yellow-50' : 
                  'border-gray-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${milestoneStatusColors[milestone.milestone_status as keyof typeof milestoneStatusColors]}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{milestone.milestone_name}</h3>
                        <Badge variant="outline" className={priorityColors[milestone.milestone_priority as keyof typeof priorityColors]}>
                          <Flag className="h-3 w-3 mr-1" />
                          {milestone.milestone_priority}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Atrasado
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Próximo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {getProductName(milestone.npi_product_id)}
                      </p>
                      
                      {milestone.notes && (
                        <p className="text-sm mb-2">{milestone.notes}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vencimiento: {format(dueDate, 'MMM dd, yyyy')}
                        </div>
                        {milestone.responsible_person && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {milestone.responsible_person}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredMilestones.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron hitos</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Intenta ajustar tu búsqueda o criterios de filtro' 
                    : 'Crea tu primer hito para comenzar'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Hito
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}