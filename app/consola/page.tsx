'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { projects } from '@/projects/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, LogOut, FolderKanban } from 'lucide-react';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

export default function ConsolaPage() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={URBEX_LOGO} alt="Urbex" className="h-8" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#a738cd]" />
              Consola Urbex Proyectos
            </h1>
            <p className="text-sm text-muted-foreground">
              Acceso restringido al equipo @urbex · {user?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <p className="text-gray-600 mb-6">
          Proyectos registrados en la plataforma. Haz clic para abrir cada aplicativo.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={`${project.empresa}-${project.id}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.nombre}</CardTitle>
                    <CardDescription className="mt-1">{project.empresaLabel}</CardDescription>
                  </div>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{project.descripcion}</p>
                <p className="text-xs text-muted-foreground font-mono">{project.url}</p>
                <Link href={project.url}>
                  <Button className="w-full bg-[#a738cd] hover:bg-[#8c2ca3]">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir proyecto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
