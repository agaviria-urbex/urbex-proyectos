'use client';

import type { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartWrapper({
  title,
  children,
  className = '',
}: ChartWrapperProps) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-6 shadow-sm ${className}`}
    >
      <h4 className="mb-6 border-b border-gray-100 pb-3 text-center text-lg font-bold text-gray-800">
        {title}
      </h4>
      <div className="relative h-80">{children}</div>
    </div>
  );
}
