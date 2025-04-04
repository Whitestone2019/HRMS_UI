import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="benefits-page">
      <div class="page-header">
        <h2>Benefits Management</h2>
        <div class="actions">
          <button class="btn btn-primary" (click)="showBenefitForm = true">
            <i class="fas fa-plus me-2"></i>
            Add Benefit Plan
          </button>
        </div>
      </div>

      <div class="grid grid-3">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-heart"></i>
            </div>
            <div class="stat-info">
              <h3>Active Plans</h3>
              <p class="stat-value">12</p>
              <p class="stat-change">Total benefit plans</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <h3>Enrolled Employees</h3>
              <p class="stat-value">142</p>
              <p class="stat-change">Out of 156</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-info">
              <h3>Monthly Cost</h3>
              <p class="stat-value">$45,250</p>
              <p class="stat-change">Company contribution</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Benefit Plans -->
      <div class="benefits-grid">
        <div class="card benefit-plan" *ngFor="let plan of benefitPlans">
          <div class="plan-header">
            <div class="plan-icon">
              <i [class]="plan.icon"></i>
            </div>
            <div class="plan-title">
              <h3>{{plan.name}}</h3>
              <span class="plan-type">{{plan.type}}</span>
            </div>
          </div>
          <div class="plan-details">
            <p>{{plan.description}}</p>
            <ul class="plan-features">
              <li *ngFor="let feature of plan.features">
                <i class="fas fa-check"></i>
                {{feature}}
              </li>
            </ul>
          </div>
          <div class="plan-footer">
            <button class="btn btn-outline" (click)="editPlan(plan)">
              Edit Plan
            </button>
            <span class="enrolled-count">
              {{plan.enrolledCount}} enrolled
            </span>
          </div>
        </div>
      </div>

      <!-- Add Benefit Form Modal -->
      <div class="modal" *ngIf="showBenefitForm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Benefit Plan</h3>
            <button class="close-btn" (click)="showBenefitForm = false">×</button>
          </div>
          <div class="modal-body">
            <form (submit)="saveBenefitPlan($event)">
              <div class="form-group">
                <label>Plan Name</label>
                <input type="text" class="form-control" [(ngModel)]="benefitForm.name" name="name">
              </div>
              <div class="form-group">
                <label>Plan Type</label>
                <select class="form-control" [(ngModel)]="benefitForm.type" name="type">
                  <option value="health">Health Insurance</option>
                  <option value="dental">Dental Insurance</option>
                  <option value="vision">Vision Insurance</option>
                  <option value="life">Life Insurance</option>
                </select>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" [(ngModel)]="benefitForm.description" name="description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Coverage Amount</label>
                <input type="number" class="form-control" [(ngModel)]="benefitForm.coverage" name="coverage">
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="showBenefitForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .benefits-page {
      padding: 1.5rem;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .benefit-plan {
      display: flex;
      flex-direction: column;
    }

    .plan-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .plan-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f0f3ff;
      color: #2d5bff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .plan-title h3 {
      margin: 0;
    }

    .plan-type {
      font-size: 0.9rem;
      color: #666;
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .plan-features li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #666;
    }

    .plan-features i {
      color: #00c853;
    }

    .plan-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .enrolled-count {
      font-size: 0.9rem;
      color: #666;
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
  `]
})
export class BenefitsComponent {
  showBenefitForm = false;

  benefitForm = {
    name: '',
    type: '',
    description: '',
    coverage: 0
  };

  benefitPlans = [
    {
      name: 'Premium Health Insurance',
      type: 'Health',
      icon: 'fas fa-heart',
      description: 'Comprehensive health coverage including medical, dental, and vision',
      features: [
        'Full medical coverage',
        'Dental and vision included',
        'Prescription drug coverage',
        'Mental health support'
      ],
      enrolledCount: 125
    },
    {
      name: 'Life Insurance Plus',
      type: 'Life Insurance',
      icon: 'fas fa-shield-alt',
      description: 'Extended life insurance coverage with additional benefits',
      features: [
        '3x annual salary coverage',
        'Accidental death benefit',
        'Family coverage option',
        'Portable policy'
      ],
      enrolledCount: 98
    },
    {
      name: 'Wellness Program',
      type: 'Wellness',
      icon: 'fas fa-heartbeat',
      description: 'Complete wellness program for employee health and fitness',
      features: [
        'Gym membership',
        'Health coaching',
        'Nutrition planning',
        'Mental wellness support'
      ],
      enrolledCount: 84
    }
  ];

  saveBenefitPlan(event: Event) {
    event.preventDefault();
    // Add benefit plan logic here
    this.showBenefitForm = false;
  }

  editPlan(plan: any) {
    // Edit plan logic
  }
}