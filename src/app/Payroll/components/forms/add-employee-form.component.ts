import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Employee</h3>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()">
            <div class="form-section">
              <h4>Personal Information</h4>
              <div class="form-group">
                <label>First Name</label>
                <input type="text" class="form-control" [(ngModel)]="formData.firstName" name="firstName" required>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" class="form-control" [(ngModel)]="formData.lastName" name="lastName" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" [(ngModel)]="formData.email" name="email" required>
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" class="form-control" [(ngModel)]="formData.phone" name="phone" required>
              </div>
            </div>

            <div class="form-section">
              <h4>Employment Details</h4>
              <div class="form-group">
                <label>Department</label>
                <select class="form-control" [(ngModel)]="formData.department" name="department" required>
                  <option value="engineering">Engineering</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="hr">Human Resources</option>
                </select>
              </div>
              <div class="form-group">
                <label>Position</label>
                <input type="text" class="form-control" [(ngModel)]="formData.position" name="position" required>
              </div>
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" class="form-control" [(ngModel)]="formData.startDate" name="startDate" required>
              </div>
              <div class="form-group">
                <label>Employment Type</label>
                <select class="form-control" [(ngModel)]="formData.employmentType" name="employmentType" required>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>

            <div class="form-section">
              <h4>Salary Information</h4>
              <div class="form-group">
                <label>Base Salary</label>
                <input type="number" class="form-control" [(ngModel)]="formData.baseSalary" name="baseSalary" required>
              </div>
              <div class="form-group">
                <label>Pay Frequency</label>
                <select class="form-control" [(ngModel)]="formData.payFrequency" name="payFrequency" required>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Employee</button>
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
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h4 {
      margin-bottom: 1rem;
      color: #2d5bff;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  `]
})
export class AddEmployeeFormComponent {
  isVisible = false;
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    startDate: '',
    employmentType: 'full_time',
    baseSalary: 0,
    payFrequency: 'biweekly'
  };

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
  }

  onSubmit() {
    console.log('Adding employee:', this.formData);
    this.close();
  }
}