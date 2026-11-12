import { Component, HostListener, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)" role="dialog" aria-modal="true">
        <div class="modal-panel" [style.max-width]="maxWidth()">
          <header class="modal-header">
            <div>
              <h3 class="modal-title">{{ title() }}</h3>
              @if (subtitle()) {
                <p class="modal-subtitle">{{ subtitle() }}</p>
              }
            </div>
            <button
              type="button"
              class="sw-icon-btn"
              (click)="closed.emit()"
              aria-label="Cerrar ventana"
            >
              <lucide-icon [img]="XIcon" [size]="18" />
            </button>
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(15, 23, 42, 0.52);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    }

    .modal-panel {
      width: 100%;
      background: var(--sw-surface);
      border-radius: var(--sw-radius-lg);
      border: 1px solid var(--sw-border);
      box-shadow: var(--sw-shadow-lg);
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.16s ease-out;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.98) translateY(6px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--sw-border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--sw-text-primary);
    }

    .modal-subtitle {
      font-size: 12.5px;
      color: var(--sw-text-secondary);
      margin-top: 2px;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }
  `,
})
export class ModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly maxWidth = input<string>('640px');
  readonly closed = output<void>();

  readonly XIcon = X;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}

