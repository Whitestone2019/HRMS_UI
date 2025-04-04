import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tax-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tax-reports">
      <div class="page-header">
        <h2>Tax Reports</h2>
        <div class="actions">
          <button class="btn btn-secondary me-2">
            <i class="fas fa-download me-2"></i>
            Export Reports
          </button>
          <button class="btn btn-primary">
            <i class="fas fa-file-invoice me-2"></i>
            Generate Tax Forms
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" [(ngModel)]="filters.year">
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tax Type</label>
            <select class="form-control" [(ngModel)]="filters.taxType">
              <option value="all">All Taxes</option>
              <option value="federal">Federal Tax</option>
              <option value="state">State Tax</option>
              <option value="local">Local Tax</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="applyFilters()">
            Apply Filters
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-3">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-file-invoice-dollar"></i>
            </div>
            <div class="stat-info">
              <h3>Total Tax Withheld</h3>
              <p class="stat-value">$127,725</p>
              <p class="stat-change">Year to date</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="stat-info">
              <h3>Average Tax Rate</h3>
              <p class="stat-value">30%</p>
              <p class="stat-change">Company-wide</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="stat-info">
              <h3>Next Filing Due</h3>
              <p class="stat-value">15</p>
              <p class="stat-change">Days remaining</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tax Forms -->
      <div class="card">
        <h3>Tax Forms</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Form Type</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let form of taxForms">
              <td>{{form.type}}</td>
              <td>{{form.description}}</td>
              <td>{{form.dueDate}}</td>
              <td>
                <span [class]="'badge badge-' + form.status.toLowerCase()">
                  {{form.status}}
                </span>
              </td>
              <td>
                <button class="btn-icon" (click)="viewForm(form)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" (click)="downloadForm(form)">
                  <i class="fas fa-download"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tax Deductions Summary -->
      <div class="card mt-4">
        <h3>Tax Deductions Summary</h3>
        <div class="tax-summary">
          <div class="tax-category" *ngFor="let category of taxCategories">
            <div class="category-header">
              <h4>{{category.name}}</h4>
              <span class="amount">{{category.amount}}</span>
            </div>
            <div class="progress-bar">
              <div class="progress" [style.width]="category.percentage + '%'"></div>
            </div>
            <div class="category-footer">
              <span>{{category.percentage}}% of total</span>
              <span>{{category.count}} employees</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tax-reports {
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

    .tax-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .tax-category {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .category-header h4 {
      margin: 0;
      font-size: 1rem;
    }

    .amount {
      font-weight: 500;
      color: #2d5bff;
    }

    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      margin: 0.5rem 0;
    }

    .progress {
      height: 100%;
      background: #2d5bff;
      border-radius: 4px; 
      transition: width 0.3s ease;
    }

    .category-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #666;
    }

    .mt-4 {
      margin-top: 2rem;
    }

    .me-2 {
      margin-right: 0.5rem;
    }
  `]
})
export class TaxReportsComponent {
  filters = {
    year: '2024',
    taxType: 'all'
  };

  taxForms = [
    {
      type: 'W-2',
      description: 'Wage and Tax Statement',
      dueDate: 'Jan 31, 2024',
      status: 'Pending'
    },
    {
      type: '1099-NEC',
      description: 'Nonemployee Compensation',
      dueDate: 'Jan 31, 2024',
      status: 'Completed'
    },
    {
      type: '941',
      description: 'Quarterly Tax Return',
      dueDate: 'Apr 30, 2024',
      status: 'Upcoming'
    }
  ];

  taxCategories = [
    {
      name: 'Federal Income Tax',
      amount: '85,150',
      percentage: 40,
      count: 156
    },
    {
      name: 'State Income Tax',
      amount: '25,545',
      percentage: 20,
      count: 156
    },
    {
      name: 'Social Security',
      amount: '38,317',
      percentage: 30,
      count: 156
    },
    {
      name: 'Medicare',
      amount: '12,772',
      percentage: 10,
      count: 156
    }
  ];

  applyFilters() {
    // Apply filters logic
  }

  viewForm(form: any) {
    // View form logic
  }

  downloadForm(form: any) {
    // Download form logic
  }
}