import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { cerrarPoolDatos, crearProducto } from '../src/lib/dataService';
import { hayDiscrepancia } from '../src/lib/reglas/precio';

const productosDemo = [
  { codigo: 'PV-DEMO-001', nombre: 'Arroz Diana', precioActual: 4500, precioEtiqueta: 4500 },
  { codigo: 'PV-DEMO-002', nombre: 'Aceite Premier', precioActual: 12000, precioEtiqueta: 11000 },
  { codigo: 'PV-DEMO-003', nombre: 'Pan Bimbo', precioActual: 3000, precioEtiqueta: null },
  { codigo: 'PV-DEMO-004', nombre: 'Leche Entera', precioActual: 4200, precioEtiqueta: 4500 },
  { codigo: 'PV-DEMO-005', nombre: 'Azúcar Blanca', precioActual: 3800, precioEtiqueta: 3500 },
  { codigo: 'PV-DEMO-006', nombre: 'Huevos AA', precioActual: 16500, precioEtiqueta: 16500 },
  { codigo: 'PV-DEMO-007', nombre: 'Pasta Spaghetti', precioActual: 3200, precioEtiqueta: null },
  { codigo: 'PV-DEMO-008', nombre: 'Café Molido', precioActual: 14500, precioEtiqueta: 15000 },
];

async function limpiarDemo(): Promise<void> {
  execFileSync(
    process.execPath,
    [path.join(process.cwd(), 'scripts', 'limpiar-prueba.mjs'), '--demo'],
    { stdio: 'inherit' },
  );
}

async function main(): Promise<void> {
  try {
    await limpiarDemo();
    for (const producto of productosDemo) {
      await crearProducto(producto);
    }

    console.table(
      productosDemo.map((producto) => ({
        codigo: producto.codigo,
        nombre: producto.nombre,
        precioActual: producto.precioActual,
        precioEtiqueta: producto.precioEtiqueta ?? '—',
        discrepancia: hayDiscrepancia(producto.precioActual, producto.precioEtiqueta) ? 'Sí' : 'No',
      })),
    );
  } catch (error) {
    console.error('No se pudieron cargar los productos demo.', error);
    process.exitCode = 1;
  } finally {
    await cerrarPoolDatos();
  }
}

void main();
