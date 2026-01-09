import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-payroll-checks',
  templateUrl: './payroll-checks.component.html',
  styleUrls: ['./payroll-checks.component.css']
})
export class PayrollChecksComponent implements OnInit {
  @Input() exitFormId!: string;
  @Input() readonly: boolean = false;

  payrollForm!: FormGroup;
  isSubmitting = false;
  isLoading = false;
  isSubmitted = false;
  isEditMode = false;
  
  // User role and permissions
  currentUserRole: string = '';
  isACCRole: boolean = false;
  isHRRole: boolean = false;
  canEdit: boolean = false;
  canView: boolean = false;
  hasDataInDB: boolean = false;

  defaultItems = [
    'Salary advances', 'LOP days', 'Notice period buyout', 'Extra payments',
    'Reimbursable claims', 'Gratuity eligibility', 'PF/ESI closure',
    'PF/ESI Exit date', 'Last Month Pay Slip'
  ];

  private addedLabels = new Set<string>();

  constructor(private fb: FormBuilder, private apiService: ApiService) {}

  ngOnInit(): void {
    this.initializeUserRole();
    this.initializeForm();
    
    if (this.exitFormId) {
      this.loadExistingData();
    } else {
      this.loadDefaultItems();
      this.disableFormIfNotACC();
    }
  }

  // 🟢 Initialize user role and permissions
  private initializeUserRole(): void {
    this.currentUserRole = localStorage.getItem('role') || '';
    const username = (localStorage.getItem('username') || '').toUpperCase();
    const role = (this.currentUserRole || '').toUpperCase();
    
    // Check for ACC role
    this.isACCRole = role.includes('ACC') || 
                    role === 'R008' || 
                    role.includes('PAYROLL') ||
                    username.includes('PAYROLL') ||
                    username.includes('ACC');
    
    // Check for HR role
    this.isHRRole = role.includes('HR') || 
                   role === 'R003' || 
                   this.currentUserRole?.toLowerCase().includes('hr');
    
    console.log('🟢 Payroll Component - User Role:', {
      role: this.currentUserRole,
      isACCRole: this.isACCRole,
      isHRRole: this.isHRRole,
      readonlyInput: this.readonly
    });
  }

  initializeForm(): void {
    this.payrollForm = this.fb.group({
      items: this.fb.array([]),
      newItemName: ['']
    });
    this.addedLabels.clear();
  }

  get items(): FormArray {
    return this.payrollForm.get('items') as FormArray;
  }

  createItem(label: string, status = 'Cleared', comments = ''): FormGroup {
    return this.fb.group({
      label: [label],
      status: [status, Validators.required],
      comments: [comments]
    });
  }

  addItem(label: string, status = 'Cleared', comments = ''): void {
    if (this.addedLabels.has(label)) return;
    
    this.items.push(this.createItem(label, status, comments));
    this.addedLabels.add(label);
  }

  loadDefaultItems(): void {
    this.defaultItems.forEach(item => this.addItem(item));
  }

  addNewItem(): void {
    if (!this.isFormEditable) return;
    
    const name = this.payrollForm.get('newItemName')?.value?.trim();
    if (name && !this.addedLabels.has(name)) {
      this.addItem(name);
      this.payrollForm.patchValue({ newItemName: '' });
    }
  }

  removeItem(index: number): void {
    if (!this.isFormEditable) return;
    
    const label = this.items.at(index).get('label')?.value;
    if (this.defaultItems.includes(label)) return;

    this.items.removeAt(index);
    this.addedLabels.delete(label);
  }

  // 🟢 Enable edit mode - Only for ACC role
  enableEditMode(): void {
    if (!this.isACCRole) {
      alert('You are not authorized to edit payroll checks. Only ACC/Payroll users can edit.');
      return;
    }
    
    this.isEditMode = true;
    this.payrollForm.enable();
  }

  buildPayrollString(): string {
    return this.items.value
      .map((item: any) => {
        const comment = item.comments?.trim();
        const commentPart = comment ? ` || ${comment}` : ' || ';
        return `${item.label} : ${item.status}${commentPart}`;
      })
      .join(' # ');
  }

  parsePayrollString(str: string): void {
    this.items.clear();
    this.addedLabels.clear();

    if (!str || str.trim() === '' || str === 'null') {
      this.loadDefaultItems();
      this.isSubmitted = false;
      this.hasDataInDB = false;
      this.disableFormIfNotACC();
      return;
    }

    const parts = str.split('#').map(p => p.trim()).filter(Boolean);

    parts.forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) return;
      const label = part.substring(0, colonIdx).trim();
      const rest = part.substring(colonIdx + 1).trim();
      const [status, comment] = rest.split('||').map(s => s.trim());
      this.addItem(label, status || 'Cleared', comment && comment !== 'null' ? comment : '');
    });

    this.defaultItems.forEach(def => {
      if (!this.addedLabels.has(def)) this.addItem(def);
    });

    this.isSubmitted = true;
    this.hasDataInDB = true;
    this.isEditMode = false;
    
    // 🟢 Set form state based on user role
    this.setFormStateBasedOnRole();
  }

  // 🟢 Set form state based on user role
  private setFormStateBasedOnRole(): void {
    if (this.isACCRole && this.hasDataInDB && !this.isEditMode) {
      // ACC role can enable edit mode later
      this.payrollForm.disable();
    } else if (this.isHRRole) {
      // HR role is always read-only
      this.payrollForm.disable();
    } else if (!this.isACCRole && !this.isHRRole) {
      // Other roles - disable
      this.payrollForm.disable();
    }
  }

  // 🟢 Disable form if user is not ACC
  private disableFormIfNotACC(): void {
    if (!this.isACCRole) {
      this.payrollForm.disable();
    }
  }

  // 🟢 Load existing data from database
  loadExistingData(): void {
    if (!this.exitFormId) return;

    this.isLoading = true;
    this.apiService.getPayrollChecks(this.exitFormId).subscribe({
      next: (res: any) => {
        const data = res.payrollChecks?.trim();
        if (res.success && data && data !== 'null') {
          this.parsePayrollString(data);
          this.hasDataInDB = true;
        } else {
          this.loadDefaultItems();
          this.isSubmitted = false;
          this.hasDataInDB = false;
          
          // Enable only if ACC role
          if (this.isACCRole) {
            this.payrollForm.enable();
          } else {
            this.payrollForm.disable();
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payroll data:', error);
        this.loadDefaultItems();
        this.isSubmitted = false;
        this.hasDataInDB = false;
        
        // Enable only if ACC role
        if (this.isACCRole) {
          this.payrollForm.enable();
        } else {
          this.payrollForm.disable();
        }
        
        this.isLoading = false;
      }
    });
  }

  // 🟢 Check if form is editable
  get isFormEditable(): boolean {
    // If readonly input is true, always read-only
    if (this.readonly) return false;
    
    // Only ACC role can edit
    if (!this.isACCRole) return false;
    
    // If form has data in DB, only editable in edit mode
    if (this.hasDataInDB) {
      return this.isEditMode;
    }
    
    // If no data in DB, ACC can always edit
    return true;
  }

  // 🟢 Submit method - Only for ACC role
  submit(): void {
    // Check permissions
    if (!this.isACCRole) {
      alert('You are not authorized to submit payroll checks. Only ACC/Payroll users can submit.');
      return;
    }
    
    if (this.isSubmitting) return;

    const hasError = this.items.controls.some((control: any) => {
      const status = control.get('status')?.value;
      const comments = control.get('comments')?.value?.trim();
      return (status === 'Pending' || status === 'Rejected') && !comments;
    });

    if (hasError) {
      alert('Please provide comments for all Pending/Rejected items!');
      return;
    }

    this.isSubmitting = true;
    const payload = { payroll_checks: this.buildPayrollString() };

    this.apiService.submitPayrollChecks(this.exitFormId, payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert(this.isEditMode ? 'Payroll Checks Updated Successfully!' : 'Payroll Checks Submitted Successfully!');
          this.isSubmitted = true;
          this.hasDataInDB = true;
          this.isEditMode = false;
          this.payrollForm.disable();
          
          // Refresh data to show updated state
          this.loadExistingData();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving payroll checks:', error);
        alert('Error saving payroll checks. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  // 🟢 Check if user can see update button
  get canShowUpdateButton(): boolean {
    // Only ACC role can see update button when form has data in DB
    return this.isACCRole && this.hasDataInDB && !this.isEditMode;
  }

  // 🟢 Get user role display
  get userRoleDisplay(): string {
    if (this.isACCRole) return 'ACC/Payroll User';
    if (this.isHRRole) return 'HR User (View Only)';
    return 'User';
  }

  // 🟢 Check if user can view the form
  get canViewForm(): boolean {
    // Anyone can view if data exists in DB
    if (this.hasDataInDB) return true;
    
    // If no data in DB, only ACC can view to create new
    return this.isACCRole;
  }
}