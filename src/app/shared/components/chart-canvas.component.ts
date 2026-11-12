import {
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-canvas',
  standalone: true,
  template: `
    <div class="chart-box" [style.height.px]="height()">
      <canvas #canvasEl></canvas>
    </div>
  `,
  styles: `
    .chart-box {
      position: relative;
      width: 100%;
    }
  `,
})
export class ChartCanvasComponent implements OnDestroy {
  readonly config = input.required<ChartConfiguration<ChartType>>();
  readonly height = input<number>(280);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasEl');
  private chartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      const cfg = this.config();
      if (!canvas || !cfg) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
      this.chartInstance = new Chart(canvas, cfg);
    });
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
    this.chartInstance = null;
  }
}

