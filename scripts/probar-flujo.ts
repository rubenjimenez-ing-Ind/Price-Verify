import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  agregarAlCarrito,
  buscarProductos,
  cerrarSesion,
  cerrarPoolDatos,
  crearProducto,
  editarProducto,
  listarProductosAdmin,
  obtenerProductoPorCodigo,
  verCarrito,
  ajustarCantidad,
} from '../src/lib/dataService';
import { ErrorDeNegocio, type CodigoError } from '../src/lib/reglas/errores';

const deviceId = 'dev-test-0001';
let fallas = 0;

function exigir(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

async function paso(id: number, ejecutar: () => Promise<string>): Promise<void> {
  try {
    console.log(`OK ${id}: ${await ejecutar()}`);
  } catch (error) {
    fallas += 1;
    console.error(`FALLA ${id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

async function pasoError(
  id: number,
  codigoEsperado: CodigoError,
  ejecutar: () => Promise<unknown>,
): Promise<void> {
  await paso(id, async () => {
    try {
      await ejecutar();
    } catch (error) {
      exigir(error instanceof ErrorDeNegocio, `Se esperaba ${codigoEsperado}.`);
      exigir(error.codigo === codigoEsperado, `Se esperaba ${codigoEsperado}, se obtuvo ${error.codigo}.`);
      return `error ${codigoEsperado} correcto`;
    }
    throw new Error(`Se esperaba el error ${codigoEsperado}.`);
  });
}

async function limpiarPruebas(): Promise<void> {
  execFileSync(
    process.execPath,
    [path.join(process.cwd(), 'scripts', 'limpiar-prueba.mjs'), '--prueba'],
    { stdio: 'ignore' },
  );
}

async function main(): Promise<void> {
  try {
    await limpiarPruebas();

  await paso(1, async () => {
    const producto = await crearProducto({
      codigo: 'PV-TEST-1',
      nombre: 'Arroz Prueba',
      precioActual: 4500,
      precioEtiqueta: 4500,
    });
    exigir(producto.codigo === 'PV-TEST-1', 'No se creó el producto esperado.');
    return 'producto PV-TEST-1 creado';
  });

  await pasoError(2, 'CODIGO_DUPLICADO', () =>
    crearProducto({
      codigo: 'PV-TEST-1',
      nombre: 'Arroz Prueba duplicado',
      precioActual: 4500,
      precioEtiqueta: 4500,
    }),
  );

  await paso(3, async () => {
    await crearProducto({
      codigo: 'PV-TEST-2',
      nombre: 'Aceite Prueba',
      precioActual: 12000,
      precioEtiqueta: 11000,
    });
    return 'producto discrepante PV-TEST-2 creado';
  });

  await paso(4, async () => {
    await crearProducto({
      codigo: 'PV-TEST-3',
      nombre: 'Pan Prueba',
      precioActual: 3000,
      precioEtiqueta: null,
    });
    return 'producto PV-TEST-3 sin etiqueta creado';
  });

  await paso(5, async () => {
    const productos = await buscarProductos('prueba');
    const codigos = new Set(productos.map((producto) => producto.codigo));
    exigir(
      ['PV-TEST-1', 'PV-TEST-2', 'PV-TEST-3'].every((codigo) => codigos.has(codigo)),
      'La búsqueda no devolvió los tres productos de prueba.',
    );
    return 'búsqueda por nombre encontró los tres productos';
  });

  await paso(6, async () => {
    const resultado = await obtenerProductoPorCodigo('PV-TEST-2');
    exigir(
      resultado.alerta.hay &&
        resultado.alerta.precioCobrado === 12000 &&
        resultado.alerta.precioEtiqueta === 11000,
      'La discrepancia de precio no coincide.',
    );
    return 'alerta indica precio cobrado 12000 y etiqueta 11000';
  });

  await paso(7, async () => {
    const resultado = await obtenerProductoPorCodigo('PV-TEST-3');
    exigir(!resultado.alerta.hay, 'Una etiqueta nula no debe generar alerta.');
    return 'sin alerta para etiqueta nula';
  });

  await paso(8, async () => {
    const resultado = await agregarAlCarrito(deviceId, 'PV-TEST-1', 2);
    exigir(
      resultado.carrito.total === 9000 && resultado.alerta?.hay === false,
      'El total inicial no es 9000.',
    );
    return 'PV-TEST-1 x2, total 9000';
  });

  await paso(9, async () => {
    const resultado = await agregarAlCarrito(deviceId, 'PV-TEST-2', 1);
    exigir(
      resultado.carrito.total === 21000 && resultado.alerta?.hay === true,
      'El total o alerta no coincide.',
    );
    return 'PV-TEST-2 agregado con alerta, total 21000';
  });

  await paso(10, async () => {
    const resultado = await agregarAlCarrito(deviceId, 'PV-TEST-1', 3);
    const item = resultado.carrito.items.find((actual) => actual.codigo === 'PV-TEST-1');
    exigir(item?.cantidad === 5 && resultado.carrito.total === 34500, 'La cantidad no se sumó correctamente.');
    return 'PV-TEST-1 suma a x5, total 34500';
  });

  await paso(11, async () => {
    const resultado = await ajustarCantidad(deviceId, 'PV-TEST-2', 0);
    exigir(resultado.carrito.total === 22500, 'El total tras eliminar no es 22500.');
    return 'PV-TEST-2 eliminado al ajustar a cero, total 22500';
  });

  await paso(12, async () => {
    const productos = await listarProductosAdmin({ busqueda: 'PV-TEST-1' });
    const producto = productos.find((actual) => actual.codigo === 'PV-TEST-1');
    exigir(producto !== undefined, 'No se encontró el producto de prueba.');
    await editarProducto(producto.id, {
      codigo: 'PV-TEST-1',
      nombre: 'Arroz Prueba',
      precioActual: 5000,
      precioEtiqueta: 4500,
    });
    const carrito = await verCarrito(deviceId);
    const item = carrito.items.find((actual) => actual.codigo === 'PV-TEST-1');
    exigir(item?.precioUnitario === 4500 && carrito.total === 22500, 'El precio congelado cambió.');
    return 'precio congelado en 4500; total permanece 22500';
  });

  await paso(13, async () => {
    const resultado = await agregarAlCarrito(deviceId, 'PV-TEST-1', 1);
    const item = resultado.carrito.items.find((actual) => actual.codigo === 'PV-TEST-1');
    exigir(
      item?.cantidad === 6 && item.precioUnitario === 4500 && resultado.carrito.total === 27000,
      'La suma no conservó el precio congelado.',
    );
    return 'al sumar mantiene 4500, cantidad 6, total 27000';
  });

  await pasoError(14, 'DATOS_INVALIDOS', () =>
    agregarAlCarrito(deviceId, 'PV-TEST-1', 0),
  );

  await paso(15, async () => {
    const antes = await verCarrito(deviceId);
    await cerrarSesion(deviceId);
    const despues = await verCarrito(deviceId);
    exigir(
      antes.sesionId !== despues.sesionId &&
        despues.estado === 'activa' &&
        despues.items.length === 0 &&
        despues.total === 0,
      'Cerrar la sesión no creó un carrito vacío nuevo.',
    );
    return 'sesión cerrada; nuevo carrito vacío creado';
  });
  } catch (error) {
    fallas += 1;
    console.error('Falló la preparación o limpieza de la prueba.', error);
  } finally {
    try {
      await limpiarPruebas();
    } catch (error) {
      fallas += 1;
      console.error('No se pudo limpiar el device/producto de prueba.', error);
    }
    await cerrarPoolDatos();
  }

  console.log(`Total de fallas: ${fallas}`);
  if (fallas > 0) process.exitCode = 1;
}

void main();
