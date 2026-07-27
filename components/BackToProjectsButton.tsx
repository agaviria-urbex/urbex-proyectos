'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackToProjectsButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/proyectos">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a proyectos
      </Link>
    </Button>
  );
}
