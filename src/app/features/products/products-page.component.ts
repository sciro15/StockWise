import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ArrowUpDown,
  Eye,
  LucideAngularModule,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-angular';
import { Product, ProductStatus } from '../../core/models/inventory.models';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { formatCOP, formatDateBogota, productStatusLabel } from '../../core/utils/formatters';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

type SortField = 'name' | 'sku' | 'purchasePrice' | 'salePrice' | 'stock';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent implements OnInit {
  readonly store = inject(InventoryStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly EyeIcon = Eye;
  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;
  readonly ArrowUpDownIcon = ArrowUpDown;
  readonly PackageIcon = Package;

  readonly searchTerm = signal('');
  readonly categoryFilter = signal('');
  readonly statusFilter = signal<'' | ProductStatus>('');
  readonly sortField = signal<SortField>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = 8;

  readonly formOpen = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly formError = signal('');

  readonly detailProduct = signal<Product | null>(null);
  readonly deleteTarget = signal<Product | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    sku: ['', [Validators.required, Validators.minLength(3)]],
    barcode: [''],
    categoryId: ['', Validators.required],
    supplierId: ['', Validators.required],
    purchasePrice: [0, [Validators.required, Validators.min(1)]],
    salePrice: [0, [Validators.required, Validators.min(1)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minStock: [5, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
  });

  readonly filteredProducts = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.categoryFilter();
    const st = this.statusFilter();
    const field = this.sortField();
    const dir = this.sortDir();

    const list = this.store.products().filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      const matchesCat = !cat || p.categoryId === cat;
      const status = this.store.getProductStatus(p);
      const matchesStatus = !st || status === st;
      return matchesQ && matchesCat && matchesStatus;
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (field === 'name' || field === 'sku') {
        cmp = a[field].localeCompare(b[field], 'es');
      } else {
        cmp = a[field] - b[field];
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)),
  );

  readonly pagedProducts = computed(() => {
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q');
      if (q !== null) {
        this.searchTerm.set(q);
        this.page.set(1);
      }
    });
  }

  onSearch(val: string): void {
    this.searchTerm.set(val);
    this.page.set(1);
  }

  onCategoryChange(val: string): void {
    this.categoryFilter.set(val);
    this.page.set(1);
  }

  onStatusChange(val: string): void {
    this.statusFilter.set(val as '' | ProductStatus);
    this.page.set(1);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.formError.set('');
    this.form.reset({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: this.store.categories()[0]?.id ?? '',
      supplierId: this.store.suppliers()[0]?.id ?? '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
      imageUrl: '',
    });
    this.formOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.formError.set('');
    this.form.reset({
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
    });
    this.formOpen.set(true);
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.form.controls.imageUrl.setValue(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  submitProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completa los campos obligatorios con valores válidos.');
      return;
    }

    const raw = this.form.getRawValue();
    const editing = this.editingProduct();

    if (!this.store.isSkuUnique(raw.sku, editing?.id)) {
      this.formError.set(`El SKU "${raw.sku}" ya está asignado a otro producto.`);
      return;
    }

    const fallbackSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#E2E8F0"/><text x="48" y="55" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="24" fill="#142B4A">${raw.name.slice(0, 3).toUpperCase()}</text></svg>`,
    )}`;

    const payload = {
      ...raw,
      imageUrl: raw.imageUrl.trim() || fallbackSvg,
    };

    const result = editing
      ? this.store.updateProduct(editing.id, payload)
      : this.store.addProduct(payload);

    if (!result.ok) {
      this.formError.set(result.error ?? 'No se pudo guardar el producto.');
      return;
    }

    this.formOpen.set(false);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.store.deleteProduct(target.id);
    this.deleteTarget.set(null);
  }

  categoryName(id: string): string {
    return this.store.categoryMap().get(id)?.name ?? 'Sin categoría';
  }

  supplierName(id: string): string {
    return this.store.supplierMap().get(id)?.commercialName ?? 'Sin proveedor';
  }

  statusLabel(product: Product): string {
    return productStatusLabel(this.store.getProductStatus(product));
  }

  statusTone(product: Product): 'success' | 'warning' | 'danger' | 'info' {
    const st = this.store.getProductStatus(product);
    switch (st) {
      case 'NORMAL':
        return 'success';
      case 'STOCK_BAJO':
        return 'warning';
      case 'AGOTADO':
        return 'danger';
      case 'EXCESO':
        return 'info';
    }
  }

  cop(value: number): string {
    return formatCOP(value);
  }

  formatDate(iso: string): string {
    return formatDateBogota(iso, true);
  }

  marginPercent(product: Product): string {
    if (product.purchasePrice <= 0) return '0%';
    const pct = ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100;
    return `${pct.toFixed(1)}%`;
  }
}

