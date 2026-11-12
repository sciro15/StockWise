import { Component, inject } from '@angular/core';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LucideAngularModule,
  X,
  XCircle,
} from 'lucide-angular';
import { NotificationService, ToastType } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast-card" [class]="'toast-card toast-' + toast.type">
          <div class="toast-icon">
            <lucide-icon [img]="iconFor(toast.type)" [size]="18" />
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-msg">{{ toast.message }}</div>
          </div>
          <button
            type="button"
            class="toast-close"
            (click)="notifications.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >
            <lucide-icon [img]="XIcon" [size]="15" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 32px);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #ffffff;
      border: 1px solid var(--sw-border);
      border-left-width: 4px;
      border-radius: var(--sw-radius-md);
      padding: 12px 14px;
      box-shadow: var(--sw-shadow-lg);
      animation: toastSlideIn 0.2s ease-out;
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .toast-success {
      border-left-color: var(--sw-success);
      .toast-icon {
        color: var(--sw-success);
      }
    }

    .toast-warning {
      border-left-color: var(--sw-warning);
      .toast-icon {
        color: var(--sw-warning);
      }
    }

    .toast-error {
      border-left-color: var(--sw-danger);
      .toast-icon {
        color: var(--sw-danger);
      }
    }

    .toast-info {
      border-left-color: var(--sw-teal-600);
      .toast-icon {
        color: var(--sw-teal-600);
      }
    }

    .toast-icon {
      margin-top: 1px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--sw-text-primary);
    }

    .toast-msg {
      font-size: 12.5px;
      color: var(--sw-text-secondary);
      margin-top: 2px;
    }

    .toast-close {
      border: none;
      background: transparent;
      color: var(--sw-text-muted);
      cursor: pointer;
      padding: 2px;
      display: inline-flex;

      &:hover {
        color: var(--sw-text-primary);
      }
    }
  `,
})
export class ToastContainerComponent {
  readonly notifications = inject(NotificationService);
  readonly XIcon = X;

  iconFor(type: ToastType) {
    switch (type) {
      case 'success':
        return CheckCircle2;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      case 'info':
      default:
        return Info;
    }
  }
}

