import { Component, input, output } from '@angular/core';
import { AlertTriangle, LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, LucideAngularModule],
  template: `
    <app-modal [open]="open()" [title]="title()" maxWidth="440px" (closed)="cancelled.emit()">
      <div class="confirm-body">
        <div class="confirm-icon">
          <lucide-icon [img]="AlertTriangleIcon" [size]="22" />
        </div>
        <p class="confirm-message">{{ message() }}</p>
      </div>
      <div class="confirm-actions">
        <button type="button" class="sw-btn sw-btn-secondary" (click)="cancelled.emit()">
          Cancelar
        </button>
        <button type="button" class="sw-btn sw-btn-danger" (click)="confirmed.emit()">
          {{ confirmLabel() }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .confirm-body {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .confirm-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: var(--sw-danger-bg);
      color: var(--sw-danger);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .confirm-message {
      font-size: 13.5px;
      color: var(--sw-text-secondary);
      line-height: 1.55;
      padding-top: 2px;
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 22px;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input.required<boolean>();
  readonly title = input<string>('Confirmar acción');
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Eliminar');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly AlertTriangleIcon = AlertTriangle;
}

