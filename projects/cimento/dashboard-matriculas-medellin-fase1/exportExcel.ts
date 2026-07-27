import ExcelJS from 'exceljs';
import type { Feature } from 'geojson';

type Props = Record<string, unknown>;

const COLUMNS: Array<{ header: string; key: string; width: number }> = [
  { header: 'Matrícula', key: 'matricula_inmobiliaria', width: 15 },
  { header: 'Matrícula Completa', key: 'matricula_completa', width: 18 },
  { header: 'Oficina Registro', key: 'oficina_registro', width: 15 },
  { header: 'Dirección Predio', key: 'direccion_predio', width: 30 },
  { header: 'Dirección Catastral', key: 'direccion_catastral', width: 30 },
  { header: 'Dirección CTL', key: 'direccion_ctl', width: 30 },
  { header: 'Dirección SNR', key: 'direccion_snr', width: 30 },
  { header: 'CBML', key: 'cbml', width: 15 },
  { header: 'Cobama', key: 'cobama', width: 12 },
  { header: 'Destinación Principal', key: 'destinacion_principal', width: 20 },
  { header: 'Destinaciones', key: 'destinaciones', width: 20 },
  { header: 'Estrato', key: 'estrato', width: 10 },
  { header: 'Estrato Usos', key: 'estrato_usos', width: 12 },
  { header: 'Área Terreno', key: 'area_terreno', width: 14 },
  { header: 'Área Construida', key: 'area_construida', width: 15 },
  { header: 'N° Construcciones', key: 'n_construcciones', width: 16 },
  { header: 'N° Predios Usos', key: 'n_predios_usos', width: 14 },
  { header: 'Pisos Máx', key: 'pisos_max', width: 12 },
  { header: 'Avalúo Total', key: 'avaluototal', width: 18 },
  { header: 'Uso Predial', key: 'usopredial', width: 12 },
  { header: 'N° Propietarios', key: 'nropropietarios', width: 14 },
  { header: 'Porcentaje Derecho', key: 'pordes', width: 16 },
  { header: 'Comuna', key: 'nomcomuna', width: 18 },
  { header: 'Código Comuna', key: 'codcomuna', width: 14 },
  { header: 'Barrio', key: 'barrio', width: 18 },
  { header: 'Barrio (DS)', key: 'ds_barrio', width: 18 },
  { header: 'Código Barrio', key: 'codbarrio', width: 12 },
  { header: 'Manzana', key: 'manzana', width: 10 },
  { header: 'Cédula Catastral', key: 'cedcat', width: 14 },
  { header: 'Urbanización', key: 'urbanizacion', width: 18 },
  { header: 'Indicador U/R', key: 'indicadoru/r', width: 12 },
  { header: 'MZ IGAC', key: 'mz_igac', width: 24 },
  { header: 'Latitud', key: 'latitud', width: 14 },
  { header: 'Longitud', key: 'longitud', width: 14 },
  { header: 'Fecha CTL', key: 'fecha_ctl', width: 14 },
  { header: 'URL CTL', key: 'url_ctl', width: 40 },
  { header: 'Doc ID', key: 'docid', width: 14 },
  { header: 'Fuente', key: 'fuente', width: 12 },
];

function toCellValue(value: unknown): string | number {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';

  const asString = String(value);
  const asNumber = Number(asString);
  if (asString.trim() !== '' && Number.isFinite(asNumber) && /^-?\d+(\.\d+)?$/.test(asString.trim())) {
    return asNumber;
  }

  return asString;
}

function getMatriculaRows(features: Feature[]): Props[] {
  return features
    .filter((feature) => String(feature.properties?.fuente ?? '') === 'matricula')
    .map((feature) => (feature.properties ?? {}) as Props);
}

export async function exportMatriculasToExcel(features: Feature[]): Promise<void> {
  const rows = getMatriculaRows(features);
  if (rows.length === 0) {
    throw new Error('No hay matrículas para exportar');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Matrículas Medellín');

  worksheet.columns = COLUMNS;

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE1D4FF' },
  };

  rows.forEach((props) => {
    const row: Record<string, string | number> = {};
    COLUMNS.forEach(({ key }) => {
      row[key] = toCellValue(props[key]);
    });
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `matriculas_medellin_fase1_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
