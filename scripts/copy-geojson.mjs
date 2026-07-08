import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCE_DIR =
  process.env.GEOJSON_SOURCE ||
  'D:\\Dropbox\\Empresa\\Urbex\\Clientes\\Cimento\\Proyecto Matriculas Medellin - Julio 2026\\GeoJSON';

const TARGET_DIR = join(
  root,
  'public',
  'data',
  'cimento',
  'dashboard-matriculas-medellin-fase1',
  'geojson'
);

if (!existsSync(SOURCE_DIR)) {
  console.error(`❌ Directorio origen no encontrado: ${SOURCE_DIR}`);
  console.error('   Define GEOJSON_SOURCE o verifica la ruta de Dropbox.');
  process.exit(1);
}

mkdirSync(TARGET_DIR, { recursive: true });

const files = readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.geojson'));

if (files.length === 0) {
  console.error('❌ No se encontraron archivos .geojson en el directorio origen.');
  process.exit(1);
}

files.forEach((file) => {
  const src = join(SOURCE_DIR, file);
  const dest = join(TARGET_DIR, file);
  copyFileSync(src, dest);
  console.log(`✅ Copiado: ${file}`);
});

console.log(`\n🎉 ${files.length} archivos GeoJSON copiados a ${TARGET_DIR}`);
