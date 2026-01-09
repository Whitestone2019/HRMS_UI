import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicDetailsComponent } from './form-steps/basic-details.component';
import { PaymentInfoComponent } from './form-steps/payment-info.component';
import { SalaryTemplateComponent } from '../settings/salary-template/salary-template.component';
import { ApiService } from '../../../api.service';
 
@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BasicDetailsComponent,
    SalaryTemplateComponent,
    PaymentInfoComponent
  ],
  template: `
    <div class="employee-form">
      <div class="employee-header">
        <h1>New Employee</h1>
      </div>
     
      <div class="employee-tabs">
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
          <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
            <app-basic-details *ngIf="currentStep === 0" [form]="employeeForm"></app-basic-details>
           
            <app-salary-template
              *ngIf="currentStep === 1"
              [form]="employeeForm"
              [basic]="basic">
            </app-salary-template>
           
            <app-payment-info *ngIf="currentStep === 2" [form]="employeeForm"></app-payment-info>
 
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
                *ngIf="currentStep < 2"
                (click)="nextStep()">
                Next <i class="fas fa-arrow-right"></i>
              </button>
              <button
                type="submit"
                class="nav-button success"
                *ngIf="currentStep === 2">
                Submit <i class="fas fa-check"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employee-form { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .employee-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e0e0e0; }
    .employee-header h1 { font-size: 1.5rem; color: #333; margin: 0; }
    .employee-tabs { padding: 2rem; }
    .tab-navigation { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid #f0f0f0; padding-bottom: 1rem; }
    .tab-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: none; background: none; color: #666; cursor: pointer; position: relative; transition: all 0.3s ease; }
    .tab-item::after { content: ''; position: absolute; bottom: -1rem; left: 0; width: 100%; height: 3px; background: transparent; transition: all 0.3s ease; }
    .tab-item.active { color: #2196F3; }
    .tab-item.active::after { background: #2196F3; }
    .tab-item.completed { color: #4CAF50; }
    .tab-item.completed::after { background: #4CAF50; }
    .tab-indicator { width: 24px; height: 24px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; }
    .tab-item.active .tab-indicator { background: #2196F3; color: white; }
    .tab-item.completed .tab-indicator { background: #4CAF50; color: white; }
    .tab-container { background: white; padding: 2rem; border-radius: 4px; }
    .form-navigation { display: flex; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0; }
    .nav-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
    .nav-button.primary { background: #2196F3; color: white; }
    .nav-button.secondary { background: #f0f0f0; color: #333; }
    .nav-button.success { background: #4CAF50; color: white; }
    .nav-button:hover { opacity: 0.9; }
    @media (max-width: 768px) {
      .tab-navigation { flex-direction: column; gap: 0.5rem; }
      .tab-item::after { display: none; }
      .form-navigation { flex-direction: column; }
      .nav-button { width: 100%; justify-content: center; }
    }
  `]
})
export class EmployeeComponent implements AfterViewInit {
  @ViewChild(SalaryTemplateComponent) salaryTemplateComponent!: SalaryTemplateComponent;
 
  basic: string = 'true';
  currentStep = 0;
  employeeForm: FormGroup;
  tabs = ['Basic Details', 'Salary Details', 'Payment Information'];
  completedSteps: boolean[] = [false, false, false];
 
  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.employeeForm = this.fb.group({
      empid: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      dateofbirth: [''],
      dateOfJoin: [''],
      officialemail: [''],
      emailid: [''],
      phonenumber: [''],
      locationType: ['', Validators.required],
      department: ['', Validators.required],
 
      // Salary Details
      annualCTC: ['', Validators.required],
      earnings: [[]],
      deductions: [[]],
      payrollDeductions: [[]],           // Payroll deductions array
      perDayAllowanceAmount: [''],
      pgRentAmount: [''],
 
      // Payment Information
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      ifscCode: ['', Validators.required]
    });
  }
 
  ngOnInit() {
    const employee = history.state.employee;
    if (employee) {
      console.log('Editing employee - Raw data:', employee);
      this.populateForm(employee);
      this.currentStep = 0; // Always start from Basic Details on edit
    }
  }
 
  ngAfterViewInit() {
    // Ensure child components (especially SalaryTemplate) get updated data
    setTimeout(() => {
      this.employeeForm.updateValueAndValidity();
    }, 100);
  }
 
  // Safe JSON parser to handle stringified or double-stringified data
  private safeParseJson(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) return data;
 
    try {
      let parsed = JSON.parse(data as string);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse JSON field:', data, e);
      return [];
    }
  }
 
  populateForm(employee: any) {
    this.employeeForm.patchValue({
      empid: employee.empid || '',
      firstname: employee.firstname || '',
      lastname: employee.lastname || '',
      dateofbirth: employee.dateofbirth || employee.dateOfBirth || '',
      dateOfJoin: employee.dateOfJoin || employee.dateofjoin || '',
      officialemail: employee.emailid || employee.officialemail || '',
      emailid: employee.emailid || employee.officialemail || '',
      phonenumber: employee.mobilenumber || employee.phonenumber || employee.mobileNumber || employee.phoneNumber || '',
      locationType: employee.locationType || '',
      department: employee.department || '',
      annualCTC: employee.annualCTC || '',
 
      // Parse JSON arrays safely
      earnings: this.safeParseJson(employee.earnings),
      deductions: this.safeParseJson(employee.deductions),
      payrollDeductions: this.safeParseJson(employee.payrollDeductions),
 
      bankName: employee.bankName || '',
      accountNumber: employee.accountNumber || '',
      ifscCode: employee.ifscCode || ''
    });
 
    // Mark salary step as completed if any salary data exists
    if (employee.annualCTC || employee.earnings || employee.deductions || employee.payrollDeductions) {
      this.completedSteps[1] = true;
    }
 
    console.log('Form populated with parsed data:', this.employeeForm.value);
  }
 
  isStepCompleted(step: number): boolean {
    return this.completedSteps[step];
  }
 
  goToStep(step: number) {
    if (step < this.tabs.length) {
      this.currentStep = step;
    }
  }
 
  nextStep() {
    if (this.currentStep === 1) {
      // Validate and merge salary template data
      if (this.salaryTemplateComponent && this.salaryTemplateComponent.isSalaryTemplateValid()) {
        const salaryTemplateData = this.salaryTemplateComponent.getSalaryTemplateData();
 
        const mergedData = {
          ...this.employeeForm.value,
          ...salaryTemplateData,
          payrollDeductions: salaryTemplateData.payrollDeductions || []
        };
 
        this.employeeForm.patchValue(mergedData);
        this.completedSteps[this.currentStep] = true;
        this.currentStep++;
      } else {
        alert("Please complete the salary template form correctly.");
      }
    } else if (this.currentStep < this.tabs.length - 1) {
      this.completedSteps[this.currentStep] = true;
      this.currentStep++;
    }
  }
 
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
 
  onSubmit() {
    if (this.employeeForm.valid) {
      const formData = this.employeeForm.value;
 
      // Stringify arrays before sending to backend
      const dataToSubmit = {
        ...formData,
        earnings: JSON.stringify(formData.earnings || []),
        deductions: JSON.stringify(formData.deductions || []),
        payrollDeductions: JSON.stringify(formData.payrollDeductions || []),
        modifiedBy: "Admin"
      };
 
      console.log("Final Submitted Data:", dataToSubmit);
 
      this.apiService.saveOrUpdateEmployeeSalary(dataToSubmit).subscribe({
        next: (response) => {
          console.log("Employee data saved successfully:", response);
          alert("Employee data saved successfully!");
          // Optional: Navigate back or reset form
        },
        error: (error) => {
          console.error("Error saving employee data:", error);
          alert("Error saving employee data. Please try again.");
        }
      });
    } else {
      console.log("Form is invalid:", this.employeeForm.errors);
      alert("Please fill all required fields before submitting.");
    }
  }
}
 