CREATE TABLE IF NOT EXISTS productos (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR(64)   NOT NULL,
  nombre          VARCHAR(160)  NOT NULL,
  descripcion     TEXT,
  precio_actual   INTEGER       NOT NULL,
  precio_etiqueta INTEGER,
  foto_url        TEXT,
  activo          BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico UNIQUE (codigo),
  CONSTRAINT productos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT productos_precio_actual_ok CHECK (precio_actual > 0),
  CONSTRAINT productos_precio_etiqueta_ok CHECK (precio_etiqueta IS NULL OR precio_etiqueta > 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (lower(nombre));
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS sesiones (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        VARCHAR(64)  NOT NULL,
  estado           VARCHAR(8)   NOT NULL DEFAULT 'activa',
  total            INTEGER      NOT NULL DEFAULT 0,
  fecha_inicio     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ultima_actividad TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_cierre     TIMESTAMPTZ,
  CONSTRAINT sesiones_estado_valido CHECK (estado IN ('activa', 'cerrada')),
  CONSTRAINT sesiones_total_no_negativo CHECK (total >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_sesiones_activa_por_device
  ON sesiones (device_id) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_sesiones_actividad ON sesiones (estado, ultima_actividad);

CREATE TABLE IF NOT EXISTS items_carrito (
  id              BIGSERIAL    PRIMARY KEY,
  sesion_id       UUID         NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  producto_id     UUID         NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  codigo_producto VARCHAR(64)  NOT NULL,
  cantidad        INTEGER      NOT NULL,
  precio_unitario INTEGER      NOT NULL,
  subtotal        INTEGER      GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT items_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT items_precio_positivo CHECK (precio_unitario > 0),
  CONSTRAINT items_unico_por_sesion UNIQUE (sesion_id, producto_id)
);
CREATE INDEX IF NOT EXISTS idx_items_sesion ON items_carrito (sesion_id);

CREATE OR REPLACE FUNCTION pv_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION pv_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_items_updated_at ON items_carrito;
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON items_carrito
  FOR EACH ROW EXECUTE FUNCTION pv_actualizar_updated_at();
