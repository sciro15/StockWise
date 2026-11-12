import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Lightbulb,
  LucideAngularModule,
  PackagePlus,
  PackageX,
  TrendingUp,
} from 'lucide-angular';
import { AlertType, SmartAlert } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, StatusBadgeComponent],
  template: `
    <div class="sw-page">
      <header class="sw-page-header">
        <div>
          <h1 class="sw-page-title">Alertas inteligentes de inventario</h1>
          <p class="sw-page-subtitle">
            Detección automática basada en reglas operativas, umbrales configurados y rotación
          </p>
        </div>
        <div class="sw-header-actions">
          <a routerLink="/configuracion" class="sw-btn sw-btn-secondary">Ajustar umbrales</a>
        </div>
      </header>

      <section class="summary-grid">
        <button
          type="button"
          class="sw-card summary-card"
          [class.active]="typeFilter() === 'AGOTADO'"
          (click)="toggleFilter('AGOTADO')"
        >
          <div class="sum-icon danger"><lucide-icon [img]="PackageXIcon" [size]="18" /></div>
          <div>
            <span class="sum-label">Agotados</span>
            <strong class="sum-val sw-mono">{{ countByType('AGOTADO') }}</strong>
          </div>
        </button>

        <button
          type="button"
          class="sw-card summary-card"
          [class.active]="typeFilter() === 'STOCK_BAJO'"
          (click)="toggleFilter('STOCK_BAJO')"
        >
          <div class="sum-icon warning"><lucide-icon [img]="AlertTriangleIcon" [size]="18" /></div>
          <div>
            <span class="sum-label">Stock bajo</span>
            <strong class="sum-val sw-mono">{{ countByType('STOCK_BAJO') }}</strong>
          </div>
        </button>

        <button
          type="button"
          class="sw-card summary-card"
          [class.active]="typeFilter() === 'EXCESO'"
          (click)="toggleFilter('EXCESO')"
        >
          <div class="sum-icon info"><lucide-icon [img]="TrendingUpIcon" [size]="18" /></div>
          <div>
            <span class="sum-label">Exceso de inventario</span>
            <strong class="sum-val sw-mono">{{ countByType('EXCESO') }}</strong>
          </div>
        </button>

        <button
          type="button"
          class="sw-card summary-card"
          [class.active]="typeFilter() === 'BAJA_ROTACION'"
          (click)="toggleFilter('BAJA_ROTACION')"
        >
          <div class="sum-icon neutral"><lucide-icon [img]="ClockIcon" [size]="18" /></div>
          <div>
            <span class="sum-label">Baja rotación</span>
            <strong class="sum-val sw-mono">{{ countByType('BAJA_ROTACION') }}</strong>
          </div>
        </button>
      </section>

      <section class="sw-card">
        <div class="sw-card-header">
          <div>
            <h2 class="sw-card-title">Recomendaciones operativas</h2>
            <p class="sw-card-subtitle">
              Mensajes calculados mediante reglas de negocio y comparación contra rotación promedio
            </p>
          </div>
        </div>
        <div class="sw-card-body rec-grid">
          @for (rec of store.recommendations(); track rec.id) {
            <div class="rec-card" [class]="'rec-' + rec.severity">
              <div class="rec-head">
                <lucide-icon [img]="LightbulbIcon" [size]="16" />
                <strong>{{ rec.title }}</strong>
              </div>
              <p>{{ rec.message }}</p>
            </div>
          }
        </div>
      </section>

      <section class="sw-card">
        <div class="sw-toolbar">
          <div class="filter-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="typeFilter() === ''"
              (click)="typeFilter.set('')"
            >
              Todas ({{ store.alerts().length }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="typeFilter() === 'AGOTADO'"
              (click)="typeFilter.set('AGOTADO')"
            >
              Agotado
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="typeFilter() === 'STOCK_BAJO'"
              (click)="typeFilter.set('STOCK_BAJO')"
            >
              Stock bajo
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="typeFilter() === 'EXCESO'"
              (click)="typeFilter.set('EXCESO')"
            >
              Exceso
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="typeFilter() === 'BAJA_ROTACION'"
              (click)="typeFilter.set('BAJA_ROTACION')"
            >
              Baja rotación
            </button>
          </div>
        </div>

        <div class="sw-table-wrap">
          <table class="sw-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Clasificación</th>
                <th>Existencias</th>
                <th>Stock mín.</th>
                <th>Prioridad</th>
                <th>Recomendación y regla</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of filteredAlerts(); track alert.id) {
                <tr>
                  <td>
                    <strong>{{ alert.productName }}</strong>
                    <div class="sub-info sw-mono">{{ alert.sku }} · {{ alert.categoryName }}</div>
                  </td>
                  <td>
                    <app-status-badge [label]="typeLabel(alert.type)" [tone]="typeTone(alert.type)" />
                  </td>
                  <td class="sw-mono"><strong>{{ alert.currentStock }}</strong></td>
                  <td class="sw-mono">{{ alert.minStock }}</td>
                  <td>
                    <app-status-badge
                      [label]="alert.priority"
                      [tone]="priorityTone(alert.priority)"
                    />
                  </td>
                  <td class="rec-cell">
                    <div>{{ alert.recommendation }}</div>
                    <small class="rule-note">{{ alert.ruleReason }}</small>
                  </td>
                  <td>
                    @if (alert.type === 'AGOTADO' || alert.type === 'STOCK_BAJO') {
                      <a
                        routerLink="/inventario"
                        [queryParams]="{ productId: alert.productId, type: 'ENTRADA' }"
                        class="sw-btn sw-btn-primary sw-btn-sm"
                      >
                        <lucide-icon [img]="PackagePlusIcon" [size]="14" />
                        <span>Reponer</span>
                      </a>
                    } @else {
                      <a
                        routerLink="/productos"
                        [queryParams]="{ q: alert.sku }"
                        class="sw-btn sw-btn-secondary sw-btn-sm"
                      >
                        <span>Revisar</span>
                        <lucide-icon [img]="ArrowRightIcon" [size]="14" />
                      </a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="sw-empty-state">
                      <lucide-icon [img]="BellIcon" [size]="32" />
                      <h4>No hay alertas en esta categoría</h4>
                      <p>Todos los productos de este filtro cumplen los parámetros definidos.</p>
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
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;

      @media (max-width: 960px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 540px) {
        grid-template-columns: 1fr;
      }
    }

    .summary-card {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:hover,
      &.active {
        border-color: var(--sw-teal-600);
        box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.14);
      }
    }

    .sum-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.danger {
        background: var(--sw-danger-bg);
        color: var(--sw-danger-text);
      }
      &.warning {
        background: var(--sw-warning-bg);
        color: var(--sw-warning-text);
      }
      &.info {
        background: var(--sw-info-bg);
        color: var(--sw-info-text);
      }
      &.neutral {
        background: #f1f5f9;
        color: var(--sw-navy-900);
      }
    }

    .sum-label {
      display: block;
      font-size: 12.5px;
      color: var(--sw-text-secondary);
    }

    .sum-val {
      font-size: 22px;
      color: var(--sw-text-primary);
    }

    .rec-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .rec-card {
      padding: 13px 15px;
      border-radius: var(--sw-radius-md);
      border: 1px solid var(--sw-border);
      background: var(--sw-surface-muted);

      .rec-head {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
      }

      p {
        margin-top: 5px;
        font-size: 13px;
        color: var(--sw-text-secondary);
      }

      &.rec-danger {
        background: #fef2f2;
        border-color: #fecaca;
        .rec-head {
          color: var(--sw-danger-text);
        }
      }
      &.rec-warning {
        background: #fffbeb;
        border-color: #fde68a;
        .rec-head {
          color: var(--sw-warning-text);
        }
      }
      &.rec-info {
        background: #f0fdfa;
        border-color: #ccfbf1;
        .rec-head {
          color: var(--sw-teal-700);
        }
      }
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill-btn {
      padding: 6px 13px;
      border-radius: 999px;
      border: 1px solid var(--sw-border-strong);
      background: #ffffff;
      color: var(--sw-text-secondary);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;

      &.active {
        background: var(--sw-navy-900);
        border-color: var(--sw-navy-900);
        color: #ffffff;
      }
    }

    .sub-info {
      font-size: 11.5px;
      color: var(--sw-text-secondary);
    }

    .rec-cell {
      max-width: 380px;
    }

    .rule-note {
      display: block;
      margin-top: 3px;
      font-size: 11.5px;
      color: var(--sw-text-secondary);
    }
  `,
})
export class AlertsPageComponent {
  readonly store = inject(InventoryStoreService);

  readonly PackageXIcon = PackageX;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly TrendingUpIcon = TrendingUp;
  readonly ClockIcon = Clock;
  readonly LightbulbIcon = Lightbulb;
  readonly PackagePlusIcon = PackagePlus;
  readonly ArrowRightIcon = ArrowRight;
  readonly BellIcon = Bell;

  readonly typeFilter = signal<'' | AlertType>('');

  readonly filteredAlerts = computed(() => {
    const t = this.typeFilter();
    return this.store.alerts().filter((a) => !t || a.type === t);
  });

  countByType(type: AlertType): number {
    return this.store.alerts().filter((a) => a.type === type).length;
  }

  toggleFilter(type: AlertType): void {
    this.typeFilter.update((current) => (current === type ? '' : type));
  }

  typeLabel(type: AlertType): string {
    const map: Record<AlertType, string> = {
      AGOTADO: 'Agotado',
      STOCK_BAJO: 'Stock bajo',
      EXCESO: 'Exceso',
      BAJA_ROTACION: 'Baja rotación',
    };
    return map[type];
  }

  typeTone(type: AlertType): 'danger' | 'warning' | 'info' | 'neutral' {
    switch (type) {
      case 'AGOTADO':
        return 'danger';
      case 'STOCK_BAJO':
        return 'warning';
      case 'EXCESO':
        return 'info';
      case 'BAJA_ROTACION':
        return 'neutral';
    }
  }

  priorityTone(priority: SmartAlert['priority']): 'danger' | 'warning' | 'info' | 'neutral' {
    switch (priority) {
      case 'CRITICA':
        return 'danger';
      case 'ALTA':
        return 'warning';
      case 'MEDIA':
        return 'info';
      case 'BAJA':
        return 'neutral';
    }
  }
}

