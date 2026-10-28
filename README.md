# GrabaMil - Plataforma Web de Personalización, Renders 3D y Pedidos

Sistema integral para la compra y personalización de productos en línea utilizando cantidades dinámicas, formularios personalizados Drag & Drop, tablas interactivas con renderizado 3D en tiempo real, seguimiento de órdenes, actualización de estados, notificaciones por correo e integración con **Mercado Pago**.

---

## 🛠️ Stack Tecnológico

* **Frontend & BFF:** Next.js (App Router, React 19, TypeScript)
* **Estilos & Diseño:** Tailwind CSS + Lucide Icons
* **Constructor Visual:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
* **Base de Datos & Auth:** Firebase Client SDK + Firebase Admin SDK (Node.js) + Soporte Reactivo LocalStorage
* **Visor 3D Seguro:** HTML5 Sandboxed Engine (`sandbox="allow-scripts"` sin `allow-same-origin`) para mitigación crítica de XSS
* **Pasarela de Pagos:** Mercado Pago SDK (Node.js) con Webhook idempotente y validación criptográfica
* **Despliegue & Nube:** Google Cloud (Cloud Run / App Engine) + GitHub Actions

---

## 🏛️ Arquitectura de Módulos Implementados

### 1. Módulos de Administración
1. **Usuarios:** Generación automática de IDs, roles asignados, contraseña y confirmación. Aplica jerarquía de seguridad estricta:
   * Solo `System Administrator` puede crear roles `System Administrator`.
   * Un usuario `Administrador` no puede crear usuarios `System Administrator`.
   * Un usuario `Agente` no puede crear usuarios `Administrador` ni `System Administrator`.
2. **Roles:** Definición de roles (`system_admin`, `admin`, `agent`, `client`) con identificador único.
3. **Roles y Perfiles:** Asociación dinámica entre cada rol y su perfil de permisos.
4. **Perfiles y Visibilidad de UI:** Matriz interactiva de módulos con toggles activar/desactivar. Si un módulo se apaga, los usuarios con ese perfil no lo ven en la barra lateral ni tienen acceso.
5. **Categorías:** Creación y gestión de categorías de productos.
6. **Estados de Pedidos:** Estados parametrizables con color identificador. Incluye estados base protegidos para el ciclo de Mercado Pago:
   * *Orden recibida* (Inicial por pago aprobado).
   * *Pendiente de pago* (En validación de pasarela).
   * *Cancelado por falta de pago* (Rechazado por Mercado Pago).
7. **Tipos de Formularios:** Definición de tipos (`CLIENTE` y `PRODUCTO`).
8. **Formularios Personalizados:** Constructor visual con función **Drag & Drop** para reordenar elementos sin límite:
   * Inputs (text, number, email, address).
   * Labels / Títulos.
   * Radios y Selects.
   * Tablas interactivas (exclusivo tipo `PRODUCTO`).
   * Botón Cancelar (lógica predeterminada de cerrar) y Botón Enviar (lógica de enviar petición).
9. **Módulo de Renderizado 3D:** Carga de archivos HTML con estructuras de renders 3D visualizados en un iframe sandbox aislado.
10. **Tablas Personalizadas:** Creación de columnas y encabezados dinámicos con ID de renderizado asignado. Permite agregar, quitar y modificar filas interactivamente.
11. **Módulo de Productos:** Catálogo con nombre, descripción, precio, estado (activo/inactivo), imagen, stock, categoría y vinculación a Formulario ID.
12. **Seguimiento de Pedidos:** Listado de órdenes con vista desplegable tipo **acordeón**:
   * Despliega información del módulo de facturación.
   * Despliega formulario personalizado diligenciado y filas de la tabla personalizada.
   * Selector directo para actualizar el estado del pedido.
   * **Disparo automático de correos electrónicos** tanto al cliente como al administrador ante cada cambio de estado.

### 2. Experiencia del Cliente (Tienda & Pasarela)
* **Catálogo Público (`/`):** Listado responsivo con filtros por categoría.
* **Detalle y Personalización (`/products/[id]`):** Selección de cantidades dinámicas, diligenciamiento del formulario personalizado embebido y tabla interactiva con **toggle de previsualizar en 3D**.
* **Módulo de Facturación (`/checkout`):** Formulario embebido de captura de datos de facturación y despacho integrado con Mercado Pago.
* **Resultado de Transacción (`/transaction-result`):** Respuesta de la pasarela con actualización del estado de la orden y confirmación de notificación por correo.

---

## 🚀 Puesta en Marcha

### 1. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

* Tienda pública: `http://localhost:3000`
* Panel de administración: `http://localhost:3000/admin`

### 2. Simulación de Roles y Permisos (RBAC)
En la barra superior del panel administrativo dispones de un selector: **"Actuar como"**:
* **Carlos SuperAdmin (System Administrator):** Acceso total a todos los módulos y capacidad de crear cualquier rol.
* **Mariana Administradora (Administrador):** Acceso restringido según su perfil; no puede crear usuarios ni roles System Administrator.
* **Julian Agente (Agente Comercial):** Solo ve pedidos, productos y tablas; la interfaz oculta automáticamente los demás módulos.
