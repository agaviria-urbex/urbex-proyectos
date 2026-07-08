'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DestinacionBarChartProps {
  data: Record<string, number>;
}

export function DestinacionBarChart({ data }: DestinacionBarChartProps) {
  const chartData = Object.entries(data).map(([name, count]) => ({
    name,
    count,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, 'Matrículas']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="count" fill="#a738cd" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
