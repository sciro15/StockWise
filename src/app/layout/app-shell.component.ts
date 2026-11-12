import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  FileBarChart2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Truck,
  X,
} from 'lucide-angular';
import { AuthService } from '../core/services/auth.service';
import { InventoryStoreService } from '../core/services/inventory-store.service';
import { formatCOP } from '../core/utils/formatters';
import { StockwiseLogoComponent } from '../shared/components/stockwise-logo.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    StockwiseLogoComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly store = inject(InventoryStoreService);
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly globalSearch = signal('');
  readonly searchFocused = signal(false);

  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly LogOutIcon = LogOut;
  readonly PlusIcon = Plus;

  readonly navItems = [
    { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Productos', path: '/productos', icon: Package },
    { label: 'Inventario', path: '/inventario', icon: ArrowLeftRight },
    { label: 'Categorías', path: '/categorias', icon: FolderTree },
    { label: 'Proveedores', path: '/proveedores', icon: Truck },
    { label: 'Alertas', path: '/alertas', icon: Bell, showBadge: true },
    { label: 'Reportes', path: '/reportes', icon: FileBarChart2 },
    { label: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  readonly BoxesIcon = Boxes;

  readonly searchResults = computed(() => {
    const q = this.globalSearch().trim().toLowerCase();
    if (!q) return [];
    return this.store
      .products()
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q),
      )
      .slice(0, 6);
  });

  readonly topAlerts = computed(() => this.store.alerts().slice(0, 5));

  readonly userInitials = computed(() => {
    const name = this.auth.session()?.fullName ?? 'SW';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });

  formatPrice(value: number): string {
    return formatCOP(value);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalSearch.set(value);
  }

  goToProductSearch(query?: string): void {
    const term = (query ?? this.globalSearch()).trim();
    this.searchFocused.set(false);
    void this.router.navigate(['/productos'], {
      queryParams: term ? { q: term } : {},
    });
  }

  goToAlerts(): void {
    this.notificationsOpen.set(false);
    void this.router.navigate(['/alertas']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((v) => !v);
  }
}

