import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Building2,
  LucideAngularModule,
  RotateCcw,
  Save,
  Sliders,
  UserPlus,
  Users,
} from 'lucide-angular';
import { UserRole } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { formatDateBogota } from '../../core/utils/formatters';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="sw-page">
      <header class="sw-page-header">
        <div>
          <h1 class="sw-page-title">Configuración del sistema</h1>
          <p class="sw-page-subtitle">
            Información comercial del negocio, parámetros de alertas y usuarios de demostración
          </p>
        </div>
        <div class="sw-header-actions">
          <button type="button" class="sw-btn sw-btn-secondary" (click)="resetConfirmOpen.set(true)">
            <lucide-icon [img]="RotateCcwIcon" [size]="15" />
            <span>Restaurar datos demo</span>
          </button>
        </div>
      </header>

      <section class="settings-grid">
        <article class="sw-card">
          <div class="sw-card-header">
            <div class="card-head-icon">
              <lucide-icon [img]="BuildingIcon" [size]="18" />
              <div>
                <h2 class="sw-card-title">Información del negocio</h2>
                <p class="sw-card-subtitle">Datos visibles en reportes y barra lateral</p>
              </div>
            </div>
          </div>
          <div class="sw-card-body">
            <form [formGroup]="businessForm" (ngSubmit)="saveAllSettings()" class="sw-form-grid">
              <div class="sw-field sw-col-span-2">
                <label class="sw-label">Nombre comercial <span class="req">*</span></label>
                <input type="text" class="sw-input" formControlName="commercialName" />
              </div>
              <div class="sw-field">
                <label class="sw-label">NIT <span class="req">*</span></label>
                <input type="text" class="sw-input" formControlName="nit" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Ciudad</label>
                <input type="text" class="sw-input" formControlName="city" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Correo electrónico</label>
                <input type="email" class="sw-input" formControlName="email" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Teléfono</label>
                <input type="text" class="sw-input" formControlName="phone" />
              </div>
              <div class="sw-field sw-col-span-2">
                <label class="sw-label">Dirección</label>
                <input type="text" class="sw-input" formControlName="address" />
              </div>
              <div class="sw-col-span-2 form-save-row">
                <span class="meta-pill">Moneda: COP · Zona horaria: America/Bogota</span>
                <button type="submit" class="sw-btn sw-btn-primary">
                  <lucide-icon [img]="SaveIcon" [size]="15" />
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>
          </div>
        </article>

        <article class="sw-card">
          <div class="sw-card-header">
            <div class="card-head-icon">
              <lucide-icon [img]="SlidersIcon" [size]="18" />
              <div>
                <h2 class="sw-card-title">Umbrales de alertas inteligentes</h2>
                <p class="sw-card-subtitle">Reglas aplicadas para clasificar existencias</p>
              </div>
            </div>
          </div>
          <div class="sw-card-body">
            <form [formGroup]="thresholdsForm" (ngSubmit)="saveAllSettings()" class="sw-form-grid">
              <div class="sw-field">
                <label class="sw-label">Límite exceso de stock (uds)</label>
                <input type="number" class="sw-input" formControlName="excessStockLimit" min="10" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Periodo baja rotación (días)</label>
                <input type="number" class="sw-input" formControlName="lowRotationDays" min="7" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Máx. salidas para baja rotación</label>
                <input type="number" class="sw-input" formControlName="lowRotationMaxExits" min="0" />
              </div>
              <div class="sw-field">
                <label class="sw-label">Mín. salidas para alta rotación</label>
                <input type="number" class="sw-input" formControlName="highRotationMinExits" min="1" />
              </div>

              <div class="sw-col-span-2 toggles-list">
                <label class="toggle-item">
                  <input type="checkbox" formControlName="enableLowStockNotifications" />
                  <span>Activar alertas automáticas de stock bajo</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" formControlName="enableExcessNotifications" />
                  <span>Detectar productos con exceso de inventario</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" formControlName="enableLowRotationDetection" />
                  <span>Identificar referencias de baja rotación</span>
                </label>
              </div>

              <div class="sw-col-span-2 form-save-row">
                <span></span>
                <button type="submit" class="sw-btn sw-btn-navy">
                  <lucide-icon [img]="SaveIcon" [size]="15" />
                  <span>Actualizar umbrales</span>
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>

      <section class="sw-card">
        <div class="sw-card-header">
          <div class="card-head-icon">
            <lucide-icon [img]="UsersIcon" [size]="18" />
            <div>
              <h2 class="sw-card-title">Usuarios y roles de demostración</h2>
              <p class="sw-card-subtitle">Control de acceso por perfil operativo</p>
            </div>
          </div>
          <button type="button" class="sw-btn sw-btn-primary sw-btn-sm" (click)="userModalOpen.set(true)">
            <lucide-icon [img]="UserPlusIcon" [size]="15" />
            <span>Agregar usuario</span>
          </button>
        </div>

        <div class="sw-table-wrap">
          <table class="sw-table">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Correo electrónico</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (u of store.users(); track u.id) {
                <tr>
                  <td><strong>{{ u.fullName }}</strong></td>
                  <td>{{ u.email }}</td>
                  <td><app-status-badge [label]="u.role" tone="info" /></td>
                  <td>{{ formatDate(u.lastAccess) }}</td>
                  <td>
                    <app-status-badge
                      [label]="u.active ? 'Activo' : 'Suspendido'"
                      [tone]="u.active ? 'success' : 'neutral'"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      class="sw-btn sw-btn-secondary sw-btn-sm"
                      (click)="store.toggleUserActive(u.id)"
                    >
                      {{ u.active ? 'Suspender' : 'Activar' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <app-modal
      [open]="userModalOpen()"
      title="Agregar usuario de demostración"
      maxWidth="460px"
      (closed)="userModalOpen.set(false)"
    >
      <form [formGroup]="userForm" (ngSubmit)="createUser()" class="user-form">
        <div class="sw-field">
          <label class="sw-label">Nombre completo <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="fullName" placeholder="Ej. Sofía Arango" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Correo electrónico <span class="req">*</span></label>
          <input type="email" class="sw-input" formControlName="email" placeholder="sofia@techstore.co" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Rol</label>
          <select class="sw-select" formControlName="role">
            <option value="Administrador">Administrador</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Operador de Bodega">Operador de Bodega</option>
          </select>
        </div>
        <div class="form-save-row">
          <button type="button" class="sw-btn sw-btn-secondary" (click)="userModalOpen.set(false)">
            Cancelar
          </button>
          <button type="submit" class="sw-btn sw-btn-primary">Crear usuario</button>
        </div>
      </form>
    </app-modal>

    <app-confirm-dialog
      [open]="resetConfirmOpen()"
      title="Restaurar datos de demostración"
      message="Se restablecerán los 22 productos, movimientos históricos, categorías, proveedores y configuración inicial de TechStore Medellín."
      confirmLabel="Restaurar demo"
      (cancelled)="resetConfirmOpen.set(false)"
      (confirmed)="confirmReset()"
    />
  `,
  styles: `
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .card-head-icon {
      display: flex;
      align-items: center;
      gap: 11px;
      color: var(--sw-teal-600);
    }

    .toggles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--sw-radius-md);
      background: var(--sw-surface-muted);
      border: 1px solid var(--sw-border);
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      cursor: pointer;
    }

    .form-save-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .meta-pill {
      font-size: 12px;
      color: var(--sw-text-secondary);
      font-weight: 500;
    }

    .user-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  `,
})
export class SettingsPageComponent {
  readonly store = inject(InventoryStoreService);
  private readonly fb = inject(FormBuilder);

  readonly BuildingIcon = Building2;
  readonly SlidersIcon = Sliders;
  readonly UsersIcon = Users;
  readonly UserPlusIcon = UserPlus;
  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;

  readonly userModalOpen = signal(false);
  readonly resetConfirmOpen = signal(false);

  private readonly initialSettings = this.store.settings();

  readonly businessForm = this.fb.nonNullable.group({
    commercialName: [this.initialSettings.business.commercialName, Validators.required],
    nit: [this.initialSettings.business.nit, Validators.required],
    city: [this.initialSettings.business.city],
    email: [this.initialSettings.business.email, [Validators.required, Validators.email]],
    phone: [this.initialSettings.business.phone],
    address: [this.initialSettings.business.address],
  });

  readonly thresholdsForm = this.fb.nonNullable.group({
    excessStockLimit: [this.initialSettings.thresholds.excessStockLimit, [Validators.required, Validators.min(5)]],
    lowRotationDays: [this.initialSettings.thresholds.lowRotationDays, [Validators.required, Validators.min(7)]],
    lowRotationMaxExits: [this.initialSettings.thresholds.lowRotationMaxExits, [Validators.required, Validators.min(0)]],
    highRotationMinExits: [this.initialSettings.thresholds.highRotationMinExits, [Validators.required, Validators.min(1)]],
    enableLowStockNotifications: [this.initialSettings.enableLowStockNotifications],
    enableExcessNotifications: [this.initialSettings.enableExcessNotifications],
    enableLowRotationDetection: [this.initialSettings.enableLowRotationDetection],
  });

  readonly userForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Supervisor' as UserRole],
  });

  saveAllSettings(): void {
    if (this.businessForm.invalid || this.thresholdsForm.invalid) return;
    const b = this.businessForm.getRawValue();
    const t = this.thresholdsForm.getRawValue();

    this.store.updateSettings({
      business: {
        ...b,
        currency: 'COP',
        timezone: 'America/Bogota',
      },
      thresholds: {
        excessStockLimit: t.excessStockLimit,
        lowRotationDays: t.lowRotationDays,
        lowRotationMaxExits: t.lowRotationMaxExits,
        highRotationMinExits: t.highRotationMinExits,
      },
      enableLowStockNotifications: t.enableLowStockNotifications,
      enableExcessNotifications: t.enableExcessNotifications,
      enableLowRotationDetection: t.enableLowRotationDetection,
    });
  }

  createUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const raw = this.userForm.getRawValue();
    this.store.addUser({ ...raw, active: true });
    this.userForm.reset({ fullName: '', email: '', role: 'Supervisor' });
    this.userModalOpen.set(false);
  }

  confirmReset(): void {
    this.store.resetDemoData();
    const next = this.store.settings();
    this.businessForm.reset(next.business);
    this.thresholdsForm.reset({
      ...next.thresholds,
      enableLowStockNotifications: next.enableLowStockNotifications,
      enableExcessNotifications: next.enableExcessNotifications,
      enableLowRotationDetection: next.enableLowRotationDetection,
    });
    this.resetConfirmOpen.set(false);
  }

  formatDate(iso: string): string {
    return formatDateBogota(iso);
  }
}

