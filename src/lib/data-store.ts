import {
  Role,
  Profile,
  RoleProfileAssociation,
  User,
  ProductCategory,
  OrderStatus,
  FormTypeItem,
  CustomForm,
  CustomTable,
  Render3D,
  Product,
  Order,
  ModuleKey,
  RoleType,
} from "@/types";

// Clave de almacenamiento en LocalStorage
const STORAGE_KEY = "grabamil_database_v1";

export interface DatabaseState {
  users: User[];
  roles: Role[];
  profiles: Profile[];
  rolesProfiles: RoleProfileAssociation[];
  categories: ProductCategory[];
  orderStatuses: OrderStatus[];
  formTypes: FormTypeItem[];
  renders: Render3D[];
  customTables: CustomTable[];
  customForms: CustomForm[];
  products: Product[];
  orders: Order[];
}

// Datos semilla iniciales del sistema
export const INITIAL_DATABASE_STATE: DatabaseState = {
  roles: [
    { id: "role-system-admin", name: "System Administrator", type: "system_admin", createdAt: "2026-01-01T00:00:00Z" },
    { id: "role-admin", name: "Administrador", type: "admin", createdAt: "2026-01-01T00:00:00Z" },
    { id: "role-agent", name: "Agente Comercial", type: "agent", createdAt: "2026-01-01T00:00:00Z" },
    { id: "role-client", name: "Cliente", type: "client", createdAt: "2026-01-01T00:00:00Z" },
  ],
  profiles: [
    {
      id: "prof-system-admin",
      name: "Acceso Total Super Administrador",
      modules: {
        users: true,
        roles: true,
        roles_profiles: true,
        profiles: true,
        categories: true,
        order_statuses: true,
        form_types: true,
        custom_forms: true,
        custom_tables: true,
        renders: true,
        products: true,
        orders: true,
      },
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prof-admin",
      name: "Administrador de Operaciones y Productos",
      modules: {
        users: true,
        roles: false,
        roles_profiles: false,
        profiles: false,
        categories: true,
        order_statuses: true,
        form_types: true,
        custom_forms: true,
        custom_tables: true,
        renders: true,
        products: true,
        orders: true,
      },
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prof-agent",
      name: "Agente de Seguimiento y Pedidos",
      modules: {
        users: false,
        roles: false,
        roles_profiles: false,
        profiles: false,
        categories: false,
        order_statuses: false,
        form_types: false,
        custom_forms: false,
        custom_tables: true,
        renders: false,
        products: true,
        orders: true,
      },
      createdAt: "2026-01-01T00:00:00Z",
    },
  ],
  rolesProfiles: [
    { id: "rp-1", roleId: "role-system-admin", profileId: "prof-system-admin", updatedAt: "2026-01-01T00:00:00Z" },
    { id: "rp-2", roleId: "role-admin", profileId: "prof-admin", updatedAt: "2026-01-01T00:00:00Z" },
    { id: "rp-3", roleId: "role-agent", profileId: "prof-agent", updatedAt: "2026-01-01T00:00:00Z" },
  ],
  users: [
    { id: "usr-sysadmin-1", name: "Carlos SuperAdmin", email: "system@grabamil.com", roleId: "role-system-admin", createdAt: "2026-01-01T00:00:00Z" },
    { id: "usr-admin-1", name: "Mariana Administradora", email: "admin@grabamil.com", roleId: "role-admin", createdAt: "2026-01-02T00:00:00Z" },
    { id: "usr-agent-1", name: "Julian Agente", email: "agente@grabamil.com", roleId: "role-agent", createdAt: "2026-01-03T00:00:00Z" },
  ],
  categories: [
    { id: "cat-1", name: "Joyería & Anillos", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-2", name: "Placas & Trofeos", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-3", name: "Artículos Promocionales", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-4", name: "Grabados Industriales", createdAt: "2026-01-01T00:00:00Z" },
  ],
  orderStatuses: [
    { id: "st-recibida", name: "Orden recibida", color: "#10b981", isDefaultInitial: true, createdAt: "2026-01-01T00:00:00Z" },
    { id: "st-pendiente", name: "Pendiente de pago", color: "#f59e0b", isPendingPayment: true, createdAt: "2026-01-01T00:00:00Z" },
    { id: "st-cancelada", name: "Cancelado por falta de pago", color: "#ef4444", isCancelled: true, createdAt: "2026-01-01T00:00:00Z" },
    { id: "st-produccion", name: "En Grabado / Producción", color: "#3b82f6", createdAt: "2026-01-01T00:00:00Z" },
    { id: "st-enviado", name: "Enviado al Cliente", color: "#8b5cf6", createdAt: "2026-01-01T00:00:00Z" },
    { id: "st-entregado", name: "Entregado Exitosamente", color: "#059669", createdAt: "2026-01-01T00:00:00Z" },
  ],
  formTypes: [
    { id: "ft-cliente", name: "CLIENTE", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ft-producto", name: "PRODUCTO", createdAt: "2026-01-01T00:00:00Z" },
  ],
  renders: [
    {
      id: "render-anillo-3d",
      name: "Visor 3D Anillo Metálico Interactivo",
      createdAt: "2026-01-01T00:00:00Z",
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, sans-serif;
      color: #e2e8f0;
      user-select: none;
    }
    .scene {
      width: 260px;
      height: 260px;
      perspective: 1000px;
    }
    .ring-container {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      animation: rotateRing 12s infinite linear;
    }
    .ring {
      position: absolute;
      width: 200px;
      height: 200px;
      top: 30px;
      left: 30px;
      border: 24px solid #cbd5e1;
      border-radius: 50%;
      box-shadow: 0 0 35px rgba(203, 213, 225, 0.4), inset 0 0 25px rgba(0,0,0,0.8);
      transform: rotateX(65deg) rotateY(15deg);
      background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(100,116,139,0.2));
    }
    .engraving-badge {
      position: absolute;
      top: 15px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #38bdf8;
      border-radius: 9999px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #38bdf8;
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
    }
    .hud {
      position: absolute;
      bottom: 15px;
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    @keyframes rotateRing {
      0% { transform: rotateY(0deg) rotateX(15deg); }
      100% { transform: rotateY(360deg) rotateX(15deg); }
    }
  </style>
</head>
<body>
  <div class="engraving-badge" id="engraveText">Render 3D: Anillo en Tiempo Real</div>
  <div class="scene">
    <div class="ring-container">
      <div class="ring"></div>
    </div>
  </div>
  <div class="hud">Visualización Interactiva 360° • GrabaMil 3D Engine</div>
  <script>
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'UPDATE_RENDER_TEXT') {
        const el = document.getElementById('engraveText');
        if (el) el.innerText = 'Grabado: ' + e.data.text;
      }
    });
  </script>
</body>
</html>`,
    },
    {
      id: "render-placa-3d",
      name: "Visor 3D Placa Trofeo Prisma",
      createdAt: "2026-01-02T00:00:00Z",
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, sans-serif;
      color: #f4f4f5;
    }
    .trophy {
      width: 140px;
      height: 200px;
      background: linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(202, 138, 4, 0.8));
      border: 3px solid #fef08a;
      box-shadow: 0 0 30px rgba(234, 179, 8, 0.35);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotateY(20deg) rotateX(10deg);
      animation: float 6s ease-in-out infinite alternate;
      text-align: center;
      padding: 12px;
      font-size: 13px;
      font-weight: bold;
      color: #713f12;
    }
    @keyframes float {
      0% { transform: rotateY(-20deg) rotateX(8deg) translateY(-5px); }
      100% { transform: rotateY(20deg) rotateX(12deg) translateY(5px); }
    }
  </style>
</head>
<body>
  <div class="trophy" id="trophyText">Placa Dorada de Honor</div>
  <p style="font-size: 11px; color: #a1a1aa; margin-top: 15px;">Trofeo Metálico 3D Personalizado</p>
  <script>
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'UPDATE_RENDER_TEXT') {
        const el = document.getElementById('trophyText');
        if (el) el.innerText = e.data.text;
      }
    });
  </script>
</body>
</html>`,
    },
  ],
  customTables: [
    {
      id: "tbl-anillo-especificaciones",
      name: "Especificaciones de Grabado en Joyería",
      renderId: "render-anillo-3d",
      columns: [
        { id: "col-1", header: "Texto o Iniciales a Grabar", type: "text" },
        { id: "col-2", header: "Tipografía", type: "select", options: ["Cursiva Elegante", "Moderna Sans", "Gótica Clásica", "Romana"] },
        { id: "col-3", header: "Posición", type: "select", options: ["Interior del Aro", "Exterior Frontal", "Lateral"] },
        { id: "col-4", header: "Profundidad (mm)", type: "number" },
      ],
      initialRows: [
        { "col-1": "Amor Eterno 2026", "col-2": "Cursiva Elegante", "col-3": "Interior del Aro", "col-4": 0.5 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
  ],
  customForms: [
    {
      id: "form-joyas-producto",
      name: "Formulario de Personalización de Joyas",
      formTypeId: "ft-producto",
      customTableId: "tbl-anillo-especificaciones",
      elements: [
        { id: "elem-1", type: "label", label: "Personaliza tu pieza única de joyería grabada", order: 0 },
        { id: "elem-2", type: "select", label: "Acabado del Metal", placeholder: "Selecciona el acabado", options: ["Titanio Cepillado", "Plata 925 Brillante", "Oro Rosa 18K", "Negro Mate Tungsteno"], required: true, order: 1 },
        { id: "elem-3", type: "radio", label: "Talla del Anillo", options: ["6 US (16.5 mm)", "7 US (17.3 mm)", "8 US (18.1 mm)", "9 US (19.0 mm)", "10 US (19.8 mm)"], required: true, order: 2 },
        { id: "elem-4", type: "text", label: "Dedicatoria especial en estuche", placeholder: "Ej. Para mi persona favorita...", required: false, order: 3 },
        { id: "elem-5", type: "custom_table", label: "Detalles del Grabado Láser (Incluye render 3D interactivo)", required: true, order: 4 },
        { id: "elem-6", type: "button_cancel", label: "Cancelar", order: 5 },
        { id: "elem-7", type: "button_submit", label: "Confirmar Personalización y Continuar", order: 6 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "form-cliente-basico",
      name: "Formulario Estándar Datos de Facturación y Envío",
      formTypeId: "ft-cliente",
      elements: [
        { id: "elem-c1", type: "label", label: "Información para Despacho y Facturación", order: 0 },
        { id: "elem-c2", type: "text", label: "Nombre Completo", placeholder: "Ej. Juan Pérez", required: true, order: 1 },
        { id: "elem-c3", type: "email", label: "Correo Electrónico", placeholder: "juan@ejemplo.com", required: true, order: 2 },
        { id: "elem-c4", type: "number", label: "Teléfono / WhatsApp", placeholder: "3001234567", required: true, order: 3 },
        { id: "elem-c5", type: "address", label: "Dirección de Entrega y Ciudad", placeholder: "Calle 100 # 15-20, Bogotá", required: true, order: 4 },
        { id: "elem-c6", type: "button_cancel", label: "Volver a la Tienda", order: 5 },
        { id: "elem-c7", type: "button_submit", label: "Pagar con Mercado Pago", order: 6 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
  products: [
    {
      id: "prod-anillo-titanio",
      name: "Anillo de Titanio con Grabado Láser Personalizado",
      description: "Anillo ultra resistente de titanio de grado aeroespacial. Personaliza el acabado, tamaño y grabado láser interior/exterior con vista 3D.",
      price: 135000,
      status: "activo",
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      stock: 45,
      categoryId: "cat-1",
      formId: "form-joyas-producto",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-placa-reconocimiento",
      name: "Placa Conmemorativa Cristal y Madera Noble",
      description: "Trofeo y placa de honor ideal para eventos corporativos, aniversarios y reconocimientos especiales grabados al detalle.",
      price: 98000,
      status: "activo",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
      stock: 28,
      categoryId: "cat-2",
      formId: "form-joyas-producto",
      createdAt: "2026-01-02T00:00:00Z",
    },
    {
      id: "prod-termo-laser",
      name: "Termo de Acero Inoxidable 750ml con Grabado Láser",
      description: "Mantiene bebidas frías por 24h y calientes por 12h. Grabado láser de logotipos o nombres de alta precisión indeleble.",
      price: 65000,
      status: "activo",
      imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      stock: 90,
      categoryId: "cat-3",
      formId: "form-joyas-producto",
      createdAt: "2026-01-03T00:00:00Z",
    },
  ],
  orders: [
    {
      id: "ord-1001",
      orderNumber: "GRB-84920",
      productId: "prod-anillo-titanio",
      productName: "Anillo de Titanio con Grabado Láser Personalizado",
      unitPrice: 135000,
      quantity: 1,
      total: 135000,
      customerData: {
        name: "Andrea Gómez",
        email: "andrea.gomez@ejemplo.com",
        phone: "+57 311 456 7890",
        address: "Carrera 7 # 72-41, Bogotá D.C.",
      },
      customFormData: {
        "Acabado del Metal": "Plata 925 Brillante",
        "Talla del Anillo": "7 US (17.3 mm)",
        "Dedicatoria especial en estuche": "Para siempre en mi corazón.",
      },
      tableData: [
        { "col-1": "A & J • 25.12.2025", "col-2": "Cursiva Elegante", "col-3": "Interior del Aro", "col-4": 0.5 },
      ],
      statusId: "st-recibida",
      mercadoPagoPaymentId: "MP-9843210984",
      mercadoPagoStatus: "approved",
      createdAt: "2026-01-10T14:20:00Z",
      updatedAt: "2026-01-10T14:25:00Z",
      statusHistory: [
        { statusId: "st-recibida", statusName: "Orden recibida", timestamp: "2026-01-10T14:25:00Z", note: "Pago aprobado vía Mercado Pago" },
      ],
    },
    {
      id: "ord-1002",
      orderNumber: "GRB-84921",
      productId: "prod-placa-reconocimiento",
      productName: "Placa Conmemorativa Cristal y Madera Noble",
      unitPrice: 98000,
      quantity: 2,
      total: 196000,
      customerData: {
        name: "Roberto Silva",
        email: "roberto.silva@empresa.com",
        phone: "+57 320 890 1234",
        address: "Calle 127 # 19-30, Oficina 402, Bogotá",
      },
      customFormData: {
        "Acabado del Metal": "Oro Rosa 18K",
        "Dedicatoria especial en estuche": "Reconocimiento a la excelencia 2025",
      },
      tableData: [
        { "col-1": "Empleado del Año", "col-2": "Moderna Sans", "col-3": "Exterior Frontal", "col-4": 0.8 },
      ],
      statusId: "st-pendiente",
      mercadoPagoPaymentId: "MP-9843210985",
      mercadoPagoStatus: "pending",
      createdAt: "2026-01-11T10:05:00Z",
      updatedAt: "2026-01-11T10:05:00Z",
      statusHistory: [
        { statusId: "st-pendiente", statusName: "Pendiente de pago", timestamp: "2026-01-11T10:05:00Z", note: "Esperando confirmación de pasarela de pago" },
      ],
    },
  ],
};

// Singleton in-memory state
let memoryState: DatabaseState = { ...INITIAL_DATABASE_STATE };

// Funciones para sincronizar y acceder
export function getDatabase(): DatabaseState {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        memoryState = parsed;
        return parsed;
      } catch (e) {
        console.error("Error al leer de localStorage:", e);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATABASE_STATE));
    }
  }
  return memoryState;
}

export function saveDatabase(nextState: DatabaseState): void {
  memoryState = nextState;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    window.dispatchEvent(new CustomEvent("grabamil_db_changed", { detail: nextState }));
  }
}

export function resetDatabaseToDefault(): DatabaseState {
  saveDatabase(INITIAL_DATABASE_STATE);
  return INITIAL_DATABASE_STATE;
}

// ==================== SEGURIDAD Y CONTROL DE ACCESO (RBAC) ====================

/**
 * REGLAS GENERALES DE ADMINISTRACIÓN DE USUARIOS:
 * - El único que podrá crear roles System Administrador será un usuario con ese mismo rol
 * - Un usuario administrador no podrá crear un usuario de tipo System Administrador
 * - Un usuario de tipo agente no podrá crear usuarios administrador ni System Administrador.
 */
export function canCreateRole(currentUserRoleType: RoleType, targetRoleType: RoleType): { allowed: boolean; reason?: string } {
  if (targetRoleType === "system_admin" && currentUserRoleType !== "system_admin") {
    return {
      allowed: false,
      reason: "Solo un usuario con rol 'System Administrator' tiene privilegios para crear o asignar roles de tipo System Administrator.",
    };
  }

  if (currentUserRoleType === "admin" && targetRoleType === "system_admin") {
    return {
      allowed: false,
      reason: "Un usuario Administrador no tiene autorización para crear o asignar roles System Administrator.",
    };
  }

  if (currentUserRoleType === "agent" && (targetRoleType === "system_admin" || targetRoleType === "admin")) {
    return {
      allowed: false,
      reason: "Un usuario Agente Comercial no tiene permisos para crear usuarios Administrador ni System Administrator.",
    };
  }

  return { allowed: true };
}

/**
 * Valida si un usuario tiene acceso a un módulo específico según su perfil asociado
 */
export function isModuleAllowedForUser(userId: string, moduleKey: ModuleKey): boolean {
  const db = getDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return false;

  const role = db.roles.find((r) => r.id === user.roleId);
  if (!role) return false;

  // Si es System Administrator tiene acceso total garantizado
  if (role.type === "system_admin") return true;

  const association = db.rolesProfiles.find((rp) => rp.roleId === role.id);
  if (!association) return false;

  const profile = db.profiles.find((p) => p.id === association.profileId);
  if (!profile) return false;

  return !!profile.modules[moduleKey];
}

