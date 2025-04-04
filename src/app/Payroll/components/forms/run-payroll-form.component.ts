import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-run-payroll-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Run Payroll</h3>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Pay Period</label>
              <select class="form-control" [(ngModel)]="formData.payPeriod" name="payPeriod" required>
                <option value="current">Current Period (May 1-15, 2024)</option>
                <option value="previous">Previous Period (Apr 16-30, 2024)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Payment Date</label>
              <input type="date" class="form-control" [(ngModel)]="formData.paymentDate" name="paymentDate" required>
            </div>

            <div class="form-group">
              <label>Payment Method</label>
              <select class="form-control" [(ngModel)]="formData.paymentMethod" name="paymentMethod" required>
                <option value="direct_deposit">Direct Deposit</option>
                <option value="check">Check</option>
              </select>
            </div>

            <div class="form-summary">
              <div class="summary-item">
                <span>Total Employees:</span>
                <strong>156</strong>
              </div>
              <div class="summary-item">
                <span>Gross Pay:</span>
                <strong>$425,750</strong>
              </div>
              <div class="summary-item">
                <span>Deductions:</span>
                <strong>$127,725</strong>
              </div>
              <div class="summary-item">
                <span>Net Pay:</span>
                <strong>$298,025</strong>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-primary">Run Payroll</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
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

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-summary {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .summary-item:last-child {
      margin-bottom: 0;
      padding-top: 0.5rem;
      border-top: 1px solid #dee2e6;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  `]
})
export class RunPayrollFormComponent {
  isVisible = false;
  formData = {
    payPeriod: 'current',
    paymentDate: '',
    paymentMethod: 'direct_deposit'
  };

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
  }

  onSubmit() {
    console.log('Running payroll:', this.formData);
    this.close();
  }
}