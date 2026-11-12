import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  DEMO_CATEGORIES,
  DEMO_MOVEMENTS,
  DEMO_PRODUCTS,
  DEMO_SETTINGS,
  DEMO_SUPPLIERS,
  DEMO_USERS,
} from '../data/demo-data';
import {
  BusinessSettings,
  Category,
  DashboardKpis,
  InventoryMovement,
  MovementType,
  Product,
  ProductStatus,
  Supplier,
  SystemUser,
} from '../models/inventory.models';
import {
  evaluateProductStatus,
  generateSmartAlerts,
  generateSmartRecommendations,
} from '../utils/alert-engine';
import { isInboundMovement } from '../utils/formatters';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

export interface CreateMovementPayload {
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryStoreService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  private readonly _products = signal<Product[]>(this.storage.get('products', DEMO_PRODUCTS));
  private readonly _categories = signal<Category[]>(this.storage.get('categories', DEMO_CATEGORIES));
  private readonly _suppliers = signal<Supplier[]>(this.storage.get('suppliers', DEMO_SUPPLIERS));
  private readonly _movements = signal<InventoryMovement[]>(
    this.storage.get('movements', DEMO_MOVEMENTS),
  );
  private readonly _settings = signal<BusinessSettings>(this.storage.get('settings', DEMO_SETTINGS));
  private readonly _users = signal<SystemUser[]>(this.storage.get('users', DEMO_USERS));

  readonly products = this._products.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly suppliers = this._suppliers.asReadonly();
  readonly movements = this._movements.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly users = this._users.asReadonly();

  readonly categoryMap = computed(() => new Map(this._categories().map((c) => [c.id, c])));
  readonly supplierMap = computed(() => new Map(this._suppliers().map((s) => [s.id, s])));
  readonly productMap = computed(() => new Map(this._products().map((p) => [p.id, p])));

  readonly alerts = computed(() =>
    generateSmartAlerts(
      this._products(),
      this._categories(),
      this._movements(),
      this._settings(),
    ),
  );

  readonly recommendations = computed(() =>
    generateSmartRecommendations(
      this._products(),
      this._categories(),
      this._movements(),
      this.alerts(),
      this._settings(),
    ),
  );

  readonly kpis = computed<DashboardKpis>(() => {
    const products = this._products();
    const thresholds = this._settings().thresholds;
    const movements = this._movements();

    let totalUnits = 0;
    let totalInventoryValue = 0;
    let potentialRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalUnits += p.stock;
      totalInventoryValue += p.stock * p.purchasePrice;
      potentialRetailValue += p.stock * p.salePrice;
      const status = evaluateProductStatus(p, thresholds);
      if (status === 'AGOTADO') outOfStockCount++;
      else if (status === 'STOCK_BAJO') lowStockCount++;
    }

    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(now.getDate() - 30);
    const cutoff = monthAgo.getTime();

    let monthlyEntries = 0;
    let monthlyExits = 0;

    for (const m of movements) {
      const mTime = new Date(m.date).getTime();
      if (mTime >= cutoff) {
        if (isInboundMovement(m.type)) monthlyEntries += m.quantity;
        else monthlyExits += m.quantity;
      }
    }

    return {
      totalProducts: products.length,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      potentialRetailValue,
      monthlyEntries,
      monthlyExits,
    };
  });

  readonly last30DaysChart = computed(() => {
    const movements = this._movements();
    const labels: string[] = [];
    const entries: number[] = [];
    const exits: number[] = [];
    const dayKeys: string[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayKeys.push(key);
      labels.push(
        new Intl.DateTimeFormat('es-CO', {
          month: 'short',
          day: '2-digit',
        }).format(d),
      );
      entries.push(0);
      exits.push(0);
    }

    const indexMap = new Map(dayKeys.map((k, idx) => [k, idx]));

    for (const m of movements) {
      const key = m.date.slice(0, 10);
      const idx = indexMap.get(key);
      if (idx !== undefined) {
        if (isInboundMovement(m.type)) entries[idx] += m.quantity;
        else exits[idx] += m.quantity;
      }
    }

    return { labels, entries, exits };
  });

  readonly topRotatingChart = computed(() => {
    const products = this._products();
    const movements = this._movements();
    const exitTotals = new Map<string, number>();

    for (const m of movements) {
      if (m.type === 'SALIDA') {
        exitTotals.set(m.productId, (exitTotals.get(m.productId) ?? 0) + m.quantity);
      }
    }

    const ranked = products
      .map((p) => ({
        name: p.name,
        exits: exitTotals.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 6);

    return {
      labels: ranked.map((r) => (r.name.length > 20 ? r.name.slice(0, 19) + '…' : r.name)),
      values: ranked.map((r) => r.exits),
    };
  });

  readonly categoryDistributionChart = computed(() => {
    const categories = this._categories();
    const products = this._products();

    const grouped = categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = catProducts.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
      return {
        category: cat,
        productCount: catProducts.length,
        totalStock,
        totalValue,
      };
    });

    return grouped.filter((g) => g.productCount > 0 || g.totalStock > 0);
  });

  constructor() {
    effect(() => this.storage.set('products', this._products()));
    effect(() => this.storage.set('categories', this._categories()));
    effect(() => this.storage.set('suppliers', this._suppliers()));
    effect(() => this.storage.set('movements', this._movements()));
    effect(() => this.storage.set('settings', this._settings()));
    effect(() => this.storage.set('users', this._users()));
  }

  getProductStatus(product: Product): ProductStatus {
    return evaluateProductStatus(product, this._settings().thresholds);
  }

  isSkuUnique(sku: string, excludeProductId?: string): boolean {
    const normalized = sku.trim().toLowerCase();
    return !this._products().some(
      (p) => p.id !== excludeProductId && p.sku.trim().toLowerCase() === normalized,
    );
  }

  addProduct(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): { ok: boolean; error?: string; product?: Product } {
    if (!data.name.trim()) {
      return { ok: false, error: 'El nombre del producto es obligatorio.' };
    }
    if (!this.isSkuUnique(data.sku)) {
      return { ok: false, error: `El SKU "${data.sku}" ya existe en el catálogo.` };
    }
    if (data.purchasePrice <= 0 || data.salePrice <= 0 || data.stock < 0 || data.minStock < 0) {
      return { ok: false, error: 'Los precios y cantidades deben ser valores numéricos válidos.' };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prd-${Date.now()}`,
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    this._products.update((list) => [newProduct, ...list]);

    if (newProduct.stock > 0) {
      const session = this.auth.session();
      const initialMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        type: 'ENTRADA',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        date: now,
        reason: 'Inventario inicial de producto',
        notes: 'Registro inicial desde módulo de Productos.',
        userId: session?.userId ?? 'usr-1',
        userName: session?.fullName ?? 'Carlos Restrepo',
        createdAt: now,
      };
      this._movements.update((list) => [initialMovement, ...list]);
    }

    this.notifications.success(
      'Producto registrado',
      `${newProduct.name} (${newProduct.sku}) se agregó al inventario.`,
    );
    return { ok: true, product: newProduct };
  }

  updateProduct(
    id: string,
    patch: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): { ok: boolean; error?: string } {
    if (!patch.name.trim()) {
      return { ok: false, error: 'El nombre del producto es obligatorio.' };
    }
    if (!this.isSkuUnique(patch.sku, id)) {
      return { ok: false, error: `El SKU "${patch.sku}" ya pertenece a otro producto.` };
    }
    if (patch.purchasePrice <= 0 || patch.salePrice <= 0 || patch.stock < 0 || patch.minStock < 0) {
      return { ok: false, error: 'Los precios y cantidades deben ser valores numéricos válidos.' };
    }

    const now = new Date().toISOString();
    this._products.update((list) =>
      list.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              name: patch.name.trim(),
              sku: patch.sku.trim().toUpperCase(),
              updatedAt: now,
            }
          : p,
      ),
    );

    this.notifications.success('Producto actualizado', `Se guardaron los cambios de ${patch.name}.`);
    return { ok: true };
  }

  deleteProduct(id: string): void {
    const target = this.productMap().get(id);
    this._products.update((list) => list.filter((p) => p.id !== id));
    this.notifications.info(
      'Producto eliminado',
      target ? `${target.name} fue retirado del catálogo.` : 'Producto eliminado.',
    );
  }

  registerMovement(payload: CreateMovementPayload): { ok: boolean; error?: string } {
    const product = this.productMap().get(payload.productId);
    if (!product) {
      return { ok: false, error: 'Selecciona un producto válido.' };
    }
    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return { ok: false, error: 'La cantidad del movimiento debe ser mayor a cero.' };
    }
    if (!payload.reason.trim()) {
      return { ok: false, error: 'Debes indicar un motivo para el movimiento.' };
    }

    const inbound = isInboundMovement(payload.type);
    const previousStock = product.stock;
    const newStock = inbound ? previousStock + payload.quantity : previousStock - payload.quantity;

    if (newStock < 0) {
      return {
        ok: false,
        error: `Stock insuficiente. Existencias actuales de ${product.name}: ${previousStock} unidades.`,
      };
    }

    const now = new Date().toISOString();
    const normalizedDate = payload.date.includes('T')
      ? payload.date
      : `${payload.date}T12:00:00.000Z`;

    const session = this.auth.session();
    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      type: payload.type,
      quantity: payload.quantity,
      previousStock,
      newStock,
      date: normalizedDate,
      reason: payload.reason.trim(),
      notes: payload.notes.trim(),
      userId: session?.userId ?? 'usr-1',
      userName: session?.fullName ?? 'Carlos Restrepo',
      createdAt: now,
    };

    this._products.update((list) =>
      list.map((p) => (p.id === product.id ? { ...p, stock: newStock, updatedAt: now } : p)),
    );
    this._movements.update((list) => [movement, ...list]);

    this.notifications.success(
      'Movimiento registrado',
      `${product.name}: ${previousStock} → ${newStock} unidades.`,
    );

    if (newStock === 0) {
      this.notifications.error(
        'Alerta: Producto agotado',
        `${product.name} llegó a 0 unidades en inventario.`,
      );
    } else if (newStock <= product.minStock) {
      this.notifications.warning(
        'Alerta de stock bajo',
        `${product.name} quedó en ${newStock} uds (mínimo: ${product.minStock}).`,
      );
    }

    return { ok: true };
  }

  addCategory(name: string, description: string, color: string): { ok: boolean; error?: string } {
    const cleanName = name.trim();
    if (!cleanName) return { ok: false, error: 'El nombre de la categoría es obligatorio.' };
    if (this._categories().some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      return { ok: false, error: 'Ya existe una categoría con ese nombre.' };
    }

    const category: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      description: description.trim(),
      color: color || '#0D9488',
      createdAt: new Date().toISOString(),
    };
    this._categories.update((list) => [...list, category]);
    this.notifications.success('Categoría creada', `Se agregó la categoría "${cleanName}".`);
    return { ok: true };
  }

  updateCategory(
    id: string,
    name: string,
    description: string,
    color: string,
  ): { ok: boolean; error?: string } {
    const cleanName = name.trim();
    if (!cleanName) return { ok: false, error: 'El nombre de la categoría es obligatorio.' };
    if (
      this._categories().some((c) => c.id !== id && c.name.toLowerCase() === cleanName.toLowerCase())
    ) {
      return { ok: false, error: 'Ya existe otra categoría con ese nombre.' };
    }

    this._categories.update((list) =>
      list.map((c) => (c.id === id ? { ...c, name: cleanName, description: description.trim(), color } : c)),
    );
    this.notifications.success('Categoría actualizada', `Se actualizó "${cleanName}".`);
    return { ok: true };
  }

  deleteCategory(id: string): { ok: boolean; error?: string } {
    const usedCount = this._products().filter((p) => p.categoryId === id).length;
    if (usedCount > 0) {
      return {
        ok: false,
        error: `No se puede eliminar porque tiene ${usedCount} producto(s) asociados.`,
      };
    }
    this._categories.update((list) => list.filter((c) => c.id !== id));
    this.notifications.info('Categoría eliminada', 'La categoría fue removida.');
    return { ok: true };
  }

  addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): { ok: boolean; error?: string } {
    if (!data.commercialName.trim() || !data.nit.trim()) {
      return { ok: false, error: 'Nombre comercial y NIT son obligatorios.' };
    }
    const supplier: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      commercialName: data.commercialName.trim(),
      nit: data.nit.trim(),
      createdAt: new Date().toISOString(),
    };
    this._suppliers.update((list) => [supplier, ...list]);
    this.notifications.success('Proveedor registrado', `${supplier.commercialName} fue agregado.`);
    return { ok: true };
  }

  updateSupplier(id: string, data: Omit<Supplier, 'id' | 'createdAt'>): { ok: boolean; error?: string } {
    if (!data.commercialName.trim() || !data.nit.trim()) {
      return { ok: false, error: 'Nombre comercial y NIT son obligatorios.' };
    }
    this._suppliers.update((list) =>
      list.map((s) => (s.id === id ? { ...s, ...data, commercialName: data.commercialName.trim() } : s)),
    );
    this.notifications.success('Proveedor actualizado', `Se guardaron los datos de ${data.commercialName}.`);
    return { ok: true };
  }

  deleteSupplier(id: string): { ok: boolean; error?: string } {
    const associated = this._products().filter((p) => p.supplierId === id).length;
    if (associated > 0) {
      return {
        ok: false,
        error: `Este proveedor tiene ${associated} producto(s) vinculados. Reasígnalos antes de eliminarlo.`,
      };
    }
    this._suppliers.update((list) => list.filter((s) => s.id !== id));
    this.notifications.info('Proveedor eliminado', 'El proveedor fue eliminado del directorio.');
    return { ok: true };
  }

  updateSettings(next: BusinessSettings): void {
    this._settings.set(next);
    this.notifications.success(
      'Configuración guardada',
      'Las preferencias del negocio y umbrales de alertas fueron actualizados.',
    );
  }

  addUser(user: Omit<SystemUser, 'id' | 'lastAccess'>): void {
    const created: SystemUser = {
      ...user,
      id: `usr-${Date.now()}`,
      lastAccess: new Date().toISOString(),
    };
    this._users.update((list) => [...list, created]);
    this.notifications.success('Usuario creado', `${created.fullName} (${created.role}) añadido.`);
  }

  toggleUserActive(id: string): void {
    this._users.update((list) =>
      list.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    );
    this.notifications.info('Estado actualizado', 'Se modificó el acceso del usuario.');
  }

  resetDemoData(): void {
    this._products.set(DEMO_PRODUCTS);
    this._categories.set(DEMO_CATEGORIES);
    this._suppliers.set(DEMO_SUPPLIERS);
    this._movements.set(DEMO_MOVEMENTS);
    this._settings.set(DEMO_SETTINGS);
    this._users.set(DEMO_USERS);
    this.notifications.info(
      'Datos restaurados',
      'Se restableció el conjunto completo de demostración para TechStore Medellín.',
    );
  }
}

