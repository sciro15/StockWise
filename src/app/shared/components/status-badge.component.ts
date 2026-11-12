import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="'sw-badge ' + toneClass()">
      <span class="dot"></span>
      {{ label() }}
    </span>
  `,
  styles: `
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.85;
    }
  `,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal'>('neutral');

  readonly toneClass = computed(() => `sw-badge-${this.tone()}`);
}

