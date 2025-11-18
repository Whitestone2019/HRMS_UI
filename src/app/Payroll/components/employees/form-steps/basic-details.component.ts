import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../api.service';
import { UserService } from '../../../../user.service';

@Component({
  selector: 'app-basic-details',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="form-section">
      <h4>Basic Details</h4>

      <!-- Employee ID Selection Dropdown (Visible for Admin & HR) -->
      <div *ngIf="canSelectEmployee" class="form-group">
        <label>Select Employee ID</label>
        <select (change)="onEmployeeChange($event)" (click)="$event.stopPropagation()">
          <option value="" disabled selected>Select Employee ID</option>
          <option *ngFor="let emp of employeeList; trackBy: trackByEmployeeId" [value]="emp.employeeId">
            {{ emp.employeeId }} - {{ emp.employeeName }}
          </option>
        </select>
      </div>

      <div [formGroup]="form">
        <div class="form-group-title">Personal Information</div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name*</label>
            <input type="text" formControlName="firstname" placeholder="Enter first name" readonly>
          </div>
        
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" formControlName="lastname" placeholder="Enter last name" readonly>
          </div>

           <!-- <div class="form-group">
            <label>Date of Birth</label>
           <input type="date" formControlName="dateofbirth" readonly>
          </div> -->
        </div>

       <div class="form-row">
  <div class="form-group">
    <label>Date of Joining*</label>
    <input type="date" formControlName="dateOfJoin" (focus)="openDatePicker($event)">
  </div>
</div>


        <div class="form-group-title">Contact Information</div>
        <div class="form-row">
          <div class="form-group">
            <label>Work Email*</label>
            <input type="email" formControlName="emailid" readonly>
          </div>
          <div class="form-group">
            <label>Personal Email</label>
            <input type="email" formControlName="emailid" readonly>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Mobile Number*</label>
            <input type="tel" formControlName="phonenumber" readonly>
          </div>
        </div>

        <div class="form-group-title">Employment Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Work Location*</label>
            <input type="text" formControlName="locationType">
          </div>
          <div class="form-group">
            <label>Department*</label>
            <input type="text" formControlName="department">
          </div>
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
  `]
})
export class BasicDetailsComponent implements OnInit {
  @Input() form!: FormGroup;
  userRole: string = '';
  employeeList: any[] = [];
  canSelectEmployee: boolean = false;
  employeeId: string = '';

  constructor(private apiService: ApiService, private fb: FormBuilder, private userService: UserService) {}

  ngOnInit(): void {
   // this.initializeForm();
    this.userRole = this.userService.role || '';
    this.employeeId = localStorage.getItem('employeeId') || '';

    if (this.userService.isAdmin()) {
      this.canSelectEmployee = true;
      this.loadAllEmployees();
    } else {
      this.loadEmployeeDetails(this.employeeId);
    }
  }
  openDatePicker(event: Event) {
    const input = event.target as HTMLInputElement;
    input.showPicker(); // This will force the date picker to open (supported in modern browsers)
  }

  loadAllEmployees() {
    this.apiService.getAllEmployeeIds().subscribe(
      (data: any[]) => {
        this.employeeList = data;
      },
      (error) => {
        console.error('Error fetching employee IDs:', error);
      }
    );
  }
  loadEmployeeDetails(empId: string) {
    if (!empId) {
      console.warn('No employee ID found.');
      return;
    }
  
    this.apiService.getEmployeeDetails(empId).subscribe(
      (data) => {
        console.log('Loaded Employee Details:', data);
        // /alert(`Raw DOB from API: ${data.dateofbirth}`); // Debugging
  
        // Ensure the date format is correct
        if (data.dateofbirth) {
          data.dateofbirth = this.formatDate(data.dateofbirth);
          alert(`Formatted DOB: ${data.dateofbirth}`); // Debugging
        }
  
        this.form.patchValue(data);
      },
      (error) => {
        console.error('Error fetching employee details:', error);
      }
    );
  }
  formatDate(date: string | Date): string {
    if (!date) return ''; // Handle null values

    // If the date is already in 'YYYY-MM-DD' format, return it directly
    if (typeof date === 'string' && date.length === 10 && date.includes('-')) {
        return date;
    }

    // Parse the date correctly
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        console.error('Invalid date:', date);
        return '';
    }

    return d.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
}
     
  

  onEmployeeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedEmpId = target?.value;

    if (selectedEmpId) {
      this.loadEmployeeDetails(selectedEmpId);
    }
  }

  trackByEmployeeId(index: number, employee: any): string {
    return employee.employeeId;
  }
}