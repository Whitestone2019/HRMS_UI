import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="salary-page">
      <div class="page-header">
        <h2>Salary Management</h2>
        <div class="actions">
          <button class="btn btn-primary" (click)="showSalaryForm = true">
            <i class="fas fa-plus me-2"></i>
            Add Salary Structure
          </button>
        </div>
      </div>

      <div class="grid grid-3">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-info">
              <h3>Total Payroll</h3>
              <p class="stat-value">$425,750</p>
              <p class="stat-change">Monthly</p>
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

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
              <h3>Next Review</h3>
              <p class="stat-value">15</p>
              <p class="stat-change">Days remaining</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Salary Form Modal -->
      <div class="modal" *ngIf="showSalaryForm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Salary Structure</h3>
            <button class="close-btn" (click)="showSalaryForm = false">×</button>
          </div>
          <div class="modal-body">
            <form (submit)="saveSalaryStructure($event)">
              <div class="form-group">
                <label>Employee</label>
                <select class="form-control" [(ngModel)]="salaryForm.employee" name="employee">
                  <option value="">Select Employee</option>
                  <option value="1">John Smith</option>
                  <option value="2">Sarah Johnson</option>
                </select>
              </div>
              <div class="form-group">
                <label>Basic Salary</label>
                <input type="number" class="form-control" [(ngModel)]="salaryForm.basicSalary" name="basicSalary">
              </div>
              <div class="form-group">
                <label>Allowances</label>
                <input type="number" class="form-control" [(ngModel)]="salaryForm.allowances" name="allowances">
              </div>
              <div class="form-group">
                <label>Deductions</label>
                <input type="number" class="form-control" [(ngModel)]="salaryForm.deductions" name="deductions">
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="showSalaryForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Salary Table -->
      <div class="card mt-4">
        <table class="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let salary of salaryData">
              <td>{{salary.employee}}</td>
              <td>{{salary.basicSalary}}</td>
              <td>{{salary.allowances}}</td>
              <td>{{salary.deductions}}</td>
              <td>{{salary.netSalary}}</td>
              <td>
                <button class="btn-icon" (click)="editSalary(salary)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" (click)="deleteSalary(salary)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .salary-page {
      padding: 1.5rem;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 500px;
      max-width: 90%;
    }

    .modal-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .mt-4 {
      margin-top: 2rem;
    }
  `]
})
export class SalaryComponent {
  showSalaryForm = false;
  
  salaryForm = {
    employee: '',
    basicSalary: 0,
    allowances: 0,
    deductions: 0
  };

  salaryData = [
    {
      employee: 'John Smith',
      basicSalary: 60000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 63000
    },
    {
      employee: 'Sarah Johnson',
      basicSalary: 55000,
      allowances: 4000,
      deductions: 1800,
      netSalary: 57200
    }
  ];

  saveSalaryStructure(event: Event) {
    event.preventDefault();
    // Add salary structure logic here
    this.showSalaryForm = false;
  }

  editSalary(salary: any) {
    // Edit salary logic
  }

  deleteSalary(salary: any) {
    // Delete salary logic
  }
}