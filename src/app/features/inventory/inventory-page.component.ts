import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  LucideAngularModule,
  PlusCircle,
  Search,
} from 'lucide-angular';
import { MovementType } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import {
  formatDateBogota,
  isInboundMovement,
  movementTypeLabel,
  toBogotaInputDate,
} from '../../core/utils/formatters';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, StatusBadgeComponent],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss',
})
export class InventoryPageComponent implements OnInit {
  readonly store = inject(InventoryStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly PlusCircleIcon = PlusCircle;
  readonly SearchIcon = Search;
  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly ArrowDownLeftIcon = ArrowDownLeft;
  readonly ArrowUpRightIcon = ArrowUpRight;

  readonly searchTerm = signal('');
  readonly typeFilter = signal<'' | MovementType>('');
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    type: ['ENTRADA' as MovementType, Validators.required],
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    date: [toBogotaInputDate(), Validators.required],
    reason: ['Compra a proveedor', [Validators.required, Validators.minLength(2)]],
    notes: [''],
  });

  readonly selectedProductId = signal('');
  readonly selectedType = signal<MovementType>('ENTRADA');
  readonly selectedQuantity = signal(1);

  readonly selectedProduct = computed(() =>
    this.store.productMap().get(this.selectedProductId()) ?? null,
  );

  readonly projectedStock = computed(() => {
    const product = this.selectedProduct();
    if (!product) return null;
    const qty = Number(this.selectedQuantity()) || 0;
    return isInboundMovement(this.selectedType()) ? product.stock + qty : product.stock - qty;
  });

  readonly filteredMovements = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const t = this.typeFilter();

    return this.store
      .movements()
      .filter((m) => {
        const product = this.store.productMap().get(m.productId);
        const matchesQ =
          !q ||
          (product?.name.toLowerCase().includes(q) ?? false) ||
          (product?.sku.toLowerCase().includes(q) ?? false) ||
          m.reason.toLowerCase().includes(q) ||
          m.userName.toLowerCase().includes(q);
        const matchesType = !t || m.type === t;
        return matchesQ && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  ngOnInit(): void {
    const firstId = this.store.products()[0]?.id ?? '';
    this.form.controls.productId.setValue(firstId);
    this.selectedProductId.set(firstId);

    this.form.controls.productId.valueChanges.subscribe((v) => this.selectedProductId.set(v));
    this.form.controls.type.valueChanges.subscribe((v) => {
      this.selectedType.set(v);
      const defaultReason: Record<MovementType, string> = {
        ENTRADA: 'Compra a proveedor',
        SALIDA: 'Venta mostrador',
        AJUSTE_POSITIVO: 'Conteo cíclico bodega',
        AJUSTE_NEGATIVO: 'Merma o avería',
      };
      this.form.controls.reason.setValue(defaultReason[v]);
    });
    this.form.controls.quantity.valueChanges.subscribe((v) =>
      this.selectedQuantity.set(Number(v) || 0),
    );

    this.route.queryParamMap.subscribe((params) => {
      const productId = params.get('productId');
      const type = params.get('type') as MovementType | null;
      if (productId && this.store.productMap().has(productId)) {
        this.form.controls.productId.setValue(productId);
        this.selectedProductId.set(productId);
      }
      if (type) {
        this.form.controls.type.setValue(type);
        this.selectedType.set(type);
      }
    });
  }

  submitMovement(): void {
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completa todos los campos obligatorios con cantidades positivas.');
      return;
    }

    const raw = this.form.getRawValue();
    const res = this.store.registerMovement(raw);
    if (!res.ok) {
      this.formError.set(res.error ?? 'No fue posible registrar el movimiento.');
      return;
    }

    this.form.patchValue({
      quantity: 1,
      notes: '',
    });
  }

  productName(id: string): string {
    return this.store.productMap().get(id)?.name ?? 'Producto eliminado';
  }

  productSku(id: string): string {
    return this.store.productMap().get(id)?.sku ?? '—';
  }

  labelForType(type: MovementType): string {
    return movementTypeLabel(type);
  }

  isInbound(type: MovementType): boolean {
    return isInboundMovement(type);
  }

  formatDate(iso: string): string {
    return formatDateBogota(iso);
  }
}

