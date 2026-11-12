export type MovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

export type ProductStatus = 'NORMAL' | 'STOCK_BAJO' | 'AGOTADO' | 'EXCESO';

export type SupplierStatus = 'ACTIVO' | 'INACTIVO';

export type AlertType = 'AGOTADO' | 'STOCK_BAJO' | 'EXCESO' | 'BAJA_ROTACION';

export type AlertPriority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export type UserRole = 'Administrador' | 'Supervisor' | 'Operador de Bodega';

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  commercialName: string;
  nit: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  status: SupplierStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SmartAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  type: AlertType;
  priority: AlertPriority;
  recommendation: string;
  ruleReason: string;
  detectedAt: string;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  message: string;
  category: 'REPOSICION' | 'ROTACION' | 'OPTIMIZACION' | 'CATEGORIA';
  severity: 'danger' | 'warning' | 'info' | 'success';
  productId?: string;
}

export interface AlertThresholds {
  excessStockLimit: number;
  lowRotationDays: number;
  lowRotationMaxExits: number;
  highRotationMinExits: number;
}

export interface BusinessInfo {
  commercialName: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  currency: 'COP';
  timezone: 'America/Bogota';
}

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastAccess: string;
}

export interface BusinessSettings {
  business: BusinessInfo;
  thresholds: AlertThresholds;
  enableLowStockNotifications: boolean;
  enableExcessNotifications: boolean;
  enableLowRotationDetection: boolean;
}

export interface AuthSession {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  rememberMe: boolean;
  loggedInAt: string;
}

export interface DashboardKpis {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  potentialRetailValue: number;
  monthlyEntries: number;
  monthlyExits: number;
}

