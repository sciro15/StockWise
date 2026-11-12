import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Eye, LucideAngularModule, Pencil, Plus, Search, Trash2, Truck } from 'lucide-angular';
import { Supplier, SupplierStatus } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatCOP } from '../../core/utils/formatters';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="sw-page">
      <header class="sw-page-header">
        <div>
          <h1 class="sw-page-title">Proveedores</h1>
          <p class="sw-page-subtitle">
            Directorio de aliados comerciales, NIT, contactos y productos suministrados
          </p>
        </div>
        <div class="sw-header-actions">
          <button type="button" class="sw-btn sw-btn-primary" (click)="openCreate()">
            <lucide-icon [img]="PlusIcon" [size]="16" />
            <span>Nuevo proveedor</span>
          </button>
        </div>
      </header>

      <section class="sw-card">
        <div class="sw-toolbar">
          <div class="sw-filter-group">
            <div class="sw-search-input-wrap">
              <span class="sw-search-icon"><lucide-icon [img]="SearchIcon" [size]="15" /></span>
              <input
                type="search"
                class="sw-input"
                placeholder="Buscar por nombre comercial, NIT o contacto..."
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
              />
            </div>
          </div>
          <span class="result-count">{{ filteredSuppliers().length }} proveedor(es)</span>
        </div>

        <div class="sw-table-wrap">
          <table class="sw-table">
            <thead>
              <tr>
                <th>Nombre comercial</th>
                <th>NIT</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Correo electrónico</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filteredSuppliers(); track s.id) {
                <tr>
                  <td>
                    <strong>{{ s.commercialName }}</strong>
                    <div class="sub-text">{{ s.address }}</div>
                  </td>
                  <td class="sw-mono">{{ s.nit }}</td>
                  <td>{{ s.contactName }}</td>
                  <td>{{ s.phone }}</td>
                  <td>{{ s.email }}</td>
                  <td class="sw-mono">
                    <button type="button" class="count-link" (click)="productsModalSupplier.set(s)">
                      {{ associatedCount(s.id) }} producto(s)
                    </button>
                  </td>
                  <td>
                    <app-status-badge
                      [label]="s.status === 'ACTIVO' ? 'Activo' : 'Inactivo'"
                      [tone]="s.status === 'ACTIVO' ? 'success' : 'neutral'"
                    />
                  </td>
                  <td>
                    <div class="row-actions">
                      <button
                        type="button"
                        class="sw-icon-btn"
                        title="Consultar productos asociados"
                        (click)="productsModalSupplier.set(s)"
                      >
                        <lucide-icon [img]="EyeIcon" [size]="16" />
                      </button>
                      <button
                        type="button"
                        class="sw-icon-btn"
                        title="Editar proveedor"
                        (click)="openEdit(s)"
                      >
                        <lucide-icon [img]="PencilIcon" [size]="16" />
                      </button>
                      <button
                        type="button"
                        class="sw-icon-btn danger"
                        title="Eliminar proveedor"
                        (click)="deleteTarget.set(s)"
                      >
                        <lucide-icon [img]="TrashIcon" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
                    <div class="sw-empty-state">
                      <lucide-icon [img]="TruckIcon" [size]="32" />
                      <h4>No se encontraron proveedores</h4>
                      <p>Ajusta tu búsqueda o registra un nuevo proveedor en el sistema.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <app-modal
      [open]="formOpen()"
      [title]="editing() ? 'Editar proveedor' : 'Registrar proveedor'"
      maxWidth="620px"
      (closed)="formOpen.set(false)"
    >
      @if (formError()) {
        <div class="form-alert">{{ formError() }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="save()" class="sw-form-grid">
        <div class="sw-field sw-col-span-2">
          <label class="sw-label">Nombre comercial <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="commercialName" />
        </div>
        <div class="sw-field">
          <label class="sw-label">NIT <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="nit" placeholder="900.123.456-7" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Estado</label>
          <select class="sw-select" formControlName="status">
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
        <div class="sw-field">
          <label class="sw-label">Persona de contacto <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="contactName" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Teléfono <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="phone" placeholder="+57 300..." />
        </div>
        <div class="sw-field">
          <label class="sw-label">Correo electrónico <span class="req">*</span></label>
          <input type="email" class="sw-input" formControlName="email" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Dirección</label>
          <input type="text" class="sw-input" formControlName="address" />
        </div>
        <div class="modal-actions sw-col-span-2">
          <button type="button" class="sw-btn sw-btn-secondary" (click)="formOpen.set(false)">
            Cancelar
          </button>
          <button type="submit" class="sw-btn sw-btn-primary">
            {{ editing() ? 'Guardar cambios' : 'Registrar proveedor' }}
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal
      [open]="productsModalSupplier() !== null"
      [title]="'Productos de ' + (productsModalSupplier()?.commercialName ?? '')"
      [subtitle]="'NIT: ' + (productsModalSupplier()?.nit ?? '')"
      maxWidth="620px"
      (closed)="productsModalSupplier.set(null)"
    >
      <div class="sw-table-wrap">
        <table class="sw-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Precio compra</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            @for (p of associatedProducts(); track p.id) {
              <tr>
                <td><strong>{{ p.name }}</strong></td>
                <td class="sw-mono">{{ p.sku }}</td>
                <td class="sw-mono">{{ cop(p.purchasePrice) }}</td>
                <td class="sw-mono">{{ p.stock }} uds</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4">
                  <div class="sw-empty-state">
                    <h4>Sin productos asociados</h4>
                    <p>Este proveedor aún no tiene referencias asignadas en el catálogo.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-modal>

    <app-confirm-dialog
      [open]="deleteTarget() !== null"
      title="Eliminar proveedor"
      [message]="'¿Deseas eliminar a ' + (deleteTarget()?.commercialName ?? '') + '?'"
      confirmLabel="Eliminar"
      (cancelled)="deleteTarget.set(null)"
      (confirmed)="confirmDelete()"
    />
  `,
  styles: `
    .result-count {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--sw-text-secondary);
    }

    .sub-text {
      font-size: 11.5px;
      color: var(--sw-text-secondary);
    }

    .count-link {
      border: none;
      background: var(--sw-teal-50);
      color: var(--sw-teal-700);
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .row-actions {
      display: flex;
      gap: 4px;
    }

    .form-alert {
      padding: 10px 12px;
      border-radius: var(--sw-radius-sm);
      background: var(--sw-danger-bg);
      color: var(--sw-danger-text);
      font-size: 13px;
      margin-bottom: 12px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 6px;
    }
  `,
})
export class SuppliersPageComponent {
  readonly store = inject(InventoryStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly EyeIcon = Eye;
  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;
  readonly TruckIcon = Truck;

  readonly searchTerm = signal('');
  readonly formOpen = signal(false);
  readonly editing = signal<Supplier | null>(null);
  readonly deleteTarget = signal<Supplier | null>(null);
  readonly productsModalSupplier = signal<Supplier | null>(null);
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    commercialName: ['', Validators.required],
    nit: ['', Validators.required],
    contactName: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: [''],
    status: ['ACTIVO' as SupplierStatus],
  });

  readonly filteredSuppliers = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    return this.store.suppliers().filter(
      (s) =>
        !q ||
        s.commercialName.toLowerCase().includes(q) ||
        s.nit.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q),
    );
  });

  readonly associatedProducts = computed(() => {
    const sup = this.productsModalSupplier();
    if (!sup) return [];
    return this.store.products().filter((p) => p.supplierId === sup.id);
  });

  associatedCount(supplierId: string): number {
    return this.store.products().filter((p) => p.supplierId === supplierId).length;
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set('');
    this.form.reset({
      commercialName: '',
      nit: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVO',
    });
    this.formOpen.set(true);
  }

  openEdit(sup: Supplier): void {
    this.editing.set(sup);
    this.formError.set('');
    this.form.reset({
      commercialName: sup.commercialName,
      nit: sup.nit,
      contactName: sup.contactName,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      status: sup.status,
    });
    this.formOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completa los campos obligatorios con un correo válido.');
      return;
    }
    const raw = this.form.getRawValue();
    const current = this.editing();
    const res = current ? this.store.updateSupplier(current.id, raw) : this.store.addSupplier(raw);

    if (!res.ok) {
      this.formError.set(res.error ?? 'Error guardando el proveedor.');
      return;
    }
    this.formOpen.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    const res = this.store.deleteSupplier(target.id);
    if (!res.ok && res.error) {
      this.notifications.warning('No se pudo eliminar', res.error);
    }
    this.deleteTarget.set(null);
  }

  cop(val: number): string {
    return formatCOP(val);
  }
}

