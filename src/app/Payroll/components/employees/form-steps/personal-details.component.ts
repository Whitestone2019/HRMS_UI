import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-step">
      <h4>Personal Details</h4>
      <div [formGroup]="form">
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" formControlName="dateOfBirth">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" formControlName="phonenumber">
        </div>
        <div class="form-group">
          <label>Address</label>
          <textarea formControlName="address"></textarea>
        </div>
      </div>
    </div>
   `,
  styles: [`
    .form-section {
      animation: fadeIn 0.3s ease-in-out;
    }

    .form-group-title {
      font-size: 1.1rem;
      font-weight: 500;
      color: #2196F3;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #555;
      font-weight: 500;
    }

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .checkbox-group {
      margin-top: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin-right: 0.5rem;
    }

    .helper-text {
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.5rem;
      margin-left: 1.75rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class PersonalDetailsComponent {
  @Input() form!: FormGroup;
}