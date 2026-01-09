import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-hr-verification',
  templateUrl: './hr-verification.component.html',
  styleUrls: ['./hr-verification.component.css']
})
export class HrVerificationComponent implements OnInit {
  @Input() exitFormId: string = '';
  @Input() employeeId: string = '';
  @Input() formData: any = null;

  @Output() submitted = new EventEmitter<any>();

  employeeData: any = null;

  // CHANGE THIS LINE:
  // currentUser = 'hr_user'; // OLD
  currentUser: string = ''; // NEW
  currentUserName: string = ''; // NEW: Add this for HR name
  hrForm!: FormGroup;
  loading = false;
  errorMessage: string = '';
  isSubmitted = false;
  isUpdateMode = false;
  isFormDisabled = false;
  originalData: any = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
  // Get user info from localStorage - IMPROVED VERSION
  this.getUserInfoFromLocalStorage();

  this.initializeEmployeeData();
  
  console.log('🎯 HR User Info for Database:', {
    id: this.currentUser,
    name: this.currentUserName,
    isNameValid: this.currentUserName && this.currentUserName.trim() !== ''
  });

  

  // Show alert to verify what we have
  // if (this.currentUserName && this.currentUserName.trim() !== '') {
  //   alert(`Logged in as: ${this.currentUserName}`);
  // } else {
  //   alert('⚠️ Warning: No user name found. Using default name.');
  // }

  this.createForm();
  
  if (this.formData) {
    this.initializeForm();
  } else if (this.exitFormId) {
    this.loadFormData();
  }
}

// ✅ ADD THIS METHOD: Initialize employee data
  private initializeEmployeeData(): void {
    // If formData has employee info, use it
    if (this.formData) {
      this.employeeData = {
        employeeId: this.formData.employeeId || this.employeeId || 'N/A',
        employeeName: this.formData.employeeName || 'N/A',
        department: this.formData.department || 'N/A',
        designation: this.formData.designation || 'N/A',
        exitType: this.formData.exitType || 'N/A',
        exitStatus: this.formData.hrAction || 'pending', // Use hrAction as status
        lastWorkingDay: this.formData.lastWorkingDay || 'N/A'
      };
    } else {
      // Default empty data
      this.employeeData = {
        employeeId: this.employeeId || 'N/A',
        employeeName: 'N/A',
        department: 'N/A',
        designation: 'N/A',
        exitType: 'N/A',
        exitStatus: 'pending',
        lastWorkingDay: 'N/A'
      };
    }
  }

  // ✅ ADD THIS METHOD: Missing method for exit status text
  getExitStatusText(status: string): string {
    if (!status) return 'Unknown';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'APPROVE': 'Approved',
      'REJECT': 'Rejected',
      'REVISE_LWD': 'Revision Requested'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }

// NEW METHOD: Get user info from localStorage properly
private getUserInfoFromLocalStorage(): void {
  // Debug: Show all localStorage items
  console.log('🔍 Checking localStorage for user info...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }
  }

  // Step 1: Try to get user name from common keys
  const nameKeys = [
    'employeeName', 'username', 'userName', 'name', 
    'fullName', 'displayName', 'loggedInUserName'
  ];

  for (const key of nameKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim() !== '' && value !== 'null' && value !== 'undefined') {
      console.log(`Found name in "${key}": ${value}`);
      this.currentUserName = value.trim();
      break;
    }
  }

  // Step 2: If name not found, check for user object
  if (!this.currentUserName || this.currentUserName.trim() === '') {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr.startsWith('{')) {
      try {
        const user = JSON.parse(userStr);
        console.log('Parsed user object:', user);
        this.currentUserName = user.name || user.employeeName || user.username || 
                              user.fullName || user.displayName || '';
      } catch (e) {
        console.error('Error parsing user object:', e);
      }
    }
  }

  // Step 3: If still no name, use email or create default
  if (!this.currentUserName || this.currentUserName.trim() === '') {
    const email = localStorage.getItem('email') || localStorage.getItem('userEmail');
    if (email) {
      // Extract name from email (john.doe@company.com -> John Doe)
      const emailPrefix = email.split('@')[0];
      this.currentUserName = emailPrefix
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      console.log(`Using email as name: ${this.currentUserName}`);
    } else {
      this.currentUserName = 'HR Staff';
      console.log('Using default name: HR Staff');
    }
  }

  // Get user ID
  const idKeys = ['employeeId', 'userId', 'id', 'user_id', 'empId'];
  for (const key of idKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim() !== '' && value !== 'null' && value !== 'undefined') {
      this.currentUser = value.trim();
      console.log(`Found ID in "${key}": ${value}`);
      break;
    }
  }
}


  private createForm(): void {
    this.hrForm = this.fb.group({
      noticePeriodChecked: [false],
      noticePeriodComment: ['', Validators.required],
      leaveBalancesChecked: [false],
      leaveBalancesComment: ['', Validators.required],
      policyComplianceChecked: [false],
      policyComplianceComment: ['', Validators.required],
      exitEligibilityChecked: [false],
      exitEligibilityComment: ['', Validators.required],
      generalComments: ['',Validators.required]
    });

    // Setup checkbox validators
    this.setupCheckboxValidators();
  }

  private setupCheckboxValidators(): void {
    // Notice Period
    this.hrForm.get('noticePeriodChecked')?.valueChanges.subscribe(checked => {
      const commentCtrl = this.hrForm.get('noticePeriodComment');
      if (checked) {
        commentCtrl?.setValidators(Validators.required);
      } else {
        commentCtrl?.clearValidators();
        commentCtrl?.setValue('');
      }
      commentCtrl?.updateValueAndValidity();
    });

    // Leave Balances
    this.hrForm.get('leaveBalancesChecked')?.valueChanges.subscribe(checked => {
      const commentCtrl = this.hrForm.get('leaveBalancesComment');
      if (checked) {
        commentCtrl?.setValidators(Validators.required);
      } else {
        commentCtrl?.clearValidators();
        commentCtrl?.setValue('');
      }
      commentCtrl?.updateValueAndValidity();
    });

    // Policy Compliance
    this.hrForm.get('policyComplianceChecked')?.valueChanges.subscribe(checked => {
      const commentCtrl = this.hrForm.get('policyComplianceComment');
      if (checked) {
        commentCtrl?.setValidators(Validators.required);
      } else {
        commentCtrl?.clearValidators();
        commentCtrl?.setValue('');
      }
      commentCtrl?.updateValueAndValidity();
    });

    // Exit Eligibility
    this.hrForm.get('exitEligibilityChecked')?.valueChanges.subscribe(checked => {
      const commentCtrl = this.hrForm.get('exitEligibilityComment');
      if (checked) {
        commentCtrl?.setValidators(Validators.required);
      } else {
        commentCtrl?.clearValidators();
        commentCtrl?.setValue('');
      }
      commentCtrl?.updateValueAndValidity();
    });
  }

  private initializeForm(): void {
    console.log('🟢 Initializing HR form with data:', this.formData);
    
    // Check if HR action already exists
    if (this.formData?.hrAction) {
      this.isSubmitted = true;
      this.isFormDisabled = true;
      this.hrForm.disable();
      console.log('🔒 Form is SUBMITTED and DISABLED - HR Action:', this.formData.hrAction);
    } else {
      this.isSubmitted = false;
      this.isFormDisabled = false;
      this.hrForm.enable();
      console.log('🔓 Form is OPEN - No HR action');
    }
    
    this.loadExistingHRData();
  }

  private loadFormData(): void {
    if (!this.exitFormId) return;

    console.log('📥 Loading form data by ID:', this.exitFormId);
    this.loading = true;

    this.apiService.getHRReviewByExitFormId(this.exitFormId).subscribe({
      next: (response: any) => {
        console.log('📥 HR Review API Response:', response);
        
        if (response && response.success && response.data) {
          const data = response.data;
          
          // Check if HR action exists
          if (data.hrAction && data.hrAction.trim() !== '') {
            this.isSubmitted = true;
            this.isFormDisabled = true;
            this.hrForm.disable();
            console.log('🔒 Form is SUBMITTED and DISABLED - HR Action:', data.hrAction);
          } else {
            this.isSubmitted = false;
            this.isFormDisabled = false;
            this.hrForm.enable();
            console.log('🔓 Form is OPEN - No HR action');
          }
          
          this.patchFormWithData(data);
        } else {
          this.isSubmitted = false;
          this.isFormDisabled = false;
          this.hrForm.enable();
          console.log('📭 No existing HR review found - showing empty form');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error fetching HR review:', error);
        this.isSubmitted = false;
        this.isFormDisabled = false;
        this.hrForm.enable();
        this.loading = false;
      }
    });
  }

  private patchFormWithData(data: any): void {
    this.hrForm.patchValue({
      noticePeriodChecked: data.hrNoticePeriod || false,
      noticePeriodComment: data.hrNoticePeriodComments || '',
      leaveBalancesChecked: data.hrLeaveBalances || false,
      leaveBalancesComment: data.hrLeaveBalancesComments || '',
      policyComplianceChecked: data.hrPolicyCompliance || false,
      policyComplianceComment: data.hrPolicyComplianceComments || '',
      exitEligibilityChecked: data.hrExitEligibility || false,
      exitEligibilityComment: data.hrExitEligibilityComments || '',
      generalComments: data.hrGeneralComments || ''
    });
  }

  private loadExistingHRData(): void {
    console.log('📋 Loading existing HR data from formData');
    
    if (this.formData) {
      this.hrForm.patchValue({
        noticePeriodChecked: this.formData.hrNoticePeriod || false,
        noticePeriodComment: this.formData.hrNoticePeriodComments || '',
        leaveBalancesChecked: this.formData.hrLeaveBalances || false,
        leaveBalancesComment: this.formData.hrLeaveBalancesComments || '',
        policyComplianceChecked: this.formData.hrPolicyCompliance || false,
        policyComplianceComment: this.formData.hrPolicyComplianceComments || '',
        exitEligibilityChecked: this.formData.hrExitEligibility || false,
        exitEligibilityComment: this.formData.hrExitEligibilityComments || '',
        generalComments: this.formData.hrGeneralComments || ''
      });
    }
  }

  // Check if at least one checkbox is checked
  get hasCheckedItems(): boolean {
    return this.hrForm.get('noticePeriodChecked')?.value ||
           this.hrForm.get('leaveBalancesChecked')?.value ||
           this.hrForm.get('policyComplianceChecked')?.value ||
           this.hrForm.get('exitEligibilityChecked')?.value;
  }

  // Check if all checked items have comments
  get hasValidComments(): boolean {
    const checks = [
      { checked: this.hrForm.get('noticePeriodChecked')?.value, comment: this.hrForm.get('noticePeriodComment')?.value },
      { checked: this.hrForm.get('leaveBalancesChecked')?.value, comment: this.hrForm.get('leaveBalancesComment')?.value },
      { checked: this.hrForm.get('policyComplianceChecked')?.value, comment: this.hrForm.get('policyComplianceComment')?.value },
      { checked: this.hrForm.get('exitEligibilityChecked')?.value, comment: this.hrForm.get('exitEligibilityComment')?.value }
    ];
    
    return checks.every(item => {
      if (item.checked) {
        return item.comment && item.comment.trim() !== '';
      }
      return true;
    });
  }

  // Check if form is valid for submission
  get canSubmit(): boolean {
    return this.hasCheckedItems && this.hasValidComments && !this.loading;
  }

  // Check if update button should be shown
  get canUpdate(): boolean {
    return this.isSubmitted && !this.isUpdateMode && !this.loading;
  }

  // Enter update mode
  enterUpdateMode(): void {
    if (!this.canUpdate) return;
    
    this.isUpdateMode = true;
    this.isFormDisabled = false;
    this.hrForm.enable();
    
    // Save original data for cancel
    this.originalData = this.hrForm.value;
    
    console.log('🟢 Entered update mode');
  }

  // Cancel update
  cancelUpdate(): void {
    this.isUpdateMode = false;
    this.isFormDisabled = true;
    
    // Restore original data
    if (this.originalData) {
      this.hrForm.patchValue(this.originalData);
    }
    
    this.hrForm.disable();
    this.originalData = null;
    
    console.log('🟡 Cancelled update mode');
  }

  // Submit HR Review - UPDATE THIS METHOD
// In hr-verification.component.ts - UPDATE THE submitHRReview METHOD:

submitHRReview(action: string): void {
  if (!this.canSubmit || this.loading) return;

  if (!this.exitFormId) {
    this.errorMessage = 'No valid form ID found.';
    return;
  }

  this.loading = true;
  this.errorMessage = '';
  
  // VERIFY we have a user name
  let hrNameForDb = this.currentUserName;
  if (!hrNameForDb || hrNameForDb.trim() === '') {
    hrNameForDb = 'HR User';
    console.warn('⚠️ No user name found, using default');
  }
  
  // ✅ ADD THESE DEBUG LINES
  console.log('🔍 DEBUG - Form Values:', this.hrForm.value);
  console.log('🔍 DEBUG - Form Valid:', this.hrForm.valid);
  console.log('🔍 DEBUG - Form Controls:', this.hrForm.controls);
  
  const generalCommentsValue = this.hrForm.get('generalComments')?.value;
  console.log('🔍 DEBUG - General Comments Raw:', generalCommentsValue);
  console.log('🔍 DEBUG - General Comments Type:', typeof generalCommentsValue);


  // ✅ CORRECT PAYLOAD - includes both hrName and hrGeneralComments
  const payload = {
    id: this.exitFormId,
    formId: this.exitFormId,
    employeeId: this.employeeId,
    hrNoticePeriod: this.hrForm.get('noticePeriodChecked')?.value || false,
    hrLeaveBalances: this.hrForm.get('leaveBalancesChecked')?.value || false,
    hrPolicyCompliance: this.hrForm.get('policyComplianceChecked')?.value || false,
    hrExitEligibility: this.hrForm.get('exitEligibilityChecked')?.value || false,
    hrNoticePeriodComments: this.hrForm.get('noticePeriodComment')?.value || '',
    hrLeaveBalancesComments: this.hrForm.get('leaveBalancesComment')?.value || '',
    hrPolicyComplianceComments: this.hrForm.get('policyComplianceComment')?.value || '',
    hrExitEligibilityComments: this.hrForm.get('exitEligibilityComment')?.value || '',
    hrGeneralComments: generalCommentsValue || '', // ✅ GOES TO HR_GENERAL_COMMENTS
    hrAction: action,
    hrId: this.currentUser,
    hrName: hrNameForDb, // ✅ GOES TO HR_NAME COLUMN
    hrReviewDate: new Date().toISOString().split('T')[0]
  };

  console.log("📤 Full Payload for Backend:", JSON.stringify(payload, null, 2));
  console.log("📤 Payload hrGeneralComments:", payload.hrGeneralComments);
  console.log("📤 Payload hrGeneralComments length:", payload.hrGeneralComments?.length);

  // ✅ FIXED: Pass only payload (remove second parameter hrNameForDb)
  const apiCall = this.isUpdateMode 
    ? this.apiService.updateHRReview(payload)  // Only one parameter
    : this.apiService.submitHRReview(payload); // Only one parameter

  apiCall.subscribe({
    next: (response: any) => {
      console.log("✅ HR Review Response:", response);
      this.loading = false;
      
      if (response && response.success) {
        this.isSubmitted = true;
        this.isUpdateMode = false;
        this.isFormDisabled = true;
        this.hrForm.disable();
        
        const message = this.isUpdateMode 
          ? `HR review updated by ${hrNameForDb}!` 
          : `Exit form ${action.toLowerCase()} by ${hrNameForDb}!`;
        
        console.log('🎉 SUCCESS:', message);
        console.log('🎉 HR Name saved to DB column HR_NAME:', response.data?.hrName);
        console.log('🎉 General Comments saved to DB column HR_GENERAL_COMMENTS:', response.data?.hrGeneralComments);
        
        this.submitted.emit({ 
          success: true, 
          data: response.data,
          action: action,
          hrName: hrNameForDb,
          hrGeneralComments: payload.hrGeneralComments,
          message: message
        });
      } else {
        this.errorMessage = response?.message || 'Failed to process HR review';
      }
    },
    error: (error: any) => {
      console.error("❌ HR Review Error:", error);
      this.loading = false;
      this.errorMessage = error.message || 'An error occurred while processing the HR review';
    }
  });
}



  // Submit action (Approve/Reject/Revise)
  submitAction(action: string): void {
    this.submitHRReview(action);
  }

  // Save edits (in update mode)
  saveEdits(): void {
    // When saving edits, use the existing HR action
    const existingAction = this.formData?.hrAction || 'APPROVE';
    this.submitHRReview(existingAction);
  }

  getFormTitle(): string {
    if (this.isUpdateMode) return 'Edit HR Review';
    return this.isSubmitted ? 'HR Review (Completed)' : 'HR Verification & Approval';
  }

  getSectionTitle(): string {
    if (this.isUpdateMode) return 'Edit Exit Checklist Verification';
    return this.isSubmitted ? 'HR Review Completed' : 'Exit Checklist Verification';
  }

  getCompletionMessage(): string {
    if (!this.isSubmitted) return '';
    const action = this.formData?.hrAction;
    const by = this.formData?.hrName || this.currentUser || 'HR';
    const date = this.formData?.hrReviewDate || 'N/A';
    if (action === 'APPROVE') return `Approved by ${by} on ${date}`;
    if (action === 'REJECT') return `Rejected by ${by} on ${date}`;
    if (action === 'REVISE_LWD') return `LWD Revision Requested by ${by} on ${date}`;
    return `Action taken by ${by} on ${date}`;
  }

  
}

