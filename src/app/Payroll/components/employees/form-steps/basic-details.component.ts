import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../api.service';
import { UserService } from '../../../../user.service';
 
// Define the interface based on actual API response
interface Person {
  id: string;
  type: 'Employee' | 'Trainee';
  // Employee fields
  employeeId?: string;
  employeeName?: string;
  // Trainee fields
  traineeId?: string;
  traineeName?: string;
  // Common fields
  name?: string;
  [key: string]: any; // Allow additional properties
}

// Interface for dropdown display
interface DropdownItem {
  displayId: string;
  displayName: string;
  originalData: Person;
}
 
@Component({
  selector: 'app-basic-details',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="form-section">
      <h4>Basic Details</h4>
 
      <!-- Employee/Trainee Selection Dropdown (Visible only for Admin/HR when creating new) -->
      <div *ngIf="canSelectEmployee && !isEditMode" class="form-group">
        <label>Select Employee/Trainee ID</label>
        <select 
          class="employee-select"
          (change)="onPersonChange($event)" 
          (click)="$event.stopPropagation()">
          <option value="" disabled selected>-- Select ID --</option>
          <option *ngFor="let item of dropdownList; trackBy: trackByItemId" 
                  [value]="item.displayId + '|' + item.originalData.type">
            {{ item.displayId }} - {{ item.displayName || 'No Name' }}
            <span *ngIf="item.originalData.type === 'Trainee'"> (Trainee)</span>
          </option>
        </select>
        <div class="hint" *ngIf="isLoading">Loading employees and trainees...</div>
        <div class="hint" *ngIf="!isLoading && dropdownList.length === 0">No records found</div>
        <div class="hint" *ngIf="!isLoading && dropdownList.length > 0">
          Total: {{ dropdownList.length }} records ({{ employeeCount }} Employees, {{ traineeCount }} Trainees)
        </div>
      </div>
 
      <!-- Show selected/edited ID (read-only) -->
      <div class="form-group" *ngIf="form.get('empid')?.value">
        <label>Employee/Trainee ID</label>
        <input type="text" [value]="form.get('empid')?.value" readonly class="readonly-field">
        <span class="type-badge" *ngIf="selectedPersonType">
          Type: {{ selectedPersonType }}
        </span>
      </div>
 
      <div [formGroup]="form">
        <div class="form-group-title">Personal Information</div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name*</label>
            <input type="text" formControlName="firstname" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter first name">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" formControlName="lastname" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter last name">
          </div>
        </div>
 
        <div class="form-row">
          <div class="form-group">
            <label>Date of Joining*</label>
            <input type="date" formControlName="dateOfJoin" 
                   [readOnly]="!canEditFields" 
                   (focus)="openDatePicker($event)">
          </div>
        </div>
 
        <div class="form-group-title">Contact Information</div>
        <div class="form-row">
          <div class="form-group">
            <label>Work Email*</label>
            <input type="email" formControlName="emailid" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter work email">
          </div>
          <div class="form-group">
            <label>Personal Email</label>
            <input type="email" formControlName="personalEmail" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter personal email">
          </div>
        </div>
 
        <div class="form-row">
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="tel" formControlName="phonenumber" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter mobile number">
          </div>
        </div>
 
        <div class="form-group-title">Employment Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Work Location*</label>
            <input type="text" formControlName="locationType" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter work location">
          </div>
          <div class="form-group">
            <label>Department*</label>
            <input type="text" formControlName="department" 
                   [readOnly]="!canEditFields" 
                   placeholder="Enter department">
          </div>
        </div>

        <!-- Manual entry hint -->
        <div class="manual-entry-hint" *ngIf="canEditFields && !isLoading">
          <small>You can manually edit the fields above or select a different ID from dropdown</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-section { 
      animation: fadeIn 0.3s ease-in-out; 
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-group-title { 
      font-size: 1.1rem; 
      font-weight: 500; 
      color: #2196F3; 
      margin: 2rem 0 1rem; 
      padding-bottom: 0.5rem; 
      border-bottom: 2px solid #e0e0e0; 
    }
    
    .form-row { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 1.5rem; 
      margin-bottom: 1.5rem; 
    }
    
    .form-group { 
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    label { 
      display: block; 
      margin-bottom: 0.5rem; 
      color: #555; 
      font-weight: 500; 
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    input, select { 
      width: 100%; 
      padding: 0.75rem 1rem; 
      border: 1px solid #ddd; 
      border-radius: 6px; 
      font-size: 0.95rem; 
      transition: all 0.3s ease; 
      background-color: white;
    }
    
    input:focus, select:focus { 
      outline: none; 
      border-color: #2196F3; 
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1); 
    }
    
    input[readonly] { 
      background-color: #f5f5f5; 
      cursor: not-allowed;
      border-color: #e0e0e0;
      color: #666;
    }
    
    .readonly-field { 
      background-color: #f5f5f5; 
      cursor: not-allowed;
      border-color: #e0e0e0;
      color: #666;
      width: calc(100% - 120px);
      display: inline-block;
      margin-right: 10px;
    }
    
    .type-badge {
      display: inline-block;
      padding: 5px 10px;
      background-color: #e3f2fd;
      color: #1976D2;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    
    .employee-select {
      background-color: white;
      cursor: pointer;
      border: 2px solid #e0e0e0;
      width: 100%;
    }
    
    .employee-select:hover {
      border-color: #2196F3;
    }
    
    .employee-select option {
      padding: 10px;
      font-size: 0.95rem;
    }
    
    .hint {
      display: block;
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.85rem;
      font-style: italic;
    }
    
    .manual-entry-hint {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976D2;
      font-size: 0.9rem;
      text-align: center;
      border-left: 4px solid #2196F3;
    }
    
    h4 {
      color: #333;
      margin: 0 0 20px 0;
      font-size: 1.3rem;
      font-weight: 600;
      padding-bottom: 10px;
      border-bottom: 2px solid #2196F3;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class BasicDetailsComponent implements OnInit, OnChanges {
  @Input() form!: FormGroup;
 
  userRole: string = '';
  allPersons: Person[] = [];
  dropdownList: DropdownItem[] = [];
  canSelectEmployee: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  employeeCount: number = 0;
  traineeCount: number = 0;
  canEditFields: boolean = false;
  selectedPersonId: string = '';
  selectedPersonType: string = '';
 
  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private userService: UserService
  ) {}
 
  ngOnInit(): void {
    this.userRole = this.userService.role || '';
    this.canSelectEmployee = this.userService.isAdmin();
 
    // Detect edit mode: if empid exists in form, we're likely editing
    const currentEmpId = this.form?.get('empid')?.value;
    this.isEditMode = !!currentEmpId;
    
    // In edit mode, fields should be editable if user has permission
    if (this.isEditMode) {
      this.canEditFields = this.canSelectEmployee; // Only admin can edit in edit mode
    } else {
      // In create mode, fields become editable after selection or for manual entry
      this.canEditFields = false;
    }
 
    if (this.canSelectEmployee && !this.isEditMode) {
      this.loadAllEmployeesAndTrainees();
    }
 
    // If not admin and no data loaded yet, optionally load from localStorage (fallback)
    if (!this.canSelectEmployee && !this.isEditMode) {
      const employeeId = localStorage.getItem('employeeId');
      if (employeeId && !currentEmpId) {
        this.loadPersonDetails(employeeId, 'Employee');
      }
    }
  }
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] && this.form) {
      const empId = this.form.get('empid')?.value;
      this.isEditMode = !!empId;
      
      // If in edit mode, we don't need to show the dropdown
      if (this.isEditMode) {
        this.dropdownList = [];
        this.canEditFields = this.canSelectEmployee; // Only admin can edit in edit mode
      }
    }
  }
 
  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.showPicker) {
      input.showPicker();
    }
  }
 
  loadAllEmployeesAndTrainees(): void {
    this.isLoading = true;
    this.apiService.getAllEmployeesAndTrainees().subscribe({
      next: (data: Person[]) => {
        // Store all original data
        this.allPersons = data;
        
        // Transform data for dropdown display
        this.dropdownList = data
          .map(item => this.transformToDropdownItem(item))
          .filter(item => item.displayId && item.displayId.trim() !== '') // Filter out empty IDs
          .sort((a, b) => {
            // Sort by ID (alphanumeric)
            return a.displayId.localeCompare(b.displayId, undefined, { numeric: true });
          });
        
        // Count employees and trainees
        this.employeeCount = data.filter(item => item.type === 'Employee').length;
        this.traineeCount = data.filter(item => item.type === 'Trainee').length;
        
        console.log('Loaded all records:', {
          total: this.dropdownList.length,
          employees: this.employeeCount,
          trainees: this.traineeCount,
          data: this.dropdownList
        });
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching employees and trainees:', error);
        this.allPersons = [];
        this.dropdownList = [];
        this.employeeCount = 0;
        this.traineeCount = 0;
        this.isLoading = false;
      }
    });
  }
 
  transformToDropdownItem(person: Person): DropdownItem {
    let displayId = '';
    let displayName = '';
    
    if (person.type === 'Employee') {
      // For employees, use employeeId or id
      displayId = person.employeeId || person.id || '';
      displayName = person.employeeName || person.name || '';
    } else if (person.type === 'Trainee') {
      // For trainees, use traineeId or id
      displayId = person.traineeId || person.id || '';
      displayName = person.traineeName || person.name || '';
    } else {
      // Fallback for any other type
      displayId = person.id || '';
      displayName = person.name || '';
    }
    
    return {
      displayId: String(displayId).trim(),
      displayName: String(displayName).trim(),
      originalData: person
    };
  }
 
  loadPersonDetails(personId: string, personType: string): void {
    if (!personId) return;
 
    this.isLoading = true;
    this.selectedPersonId = personId;
    this.selectedPersonType = personType;
    
    if (personType === 'Employee') {
      // Call employee API
      this.apiService.getEmployeeDetails(personId).subscribe({
        next: (data: any) => {
          this.handlePersonDetailsResponse(data, personId);
        },
        error: (error: any) => {
          this.handlePersonDetailsError(error, personId);
        }
      });
    } else if (personType === 'Trainee') {
      // Call trainee API
      this.apiService.getTraineeDetails(personId).subscribe({
        next: (data: any) => {
          this.handlePersonDetailsResponse(data, personId);
        },
        error: (error: any) => {
          this.handlePersonDetailsError(error, personId);
        }
      });
    }
  }
 
  handlePersonDetailsResponse(data: any, personId: string): void {
    console.log('Loaded Details for ID:', personId, data);
 
    // Format date if needed
    let formattedData = { ...data };
    
    // Handle date formatting for dateOfJoin field
    if (formattedData.dateOfJoin) {
      formattedData.dateOfJoin = this.formatDate(formattedData.dateOfJoin);
    }
 
    // Map the data to match form field names - FIXED VERSION
    const mappedData: any = {
      empid: formattedData.empid || formattedData.employeeId || formattedData.traineeId || formattedData.trngid || personId,
      firstname: formattedData.firstname || formattedData.firstName || '',
      lastname: formattedData.lastname || formattedData.lastName || '',
      dateOfJoin: formattedData.dateOfJoin || '',
      emailid: formattedData.emailid || formattedData.emailId || formattedData.workEmail || formattedData.email || '',
      personalEmail: formattedData.personalEmail || formattedData.personalemail || formattedData.alternateEmail || '',
      phonenumber: formattedData.phonenumber || formattedData.phoneNumber || formattedData.mobile || '',
      locationType: formattedData.locationType || formattedData.workLocation || formattedData.location || '',
      department: formattedData.department || formattedData.dept || formattedData.departmentName || ''
    };
    
    // Patch the form with retrieved data
    this.form.patchValue(mappedData);
    
    // Enable editing after data is loaded
    this.canEditFields = true;
    
    console.log('Form patched with data:', mappedData);
    this.isLoading = false;
  }
 
  handlePersonDetailsError(error: any, personId: string): void {
    console.error('Error loading person details:', error);
    
    // If error occurs, still set the ID but allow manual entry
    this.form.patchValue({
      empid: personId
    });
    
    // Enable editing even if API fails (for manual entry)
    this.canEditFields = true;
    
    // Show error message but allow manual entry
    alert('Could not load existing details. You can manually enter the information.');
    
    this.isLoading = false;
  }
 
  formatDate(date: string | Date): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
 
  onPersonChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    
    if (selectedValue) {
      // Split the combined value (ID|TYPE)
      const [selectedId, selectedType] = selectedValue.split('|');
      this.loadPersonDetails(selectedId, selectedType);
      console.log('Selected ID:', selectedId, 'Type:', selectedType);
    }
  }
 
  trackByItemId(index: number, item: DropdownItem): string {
    return item?.displayId || index.toString();
  }

  // Method to reset form for manual entry
  resetForManualEntry(): void {
    this.form.reset();
    this.canEditFields = true;
    this.selectedPersonId = '';
    this.selectedPersonType = '';
  }
}