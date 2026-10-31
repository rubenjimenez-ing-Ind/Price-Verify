CREATE OR REPLACE VIEW v_carrito
WITH (security_invoker = true) AS
SELECT
  i.id, i.sesion_id, i.producto_id, i.codigo_producto, i.cantidad,
  i.precio_unitario, i.subtotal,
  p.nombre, p.foto_url,
  p.precio_actual   AS precio_actual_vigente,
  p.precio_etiqueta AS precio_etiqueta_vigente
FROM items_carrito i
JOIN productos p ON p.id = i.producto_id;

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_carrito ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, sesiones, items_carrito FROM anon, authenticated;
REVOKE ALL ON v_carrito FROM anon, authenticated;
