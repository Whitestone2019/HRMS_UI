// src/app/dashboard/overview/team-attendance-breakdown-pie/team-attendance-breakdown-pie.component.ts

import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-team-attendance-breakdown-pie',
  templateUrl: './team-attendance-breakdown-pie.component.html',
  styleUrls: ['./team-attendance-breakdown-pie.component.css']
})
export class TeamAttendanceBreakdownPieComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() attendancePercentage: number = 0;
  @Input() totalPresent: number = 0;
  @Input() leaveWithPay: number = 0;
  @Input() leaveWithoutPay: number = 0;
  @Input() unplannedLeave: number = 0;
  @Input() period: string = 'Current Cycle';

  @ViewChild('chartCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private chart!: Chart;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const data = [
      this.totalPresent || 0,
      this.leaveWithPay || 0,
      this.leaveWithoutPay || 0,
      this.unplannedLeave || 0
    ];

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Paid Leave (SL/CL)', 'Leave Without Pay', 'Unplanned Absent'],
        datasets: [{
          data,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
          borderColor: '#ffffff',
          borderWidth: 5,
          borderRadius: 12,
          spacing: 4,
         // cutout: '72%',
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = data.reduce((a: number, b: number) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${value} days (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }

  private updateChart(): void {
    const newData = [
      this.totalPresent || 0,
      this.leaveWithPay || 0,
      this.leaveWithoutPay || 0,
      this.unplannedLeave || 0
    ];

    this.chart.data.datasets[0].data = newData;
    this.chart.update('none'); // smooth silent update
  }
}