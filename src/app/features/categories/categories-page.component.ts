import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FolderTree, LucideAngularModule, Pencil, Plus, Trash2 } from 'lucide-angular';
import { Category } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatCOP } from '../../core/utils/formatters';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="sw-page">
      <header class="sw-page-header">
        <div>
          <h1 class="sw-page-title">Categorías de productos</h1>
          <p class="sw-page-subtitle">
            Organiza el catálogo comercial y consulta el volumen de existencias por línea
          </p>
        </div>
        <div class="sw-header-actions">
          <button type="button" class="sw-btn sw-btn-primary" (click)="openCreate()">
            <lucide-icon [img]="PlusIcon" [size]="16" />
            <span>Nueva categoría</span>
          </button>
        </div>
      </header>

      <section class="cat-grid">
        @for (item of enrichedCategories(); track item.category.id) {
          <article class="sw-card cat-card">
            <div class="cat-top">
              <div class="cat-title-wrap">
                <span class="cat-dot" [style.background]="item.category.color"></span>
                <h3>{{ item.category.name }}</h3>
              </div>
              <div class="cat-actions">
                <button
                  type="button"
                  class="sw-icon-btn"
                  title="Editar categoría"
                  (click)="openEdit(item.category)"
                >
                  <lucide-icon [img]="PencilIcon" [size]="15" />
                </button>
                <button
                  type="button"
                  class="sw-icon-btn danger"
                  title="Eliminar categoría"
                  (click)="deleteTarget.set(item.category)"
                >
                  <lucide-icon [img]="TrashIcon" [size]="15" />
                </button>
              </div>
            </div>

            <p class="cat-desc">{{ item.category.description || 'Sin descripción registrada.' }}</p>

            <div class="cat-metrics">
              <div>
                <span>Productos</span>
                <strong class="sw-mono">{{ item.productCount }}</strong>
              </div>
              <div>
                <span>Unidades</span>
                <strong class="sw-mono">{{ item.totalUnits }}</strong>
              </div>
              <div>
                <span>Valorización</span>
                <strong class="sw-mono">{{ cop(item.totalValue) }}</strong>
              </div>
            </div>
          </article>
        } @empty {
          <div class="sw-card sw-empty-state">
            <lucide-icon [img]="FolderTreeIcon" [size]="32" />
            <h4>No hay categorías registradas</h4>
            <p>Crea una categoría para comenzar a agrupar tus productos.</p>
          </div>
        }
      </section>
    </div>

    <app-modal
      [open]="modalOpen()"
      [title]="editing() ? 'Editar categoría' : 'Nueva categoría'"
      maxWidth="460px"
      (closed)="modalOpen.set(false)"
    >
      @if (formError()) {
        <div class="form-alert">{{ formError() }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="save()" class="cat-form">
        <div class="sw-field">
          <label class="sw-label">Nombre <span class="req">*</span></label>
          <input type="text" class="sw-input" formControlName="name" placeholder="Ej. Redes y Conectividad" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Color identificador</label>
          <input type="color" class="color-input" formControlName="color" />
        </div>
        <div class="sw-field">
          <label class="sw-label">Descripción</label>
          <textarea
            class="sw-textarea"
            formControlName="description"
            placeholder="Describe qué tipo de referencias agrupa esta categoría..."
          ></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="sw-btn sw-btn-secondary" (click)="modalOpen.set(false)">
            Cancelar
          </button>
          <button type="submit" class="sw-btn sw-btn-primary">
            {{ editing() ? 'Guardar cambios' : 'Crear categoría' }}
          </button>
        </div>
      </form>
    </app-modal>

    <app-confirm-dialog
      [open]="deleteTarget() !== null"
      title="Eliminar categoría"
      [message]="'¿Deseas eliminar la categoría ' + (deleteTarget()?.name ?? '') + '?'"
      confirmLabel="Eliminar"
      (cancelled)="deleteTarget.set(null)"
      (confirmed)="confirmDelete()"
    />
  `,
  styles: `
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .cat-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .cat-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;

      h3 {
        font-size: 15.5px;
        font-weight: 700;
      }
    }

    .cat-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .cat-actions {
      display: flex;
      gap: 4px;
    }

    .cat-desc {
      font-size: 13px;
      color: var(--sw-text-secondary);
      flex: 1;
    }

    .cat-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--sw-border);

      span {
        display: block;
        font-size: 11px;
        color: var(--sw-text-secondary);
      }

      strong {
        font-size: 13.5px;
        color: var(--sw-text-primary);
      }
    }

    .cat-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .color-input {
      width: 56px;
      height: 38px;
      padding: 2px;
      border-radius: 6px;
      border: 1px solid var(--sw-border-strong);
      background: #ffffff;
      cursor: pointer;
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
      margin-top: 4px;
    }
  `,
})
export class CategoriesPageComponent {
  readonly store = inject(InventoryStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;
  readonly FolderTreeIcon = FolderTree;

  readonly modalOpen = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly deleteTarget = signal<Category | null>(null);
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    color: ['#0D9488'],
  });

  readonly enrichedCategories = computed(() => {
    const products = this.store.products();
    return this.store.categories().map((category) => {
      const catProducts = products.filter((p) => p.categoryId === category.id);
      return {
        category,
        productCount: catProducts.length,
        totalUnits: catProducts.reduce((sum, p) => sum + p.stock, 0),
        totalValue: catProducts.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0),
      };
    });
  });

  openCreate(): void {
    this.editing.set(null);
    this.formError.set('');
    this.form.reset({ name: '', description: '', color: '#0D9488' });
    this.modalOpen.set(true);
  }

  openEdit(cat: Category): void {
    this.editing.set(cat);
    this.formError.set('');
    this.form.reset({ name: cat.name, description: cat.description, color: cat.color });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.formError.set('El nombre de la categoría es obligatorio.');
      return;
    }
    const { name, description, color } = this.form.getRawValue();
    const current = this.editing();
    const res = current
      ? this.store.updateCategory(current.id, name, description, color)
      : this.store.addCategory(name, description, color);

    if (!res.ok) {
      this.formError.set(res.error ?? 'Error guardando la categoría.');
      return;
    }
    this.modalOpen.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    const res = this.store.deleteCategory(target.id);
    if (!res.ok && res.error) {
      this.notifications.warning('No se pudo eliminar', res.error);
    }
    this.deleteTarget.set(null);
  }

  cop(val: number): string {
    return formatCOP(val);
  }
}

