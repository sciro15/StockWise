import {
  AlertThresholds,
  BusinessSettings,
  Category,
  InventoryMovement,
  Product,
  ProductStatus,
  SmartAlert,
  SmartRecommendation,
} from '../models/inventory.models';

export function evaluateProductStatus(
  product: Product,
  thresholds: AlertThresholds,
): ProductStatus {
  if (product.stock <= 0) {
    return 'AGOTADO';
  }
  if (product.stock <= product.minStock) {
    return 'STOCK_BAJO';
  }
  const excessLimit = product.maxStock ?? thresholds.excessStockLimit;
  if (product.stock > excessLimit) {
    return 'EXCESO';
  }
  return 'NORMAL';
}

export function generateSmartAlerts(
  products: Product[],
  categories: Category[],
  movements: InventoryMovement[],
  settings: BusinessSettings,
): SmartAlert[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const alerts: SmartAlert[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.thresholds.lowRotationDays);
  const cutoffTime = cutoffDate.getTime();

  for (const product of products) {
    const categoryName = categoryMap.get(product.categoryId) ?? 'Sin categoría';
    const excessLimit = product.maxStock ?? settings.thresholds.excessStockLimit;

    if (product.stock <= 0) {
      alerts.push({
        id: `alert-out-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        categoryName,
        currentStock: product.stock,
        minStock: product.minStock,
        type: 'AGOTADO',
        priority: 'CRITICA',
        recommendation: `El producto ${product.name} está agotado. Generar orden de compra urgente (sugerido: ${Math.max(product.minStock * 3, 15)} uds).`,
        ruleReason: 'Regla: Existencias iguales a 0 unidades.',
        detectedAt: product.updatedAt,
      });
      continue;
    }

    if (product.stock <= product.minStock && settings.enableLowStockNotifications) {
      const deficit = Math.max(product.minStock * 2 - product.stock, 5);
      alerts.push({
        id: `alert-low-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        categoryName,
        currentStock: product.stock,
        minStock: product.minStock,
        type: 'STOCK_BAJO',
        priority: product.stock <= Math.ceil(product.minStock / 2) ? 'ALTA' : 'MEDIA',
        recommendation: `El producto ${product.name} necesita reposición. Solicitar al menos ${deficit} unidades para recuperar cobertura.`,
        ruleReason: `Regla: Existencias (${product.stock}) ≤ stock mínimo (${product.minStock}).`,
        detectedAt: product.updatedAt,
      });
    }

    if (product.stock > excessLimit && settings.enableExcessNotifications) {
      alerts.push({
        id: `alert-excess-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        categoryName,
        currentStock: product.stock,
        minStock: product.minStock,
        type: 'EXCESO',
        priority: 'MEDIA',
        recommendation: `${product.name} presenta existencias superiores a su límite configurado (${excessLimit} uds). Considerar promoción o pausa de compras.`,
        ruleReason: `Regla: Existencias (${product.stock}) > límite configurado (${excessLimit}).`,
        detectedAt: product.updatedAt,
      });
    }

    if (settings.enableLowRotationDetection && product.stock > product.minStock) {
      const recentExits = movements
        .filter(
          (m) =>
            m.productId === product.id &&
            m.type === 'SALIDA' &&
            new Date(m.date).getTime() >= cutoffTime,
        )
        .reduce((sum, m) => sum + m.quantity, 0);

      if (recentExits <= settings.thresholds.lowRotationMaxExits) {
        alerts.push({
          id: `alert-rot-${product.id}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          categoryName,
          currentStock: product.stock,
          minStock: product.minStock,
          type: 'BAJA_ROTACION',
          priority: 'BAJA',
          recommendation: `${product.name} registra solo ${recentExits} salida(s) en los últimos ${settings.thresholds.lowRotationDays} días. Evaluar campaña comercial o combo.`,
          ruleReason: `Regla: Salidas en ${settings.thresholds.lowRotationDays} días (${recentExits}) ≤ umbral (${settings.thresholds.lowRotationMaxExits}).`,
          detectedAt: product.updatedAt,
        });
      }
    }
  }

  const priorityOrder: Record<SmartAlert['priority'], number> = {
    CRITICA: 0,
    ALTA: 1,
    MEDIA: 2,
    BAJA: 3,
  };

  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function generateSmartRecommendations(
  products: Product[],
  categories: Category[],
  movements: InventoryMovement[],
  alerts: SmartAlert[],
  settings: BusinessSettings,
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // 1. Productos críticos o en stock bajo
  const urgentAlerts = alerts.filter((a) => a.type === 'AGOTADO' || a.type === 'STOCK_BAJO');
  for (const alert of urgentAlerts.slice(0, 2)) {
    recommendations.push({
      id: `rec-urgent-${alert.productId}`,
      title: alert.type === 'AGOTADO' ? 'Reposición urgente' : 'Alerta de reposición',
      message:
        alert.type === 'AGOTADO'
          ? `El producto ${alert.productName} se encuentra sin existencias y requiere reposición inmediata.`
          : `El producto ${alert.productName} necesita reposición (${alert.currentStock} uds disponibles frente a mínimo de ${alert.minStock}).`,
      category: 'REPOSICION',
      severity: alert.type === 'AGOTADO' ? 'danger' : 'warning',
      productId: alert.productId,
    });
  }

  // 2. Análisis de rotación vs promedio en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.getTime();

  const exitByProduct = new Map<string, number>();
  for (const m of movements) {
    if (m.type === 'SALIDA' && new Date(m.date).getTime() >= cutoff) {
      exitByProduct.set(m.productId, (exitByProduct.get(m.productId) ?? 0) + m.quantity);
    }
  }

  const totalExits = Array.from(exitByProduct.values()).reduce((sum, q) => sum + q, 0);
  const avgExits = products.length > 0 ? totalExits / products.length : 0;

  const topRotating = products
    .map((p) => ({ product: p, exits: exitByProduct.get(p.id) ?? 0 }))
    .sort((a, b) => b.exits - a.exits)[0];

  if (topRotating && topRotating.exits > avgExits && topRotating.exits >= settings.thresholds.highRotationMinExits) {
    recommendations.push({
      id: `rec-high-rot-${topRotating.product.id}`,
      title: 'Alta rotación detectada',
      message: `${topRotating.product.name} presenta una rotación superior al promedio (${topRotating.exits} salidas vs. ${avgExits.toFixed(1)} promedio del catálogo).`,
      category: 'ROTACION',
      severity: 'info',
      productId: topRotating.product.id,
    });
  }

  // 3. Categoría con mayor concentración de alertas
  const alertsByCategory = new Map<string, number>();
  for (const alert of alerts) {
    alertsByCategory.set(alert.categoryName, (alertsByCategory.get(alert.categoryName) ?? 0) + 1);
  }
  const topAlertCategory = Array.from(alertsByCategory.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topAlertCategory && topAlertCategory[1] >= 2) {
    recommendations.push({
      id: `rec-cat-${topAlertCategory[0]}`,
      title: 'Revisión por categoría',
      message: `Se recomienda revisar el inventario de ${topAlertCategory[0]}: concentra ${topAlertCategory[1]} alertas activas.`,
      category: 'CATEGORIA',
      severity: 'warning',
    });
  }

  // 4. Productos con exceso de inventario
  const excessAlert = alerts.find((a) => a.type === 'EXCESO');
  if (excessAlert) {
    const catName = categoryMap.get(
      products.find((p) => p.id === excessAlert.productId)?.categoryId ?? '',
    );
    recommendations.push({
      id: `rec-excess-${excessAlert.productId}`,
      title: 'Optimización de capital',
      message: `${excessAlert.productName}${catName ? ` (${catName})` : ''} presenta existencias superiores a su demanda habitual (${excessAlert.currentStock} uds).`,
      category: 'OPTIMIZACION',
      severity: 'info',
      productId: excessAlert.productId,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-healthy',
      title: 'Inventario equilibrado',
      message: 'Todos los productos cumplen actualmente con los umbrales operativos configurados.',
      category: 'OPTIMIZACION',
      severity: 'success',
    });
  }

  return recommendations;
}

