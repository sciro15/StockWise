import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Lightbulb,
  LucideAngularModule,
  Package,
  PackageX,
  Plus,
} from 'lucide-angular';
import { InventoryStoreService } from '../../core/services/inventory-store.service';
import { MovementType } from '../../core/models/inventory.models';
import {
  formatCOP,
  formatDateBogota,
  formatNumber,
  isInboundMovement,
  movementTypeLabel,
} from '../../core/utils/formatters';
import { ChartCanvasComponent } from '../../shared/components/chart-canvas.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    ChartCanvasComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  readonly store = inject(InventoryStoreService);

  readonly PackageIcon = Package;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly PackageXIcon = PackageX;
  readonly DollarSignIcon = DollarSign;
  readonly ArrowDownLeftIcon = ArrowDownLeft;
  readonly ArrowUpRightIcon = ArrowUpRight;
  readonly ArrowRightIcon = ArrowRight;
  readonly LightbulbIcon = Lightbulb;
  readonly PlusIcon = Plus;

  readonly recentMovements = computed(() =>
    this.store
      .movements()
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7),
  );

  readonly priorityAlerts = computed(() => this.store.alerts().slice(0, 5));

  readonly entriesVsExitsConfig = computed<ChartConfiguration<'line'>>(() => {
    const series = this.store.last30DaysChart();
    return {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          {
            label: 'Entradas',
            data: series.entries,
            borderColor: '#0D9488',
            backgroundColor: 'rgba(13, 148, 136, 0.12)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 2,
          },
          {
            label: 'Salidas',
            data: series.exits,
            borderColor: '#142B4A',
            backgroundColor: 'rgba(20, 43, 74, 0.08)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end' },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, color: '#64748B', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#64748B', font: { size: 11 } },
            grid: { color: '#F1F5F9' },
          },
        },
      },
    };
  });

  readonly topRotationConfig = computed<ChartConfiguration<'bar'>>(() => {
    const data = this.store.topRotatingChart();
    return {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Unidades vendidas / salidas',
            data: data.values,
            backgroundColor: '#1E4268',
            borderRadius: 6,
            barThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#64748B', font: { size: 11 } },
            grid: { color: '#F1F5F9' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#172033', font: { size: 11 } },
          },
        },
      },
    };
  });

  readonly categoryDistributionConfig = computed<ChartConfiguration<'doughnut'>>(() => {
    const items = this.store.categoryDistributionChart();
    return {
      type: 'doughnut',
      data: {
        labels: items.map((i) => i.category.name),
        datasets: [
          {
            data: items.map((i) => i.totalStock),
            backgroundColor: items.map((i) => i.category.color),
            borderWidth: 2,
            borderColor: '#FFFFFF',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 14, color: '#475569', font: { size: 11.5 } },
          },
        },
      },
    };
  });

  cop(value: number): string {
    return formatCOP(value);
  }

  num(value: number): string {
    return formatNumber(value);
  }

  formatDate(iso: string): string {
    return formatDateBogota(iso);
  }

  productName(id: string): string {
    return this.store.productMap().get(id)?.name ?? 'Producto eliminado';
  }

  movementLabel(type: MovementType): string {
    return movementTypeLabel(type);
  }

  movementTone(type: MovementType): 'success' | 'danger' | 'info' | 'warning' {
    switch (type) {
      case 'ENTRADA':
        return 'success';
      case 'SALIDA':
        return 'info';
      case 'AJUSTE_POSITIVO':
        return 'teal' as never;
      case 'AJUSTE_NEGATIVO':
        return 'warning';
    }
  }

  isInbound(type: MovementType): boolean {
    return isInboundMovement(type);
  }
}

