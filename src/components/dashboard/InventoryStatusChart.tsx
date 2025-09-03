
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function InventoryStatusChart() {
  const data = [
    { name: 'Stock Normal', value: 65, color: '#10B981' },
    { name: 'Stock Bajo', value: 20, color: '#F59E0B' },
    { name: 'Stock Crítico', value: 10, color: '#EF4444' },
    { name: 'Exceso', value: 5, color: '#8B5CF6' }
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
