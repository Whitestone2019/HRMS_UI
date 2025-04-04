import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payroll-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-summary">
      <div class="page-header">
        <h2>Payroll Summary Report</h2>
        <div class="actions">
          <button class="btn btn-secondary me-2">
            <i class="fas fa-download me-2"></i>
            Export Report
          </button>
          <button class="btn btn-primary">
            <i class="fas fa-print me-2"></i>
            Print Report
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters">
          <div class="form-group">
            <label>Date Range</label>
            <select class="form-control" [(ngModel)]="filters.dateRange">
              <option value="current">Current Month</option>
              <option value="previous">Previous Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Year to Date</option>
            </select>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select class="form-control" [(ngModel)]="filters.department">
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="applyFilters()">
            Apply Filters
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-4">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <h3>Total Employees</h3>
              <p class="stat-value">156</p>
              <p class="stat-change">Active employees</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-info">
              <h3>Total Payroll</h3>
              <p class="stat-value">$425,750</p>
              <p class="stat-change">This month</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="stat-info">
              <h3>Tax Deductions</h3>
              <p class="stat-value">$127,725</p>
              <p class="stat-change">30% of payroll</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-info">
              <h3>Average Salary</h3>
              <p class="stat-value">$65,500</p>
              <p class="stat-change">Per employee</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Breakdown -->
      <div class="card">
        <h3>Department Breakdown</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Employees</th>
              <th>Total Salary</th>
              <th>Average Salary</th>
              <th>Tax Deductions</th>
              <th>Net Payroll</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let dept of departmentData">
              <td>{{dept.name}}</td>
              <td>{{dept.employees}}</td>
              <td>{{dept.totalSalary}}</td>
              <td>{{dept.avgSalary}}</td>
              <td>{{dept.taxDeductions}}</td>
              <td>{{dept.netPayroll}}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>156</strong></td>
              <td><strong>$425,750</strong></td>
              <td><strong>$65,500</strong></td>
              <td><strong>$127,725</strong></td>
              <td><strong>$298,025</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .payroll-summary {
      padding: 1.5rem;
    }

    .filters-card {
      margin-bottom: 1.5rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .form-group {
      flex: 1;
    }

    table tfoot {
      background: #f8f9fa;
    }

    table tfoot td {
      border-top: 2px solid #dee2e6;
    }

    .me-2 {
      margin-right: 0.5rem;
    }
  `]
})
export class PayrollSummaryComponent {
  filters = {
    dateRange: 'current',
    department: 'all'
  };

  departmentData = [
    {
      name: 'Engineering',
      employees: 45,
      totalSalary: '168,750',
      avgSalary: '75,000',
      taxDeductions: '50,625',
      netPayroll: '118,125'
    },
    {
      name: 'Marketing',
      employees: 32,
      totalSalary: '112,000',
      avgSalary: '70,000',
      taxDeductions: '33,600',
      netPayroll: '78,400'
    },
    {
      name: 'Sales',
      employees: 38,
      totalSalary: '145,000',
      avgSalary: '76,315',
      taxDeductions: '43,500',
      netPayroll: '101,500'
    }
  ];

  applyFilters() {
    // Apply filters logic
  }
}