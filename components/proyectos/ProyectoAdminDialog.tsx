'use client';

import { useState, useEffect } from 'react';
import {
  editarProyecto,
  listarGrupos,
  asignarGrupo,
  eliminarGrupo,
  type ProyectoCatalogo,
  type GrupoAcceso,
} from '@/lib/proyectos-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Users,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

interface Props {
  proyecto: ProyectoCatalogo;
  email: string;
  onClose: (updated: boolean) => void;
}

export function ProyectoAdminDialog({ proyecto, email, onClose }: Props) {
  const [updated, setUpdated] = useState(false);

  // Metadata form
  const [nombre, setNombre] = useState(proyecto.nombre);
  const [descripcion, setDescripcion] = useState(proyecto.descripcion || '');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaMsg, setMetaMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Grupos
  const [grupos, setGrupos] = useState<GrupoAcceso[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [savingGrupo, setSavingGrupo] = useState(false);
  const [removingGrupo, setRemovingGrupo] = useState<number | null>(null);
  const [grupoMsg, setGrupoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    loadGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGrupos = async () => {
    setLoadingGrupos(true);
    try {
      const res = await listarGrupos(email, proyecto.id);
      if (res.success && res.data) {
        setGrupos(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrupos(false);
    }
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    setMetaMsg(null);
    try {
      const campos: { nombre?: string; descripcion?: string } = {};
      if (nombre.trim() !== proyecto.nombre) campos.nombre = nombre.trim();
      if (descripcion.trim() !== (proyecto.descripcion || '')) campos.descripcion = descripcion.trim();

      if (Object.keys(campos).length === 0) {
        setMetaMsg({ type: 'err', text: 'No hay cambios para guardar.' });
        return;
      }

      const res = await editarProyecto(email, proyecto.id, campos);
      if (res.success) {
        setMetaMsg({ type: 'ok', text: 'Proyecto actualizado.' });
        setUpdated(true);
      } else {
        setMetaMsg({ type: 'err', text: res.error || 'Error al guardar.' });
      }
    } catch {
      setMetaMsg({ type: 'err', text: 'Error de conexión.' });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleAddGrupo = async () => {
    if (!nuevoGrupo.trim()) return;
    setSavingGrupo(true);
    setGrupoMsg(null);
    try {
      const res = await asignarGrupo(email, proyecto.id, nuevoGrupo.trim());
      if (res.success) {
        setNuevoGrupo('');
        setGrupoMsg({ type: 'ok', text: 'Grupo asignado.' });
        setUpdated(true);
        await loadGrupos();
      } else {
        setGrupoMsg({ type: 'err', text: res.error || 'Error al asignar grupo.' });
      }
    } catch {
      setGrupoMsg({ type: 'err', text: 'Error de conexión.' });
    } finally {
      setSavingGrupo(false);
    }
  };

  const handleRemoveGrupo = async (grupo: GrupoAcceso) => {
    setRemovingGrupo(grupo.id);
    setGrupoMsg(null);
    try {
      const res = await eliminarGrupo(email, proyecto.id, grupo.grupo_cognito);
      if (res.success) {
        setGrupoMsg({ type: 'ok', text: `Grupo ${grupo.grupo_cognito} eliminado.` });
        setUpdated(true);
        await loadGrupos();
      } else {
        setGrupoMsg({ type: 'err', text: res.error || 'Error al eliminar grupo.' });
      }
    } catch {
      setGrupoMsg({ type: 'err', text: 'Error de conexión.' });
    } finally {
      setRemovingGrupo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose(updated)}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Administrar Proyecto
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onClose(updated)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Seccion: Editar metadata */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-[#a738cd]" />
              <h3 className="font-medium text-gray-900">Información del proyecto</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="nombre">Título</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Título del proyecto"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del proyecto"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              {metaMsg && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                    metaMsg.type === 'ok'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {metaMsg.type === 'ok' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {metaMsg.text}
                </div>
              )}

              <Button
                onClick={handleSaveMeta}
                disabled={savingMeta}
                className="bg-[#a738cd] hover:bg-[#8c2ca3]"
              >
                {savingMeta ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar cambios
              </Button>
            </div>
          </section>

          <hr />

          {/* Seccion: Gestionar grupos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-[#a738cd]" />
              <h3 className="font-medium text-gray-900">Grupos con acceso</h3>
            </div>

            {/* Lista de grupos */}
            {loadingGrupos ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando grupos...
              </div>
            ) : grupos.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No hay grupos asignados. Solo @urbex puede ver este proyecto.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {grupos.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-1.5 py-1"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {g.grupo_cognito}
                    </span>
                    <button
                      onClick={() => handleRemoveGrupo(g)}
                      disabled={removingGrupo === g.id}
                      className="p-0.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title={`Eliminar ${g.grupo_cognito}`}
                    >
                      {removingGrupo === g.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar grupo */}
            <div className="flex gap-2">
              <Input
                value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)}
                placeholder="Ej: @cimento"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                className="flex-1"
              />
              <Button
                onClick={handleAddGrupo}
                disabled={savingGrupo || !nuevoGrupo.trim()}
                variant="outline"
              >
                {savingGrupo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {grupoMsg && (
              <div
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md mt-3 ${
                  grupoMsg.type === 'ok'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {grupoMsg.type === 'ok' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {grupoMsg.text}
              </div>
            )}
          </section>

          {/* Info */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{proyecto.url}</code></p>
            <p className="mt-1">
              Empresa: {proyecto.empresa_label} · Slug: {proyecto.slug}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
