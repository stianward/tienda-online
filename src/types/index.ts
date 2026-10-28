// Definiciones de tipos para GrabaMil

export type ModuleKey =
  | "users"
  | "roles"
  | "roles_profiles"
  | "profiles"
  | "categories"
  | "order_statuses"
  | "form_types"
  | "custom_forms"
  | "custom_tables"
  | "renders"
  | "products"
  | "orders";

export interface SystemModule {
  id: ModuleKey;
  name: string;
  description: string;
  path: string;
  icon: string;
}

export const SYSTEM_MODULES: SystemModule[] = [
  { id: "users", name: "Usuarios", description: "Gestión de usuarios y accesos", path: "/admin/users", icon: "Users" },
  { id: "roles", name: "Roles", description: "Definición de roles del sistema", path: "/admin/roles", icon: "Shield" },
  { id: "roles_profiles", name: "Roles y Perfiles", description: "Asociación de roles con perfiles", path: "/admin/roles-profiles", icon: "Link" },
  { id: "profiles", name: "Perfiles", description: "Permisos y visibilidad de módulos", path: "/admin/profiles", icon: "Lock" },
  { id: "categories", name: "Categorías", description: "Categorías de productos", path: "/admin/categories", icon: "Tags" },
  { id: "order_statuses", name: "Estados de Pedidos", description: "Estados y colores para tracking", path: "/admin/order-statuses", icon: "Activity" },
  { id: "form_types", name: "Tipos de Formularios", description: "Tipos (Cliente, Producto)", path: "/admin/form-types", icon: "Layers" },
  { id: "custom_forms", name: "Formularios Personalizados", description: "Constructor visual Drag & Drop", path: "/admin/custom-forms", icon: "FileText" },
  { id: "custom_tables", name: "Tablas Personalizadas", description: "Estructuras de tablas dinámicas con 3D", path: "/admin/custom-tables", icon: "Table" },
  { id: "renders", name: "Módulo Renderizado", description: "Archivos HTML y estructuras de visualización 3D", path: "/admin/renders", icon: "Box" },
  { id: "products", name: "Productos", description: "Catálogo, precios, stock y formulario asignado", path: "/admin/products", icon: "Package" },
  { id: "orders", name: "Seguimiento de Pedidos", description: "Historial de pedidos, estados y notificaciones", path: "/admin/orders", icon: "ShoppingBag" },
];

export type RoleType = "system_admin" | "admin" | "agent" | "client";

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  // Mapa de cada módulo con su toggle activo/inactivo
  modules: Record<ModuleKey, boolean>;
  createdAt: string;
}

export interface RoleProfileAssociation {
  id: string;
  roleId: string;
  profileId: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // Referencia al rol
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface OrderStatus {
  id: string;
  name: string;
  color: string; // Hex o tailwind color (ej. #10b981)
  isDefaultInitial?: boolean; // Orden recibida
  isPendingPayment?: boolean; // Pendiente de pago
  isCancelled?: boolean;      // Cancelado por falta de pago
  createdAt: string;
}

export interface FormTypeItem {
  id: string;
  name: "CLIENTE" | "PRODUCTO" | string;
  createdAt: string;
}

export type FormElementType =
  | "text"
  | "number"
  | "email"
  | "address"
  | "label"
  | "select"
  | "radio"
  | "button_submit"
  | "button_cancel"
  | "custom_table";

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // Para select y radio
  order: number;
}

export interface CustomForm {
  id: string;
  name: string;
  formTypeId: string; // Tipo CLIENTE o PRODUCTO
  elements: FormElement[];
  customTableId?: string; // Opcional, asociado a tablas personalizadas si es de tipo PRODUCTO
  createdAt: string;
  updatedAt: string;
}

export interface TableColumn {
  id: string;
  header: string;
  type: "text" | "number" | "select";
  options?: string[];
}

export interface CustomTable {
  id: string;
  name: string;
  columns: TableColumn[];
  initialRows?: Record<string, string | number>[];
  renderId?: string; // ID del render 3D asignado
  createdAt: string;
}

export interface Render3D {
  id: string;
  name: string;
  htmlContent: string; // Contenido HTML seguro del render
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "activo" | "inactivo";
  imageUrl: string;
  stock: number;
  categoryId: string;
  formId?: string; // ID del formulario personalizado asignado
  createdAt: string;
}

export interface OrderItemRow {
  [columnId: string]: string | number;
}

export interface Order {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };
  customFormData: Record<string, any>;
  tableData?: OrderItemRow[];
  statusId: string;
  mercadoPagoPaymentId?: string;
  mercadoPagoStatus?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    statusId: string;
    statusName: string;
    timestamp: string;
    note?: string;
  }>;
}

