import { Component, computed, inject, signal } from '@angular/core';
import { Download, FileBarChart2, LucideAngularModule } from 'lucide-angular';
import { MovementType } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  exportToCsv,
  formatCOP,
  formatDateBogota,
  movementTypeLabel,
  productStatusLabel,
  toBogotaInputDate,
} from '../../core/utils/formatters';

type ReportKind =
  | 'INVENTARIO_ACTUAL'
  | 'VALORACION'
  | 'ENTRADAS_SALIDAS'
  | 'MAS_VENDIDOS'
  | 'MENOR_ROTACION'
  | 'STOCK_BAJO'
  | 'MOVIMIENTOS_PERIODO';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="sw-page">
      <header class="sw-page-header">
        <div>
          <h1 class="sw-page-title">Reportes y analítica operativa</h1>
          <p class="sw-page-subtitle">
            Consulta existencias, valoración en COP, rotación y movimientos filtrados con exportación CSV
          </p>
        </div>
        <div class="sw-header-actions">
          <button type="button" class="sw-btn sw-btn-primary" (click)="downloadCsv()">
            <lucide-icon [img]="DownloadIcon" [size]="16" />
            <span>Exportar reporte CSV</span>
          </button>
        </div>
      </header>

      <section class="report-tabs">
        @for (tab of reportTabs; track tab.id) {
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeReport() === tab.id"
            (click)="activeReport.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </section>

      <section class="sw-card filters-card">
        <div class="filters-grid">
          <div class="sw-field">
            <label class="sw-label">Fecha inicial</label>
            <input
              type="date"
              class="sw-input"
              [value]="startDate()"
              (change)="startDate.set($any($event.target).value)"
            />
          </div>
          <div class="sw-field">
            <label class="sw-label">Fecha final</label>
            <input
              type="date"
              class="sw-input"
              [value]="endDate()"
              (change)="endDate.set($any($event.target).value)"
            />
          </div>
          <div class="sw-field">
            <label class="sw-label">Categoría</label>
            <select
              class="sw-select"
              [value]="categoryFilter()"
              (change)="categoryFilter.set($any($event.target).value)"
            >
              <option value="">Todas</option>
              @for (cat of store.categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div class="sw-field">
            <label class="sw-label">Producto</label>
            <select
              class="sw-select"
              [value]="productFilter()"
              (change)="productFilter.set($any($event.target).value)"
            >
              <option value="">Todos</option>
              @for (p of store.products(); track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>
          <div class="sw-field">
            <label class="sw-label">Tipo movimiento</label>
            <select
              class="sw-select"
              [value]="movementTypeFilter()"
              (change)="movementTypeFilter.set($any($event.target).value)"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE_POSITIVO">Ajuste positivo</option>
              <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
            </select>
          </div>
        </div>
      </section>

      <section class="report-summary">
        <div class="sw-card mini-kpi">
          <span>Registros en reporte</span>
          <strong class="sw-mono">{{ reportTable().rows.length }}</strong>
        </div>
        <div class="sw-card mini-kpi">
          <span>Valorización filtrada (Costo)</span>
          <strong class="sw-mono">{{ cop(filteredInventoryCost()) }}</strong>
        </div>
        <div class="sw-card mini-kpi">
          <span>Valor potencial de venta</span>
          <strong class="sw-mono">{{ cop(filteredRetailValue()) }}</strong>
        </div>
      </section>

      <section class="sw-card">
        <div class="sw-card-header">
          <div>
            <h2 class="sw-card-title">{{ currentTabLabel() }}</h2>
            <p class="sw-card-subtitle">Datos actualizados al instante con el estado del inventario</p>
          </div>
        </div>

        <div class="sw-table-wrap">
          <table class="sw-table">
            <thead>
              <tr>
                @for (col of reportTable().headers; track col) {
                  <th>{{ col }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of reportTable().rows; track $index) {
                <tr>
                  @for (cell of row; track $index) {
                    <td>{{ cell }}</td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="reportTable().headers.length">
                    <div class="sw-empty-state">
                      <lucide-icon [img]="FileBarChartIcon" [size]="30" />
                      <h4>Sin datos para los filtros seleccionados</h4>
                      <p>Amplía el rango de fechas o limpia los filtros para visualizar resultados.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .report-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--sw-border-strong);
      background: #ffffff;
      color: var(--sw-text-secondary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        color: var(--sw-text-primary);
      }

      &.active {
        background: var(--sw-navy-900);
        border-color: var(--sw-navy-900);
        color: #ffffff;
      }
    }

    .filters-card {
      padding: 16px 20px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 560px) {
        grid-template-columns: 1fr;
      }
    }

    .report-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .mini-kpi {
      padding: 15px 18px;

      span {
        display: block;
        font-size: 12.5px;
        color: var(--sw-text-secondary);
      }

      strong {
        display: block;
        margin-top: 4px;
        font-size: 20px;
        color: var(--sw-text-primary);
      }
    }
  `,
})
export class ReportsPageComponent {
  readonly store = inject(InventoryStoreService);
  private readonly notifications = inject(NotificationService);

  readonly DownloadIcon = Download;
  readonly FileBarChartIcon = FileBarChart2;

  readonly reportTabs: { id: ReportKind; label: string }[] = [
    { id: 'INVENTARIO_ACTUAL', label: 'Inventario actual' },
    { id: 'VALORACION', label: 'Valoración' },
    { id: 'ENTRADAS_SALIDAS', label: 'Entradas y salidas' },
    { id: 'MAS_VENDIDOS', label: 'Más vendidos' },
    { id: 'MENOR_ROTACION', label: 'Menor rotación' },
    { id: 'STOCK_BAJO', label: 'Stock bajo' },
    { id: 'MOVIMIENTOS_PERIODO', label: 'Movimientos por periodo' },
  ];

  readonly activeReport = signal<ReportKind>('INVENTARIO_ACTUAL');
  readonly startDate = signal(this.thirtyDaysAgoInput());
  readonly endDate = signal(toBogotaInputDate());
  readonly categoryFilter = signal('');
  readonly productFilter = signal('');
  readonly movementTypeFilter = signal<'' | MovementType>('');

  private thirtyDaysAgoInput(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toBogotaInputDate(d);
  }

  readonly currentTabLabel = computed(
    () => this.reportTabs.find((t) => t.id === this.activeReport())?.label ?? 'Reporte',
  );

  readonly filteredProducts = computed(() => {
    const cat = this.categoryFilter();
    const prod = this.productFilter();
    return this.store.products().filter((p) => (!cat || p.categoryId === cat) && (!prod || p.id === prod));
  });

  readonly filteredMovements = computed(() => {
    const start = new Date(`${this.startDate()}T00:00:00`).getTime();
    const end = new Date(`${this.endDate()}T23:59:59`).getTime();
    const cat = this.categoryFilter();
    const prod = this.productFilter();
    const type = this.movementTypeFilter();

    return this.store
      .movements()
      .filter((m) => {
        const t = new Date(m.date).getTime();
        const product = this.store.productMap().get(m.productId);
        const inRange = (!Number.isNaN(start) ? t >= start : true) && (!Number.isNaN(end) ? t <= end : true);
        const matchesCat = !cat || product?.categoryId === cat;
        const matchesProd = !prod || m.productId === prod;
        const matchesType = !type || m.type === type;
        return inRange && matchesCat && matchesProd && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly filteredInventoryCost = computed(() =>
    this.filteredProducts().reduce((sum, p) => sum + p.stock * p.purchasePrice, 0),
  );

  readonly filteredRetailValue = computed(() =>
    this.filteredProducts().reduce((sum, p) => sum + p.stock * p.salePrice, 0),
  );

  readonly reportTable = computed<{ headers: string[]; rows: (string | number)[][] }>(() => {
    const kind = this.activeReport();
    const products = this.filteredProducts();
    const movements = this.filteredMovements();
    const catMap = this.store.categoryMap();

    switch (kind) {
      case 'INVENTARIO_ACTUAL':
        return {
          headers: ['SKU', 'Producto', 'Categoría', 'Existencias', 'Stock mínimo', 'Estado'],
          rows: products.map((p) => [
            p.sku,
            p.name,
            catMap.get(p.categoryId)?.name ?? '—',
            p.stock,
            p.minStock,
            productStatusLabel(this.store.getProductStatus(p)),
          ]),
        };

      case 'VALORACION':
        return {
          headers: ['SKU', 'Producto', 'Existencias', 'Costo Unit.', 'Valor Costo', 'Valor Venta'],
          rows: products.map((p) => [
            p.sku,
            p.name,
            p.stock,
            formatCOP(p.purchasePrice),
            formatCOP(p.stock * p.purchasePrice),
            formatCOP(p.stock * p.salePrice),
          ]),
        };

      case 'ENTRADAS_SALIDAS': {
        const stats = new Map<string, { inQty: number; outQty: number }>();
        for (const m of movements) {
          const entry = stats.get(m.productId) ?? { inQty: 0, outQty: 0 };
          if (m.type === 'ENTRADA' || m.type === 'AJUSTE_POSITIVO') entry.inQty += m.quantity;
          else entry.outQty += m.quantity;
          stats.set(m.productId, entry);
        }
        return {
          headers: ['SKU', 'Producto', 'Entradas', 'Salidas', 'Balance Neto', 'Stock Actual'],
          rows: products.map((p) => {
            const st = stats.get(p.id) ?? { inQty: 0, outQty: 0 };
            return [p.sku, p.name, st.inQty, st.outQty, st.inQty - st.outQty, p.stock];
          }),
        };
      }

      case 'MAS_VENDIDOS':
      case 'MENOR_ROTACION': {
        const sales = new Map<string, number>();
        for (const m of movements) {
          if (m.type === 'SALIDA') {
            sales.set(m.productId, (sales.get(m.productId) ?? 0) + m.quantity);
          }
        }
        const sorted = products
          .map((p) => ({ p, qty: sales.get(p.id) ?? 0 }))
          .sort((a, b) => (kind === 'MAS_VENDIDOS' ? b.qty - a.qty : a.qty - b.qty));

        return {
          headers: ['SKU', 'Producto', 'Categoría', 'Salidas en periodo', 'Ingresos est. (COP)', 'Stock'],
          rows: sorted.map(({ p, qty }) => [
            p.sku,
            p.name,
            catMap.get(p.categoryId)?.name ?? '—',
            qty,
            formatCOP(qty * p.salePrice),
            p.stock,
          ]),
        };
      }

      case 'STOCK_BAJO': {
        const low = products.filter((p) => {
          const st = this.store.getProductStatus(p);
          return st === 'STOCK_BAJO' || st === 'AGOTADO';
        });
        return {
          headers: ['SKU', 'Producto', 'Stock Actual', 'Stock Mínimo', 'Déficit sugerido', 'Estado'],
          rows: low.map((p) => [
            p.sku,
            p.name,
            p.stock,
            p.minStock,
            Math.max(p.minStock * 2 - p.stock, 5),
            productStatusLabel(this.store.getProductStatus(p)),
          ]),
        };
      }

      case 'MOVIMIENTOS_PERIODO':
        return {
          headers: ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Final', 'Motivo', 'Responsable'],
          rows: movements.map((m) => [
            formatDateBogota(m.date),
            this.store.productMap().get(m.productId)?.name ?? 'Eliminado',
            movementTypeLabel(m.type),
            m.quantity,
            m.newStock,
            m.reason,
            m.userName,
          ]),
        };
    }
  });

  cop(val: number): string {
    return formatCOP(val);
  }

  downloadCsv(): void {
    const table = this.reportTable();
    const filename = `stockwise-${this.activeReport().toLowerCase()}-${toBogotaInputDate()}.csv`;
    exportToCsv(filename, table.headers, table.rows);
    this.notifications.success('Reporte exportado', `Se descargó ${filename} para Excel.`);
  }
}

