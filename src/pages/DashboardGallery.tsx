import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Dashboard {
  uuid: string;
  dashboard_title?: string;
}

export default function DashboardGallery() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const { data, error } = await supabase
        .from('embedded_dashboards')
        .select('uuid');

      if (error) throw error;
      
      // For now, we'll create mock titles since the join might not work
      const dashboardsWithTitles = (data || []).map((item, index) => ({
        uuid: item.uuid,
        dashboard_title: `Dashboard ${index + 1}`
      }));
      
      setDashboards(dashboardsWithTitles);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardClick = (uuid: string) => {
    navigate(`/advanced-reports/${uuid}`);
  };

  const getRandomIcon = () => {
    const icons = [BarChart3, TrendingUp, Users, Target];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Gallery</h1>
          <p className="text-muted-foreground">
            Selecciona un dashboard para visualizar tus datos analíticos
          </p>
        </div>
        <Badge variant="secondary">
          {dashboards.length} dashboards disponibles
        </Badge>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => {
          const IconComponent = getRandomIcon();
          return (
            <Card 
              key={dashboard.uuid} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleDashboardClick(dashboard.uuid)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <IconComponent className="h-8 w-8 text-primary" />
                  <Badge variant="outline">Activo</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {dashboard.dashboard_title || 'Dashboard Sin Título'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Dashboard interactivo con visualizaciones de datos en tiempo real.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDashboardClick(dashboard.uuid);
                    }}
                  >
                    Ver Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {dashboards.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay dashboards disponibles</h3>
          <p className="text-muted-foreground">
            Contacta al administrador para configurar los dashboards.
          </p>
        </div>
      )}
    </div>
  );
}