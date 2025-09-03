
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DemandTrendChart() {
  const data = [
    { month: 'Ene', demanda: 2400, pronostico: 2200 },
    { month: 'Feb', demanda: 1398, pronostico: 1400 },
    { month: 'Mar', demanda: 9800, pronostico: 9500 },
    { month: 'Abr', demanda: 3908, pronostico: 4000 },
    { month: 'May', demanda: 4800, pronostico: 4600 },
    { month: 'Jun', demanda: 3800, pronostico: 3900 },
    { month: 'Jul', demanda: 4300, pronostico: 4200 }
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="demanda" 
            stroke="#3B82F6" 
            strokeWidth={2}
            name="Demanda Real"
          />
          <Line 
            type="monotone" 
            dataKey="pronostico" 
            stroke="#EF4444" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Pronóstico"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
