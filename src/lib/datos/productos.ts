import type { PoolClient, QueryResultRow } from 'pg';
import { subirFotoProducto as subirFoto } from '@/lib/blobImages';
import { consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { LIMITE_BUSQUEDA } from '@/lib/config/priceverify';
import { hayDiscrepancia, describirDiscrepancia } from '@/lib/reglas/precio';
import { normalizarCodigo, normalizarTextoBusqueda, validarDatosProducto } from '@/lib/reglas/producto';
import { pool } from '@/lib/db/conexion';
import type {
  DatosProducto,
  FilaProducto,
  FilaProductoAdmin,
  ProductoConAlerta,
} from './tipos';

interface FilaProductoBD extends QueryResultRow {
  codigo: string;
  nombre: string;
  precio_actual: number;
  foto_url: string | null;
}

interface ProductoBD extends FilaProductoBD {
  id: string;
  descripcion: string | null;
  precio_etiqueta: number | null;
  activo: boolean;
}

function mapearFilaProducto(producto: FilaProductoBD): FilaProducto {
  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    precioActual: producto.precio_actual,
    fotoUrl: producto.foto_url,
  };
}

export async function buscarProductos(texto: string): Promise<FilaProducto[]> {
  const codigo = normalizarCodigo(texto);
  const busqueda = normalizarTextoBusqueda(texto);
  if (!busqueda) return [];

  const filas = await consultar<FilaProductoBD>(
    `SELECT codigo, nombre, precio_actual, foto_url
     FROM productos
     WHERE activo = true
       AND (codigo = $1 OR strpos(translate(lower(nombre), 'áéíóúüñ', 'aeiouun'), $2) > 0)
     ORDER BY lower(nombre), codigo
     LIMIT $3`,
    [codigo, busqueda, LIMITE_BUSQUEDA],
  );
  return filas.map(mapearFilaProducto);
}

export async function obtenerProductoPorCodigo(
  codigo: string,
): Promise<ProductoConAlerta> {
  const filas = await consultar<ProductoBD>(
    `SELECT id, codigo, nombre, descripcion, precio_actual, precio_etiqueta, foto_url, activo
     FROM productos
     WHERE codigo = $1 AND activo = true
     LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  const producto = filas[0];
  if (!producto) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');

  return {
    producto: { ...mapearFilaProducto(producto), descripcion: producto.descripcion },
    alerta: describirDiscrepancia(producto.precio_actual, producto.precio_etiqueta),
  };
}

export async function listarProductosAdmin(
  opciones: { busqueda?: string; incluirInactivos?: boolean } = {},
): Promise<FilaProductoAdmin[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  if (!opciones.incluirInactivos) condiciones.push('activo = true');

  const busqueda = opciones.busqueda?.trim();
  if (busqueda) {
    const indiceCodigo = valores.push(normalizarCodigo(busqueda));
    const indiceTexto = valores.push(normalizarTextoBusqueda(busqueda));
    condiciones.push(
      `(codigo = $${indiceCodigo} OR strpos(translate(lower(nombre), 'áéíóúüñ', 'aeiouun'), $${indiceTexto}) > 0)`,
    );
  }

  const filas = await consultar<ProductoBD>(
    `SELECT id, codigo, nombre, descripcion, precio_actual, precio_etiqueta, foto_url, activo
     FROM productos
     ${condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''}
     ORDER BY lower(nombre), codigo`,
    valores,
  );

  return filas.map((producto) => ({
    ...mapearFilaProducto(producto),
    id: producto.id,
    descripcion: producto.descripcion,
    precioEtiqueta: producto.precio_etiqueta,
    activo: producto.activo,
    hayDiscrepancia: hayDiscrepancia(producto.precio_actual, producto.precio_etiqueta),
  }));
}

export async function crearProducto(
  datos: DatosProducto,
): Promise<{ id: string; codigo: string }> {
  validarDatosProducto({
    ...datos,
    codigo: normalizarCodigo(datos.codigo),
    nombre: datos.nombre.trim(),
  });
  try {
    const resultado = await pool.query<{ id: string; codigo: string }>(
      `INSERT INTO productos (codigo, nombre, descripcion, precio_actual, precio_etiqueta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, codigo`,
      [
        normalizarCodigo(datos.codigo),
        datos.nombre.trim(),
        datos.descripcion?.trim() || null,
        datos.precioActual,
        datos.precioEtiqueta,
      ],
    );
    return resultado.rows[0];
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      error.constraint === 'productos_codigo_unico'
    ) {
      throw new ErrorDeNegocio('CODIGO_DUPLICADO');
    }
    throw error;
  }
}

export async function editarProducto(id: string, datos: DatosProducto): Promise<void> {
  validarDatosProducto({
    ...datos,
    codigo: normalizarCodigo(datos.codigo),
    nombre: datos.nombre.trim(),
  });
  const resultado = await pool.query(
    `UPDATE productos
     SET codigo = $1, nombre = $2, descripcion = $3, precio_actual = $4, precio_etiqueta = $5
     WHERE id = $6`,
    [
      normalizarCodigo(datos.codigo),
      datos.nombre.trim(),
      datos.descripcion?.trim() || null,
      datos.precioActual,
      datos.precioEtiqueta,
      id,
    ],
  );
  if (resultado.rowCount === 0) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
}

export async function subirFotoProducto(
  id: string,
  archivo: Buffer,
  mime: string,
): Promise<{ fotoUrl: string }> {
  const existente = await pool.query('SELECT 1 FROM productos WHERE id = $1', [id]);
  if (existente.rowCount === 0) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');

  const foto = await subirFoto(id, archivo, mime);
  await pool.query('UPDATE productos SET foto_url = $1 WHERE id = $2', [foto.fotoUrl, id]);
  return foto;
}

export async function desactivarProducto(id: string): Promise<void> {
  const resultado = await pool.query(
    'UPDATE productos SET activo = false WHERE id = $1',
    [id],
  );
  if (resultado.rowCount === 0) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
}

export async function obtenerProductoActivo(
  tx: PoolClient,
  codigo: string,
): Promise<ProductoBD> {
  const resultado = await tx.query<ProductoBD>(
    `SELECT id, codigo, nombre, descripcion, precio_actual, precio_etiqueta, foto_url, activo
     FROM productos
     WHERE codigo = $1 AND activo = true
     LIMIT 1
     FOR SHARE`,
    [normalizarCodigo(codigo)],
  );
  const producto = resultado.rows[0];
  if (!producto) throw new ErrorDeNegocio('PRODUCTO_NO_ENCONTRADO');
  return producto;
}
