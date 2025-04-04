import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payroll">
      <div class="payroll-header">
        <h2>Payroll Management</h2>
        <div class="actions">
          <button class="btn primary">Process Payroll</button>
          <button class="btn secondary">Download Reports</button>
        </div>
      </div>

      <div class="payroll-summary">
        <div class="summary-card">
          <h3>Next Payroll Date</h3>
          <p class="value">May 25, 2024</p>
          <p class="description">5 days remaining</p>
        </div>
        <div class="summary-card">
          <h3>Total Payroll Amount</h3>
          <p class="value">$125,750</p>
          <p class="description">For 156 employees</p>
        </div>
        <div class="summary-card">
          <h3>Tax Deductions</h3>
          <p class="value">$37,725</p>
          <p class="description">Federal + State</p>
        </div>
      </div>

      <div class="payroll-history">
        <h3>Recent Payroll History</h3>
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employees</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let history of payrollHistory">
              <td>{{history.date}}</td>
              <td>{{history.employees}}</td>
              <td>$]{{history.amount}}</td>
              <td>
                <span [class]="'status ' + history.status.toLowerCase()">
                  {{history.status}}
                </span>
              </td>
              <td>
                <button class="action-btn">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .payroll {
      padding: 2rem;
    }

    .payroll-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
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

    .payroll-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-card h3 {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 0.5rem 0;
    }

    .summary-card .value {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0;
      color: #333;
    }

    .summary-card .description {
      color: #666;
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
    }

    .payroll-history {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background: #f8f9fa;
      font-weight: 500;
      color: #666;
    }

    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .status.completed {
      background: #e6ffed;
      color: #00c853;
    }

    .status.processing {
      background: #fff3e0;
      color: #ff9800;
    }

    .status.failed {
      background: #ffebee;
      color: #ff3d00;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class PayrollComponent {
  payrollHistory = [
    {
      date: 'Apr 25, 2024',
      employees: 156,
      amount: '125,750',
      status: 'Completed'
    },
    {
      date: 'Mar 25, 2024',
      employees: 155,
      amount: '124,500',
      status: 'Completed'
    },
    {
      date: 'Feb 25, 2024',
      employees: 153,
      amount: '122,400',
      status: 'Completed'
    }
  ];
}