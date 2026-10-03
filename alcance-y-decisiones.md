# PriceVerify: alcance y decisiones técnicas

## Propósito

PriceVerify ayuda a una persona a consultar el precio y la disponibilidad de
productos y a calcular cuánto costaría su compra. El MVP se limita a resolver
ese flujo con los datos que el proyecto tenga registrados; no promete precios
en tiempo real ni integraciones que todavía no existen.

## Alcance del MVP

### Incluido

1. **Catálogo de productos:** mostrar nombre, marca, categoría, precio
   registrado y unidades disponibles.
2. **Lista de compra:** permitir seleccionar productos y cantidades, calcular
   el subtotal por producto y el total estimado.
3. **Faltantes:** señalar productos sin unidades suficientes y distinguirlos
   del resto de la lista.
4. **Consulta de precios y disponibilidad:** presentar claramente los datos
   registrados para ayudar al cliente a decidir qué comprar.
5. **Acceso:** autenticar correo y contraseña con Supabase Auth. Las cuentas
   residen en `auth.users`; PriceVerify no guarda contraseñas propias.

### Estado de implementación

- **Disponible:** catálogo básico de productos con precio y stock desde JSON.
- **Disponible:** login conectado a Supabase Auth; las credenciales de usuario
  se administran en Supabase y la sesión local es HttpOnly y cifrada.
- **Disponible:** menú autenticado con edición del nombre propio guardado en
  los metadatos de Supabase Auth; el correo se muestra como solo lectura.
- **Disponible para administradores:** menú para consultar y crear cuentas en
  Supabase Auth, protegido por `app_metadata.role=admin`.
- **Pendiente:** lista de compra, cálculo del total y señalización de faltantes.

### Fuera del MVP

- Sincronización automática de precios, inventario o catálogos de tiendas.
- Garantía de que el precio mostrado sea el precio vigente en una tienda: hasta
  integrar una fuente, es el último valor registrado.
- Recuperación de contraseña, roles, registro público y gestión de perfiles.
- Chatbot con IA, sistema de tickets o atención humana integrada. La ayuda del
  MVP consiste en mostrar información de precio y disponibilidad; un canal de
  soporte se definirá cuando exista uno concreto.
- Pagos, pedidos, entregas, promociones, códigos de barras, notificaciones,
  analítica avanzada o aplicación móvil nativa.
- Despliegue de escritura concurrente sobre archivos JSON como solución de
  producción.

Estos elementos podrán reconsiderarse si aparecen una necesidad comprobada,
una fuente de datos disponible y criterios de aceptación concretos.

## Criterios de aceptación del MVP

- El cliente puede consultar productos con precio y stock registrados.
- Puede agregar productos y cantidades a una lista de compra.
- El total estimado coincide con la suma de precio por cantidad.
- La lista identifica artículos sin stock o con stock menor a la cantidad
  solicitada.
- Los datos no se presentan como una cotización en tiempo real.
- Las páginas y API privadas requieren una sesión firmada. La identidad y
  credenciales se verifican con Supabase Auth.

## Decisiones técnicas

| Tecnología o decisión | Motivo |
| --- | --- |
| **Next.js con App Router** | Ya es la base del repositorio y permite mantener páginas y rutas API en un mismo proyecto. No se añade otro framework ni una arquitectura distribuida para un MVP pequeño. |
| **TypeScript** | Ya está configurado en modo estricto; los tipos de producto y de API ayudan a detectar errores en precios, cantidades y stock antes de ejecutar la aplicación. |
| **Tailwind CSS** | Ya forma parte del stack y permite construir una interfaz adaptable sin sumar una biblioteca de componentes o estilos. |
| **React** | Es la capa de interfaz integrada con Next.js y sirve para gestionar la lista de compra y sus cálculos en pantalla. |
| **Archivos JSON para los datos actuales** | El proyecto ya cuenta con persistencia JSON y datos de demostración, suficiente para validar el flujo sin configurar infraestructura adicional. Es una solución temporal: no se elige para escrituras concurrentes ni producción escalable. |
| **Vitest para pruebas** | Ya está instalado. Se usará para verificar cálculos, validaciones y comportamiento de la lógica sin incorporar otro ejecutor. |
| **Supabase Auth** | Provee verificación de credenciales y almacenamiento seguro de usuarios sin crear ni mantener una tabla propia de contraseñas. La sesión de aplicación se guarda en una cookie HttpOnly cifrada, limitada al tiempo de expiración devuelto por Auth. |
| **Sin integración de precios externa por ahora** | No se ha definido una tienda, API, frecuencia de actualización ni reglas para resolver diferencias de precios. Hasta acordarlo, la aplicación muestra el valor registrado y no afirma que sea en vivo. |
| **Sin dependencias nuevas para el MVP** | El stack instalado cubre la interfaz, el tipado, los estilos y las pruebas iniciales. Añadir servicios o librerías antes de concretar su necesidad aumentaría mantenimiento sin validar el producto. |

## Evolución propuesta

1. Completar el flujo pendiente de lista de compra, total y faltantes con datos
   de demostración.
2. Validar con usuarios que el total y la identificación de faltantes resuelven
   la necesidad principal.
3. Elegir una fuente de precios y stock con reglas claras de actualización y
   mostrar cuándo se actualizaron los datos.
4. Si el perfil necesita más atributos de negocio, crear una tabla de perfiles
   vinculada a `auth.users` con políticas RLS; no duplicar credenciales.

Los pasos posteriores dependen de esas decisiones y no forman parte del MVP
hasta que se definan sus requisitos.
