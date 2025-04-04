import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-chart-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>{{ title }}</h3>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    canvas {
      width: 100% !important;
      height: 300px !important;
    }
  `]
})
export class ChartContainerComponent implements AfterViewInit {
  @Input() title!: string;
  @Input() config!: ChartConfiguration;
  @ViewChild('chartCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  private chart?: Chart;

  ngAfterViewInit() {
    if (this.config && this.canvas) {
      this.chart = new Chart(this.canvas.nativeElement, this.config);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}