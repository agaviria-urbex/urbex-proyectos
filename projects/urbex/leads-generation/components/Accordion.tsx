'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: number | string;
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  badge,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-purple-50/60 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          {title}
          {badge !== undefined && (
            <Badge className="bg-[#a738cd] hover:bg-[#a738cd] text-white">
              {badge}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-[#a738cd] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && <div className="border-t border-gray-100 px-4 py-4">{children}</div>}
    </div>
  );
}
