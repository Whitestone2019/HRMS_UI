import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-process-payroll-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Process Payroll</h3>
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

            <div class="process-steps">
              <div class="step" [class.active]="currentStep >= 1">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Review Time Entries</h4>
                  <p>156 entries pending review</p>
                </div>
              </div>

              <div class="step" [class.active]="currentStep >= 2">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Calculate Deductions</h4>
                  <p>Tax and benefit calculations</p>
                </div>
              </div>

              <div class="step" [class.active]="currentStep >= 3">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Final Review</h4>
                  <p>Verify all calculations</p>
                </div>
              </div>
            </div>

            <div class="process-summary" *ngIf="currentStep === 3">
              <div class="summary-item">
                <span>Total Employees:</span>
                <strong>156</strong>
              </div>
              <div class="summary-item">
                <span>Gross Pay:</span>
                <strong>$425,750</strong>
              </div>
              <div class="summary-item">
                <span>Total Deductions:</span>
                <strong>$127,725</strong>
              </div>
              <div class="summary-item">
                <span>Net Pay:</span>
                <strong>$298,025</strong>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="button" class="btn btn-primary" *ngIf="currentStep < 3" (click)="nextStep()">Next Step</button>
              <button type="submit" class="btn btn-primary" *ngIf="currentStep === 3">Process Payroll</button>
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
      width: 600px;
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

    .process-steps {
      margin: 2rem 0;
    }

    .step {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .step.active {
      opacity: 1;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2d5bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
    }

    .step-content h4 {
      margin: 0;
      font-size: 1rem;
    }

    .step-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .process-summary {
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
export class ProcessPayrollFormComponent {
  isVisible = false;
  currentStep = 1;
  formData = {
    payPeriod: 'current'
  };

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.currentStep = 1;
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  onSubmit() {
    console.log('Processing payroll:', this.formData);
    this.close();
  }
}