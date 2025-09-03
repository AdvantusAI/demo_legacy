import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  AlertCircle, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { ExceptionSummary } from '@/services/exceptionService';

interface ExceptionKPICardsProps {
  summary: ExceptionSummary;
  loading?: boolean;
}

export const ExceptionKPICards: React.FC<ExceptionKPICardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      title: 'CRÍTICAS',
      value: summary.critical_count,
      subtitle: 'Riesgo Agotamiento',
      icon: ShieldAlert,
      color: 'red',
      bgGradient: 'from-red-500/10 to-red-500/5',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      pulse: summary.critical_count > 0
    },
    {
      title: 'ALTAS',
      value: summary.high_count,
      subtitle: 'Stock Seguridad',
      icon: AlertTriangle,
      color: 'orange',
      bgGradient: 'from-orange-500/10 to-orange-500/5',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      title: 'PENDIENTES',
      value: summary.total_count,
      subtitle: 'Sin resolver',
      icon: BarChart3,
      color: 'blue',
      bgGradient: 'from-blue-500/10 to-blue-500/5',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'IMPACTO',
      value: `$${(summary.estimated_financial_impact || 0).toLocaleString('es-MX', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })}`,
      subtitle: 'Estimado',
      icon: DollarSign,
      color: 'green',
      bgGradient: 'from-green-500/10 to-green-500/5',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`
            relative overflow-hidden transition-all duration-300 hover:shadow-lg
            ${card.borderColor} border-2
            ${card.pulse ? 'animate-pulse-subtle' : ''}
          `}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
          
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${card.iconBg} shadow-sm`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {typeof card.value === 'number' ? card.value : card.value}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{card.subtitle}</p>
              {card.pulse && (
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${card.iconBg} animate-pulse`} />
                  <span className="text-xs text-gray-500">Activo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Add subtle pulse animation to globals.css or inline
const pulseStyle = `
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
    }
  }
  
  .animate-pulse-subtle {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;