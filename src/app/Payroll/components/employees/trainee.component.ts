// trainee.component.ts
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs/operators';

// Import your existing service
import { ApiService } from '../../../api.service';

// Basic Details Component
@Component({
  selector: 'app-trainee-basic-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="basic-details-form">
      <h2>Basic Information</h2>
      
      <!-- Search Section - Only in New Trainee mode -->
      <div class="search-section" *ngIf="!isEditMode">
        <div class="search-header">
          <i class="fas fa-search"></i>
          <span>Search Existing Trainee</span>
        </div>
        <div class="search-container">
          <input 
            type="text" 
            id="traineeSearch" 
            class="form-control search-input"
            [formControl]="getControl('traineeSearch')"
            (input)="onSearchTrainee($event)"
            placeholder="Type Trainee ID (e.g., WS10111, wss123, 1155...)">
          <i class="fas fa-search search-icon"></i>
          <button *ngIf="getControl('traineeSearch').value" 
                  type="button"
                  class="clear-search" 
                  (click)="clearSearch()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <small class="search-hint">Type at least 2 characters to search</small>

        <!-- Loading Indicator -->
        <div class="search-loading" *ngIf="isSearching">
          <i class="fas fa-spinner fa-spin"></i> Searching...
        </div>

        <!-- Search Results -->
        <div class="search-results" *ngIf="searchResults.length > 0">
          <div class="results-header">
            <span><i class="fas fa-users"></i> {{searchResults.length}} Trainee(s) Found</span>
            <button type="button" class="close-results" (click)="clearSearch()">×</button>
          </div>
          <div class="results-list">
            <div 
              *ngFor="let trainee of searchResults" 
              class="result-item"
              (click)="selectTrainee(trainee)">
              <div class="result-info">
                <span class="trainee-id">{{trainee.trngid}}</span>
                <span class="trainee-name">{{trainee.firstname || ''}} {{trainee.lastname || ''}}</span>
                <span class="trainee-email">{{trainee.emailid}}</span>
              </div>
              <i class="fas fa-chevron-right select-icon"></i>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div class="no-results" *ngIf="!isSearching && searchPerformed && searchResults.length === 0 && getControl('traineeSearch').value">
          <i class="fas fa-info-circle"></i>
          No trainees found with ID "{{getControl('traineeSearch').value}}"
        </div>
      </div>

      <!-- Selected Trainee Info -->
      <div class="selected-info" *ngIf="selectedTrainee">
        <div class="info-banner">
          <i class="fas fa-check-circle"></i>
          <span>Editing Trainee: <strong>{{selectedTrainee.trngid}}</strong></span>
          <button type="button" class="btn-change" (click)="changeTrainee()">
            <i class="fas fa-exchange-alt"></i> Change
          </button>
        </div>
      </div>
      
      <!-- Form Fields - Exactly as in the image -->
      <div class="form-fields">
        <!-- Row 1: Trainee ID, First Name, Last Name -->
        <div class="form-row">
          <div class="form-group">
            <label for="trngid">Trainee ID (TRNG_ID) <span class="required">*</span></label>
            <input 
              type="text" 
              id="trngid" 
              class="form-control"
              [formControl]="getControl('trngid')"
              [readonly]="isEditMode || selectedTrainee"
              placeholder="Enter Trainee ID">
            <div class="error-message" *ngIf="isFieldInvalid('trngid')">
              Trainee ID is required
            </div>
          </div>

          <div class="form-group">
            <label for="firstname">First Name <span class="required">*</span></label>
            <input 
              type="text" 
              id="firstname" 
              class="form-control"
              [formControl]="getControl('firstname')"
              [readonly]="isEditMode || selectedTrainee"
              placeholder="Enter first name">
            <div class="error-message" *ngIf="isFieldInvalid('firstname')">
              First name is required
            </div>
          </div>

          <div class="form-group">
            <label for="lastname">Last Name <span class="required">*</span></label>
            <input 
              type="text" 
              id="lastname" 
              class="form-control"
              [formControl]="getControl('lastname')"
              [readonly]="isEditMode || selectedTrainee"
              placeholder="Enter last name">
            <div class="error-message" *ngIf="isFieldInvalid('lastname')">
              Last name is required
            </div>
          </div>
        </div>

        <!-- Row 2: Email ID, Phone Number, Stipend Amount -->
        <div class="form-row">
          <div class="form-group">
            <label for="emailid">Email ID</label>
            <input 
              type="email" 
              id="emailid" 
              class="form-control"
              [formControl]="getControl('emailid')"
              placeholder="Enter email address">
            <div class="error-message" *ngIf="isFieldInvalid('emailid')">
              Enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="phonenumber">Phone Number</label>
            <input 
              type="tel" 
              id="phonenumber" 
              class="form-control"
              [formControl]="getControl('phonenumber')"
              placeholder="Enter phone number"
              maxlength="13">
            <div class="error-message" *ngIf="isFieldInvalid('phonenumber')">
              Enter a valid 10-digit phone number
            </div>
          </div>

          <div class="form-group">
            <label for="stipendAmount">Stipend Amount (Monthly)</label>
            <div class="currency-input">
              <span class="currency-symbol">&#8377;</span>
              <input 
                type="number" 
                id="stipendAmount" 
                class="form-control currency-field"
                [formControl]="getControl('stipendAmount')"
                placeholder="Enter stipend amount">
            </div>
          </div>
        </div>

        <!-- Row 3: Date of Joining -->
        <div class="form-row">
          <div class="form-group date-group">
            <label for="dateOfJoin">Date of Joining</label>
            <input 
              type="date" 
              id="dateOfJoin" 
              class="form-control"
              [formControl]="getControl('dateOfJoin')"
              placeholder="dd-mm-yyyy">
          </div>
          <div class="form-group spacer"></div>
          <div class="form-group spacer"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .basic-details-form { 
      padding: 1.5rem; 
      background: white;
    }
    .basic-details-form h2 { 
      color: #333; 
      margin-bottom: 1.5rem; 
      font-size: 1.35rem;
      font-weight: 500;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 0.75rem;
    }
    
    /* Search Section */
    .search-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 1px solid #e9ecef;
    }
    .search-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2196F3;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    .search-container {
      position: relative;
    }
    .search-input {
      padding: 0.75rem 2.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.95rem;
      width: 100%;
    }
    .search-input:focus {
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
      outline: none;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #adb5bd;
    }
    .clear-search {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.25rem;
    }
    .clear-search:hover {
      color: #333;
    }
    .search-hint {
      display: block;
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.8rem;
    }
    
    /* Search Results */
    .search-loading {
      margin-top: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      color: #2196F3;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search-results {
      margin-top: 1rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      max-height: 350px;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .results-header {
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
      position: sticky;
      top: 0;
    }
    .close-results {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #666;
    }
    .result-item {
      padding: 1rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }
    .result-item:hover {
      background: #e3f2fd;
    }
    .result-item:last-child {
      border-bottom: none;
    }
    .result-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .trainee-id {
      font-weight: 600;
      color: #2196F3;
      font-size: 0.95rem;
    }
    .trainee-name {
      color: #333;
      font-size: 0.9rem;
    }
    .trainee-email {
      color: #666;
      font-size: 0.85rem;
    }
    .select-icon {
      color: #adb5bd;
    }
    .no-results {
      margin-top: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 6px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px dashed #e0e0e0;
    }
    
    /* Selected Trainee Info */
    .selected-info {
      margin-bottom: 1.5rem;
    }
    .info-banner {
      background: #e3f2fd;
      border: 1px solid #2196F3;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #0d47a1;
    }
    .btn-change {
      margin-left: auto;
      padding: 0.25rem 0.75rem;
      background: white;
      border: 1px solid #2196F3;
      border-radius: 4px;
      color: #2196F3;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
    }
    .btn-change:hover {
      background: #2196F3;
      color: white;
    }
    
    /* Form Fields */
    .form-fields {
      padding: 0.5rem 0;
    }
    .form-row { 
      display: flex; 
      gap: 1.5rem; 
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .form-group { 
      flex: 1 1 calc(33.333% - 1rem);
      min-width: 250px;
    }
    .date-group {
      flex: 1 1 calc(33.333% - 1rem);
    }
    .spacer {
      visibility: hidden;
    }
    .form-group label { 
      display: block; 
      margin-bottom: 0.5rem; 
      color: #495057; 
      font-weight: 500;
      font-size: 0.9rem;
    }
    .form-control {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.95rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    .form-control:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
    }
    .form-control[readonly] {
      background-color: #e9ecef;
      opacity: 0.8;
      cursor: not-allowed;
    }
    .required { 
      color: #dc3545; 
      margin-left: 0.25rem;
    }
    .error-message {
      color: #dc3545;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    
    /* Currency Input */
    .currency-input {
      display: flex;
      align-items: center;
    }
    .currency-symbol {
      padding: 0.625rem 1rem;
      background: #e9ecef;
      border: 1px solid #ced4da;
      border-right: none;
      border-radius: 4px 0 0 4px;
      color: #495057;
      font-weight: 500;
    }
    .currency-field {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    
    @media (max-width: 768px) {
      .form-group { 
        flex: 1 1 100%; 
      }
      .spacer {
        display: none;
      }
      .result-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class TraineeBasicDetailsComponent {
  @Input() form!: FormGroup;
  @Input() isEditMode: boolean = false;
  @Input() isSearching: boolean = false;
  @Input() searchPerformed: boolean = false;
  @Input() searchResults: any[] = [];
  @Input() selectedTrainee: any | null = null;
  @Input() onSearchTrainee!: (event: any) => void;
  @Input() selectTrainee!: (trainee: any) => void;
  @Input() clearSearch!: () => void;
  @Input() changeTrainee!: () => void;

  getControl(controlName: string): FormControl {
    const control = this.form.get(controlName);
    if (!control) {
      throw new Error(`Control '${controlName}' not found in form`);
    }
    return control as FormControl;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }
}

// Payment Information Component
@Component({
  selector: 'app-trainee-payment-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="payment-info-form">
      <h2>Payment Information</h2>
      
      <div class="info-message">
        <i class="fas fa-info-circle"></i>
        <span>Trainee stipend payment details</span>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="bankName">Bank Name <span class="required">*</span></label>
          <input 
            type="text" 
            id="bankName" 
            class="form-control"
            [formControl]="getControl('bankName')"
            placeholder="Enter bank name">
          <div class="error-message" *ngIf="isFieldInvalid('bankName')">
            Bank name is required
          </div>
        </div>

        <div class="form-group">
          <label for="accountNumber">Account Number <span class="required">*</span></label>
          <input 
            type="text" 
            id="accountNumber" 
            class="form-control"
            [formControl]="getControl('accountNumber')"
            placeholder="Enter account number">
          <div class="error-message" *ngIf="isFieldInvalid('accountNumber')">
            Account number is required
          </div>
        </div>

        <div class="form-group">
          <label for="ifscCode">IFSC Code <span class="required">*</span></label>
          <input 
            type="text" 
            id="ifscCode" 
            class="form-control"
            [formControl]="getControl('ifscCode')"
            placeholder="Enter IFSC code"
            style="text-transform: uppercase">
          <div class="error-message" *ngIf="isFieldInvalid('ifscCode')">
            IFSC code is required
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-info-form { padding: 1rem; }
    .payment-info-form h2 { 
      color: #333; 
      margin-bottom: 1.5rem; 
      font-size: 1.25rem;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 0.75rem;
    }
    .info-message {
      background-color: #e3f2fd;
      border: 1px solid #2196F3;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #0d47a1;
    }
    .form-row { 
      display: flex; 
      gap: 1.5rem; 
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .form-group { 
      flex: 1 1 calc(33.333% - 1rem);
      min-width: 250px;
    }
    .form-group label { 
      display: block; 
      margin-bottom: 0.5rem; 
      color: #555; 
      font-weight: 500;
    }
    .form-control {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .required { color: #f44336; }
    .error-message {
      color: #f44336;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
  `]
})
export class TraineePaymentInfoComponent {
  @Input() form!: FormGroup;

  getControl(controlName: string): FormControl {
    const control = this.form.get(controlName);
    if (!control) {
      throw new Error(`Control '${controlName}' not found in form`);
    }
    return control as FormControl;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }
}

// Main Trainee Component
@Component({
  selector: 'app-trainee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TraineeBasicDetailsComponent,
    TraineePaymentInfoComponent
  ],
  providers: [ApiService],
  template: `
    <div class="trainee-form">
      <div class="trainee-header">
        <h1>
          <i class="fas fa-user-graduate"></i>
          {{ isEditMode ? 'Edit Trainee' : 'New Trainee' }}
        </h1>
        <button *ngIf="isEditMode || selectedTrainee" class="btn-reset" (click)="resetToNewForm()">
          <i class="fas fa-plus-circle"></i> New Trainee
        </button>
      </div>
     
      <div class="trainee-tabs">
        <div class="tab-navigation">
          <button
            *ngFor="let tab of tabs; let i = index"
            [class.active]="currentStep === i"
            [class.completed]="isStepCompleted(i)"
            (click)="goToStep(i)"
            class="tab-item">
            <span class="tab-indicator">{{i + 1}}</span>
            <span class="tab-label">{{tab}}</span>  
            <i *ngIf="isStepCompleted(i)" class="fas fa-check"></i>
          </button>
        </div>
 
        <div class="tab-container">
          <form [formGroup]="traineeForm" (ngSubmit)="onSubmit()">
            <app-trainee-basic-details 
              *ngIf="currentStep === 0" 
              [form]="traineeForm"
              [isEditMode]="isEditMode"
              [isSearching]="isSearching"
              [searchPerformed]="searchPerformed"
              [searchResults]="searchResults"
              [selectedTrainee]="selectedTrainee"
              [onSearchTrainee]="onSearchTrainee.bind(this)"
              [selectTrainee]="selectTrainee.bind(this)"
              [clearSearch]="clearSearch.bind(this)"
              [changeTrainee]="changeTrainee.bind(this)">
            </app-trainee-basic-details>
           
            <app-trainee-payment-info 
              *ngIf="currentStep === 1" 
              [form]="traineeForm">
            </app-trainee-payment-info>
 
            <div class="form-navigation">
              <button
                type="button"
                class="nav-button secondary"
                *ngIf="currentStep > 0"
                (click)="previousStep()">
                <i class="fas fa-arrow-left"></i> Previous
              </button>
              <button
                type="button"
                class="nav-button primary"
                *ngIf="currentStep < 1"
                (click)="nextStep()">
                Next <i class="fas fa-arrow-right"></i>
              </button>
              <button
                type="submit"
                class="nav-button success"
                *ngIf="currentStep === 1"
                [disabled]="isSubmitting">
                <i *ngIf="isSubmitting" class="fas fa-spinner fa-spin"></i>
                {{ isEditMode ? 'Update' : 'Submit' }} <i class="fas fa-check"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success Message -->
      <div class="success-message" *ngIf="showSuccessMessage">
        <div class="success-content">
          <i class="fas fa-check-circle"></i>
          <span>{{ successMessage }}</span>
          <button class="close-btn" (click)="showSuccessMessage = false">×</button>
        </div>
      </div>

      <!-- Error Message -->
      <div class="error-message-container" *ngIf="errorMessage">
        <div class="error-content">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
          <button class="close-btn" (click)="errorMessage = ''">×</button>
        </div>
      </div>

      <!-- Form Data Display (for demo) -->
      <div class="form-data-display" *ngIf="submittedData">
        <h3>Submitted Trainee Data:</h3>
        <pre>{{ submittedData | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .trainee-form { 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
      margin-bottom: 2rem;
    }
    .trainee-header { 
      padding: 1.5rem 2rem; 
      border-bottom: 1px solid #e9ecef; 
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .trainee-header h1 { 
      font-size: 1.5rem; 
      color: #333; 
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-reset {
      padding: 0.5rem 1rem;
      background: #2196F3;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .btn-reset:hover {
      background: #1976D2;
      transform: translateY(-1px);
    }
    .trainee-tabs { 
      padding: 2rem; 
    }
    .tab-navigation { 
      display: flex; 
      gap: 1rem; 
      margin-bottom: 2rem; 
      border-bottom: 2px solid #f0f0f0; 
      padding-bottom: 1rem; 
    }
    .tab-item { 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      padding: 0.75rem 1.25rem; 
      border: none; 
      background: none; 
      color: #666; 
      cursor: pointer; 
      position: relative; 
      transition: all 0.3s ease; 
    }
    .tab-item::after { 
      content: ''; 
      position: absolute; 
      bottom: -1rem; 
      left: 0; 
      width: 100%; 
      height: 3px; 
      background: transparent; 
      transition: all 0.3s ease; 
    }
    .tab-item.active { 
      color: #2196F3; 
    }
    .tab-item.active::after { 
      background: #2196F3; 
    }
    .tab-item.completed { 
      color: #4CAF50; 
    }
    .tab-item.completed::after { 
      background: #4CAF50; 
    }
    .tab-indicator { 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      background: #f0f0f0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 0.875rem; 
    }
    .tab-item.active .tab-indicator { 
      background: #2196F3; 
      color: white; 
    }
    .tab-item.completed .tab-indicator { 
      background: #4CAF50; 
      color: white; 
    }
    .tab-container { 
      background: white; 
      padding: 1.5rem; 
      border-radius: 8px; 
    }
    .form-navigation { 
      display: flex; 
      gap: 1rem; 
      margin-top: 2rem; 
      padding-top: 2rem; 
      border-top: 1px solid #e9ecef; 
    }
    .nav-button { 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      padding: 0.75rem 1.5rem; 
      border: none; 
      border-radius: 6px; 
      font-size: 0.95rem; 
      cursor: pointer; 
      transition: all 0.2s; 
    }
    .nav-button.primary { 
      background: #2196F3; 
      color: white; 
    }
    .nav-button.secondary { 
      background: #f0f0f0; 
      color: #333; 
    }
    .nav-button.success { 
      background: #4CAF50; 
      color: white; 
    }
    .nav-button:hover:not(:disabled) { 
      opacity: 0.9; 
      transform: translateY(-1px);
    }
    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .success-message, .error-message-container {
      padding: 1rem 2rem;
      animation: slideDown 0.3s ease;
    }
    .success-content, .error-content {
      padding: 1rem 1.5rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
    }
    .success-content {
      background: #4CAF50;
      color: white;
    }
    .error-content {
      background: #f44336;
      color: white;
    }
    .close-btn {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .form-data-display {
      margin-top: 2rem;
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }
    .form-data-display pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 1.5rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .tab-navigation { flex-direction: column; }
      .tab-item::after { display: none; }
      .form-navigation { flex-direction: column; }
      .nav-button { width: 100%; justify-content: center; }
    }
  `]
})
export class TraineeComponent implements OnInit, OnDestroy {
  currentStep = 0;
  traineeForm: FormGroup;
  tabs = ['Basic Details', 'Payment Information'];
  completedSteps: boolean[] = [false, false];
  isEditMode = false;
  isSubmitting = false;
  showSuccessMessage = false;
  successMessage = '';
  errorMessage = '';
  submittedData: any = null;
  
  // Search properties
  isSearching = false;
  searchPerformed = false;
  searchResults: any[] = [];
  selectedTrainee: any | null = null;
  allTrainees: any[] = [];
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
 
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService  // Using ApiService
  ) {
    this.traineeForm = this.fb.group({
      // Search field
      traineeSearch: [''],
      
      // Basic Details - Exactly as in the image
      trngid: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      emailid: ['', [Validators.email]],
      phonenumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      stipendAmount: [''],
      dateOfJoin: [''],
      
      // Payment Information
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      ifscCode: ['', Validators.required]
    });
    
    // Setup search with debounce
    this.setupSearch();
  }
 
  ngOnInit(): void {
    // Check for edit mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const trngid = urlParams.get('id');
    
    if (trngid) {
      this.isEditMode = true;
      this.loadTraineeById(trngid);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
          this.searchResults = [];
          this.isSearching = false;
          return [];
        }
        this.isSearching = true;
        this.searchPerformed = true;
        
        // Call the getTrainees method from ApiService
        return this.apiService.getTrainees().pipe(
          catchError((error: any) => {
            console.error('Error fetching trainees:', error);
            this.errorMessage = 'Failed to load trainees. Please try again.';
            this.isSearching = false;
            return [];
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((trainees: any[]) => {
      this.isSearching = false;
      
      // Filter trainees based on search term
      const searchTerm = this.traineeForm.get('traineeSearch')?.value?.toLowerCase() || '';
      
      if (searchTerm.length >= 2) {
        this.searchResults = trainees.filter((trainee: any) => 
          trainee.trngid && trainee.trngid.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results
      }
      
      this.allTrainees = trainees;
    });
  }
  
  onSearchTrainee(event: any): void {
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }
  
  selectTrainee(trainee: any): void {
    this.selectedTrainee = trainee;
    this.populateForm(trainee);
    this.clearSearch();
    this.isEditMode = true;
    this.completedSteps[0] = true;
  }
  
  changeTrainee(): void {
    this.selectedTrainee = null;
    this.isEditMode = false;
    this.completedSteps[0] = false;
    this.traineeForm.patchValue({
      trngid: '',
      firstname: '',
      lastname: ''
    });
  }
  
  clearSearch(): void {
    this.traineeForm.patchValue({ traineeSearch: '' });
    this.searchResults = [];
    this.searchPerformed = false;
  }
  
  loadTraineeById(trngid: string): void {
    this.isSearching = true;
    
    // Use the getTrainees method from ApiService
    this.apiService.getTrainees().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (trainees: any[]) => {
        const trainee = trainees.find((t: any) => t.trngid === trngid);
        if (trainee) {
          this.selectedTrainee = trainee;
          this.populateForm(trainee);
          this.completedSteps[0] = true;
        } else {
          this.errorMessage = `Trainee with ID ${trngid} not found.`;
        }
        this.isSearching = false;
      },
      error: (error: any) => {
        console.error('Error loading trainee:', error);
        this.errorMessage = 'Failed to load trainee data.';
        this.isSearching = false;
      }
    });
  }
 
  populateForm(trainee: any): void {
    // Format date if needed
    let dateOfJoin = '';
    if (trainee.lastlogin) {
      // Handle date string or Date object
      try {
        const date = new Date(trainee.lastlogin);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateOfJoin = `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    this.traineeForm.patchValue({
      trngid: trainee.trngid || '',
      firstname: trainee.firstname || '',
      lastname: trainee.lastname || '',
      emailid: trainee.emailid || '',
      phonenumber: trainee.phonenumber?.replace(/^0+/, '') || '', // Remove leading zeros
      stipendAmount: '',
      dateOfJoin: dateOfJoin
      // Payment info will be separate, not from trainee data
    });
  }

  resetToNewForm(): void {
    this.isEditMode = false;
    this.selectedTrainee = null;
    this.traineeForm.reset({
      traineeSearch: '',
      trngid: '',
      firstname: '',
      lastname: '',
      emailid: '',
      phonenumber: '',
      stipendAmount: '',
      dateOfJoin: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    });
    this.completedSteps = [false, false];
    this.currentStep = 0;
    this.showSuccessMessage = false;
    this.errorMessage = '';
    this.clearSearch();
  }
 
  isStepCompleted(step: number): boolean {
    return this.completedSteps[step];
  }
 
  goToStep(step: number): void {
    if (step < this.tabs.length) {
      this.currentStep = step;
    }
  }
 
  nextStep(): void {
    if (this.currentStep === 0) {
      const basicDetailsValid = this.validateBasicDetails();
      if (basicDetailsValid) {
        this.completedSteps[this.currentStep] = true;
        this.currentStep++;
      } else {
        alert('Please fill all required fields in Basic Details.');
      }
    }
  }
 
  validateBasicDetails(): boolean {
    const requiredFields = ['trngid', 'firstname', 'lastname'];
    for (const field of requiredFields) {
      const control = this.traineeForm.get(field);
      if (control?.invalid) {
        control.markAsTouched();
        return false;
      }
    }
    return true;
  }
 
  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
 
  onSubmit(): void {
    if (this.traineeForm.valid) {
      this.isSubmitting = true;
      const formData = this.traineeForm.value;
      
      // Prepare data for submission
      const traineeData = {
        // Basic Details
        trngid: formData.trngid,
        firstname: formData.firstname,
        lastname: formData.lastname,
        emailid: formData.emailid,
        phonenumber: formData.phonenumber,
        stipendAmount: formData.stipendAmount ? parseFloat(formData.stipendAmount) : 0,
        dateOfJoin: formData.dateOfJoin,
        
        // Payment Information
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        
        // Metadata
        action: this.isEditMode ? 'UPDATE' : 'CREATE',
        submittedDate: new Date().toISOString(),
        modifiedBy: 'Admin'
      };
 
      console.log('Submitting Trainee Data:', traineeData);
      
      // Call your API service method to save/update trainee
      // Uncomment and use your actual API method
      /*
      this.apiService.saveOrUpdateTrainee(traineeData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.handleSubmitSuccess(response);
        },
        error: (error) => {
          this.handleSubmitError(error);
        }
      });
      */
      
      // Simulate successful submission for demo
      setTimeout(() => {
        this.handleSubmitSuccess(traineeData);
      }, 1000);
      
    } else {
      this.markFormGroupTouched(this.traineeForm);
      
      const invalidFields = [];
      const controls = this.traineeForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidFields.push(name);
        }
      }
      
      alert(`Please fill all required fields correctly. Invalid fields: ${invalidFields.join(', ')}`);
    }
  }

  private handleSubmitSuccess(response: any): void {
    this.submittedData = response;
    this.successMessage = `Trainee ${this.isEditMode ? 'updated' : 'created'} successfully!`;
    this.showSuccessMessage = true;
    this.isSubmitting = false;
    this.completedSteps[this.currentStep] = true;
    
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
    
    if (!this.isEditMode) {
      setTimeout(() => {
        if (confirm('Form submitted successfully! Do you want to create another trainee?')) {
          this.resetToNewForm();
        }
      }, 1000);
    }
  }

  private handleSubmitError(error: any): void {
    console.error('Error submitting trainee:', error);
    this.errorMessage = 'Failed to save trainee data. Please try again.';
    this.isSubmitting = false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}