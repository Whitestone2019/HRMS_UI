import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports">
      <div class="reports-header">
        <h2>Reports</h2>
        <div class="actions">
          <button class="btn secondary">Export All</button>
          <button class="btn primary">Generate Report</button>
        </div>
      </div>

      <div class="reports-grid">
        <div class="report-card">
          <div class="report-icon">📊</div>
          <div class="report-details">
            <h3>Payroll Summary</h3>
            <p>Monthly payroll reports with detailed breakdowns</p>
            <button class="btn secondary">View Report</button>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">💰</div>
          <div class="report-details">
            <h3>Tax Reports</h3>
            <p>Tax deductions and compliance reports</p>
            <button class="btn secondary">View Report</button>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">👥</div>
          <div class="report-details">
            <h3>Employee Statistics</h3>
            <p>Employee demographics and statistics</p>
            <button class="btn secondary">View Report</button>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">📅</div>
          <div class="report-details">
            <h3>Leave Reports</h3>
            <p>Employee leave and attendance tracking</p>
            <button class="btn secondary">View Report</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports {
      padding: 2rem;
    }

    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .report-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      gap: 1.5rem;
    }

    .report-icon {
      font-size: 2rem;
    }

    .report-details h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .report-details p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      border: none;
      font-weight: 500;
      cursor: pointer;
    }

    .btn.primary {
      background: #2d5bff;
      color: white;
    }

    .btn.secondary {
      background: #f0f3ff;
      color: #2d5bff;
    }
  `]
})
export class ReportsComponent {}