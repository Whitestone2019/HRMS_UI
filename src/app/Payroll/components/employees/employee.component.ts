import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicDetailsComponent } from './form-steps/basic-details.component';
import { PaymentInfoComponent } from './form-steps/payment-info.component';
import { PersonalDetailsComponent } from './form-steps/personal-details.component';
import { SalaryTemplateComponent } from '../settings/salary-template/salary-template.component';
import { DepartmentsComponent } from '../settings/departments/departments.component';
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
  [basic]="basic"
  > <!-- Pass locationType here -->
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
    .employee-form {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .employee-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .employee-header h1 {
      font-size: 1.5rem;
      color: #333;
      margin: 0;
    }

    .employee-tabs {
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
      padding: 2rem;
      border-radius: 4px;
    }

    .form-navigation {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
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

    .nav-button:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .tab-navigation {
        flex-direction: column;
        gap: 0.5rem;
      }

      .tab-item::after {
        display: none;
      }

      .form-navigation {
        flex-direction: column;
      }

      .nav-button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EmployeeComponent {
  @ViewChild(SalaryTemplateComponent) salaryTemplateComponent!: SalaryTemplateComponent;
  basic: string = 'true';
  currentStep = 0;
  employeeForm: FormGroup;
  tabs = ['Basic Details', 'Salary Details', 'Payment Information'];
  completedSteps: boolean[] = [false, false, false]; // Track completed steps

  constructor(private fb: FormBuilder,private apiService : ApiService) {
    this.employeeForm = this.fb.group({
      empid: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      dateofbirth: [''],
      dateOfJoin: [''],
      //officialemail: ['', [Validators.required, Validators.email]],
      emailid: [''],
      phonenumber: ['', Validators.required],
      locationType: ['', Validators.required],
      department: ['', Validators.required],

      // Step 2: Salary Details
      annualCTC: ['', Validators.required],
      earnings: ['', Validators.required],
      deductions: [''],
      perDayAllowanceAmount:[''],
      pgRentAmount:[''],

      // Step 4: Payment Information
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      ifscCode: ['', Validators.required]
    });
  }

  ngOnInit() {
    const employee = history.state.employee;
    if (employee) {
      this.populateForm(employee);
    }
  }
  
  populateForm(employee: any) {
    this.employeeForm.patchValue({
      empid: employee.empid,
      firstname: employee.firstname,
      lastname: employee.lastname,
      dateofbirth: employee.dateofbirth,
      dateOfJoin: employee.dateOfJoin,
      officialemail: employee.emailid,
      emailid: employee.emailid,
      mobilenumber: employee.phonenumber,
      locationType: employee.locationType,
      department: employee.department,
      annualCTC: employee.annualCTC,
      earnings: JSON.parse(employee.earnings),
      deductions: JSON.parse(employee.deductions),
      bankName: employee.bankName,
      accountNumber: employee.accountNumber,
      ifscCode: employee.ifscCode
    });
  }
  
  isStepCompleted(step: number): boolean {
    // Check if the step is completed based on the `completedSteps` array
    return this.completedSteps[step];
  }

  goToStep(step: number) {
    if (step < this.tabs.length) {
      this.currentStep = step;
    }
  }

  nextStep() {
    console.log("Current Step: " + this.currentStep);
    console.log("Is Current Form Valid: " + this.employeeForm.valid);
  
    if (this.currentStep === 1) {
      // Salary Template validation
      if (this.salaryTemplateComponent && this.salaryTemplateComponent.isSalaryTemplateValid()) {
        // Merge form data
        const salaryTemplateData = this.salaryTemplateComponent.getSalaryTemplateData();
        const mergedData = { ...this.employeeForm.value, ...salaryTemplateData };
        this.employeeForm.patchValue(mergedData);
        const locationValue = this.employeeForm.get('locationType')?.value;
        // Mark step as complete and proceed
        this.completedSteps[this.currentStep] = true;
        this.currentStep++;
      } else {
        alert("Please complete the salary template form.");
      }
    } else if (this.currentStep === 2) {
      // Check Payment Info validity before continuing
      if (this.employeeForm.valid) {
        const paymentData = {
          bankName: this.employeeForm.get('bankName')?.value,
          accountNumber: this.employeeForm.get('accountNumber')?.value,
          ifscCode: this.employeeForm.get('ifscCode')?.value
        };
  
        const mergedData = { ...this.employeeForm.value, ...paymentData };
        console.log("Merged Data: ", mergedData);
  
        this.completedSteps[this.currentStep] = true;
        this.currentStep++; // Proceed to submit
      } else {
        alert("Please complete the payment information.");
      }
    } else if (this.currentStep < this.tabs.length - 1) {
      // For any other valid steps, continue
      this.completedSteps[this.currentStep] = true;
      this.currentStep++;
    }
  }
  
  onSubmit() {
    if (this.employeeForm.valid) {
      console.log("Final Form Data:", JSON.stringify(this.employeeForm.value, null, 2));
      
      // Prepare the data for submission
      const formData = this.employeeForm.value;
      
      // Format earnings and deductions as JSON strings
      const formattedEarnings = JSON.stringify(formData.earnings);
      const formattedDeductions = JSON.stringify(formData.deductions);
      
      // Create the final object to submit
      const dataToSubmit = {
        ...formData,
        earnings: formattedEarnings,
        deductions: formattedDeductions,
        modifiedBy: "Admin" // You can dynamically set this based on the logged-in user
      };
  
      this.apiService.saveOrUpdateEmployeeSalary(dataToSubmit)
        .subscribe(
          response => {
            console.log("Employee data saved successfully:", response);
            alert("Employee data saved successfully!");
          },
          error => {
            console.error("Error saving employee data:", error);
            alert("Error saving employee data. Please try again.");
          }
        );
    } else {
      console.log("Form is invalid");
      alert("Please fill all required fields before submitting.");
    }
  }
  
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

}
