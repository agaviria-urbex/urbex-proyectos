'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartProps {
  data: {
    labels: Array<string | number>;
    values: number[];
  };
  title: string;
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

export function PieChart({ data }: PieChartProps) {
  // Chart.js legend espera text: string | string[]. Labels numéricos (estrato 1,2,3)
  // provocan TypeError: legendItemText.reduce is not a function.
  const labels = (data.labels ?? []).map((label) => String(label));
  const values = (data.values ?? []).map((value) => Number(value) || 0);

  if (labels.length === 0 || values.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>No hay datos disponibles para este gráfico</p>
      </div>
    );
  }

  const pieColors = values.map(
    (_, i) => PROFESSIONAL_COLORS[i % PROFESSIONAL_COLORS.length]
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: pieColors,
        borderColor: pieColors,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: '#374151',
          font: { size: 12, weight: 500 as const },
          padding: 15,
          generateLabels: (chart: {
            data: {
              labels?: unknown[];
              datasets: Array<{ data: number[] }>;
            };
            getDatasetMeta: (i: number) => {
              data: Array<{ hidden?: boolean }>;
              controller: { getStyle: (i: number) => Record<string, unknown> };
            };
          }) => {
            const chartDataInner = chart.data;
            if (!chartDataInner.labels?.length || !chartDataInner.datasets.length) {
              return [];
            }
            return chartDataInner.labels.map((label, i) => {
              const meta = chart.getDatasetMeta(0);
              const style = meta.controller.getStyle(i);
              return {
                text: String(label ?? ''),
                fillStyle: style.backgroundColor as string,
                strokeStyle: style.borderColor as string,
                lineWidth: (style.borderWidth as number) ?? 1,
                hidden:
                  Number.isNaN(chartDataInner.datasets[0].data[i]) ||
                  Boolean(meta.data[i]?.hidden),
                index: i,
              };
            });
          },
        },
      },
      title: { display: false },
      datalabels: {
        color: '#374151',
        font: { size: 12, weight: 'bold' as const },
        anchor: 'end' as const,
        align: 'end' as const,
        offset: 10,
        formatter: (value: number, context: { dataset: { data: number[] } }) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
          return `${value.toLocaleString('es-CO')} (${percentage}%)`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: {
            label?: string;
            parsed: number;
            dataset: { data: number[] };
          }) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total
              ? ((context.parsed / total) * 100).toFixed(1)
              : '0.0';
            return `${context.label}: ${context.parsed.toLocaleString('es-CO')} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options as never} />;
}
