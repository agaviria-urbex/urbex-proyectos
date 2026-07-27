'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProyectosConGrupos, type ProyectoCatalogo } from '@/lib/proyectos-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProyectoAdminDialog } from '@/components/proyectos/ProyectoAdminDialog';
import {
  ExternalLink,
  LogOut,
  FolderKanban,
  Search,
  Settings,
  Loader2,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

export default function ProyectosPage() {
  const { user, logout } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGrupo, setUserGrupo] = useState<string>('');

  // Filtros
  const [searchTitulo, setSearchTitulo] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  // Admin dialog
  const [adminProyecto, setAdminProyecto] = useState<ProyectoCatalogo | null>(null);

  const isUrbex = user?.group?.includes('@urbex') ?? false;

  const cargarProyectos = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProyectosConGrupos(user.email);
      if (res.success && res.data) {
        setProyectos(res.data);
        if (res.grupo) setUserGrupo(res.grupo);
      } else {
        setError(res.error || 'Error cargando proyectos');
      }
    } catch (err) {
      setError('Error de conexión al cargar proyectos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Empresas unicas para filtro
  const empresasUnicas = useMemo(() => {
    const set = new Set(proyectos.map((p) => p.empresa_label));
    return Array.from(set).sort();
  }, [proyectos]);

  // Grupos unicos derivados de los proyectos ya cargados
  const gruposUnicos = useMemo(() => {
    const set = new Set<string>();
    for (const p of proyectos) {
      for (const g of p.grupos || []) {
        if (g.grupo_cognito) set.add(g.grupo_cognito);
      }
    }
    return Array.from(set).sort();
  }, [proyectos]);

  // Filtrado
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (searchTitulo && !p.nombre.toLowerCase().includes(searchTitulo.toLowerCase())) {
        return false;
      }
      if (filterEmpresa && p.empresa_label !== filterEmpresa) {
        return false;
      }
      if (filterGrupo) {
        const grupos = (p.grupos || []).map((g) => g.grupo_cognito);
        if (!grupos.includes(filterGrupo)) return false;
      }
      return true;
    });
  }, [proyectos, searchTitulo, filterEmpresa, filterGrupo]);

  const tienesFiltrosActivos = searchTitulo || filterGrupo || filterEmpresa;

  const limpiarFiltros = () => {
    setSearchTitulo('');
    setFilterGrupo('');
    setFilterEmpresa('');
  };

  const handleAdminClose = (updated: boolean) => {
    setAdminProyecto(null);
    if (updated) {
      cargarProyectos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={URBEX_LOGO} alt="Urbex" className="h-8" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#a738cd]" />
              {isUrbex ? 'Todos los Proyectos' : 'Mis Proyectos'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isUrbex && (
                <span className="text-[#a738cd] font-medium mr-1">@urbex</span>
              )}
              {user?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
            {tienesFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="ml-auto h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título..."
                value={searchTitulo}
                onChange={(e) => setSearchTitulo(e.target.value)}
                className="pl-9"
              />
            </div>
            {gruposUnicos.length > 0 && (
              <select
                value={filterGrupo}
                onChange={(e) => setFilterGrupo(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Todos los grupos</option>
                {gruposUnicos.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
            )}
            {empresasUnicas.length > 1 && (
              <select
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Todas las empresas</option>
                {empresasUnicas.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#a738cd]" />
            <span className="ml-3 text-gray-600">Cargando proyectos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarProyectos}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Grid de proyectos */}
        {!loading && !error && (
          <>
            {proyectosFiltrados.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No se encontraron proyectos</p>
                {tienesFiltrosActivos ? (
                  <p className="text-sm mt-1">
                    Prueba ajustando los filtros de búsqueda.
                  </p>
                ) : (
                  <p className="text-sm mt-1">
                    No tienes proyectos asignados a tu grupo.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {proyectosFiltrados.map((proyecto) => (
                  <div
                    key={proyecto.id}
                    className="w-full bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow px-5 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Izquierda: titulo, empresa, descripcion */}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                          {proyecto.nombre}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {proyecto.empresa_label}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {proyecto.descripcion || 'Sin descripción.'}
                        </p>
                      </div>

                      {/* Derecha: estado + acciones */}
                      <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                        <Badge
                          variant={proyecto.status === 'active' ? 'default' : 'secondary'}
                          className={
                            proyecto.status === 'active'
                              ? 'w-fit bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                              : 'w-fit'
                          }
                        >
                          {proyecto.status === 'active'
                            ? 'Activo'
                            : proyecto.status === 'draft'
                              ? 'Borrador'
                              : 'Archivado'}
                        </Badge>
                        <div className="flex gap-2">
                          <a
                            href={proyecto.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="bg-[#a738cd] hover:bg-[#8c2ca3]">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir proyecto
                            </Button>
                          </a>
                          {isUrbex && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setAdminProyecto(proyecto)}
                              title="Administrar proyecto"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {proyectosFiltrados.length} de {proyectos.length} proyecto(s)
              {userGrupo && !isUrbex && (
                <span className="ml-1">· Grupo: {userGrupo}</span>
              )}
            </div>
          </>
        )}
      </main>

      {/* Admin dialog */}
      {adminProyecto && user && (
        <ProyectoAdminDialog
          proyecto={adminProyecto}
          email={user.email}
          onClose={handleAdminClose}
        />
      )}
    </div>
  );
}
