'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface BarChartProps {
  data: {
    labels: Array<string | number>;
    values: number[];
  };
  title: string;
  horizontal?: boolean;
  colors?: string[];
}

const PROFESSIONAL_COLORS = [
  '#2563EB',
  '#059669',
  '#DC2626',
  '#a738cd',
  '#EA580C',
  '#0891B2',
  '#4338CA',
  '#BE185D',
  '#065F46',
  '#7F1D1D',
  '#581C87',
  '#9A3412',
];

export function CustomBarChart({
  data,
  title,
  horizontal = false,
  colors,
}: BarChartProps) {
  const labels = (data.labels ?? []).map((label) => String(label));
  const values = (data.values ?? []).map((value) => Number(value) || 0);

  if (labels.length === 0 || values.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>No hay datos disponibles para este gráfico</p>
      </div>
    );
  }

  const barColors =
    colors ||
    values.map((_, i) => PROFESSIONAL_COLORS[i % PROFESSIONAL_COLORS.length]);

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: barColors,
        borderColor: barColors,
        borderWidth: 1,
        borderRadius: horizontal ? 4 : 6,
        borderSkipped: false as const,
      },
    ],
  };

  const options = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      datalabels: {
        anchor: 'end' as const,
        align: horizontal ? ('right' as const) : ('top' as const),
        color: '#374151',
        font: { weight: 'bold' as const, size: 12 },
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
          return value.toLocaleString('es-CO');
        },
        padding: 6,
        offset: 4,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { parsed: { y?: number; x?: number } }) =>
            `${(context.parsed.y ?? context.parsed.x)?.toLocaleString('es-CO') ?? ''}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: true, color: 'rgba(100, 116, 139, 0.3)' },
        ticks: {
          color: '#374151',
          font: { size: 11 },
          maxRotation: horizontal ? 0 : 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: { display: true, color: 'rgba(100, 116, 139, 0.3)' },
        ticks: {
          color: '#374151',
          font: { size: 11 },
          callback: (value: string | number) => {
            const num = Number(value);
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
            return num.toLocaleString('es-CO');
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options as never} />;
}
