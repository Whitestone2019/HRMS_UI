import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';
import {
  Chart, ChartConfiguration, registerables
} from 'chart.js';

@Component({
  selector: 'app-attendance-pie-chart',
  template: `
    <div class="chart-container">
      <div class="chart-wrapper">
       <h4 class="chart-title">{{ label }}</h4>
        <div class="chart-box">
          <div class="chart-canvas-container">
            <canvas #chartCanvas class="chart-canvas"></canvas>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color present"></span>
            <span class="legend-text">Present: {{ present }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color absent"></span>
            <span class="legend-text">Absent: {{ absent }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      display: flex;
      justify-content: center;
      padding: 1rem;
      overflow: visible;
    }

    .chart-wrapper {
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      padding: 1.5rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: visible;
    }

    .chart-title {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #333;
    }

    .chart-box {
      border-radius: 0.5rem;
      padding: 1rem;
      height: 16rem;
      overflow: visible; /* ✅ prevent clipping */
    }

    .chart-canvas-container {
      height: 100%;
      position: relative;
      overflow: visible;
    }

    .chart-canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-color {
      display: block;
      width: 2rem;
      height: 0.25rem;
      border-radius: 4px;
    }

    .present {
      background-color: #10b981;
    }

    .absent {
      background-color: #ef4444;
    }

    .legend-text {
      color: #333;
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .chart-wrapper {
        padding: 1rem;
      }

      .chart-title {
        font-size: 1rem;
      }

      .chart-box {
        height: 12rem;
      }

      .legend-text {
        font-size: 0.875rem;
      }

      .legend-color {
        width: 1.5rem;
      }
    }
  `]
})
export class AttendancePieChartComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() present: number = 0;
  @Input() absent: number = 0;
  @Input() day: string = 'Monday';
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef;
@Input() label: string = "Today's Attendance";

  private chart: Chart<'pie'> | null = null;
  private initialized = false;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initialized = true;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && (changes['present'] || changes['absent'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private renderChart(): void {
    const ctx = this.chartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, this.getChartConfig());
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.data.datasets[0].data = [this.present || 0, this.absent || 0];
      this.chart.update();
    }
  }

  private getChartConfig(): ChartConfiguration<'pie', number[], string> {
    return {
      type: 'pie',
      data: {
        labels: ['Present', 'Absent'],
        datasets: [{
          data: [this.present || 0, this.absent || 0],
          backgroundColor: ['#02a51bff', '#EF4444'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -15,
        layout: {
          padding: 20 // ✅ ensure spacing around chart
        },
        elements: {
          arc: {
            borderAlign: 'inner',
            borderRadius: 10
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#333',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            callbacks: {
              label: (context) => {
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${percent}%)`;
              }
            }
          }
        }
      }
    };
  }
}
