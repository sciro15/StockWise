import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stockwise-logo',
  standalone: true,
  template: `
    <div class="sw-logo" [class.light]="theme() === 'light'">
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          width="36"
          height="36"
          rx="9"
          [attr.fill]="theme() === 'dark' ? '#0D9488' : '#142B4A'"
        />
        <path
          d="M18 7.5L27 12.5V23.5L18 28.5L9 23.5V12.5L18 7.5Z"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M9 12.5L18 17.5L27 12.5"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path d="M18 17.5V28.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
        <circle
          cx="26.5"
          cy="9.5"
          r="3.2"
          [attr.fill]="theme() === 'dark' ? '#CCFBF1' : '#0D9488'"
        />
      </svg>
      <div class="sw-logo-text">
        <span class="brand">Stock<span>Wise</span></span>
        @if (showSubtitle()) {
          <span class="tag">Inventario inteligente</span>
        }
      </div>
    </div>
  `,
  styles: `
    .sw-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      user-select: none;
    }

    .sw-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .brand {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;

      span {
        color: #5eead4;
      }
    }

    .tag {
      font-size: 11px;
      font-weight: 500;
      color: #94a3b8;
      margin-top: 2px;
    }

    .sw-logo.light {
      .brand {
        color: var(--sw-navy-900);

        span {
          color: var(--sw-teal-600);
        }
      }

      .tag {
        color: var(--sw-text-secondary);
      }
    }
  `,
})
export class StockwiseLogoComponent {
  readonly theme = input<'dark' | 'light'>('dark');
  readonly showSubtitle = input<boolean>(false);
}

