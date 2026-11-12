import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/products/products-page.component').then(
            (m) => m.ProductsPageComponent,
          ),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/inventory/inventory-page.component').then(
            (m) => m.InventoryPageComponent,
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/categories/categories-page.component').then(
            (m) => m.CategoriesPageComponent,
          ),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./features/suppliers/suppliers-page.component').then(
            (m) => m.SuppliersPageComponent,
          ),
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('./features/alerts/alerts-page.component').then((m) => m.AlertsPageComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reports/reports-page.component').then(
            (m) => m.ReportsPageComponent,
          ),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then(
            (m) => m.SettingsPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
