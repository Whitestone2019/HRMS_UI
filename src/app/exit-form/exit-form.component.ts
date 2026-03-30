import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, ExitForm } from '../api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-exit-form',
  templateUrl: './exit-form.component.html',
  styleUrls: ['./exit-form.component.css']
})
export class ExitFormComponent implements OnInit {
  @Input() exitFormId: string = '';
  exitForm!: FormGroup;
  selectedFileName: string = '';
  openDropdown: string | null = null;
  loading = false;
  isViewMode: boolean = false;
  isEditMode: boolean = false;
  formTitle: string = 'RESIGNATION FORM';
  hasExistingForm: boolean = false;
  formDataLoaded: boolean = false;
  withdrawing = false;
  isSubmitting = false;
  currentFormId: string = '';

  // Flags from manager review
  fromManagerReview: boolean = false;
  fromHRReview: boolean = false; // NEW: Added for HR review
  allowEdit: boolean = false;
  managerAction: string = '';
  hrAction: string = ''; // NEW: Added for HR action
  isWaiverAction: boolean = false;
  isReviseLWDAction: boolean = false; // NEW: Added for HR revise LWD
  preserveEmployeeName: boolean = false;
  originalEmployeeNameFromWaiver: string = '';

  // Fetch employee info
  employeeId: string = '';
  employeeName: string = '';
  role: string = '';
  
  // User role flags
  isHR: boolean = false;
  isManager: boolean = false;
  isEmployee: boolean = false;

  // Track if this is the employee's own form
  isOwnForm: boolean = false;

  // Withdraw modal properties
  showWithdrawModal: boolean = false;
  withdrawPurpose: string = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    console.log('🚀 ExitFormComponent initialized');
    
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      console.log('📋 Query params:', params);
      
      // Get employeeId from params or localStorage
      this.employeeId = params['empId'] || localStorage.getItem('employeeId') || 'Unknown';
      this.employeeName = localStorage.getItem('username') || 'Unknown';
      this.role = localStorage.getItem('role') || 'Unknown';
      
      // Set role flags
      this.setRoleFlags(this.role);
      
      // Check if this is the employee's own form
      const loggedInEmployeeId = localStorage.getItem('employeeId');
      this.isOwnForm = this.employeeId === loggedInEmployeeId;
      
      console.log('👤 Employee ID:', this.employeeId);
      console.log('👤 Logged-in Employee ID:', loggedInEmployeeId);
      console.log('👤 Employee Name:', this.employeeName);
      console.log('🎭 Role:', this.role);
      console.log('👑 Is HR:', this.isHR);
      console.log('👔 Is Manager:', this.isManager);
      console.log('👤 Is Employee:', this.isEmployee);
      console.log('🤝 Is Own Form:', this.isOwnForm);
      
      // Check navigation state
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras.state as any;
      
      console.log('📦 Navigation state:', state);
      
      if (state) {
        this.fromManagerReview = state.fromManagerReview || false;
        this.fromHRReview = state.fromHRReview || false; // NEW: Get HR review flag
        this.allowEdit = state.allowEdit || false;
        this.managerAction = state.managerAction || '';
        this.hrAction = state.hrAction || ''; // NEW: Get HR action
        this.isWaiverAction = this.managerAction === 'waiver';
        this.isReviseLWDAction = this.hrAction === 'revise_lwd'; // NEW: Check for revise LWD
        this.preserveEmployeeName = state.preserveEmployeeName || false;
        this.originalEmployeeNameFromWaiver = state.originalEmployeeName || '';
        
        console.log('🎯 From Manager Review:', this.fromManagerReview);
        console.log('👥 From HR Review:', this.fromHRReview);
        console.log('✏️ Allow Edit:', this.allowEdit);
        console.log('📝 Manager Action:', this.managerAction);
        console.log('📋 HR Action:', this.hrAction);
        console.log('🔄 Is Waiver Action:', this.isWaiverAction);
        console.log('📅 Is Revise LWD Action:', this.isReviseLWDAction);
        console.log('🔒 Preserve Employee Name:', this.preserveEmployeeName);
        console.log('👤 Original Employee Name from Waiver:', this.originalEmployeeNameFromWaiver);
      }
      
      // Check if manager/HR is editing another employee's form
      const isEditingOtherEmployee = params['empId'] && 
                                    (this.isManager || this.isHR) && 
                                    params['empId'] !== localStorage.getItem('employeeId');
      
      console.log('🔍 Is Editing Other Employee:', isEditingOtherEmployee);
      
      // Force edit mode for waiver action or revise LWD action
      if (this.isWaiverAction || this.isReviseLWDAction) {
        console.log('🔧 FORCING EDIT MODE - Special action detected:', {
          isWaiverAction: this.isWaiverAction,
          isReviseLWDAction: this.isReviseLWDAction
        });
        
        this.isEditMode = true;
        this.isViewMode = false;
        this.fromManagerReview = this.fromManagerReview || this.isWaiverAction;
        this.fromHRReview = this.fromHRReview || this.isReviseLWDAction;
        
        if (params['newForm'] === 'true') {
          this.hasExistingForm = false;
          this.initializeNewForm();
        } else {
          this.checkAndFetchExistingForm();
        }
      } 
      else if (params['editMode'] === 'true' || params['newForm'] === 'true' || isEditingOtherEmployee) {
        console.log('🔧 ENTERING EDIT MODE - Conditions met:');
        console.log('- editMode param:', params['editMode']);
        console.log('- newForm param:', params['newForm']);
        console.log('- isEditingOtherEmployee:', isEditingOtherEmployee);
        
        this.isEditMode = true;
        this.isViewMode = false;
        this.fromManagerReview = this.fromManagerReview || isEditingOtherEmployee;
        
        if (params['newForm'] === 'true') {
          this.hasExistingForm = false;
          this.initializeNewForm();
        } else {
          this.checkAndFetchExistingForm();
        }
      } else if (state && state.formData) {
        // From view mode navigation
        console.log('✅ Loading from navigation state');
        this.isViewMode = state.viewMode;
        this.isEditMode = false;
        this.hasExistingForm = true;
        this.loadExistingForm(state.formData);
      } else {
        console.log('🔄 Checking for existing form via API');
        this.checkAndFetchExistingForm();
      }
    });
  }

  setRoleFlags(role: string) {
    const roleLower = role.toLowerCase();
    this.isHR = roleLower.includes('hr');
    this.isManager = roleLower.includes('manager') && !this.isHR;
    this.isEmployee = !this.isHR && !this.isManager;
  }

  checkAndFetchExistingForm() {
    if (this.employeeId && this.employeeId !== 'Unknown') {
      this.loading = true;
      console.log('🔍 Fetching form data for employee:', this.employeeId);
      
      this.apiService.getExitFormByEmployee(this.employeeId).subscribe({
        next: (formsArray) => {
          console.log('✅ API Response (Array):', formsArray);
          
          if (formsArray && formsArray.length > 0 && formsArray[0].employeeId) {
            console.log('✅ Valid existing form found in array');
            const existingForm = formsArray[0];
            this.loading = false;
            this.hasExistingForm = true;
            
            // If we're coming from special actions (waiver/revise LWD) or explicitly in edit mode, stay in edit mode
            if (this.isWaiverAction || this.isReviseLWDAction || this.isEditMode) {
              this.isViewMode = false;
              this.isEditMode = true;
            } else {
              // For regular viewing
              this.isViewMode = true;
              this.isEditMode = false;
            }
            
            console.log('🎛️ Final Mode:', {
              isViewMode: this.isViewMode,
              isEditMode: this.isEditMode,
              fromManagerReview: this.fromManagerReview,
              fromHRReview: this.fromHRReview,
              isWaiverAction: this.isWaiverAction,
              isReviseLWDAction: this.isReviseLWDAction
            });
            
            this.loadExistingForm(existingForm);
            this.formDataLoaded = true;
          } else {
            console.log('❌ No valid form data found, initializing new form');
            this.loading = false;
            this.hasExistingForm = false;
            this.isViewMode = false;
            this.isEditMode = true;
            this.initializeNewForm();
            this.formDataLoaded = true;
          }
        },
        error: (error) => {
          console.log('❌ API Error or no existing form found:', error);
          this.loading = false;
          this.hasExistingForm = false;
          this.isViewMode = false;
          this.isEditMode = true;
          this.initializeNewForm();
          this.formDataLoaded = true;
        }
      });
    } else {
      console.log('❌ No employeeId found, initializing new form');
      this.hasExistingForm = false;
      this.isViewMode = false;
      this.isEditMode = true;
      this.initializeNewForm();
      this.formDataLoaded = true;
    }
  }

  initializeNewForm() {
    console.log('🆕 Initializing new form');
    
    // Determine which employee name to use
    let employeeNameToUse = this.employeeName;
    
    // If coming from waiver/revise LWD with preserve flag, use original employee name
    if ((this.isWaiverAction || this.isReviseLWDAction) && this.preserveEmployeeName && this.originalEmployeeNameFromWaiver) {
      employeeNameToUse = this.originalEmployeeNameFromWaiver;
      console.log('👤 Using original employee name from action:', employeeNameToUse);
    }
    
    const today = this.formatDateForInput(new Date());

    this.exitForm = this.fb.group({
      employeeId: [{ value: this.employeeId, disabled: true }, Validators.required],
      employeeName: [{ value: employeeNameToUse, disabled: true }, Validators.required],
      noticeStartDate: [{ 
        value: today, 
        disabled: false
      }, Validators.required],
      reason: [{ value: '', disabled: false }, Validators.required],
      comments: [{ value: '', disabled: false }, Validators.required],
      noticePeriod: [{ value: 90, disabled: true }],
      noticeEndDate: [{ value: '', disabled: true }],
      attachment: [{ value: '', disabled: false }]
    });

    this.calculateNoticeEndDate(today);
    console.log('📝 New form initialized with employee name:', employeeNameToUse);
  }

  loadExistingForm(formData: ExitForm) {
    console.log('📥 Loading existing form data:', formData);
    
    if (!formData) {
      console.error('❌ Form data is null or undefined');
      this.initializeNewForm();
      return;
    }
    
    this.currentFormId = (formData as any).id || '';
    
    // Format dates for HTML date input
    let formattedStartDate = '';
    if (formData.noticeStartDate) {
      formattedStartDate = this.formatDateForInput(new Date(formData.noticeStartDate));
    }
    
    let formattedEndDate = '';
    if (formData.noticeEndDate) {
      formattedEndDate = this.formatDateForInput(new Date(formData.noticeEndDate));
    }
    
    // Determine which employee name to use
    let employeeNameToUse = formData.employeeName || this.employeeName;
    
    // If coming from waiver/revise LWD with preserve flag, use original employee name
    if ((this.isWaiverAction || this.isReviseLWDAction) && this.preserveEmployeeName && this.originalEmployeeNameFromWaiver) {
      employeeNameToUse = this.originalEmployeeNameFromWaiver;
      console.log('👤 Using original employee name from action:', employeeNameToUse);
    }
    
    // Always enable notice date in edit mode or special actions
    const canEditNoticeDate = this.isEditMode || this.isWaiverAction || this.isReviseLWDAction;
    
    // FIXED: Disable reason and comments for HR/Manager when NOT editing their own form
    // Only employee can edit their own reason and comments
    const canEditReasonAndComments = this.isOwnForm && this.isEditMode;
    
    // Other fields (like attachment) are editable for HR or employee editing own form
    const canEditOtherFields = (this.isHR && !this.isWaiverAction && !this.isReviseLWDAction) || 
                              (this.isOwnForm && this.isEditMode);

    console.log('🔐 Field Permissions:', {
      canEditNoticeDate: canEditNoticeDate,
      canEditReasonAndComments: canEditReasonAndComments,
      canEditOtherFields: canEditOtherFields,
      isHR: this.isHR,
      isManager: this.isManager,
      isOwnForm: this.isOwnForm,
      isEditMode: this.isEditMode,
      isWaiverAction: this.isWaiverAction,
      isReviseLWDAction: this.isReviseLWDAction,
      fromHRReview: this.fromHRReview,
      employeeNameBeingUsed: employeeNameToUse
    });

    this.exitForm = this.fb.group({
      employeeId: [{ value: formData.employeeId || this.employeeId, disabled: true }, Validators.required],
      employeeName: [{ value: employeeNameToUse, disabled: true }, Validators.required],
      noticeStartDate: [{ 
        value: formattedStartDate, 
        disabled: !canEditNoticeDate
      }, Validators.required],
      reason: [{ 
        value: formData.reason || '', 
        disabled: !canEditReasonAndComments // FIXED: Only employee can edit
      }, Validators.required],
      comments: [{ 
        value: formData.comments || '', 
        disabled: !canEditReasonAndComments // FIXED: Only employee can edit
      }, Validators.required],
      noticePeriod: [{ value: formData.noticePeriod || 90, disabled: true }],
      noticeEndDate: [{ value: formattedEndDate, disabled: true }],
      attachment: [{ 
        value: formData.attachment || '', 
        disabled: !canEditOtherFields
      }]
    });

    if (formData.attachment) {
      this.selectedFileName = formData.attachment;
    }
    
    // Calculate end date if notice date is editable
    if (canEditNoticeDate && formattedStartDate) {
      this.calculateNoticeEndDate(formattedStartDate);
    }
    
    console.log('✅ Form loaded with data');
    console.log('📅 Is Notice Date Disabled?', this.exitForm.get('noticeStartDate')?.disabled);
    console.log('📝 Is Reason Disabled?', this.exitForm.get('reason')?.disabled);
    console.log('💬 Is Comments Disabled?', this.exitForm.get('comments')?.disabled);
    this.formDataLoaded = true;
  }

  // Helper method to format date for HTML date input (YYYY-MM-DD)
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  calculateNoticeEndDate(startDate: string) {
    if (!startDate) return;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 90);

    const endDateString = this.formatDateForInput(end);
    this.exitForm.get('noticeEndDate')?.setValue(
      endDateString,
      { emitEvent: false }
    );
    
    console.log('📅 Calculated notice end date:', endDateString);
  }

  // Check if notice date is editable
  isNoticeDateEditable(): boolean {
    // HR, Manager in waiver/revise LWD actions, or employee editing own form can edit notice date
    const isEditable = (this.isHR && (this.isWaiverAction || this.isReviseLWDAction)) ||
                      (this.isManager && this.isWaiverAction) ||
                      (this.isOwnForm && this.isEditMode);
    
    console.log('🔍 isNoticeDateEditable check:', {
      result: isEditable,
      isHR: this.isHR,
      isManager: this.isManager,
      isOwnForm: this.isOwnForm,
      isEditMode: this.isEditMode,
      isWaiverAction: this.isWaiverAction,
      isReviseLWDAction: this.isReviseLWDAction
    });
    
    return isEditable;
  }

  // FIXED: Check if reason and comments are editable
  isReasonAndCommentsEditable(): boolean {
    // ONLY the employee can edit their own reason and comments
    // HR and Manager CANNOT edit these fields (not even in regular mode)
    const isEditable = this.isOwnForm && this.isEditMode;
    
    console.log('🔍 isReasonAndCommentsEditable check:', {
      result: isEditable,
      isOwnForm: this.isOwnForm,
      isEditMode: this.isEditMode,
      isHR: this.isHR,
      isManager: this.isManager,
      fromHRReview: this.fromHRReview
    });
    
    return isEditable;
  }

  // Check if other fields are editable
  areOtherFieldsEditable(): boolean {
    // Only HR (not in waiver/revise mode) or employee editing own form can edit other fields
    const isEditable = (this.isHR && !this.isWaiverAction && !this.isReviseLWDAction) || 
                      (this.isOwnForm && this.isEditMode);
    
    console.log('🔍 areOtherFieldsEditable check:', {
      result: isEditable,
      isHR: this.isHR,
      isWaiverAction: this.isWaiverAction,
      isReviseLWDAction: this.isReviseLWDAction,
      isOwnForm: this.isOwnForm,
      isEditMode: this.isEditMode
    });
    
    return isEditable;
  }

  canWithdraw(): boolean {
    // HR, Manager, and Employee can all withdraw their own forms in view mode
    return this.hasExistingForm && 
           this.isOwnForm && 
           !this.withdrawing && 
           !this.isEditMode;
  }

  // Open withdraw modal
  openWithdrawModal() {
    if (!this.canWithdraw()) {
      console.warn('You cannot withdraw this form');
      return;
    }
    this.showWithdrawModal = true;
    this.withdrawPurpose = '';
  }

  // Close withdraw modal
  closeWithdrawModal() {
    this.showWithdrawModal = false;
    this.withdrawPurpose = '';
  }

  // Confirm withdraw
  confirmWithdraw(): void {
  console.log('🔴🔴🔴 CONFIRM WITHDRAW METHOD CALLED! 🔴🔴🔴');
  console.log('📋 Form ID:', this.currentFormId);
  console.log('📝 Withdraw Purpose from textarea:', this.withdrawPurpose);
  
  if (!this.currentFormId) {
    console.error('❌ No form ID found!');
    alert('Error: No form ID found. Please refresh and try again.');
    return;
  }

  // Store the purpose in a local variable to ensure it's not cleared
  const purposeToSend = this.withdrawPurpose;
  console.log('📤 Purpose being sent to API (local variable):', purposeToSend);

  this.withdrawing = true;
  this.closeWithdrawModal();

  // Call API with the local variable, NOT this.withdrawPurpose
  this.apiService.withdrawExitForm(this.currentFormId, purposeToSend).subscribe({
    next: (response: any) => {
      console.log('✅ API Response received:', response);
      
      if (response && response.success) {
        // Show what was saved
        const savedPurpose = response.withdrawPurpose;
        const message = savedPurpose 
          ? `✅ Exit form withdrawn successfully!\nReason: "${savedPurpose}"`
          : '✅ Exit form withdrawn successfully!';
        
        alert(message);
        
        // Reset state
        this.withdrawing = false;
        this.hasExistingForm = false;
        this.isViewMode = false;
        this.isEditMode = false;
        this.currentFormId = '';
        this.withdrawPurpose = '';
        
        // Navigate to dashboard
        this.router.navigate(['/dashboard/exit-page']);
      } else {
        throw new Error(response?.message || 'Withdraw failed');
      }
    },
    error: (error) => {
      console.error('❌ Withdraw error:', error);
      alert('❌ Failed to withdraw: ' + (error.error?.message || error.message || 'Unknown error'));
      this.withdrawing = false;
    }
  });
}

  keepOpen(event: MouseEvent, type: string) {
    if (this.isViewMode || !this.isReasonAndCommentsEditable()) return;
    
    event.stopPropagation();
    this.openDropdown = type;
  }

  closeDropdowns() {
    this.openDropdown = null;
  }

  onFileSelected(event: any) {
    if (this.isViewMode || !this.areOtherFieldsEditable()) return;
    
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.exitForm.patchValue({ attachment: file.name });
    }
  }

  onDateChange(event: any) {
    if (!this.isNoticeDateEditable()) {
      console.log('⚠️ Date change blocked - field not editable');
      return;
    }
    
    const selectedDate = event.target.value;
    console.log('📅 Date changed to:', selectedDate);
    this.calculateNoticeEndDate(selectedDate);
  }

  submitForm() {
    if (!this.isEditMode) {
      console.log('⚠️ Submit blocked - not in edit mode');
      return;
    }
    
    if (this.exitForm.invalid) {
      console.warn("Please fill all required fields.");
      return;
    }

    this.isSubmitting = true;

    // Get the employee name from the form (which should be the original name for waiver/revise LWD)
    const formEmployeeName = this.exitForm.get('employeeName')?.value || this.employeeName;

    const formData = {
      employeeId: this.employeeId,
      employeeName: formEmployeeName, // Use the name from form (original for special actions)
      noticeStartDate: this.exitForm.get('noticeStartDate')?.value,
      noticeEndDate: this.exitForm.get('noticeEndDate')?.value,
      reason: this.exitForm.get('reason')?.value,
      comments: this.exitForm.get('comments')?.value,
      noticePeriod: 90,
      attachment: this.selectedFileName || ''
    };

    console.log("🚀 Exit Form Payload:", formData);
    console.log("👔 User Role:", this.role);
    console.log("📋 Current Form ID:", this.currentFormId);
    console.log("🔄 Is Waiver Action:", this.isWaiverAction);
    console.log("📅 Is Revise LWD Action:", this.isReviseLWDAction);
    console.log("👥 From HR Review:", this.fromHRReview);
    console.log("👤 Employee Name in Payload:", formData.employeeName);

    if (this.hasExistingForm && this.currentFormId) {
      // Update existing form
      this.apiService.updateExitForm(this.currentFormId, formData).subscribe({
        next: (response) => {
          console.log("✅ Exit form updated:", response);
          
          // For waiver/revise LWD actions, don't show any message - just navigate back
          if (this.isWaiverAction || this.isReviseLWDAction) {
            console.log("📝 Notice start date updated (silent)");
            this.isSubmitting = false;
            this.location.back();
            return;
          }
          
          // Show success message only for non-special actions
          if (this.isHR) {
            console.log("📝 Exit form updated successfully!");
          } else if (this.isManager) {
            console.log("📝 Notice start date updated successfully!");
          } else if (this.isEmployee) {
            console.log("📝 Your exit form has been updated!");
          }
          
          this.isSubmitting = false;
          
          // Navigate back after successful update
          if (this.isHR || this.isManager) {
            this.location.back();
          } else {
            this.router.navigate(['/dashboard/exit-page']);
          }
        },
        error: (error) => {
          console.error("❌ Error updating exit form:", error);
          console.warn("Failed to update exit form. Please try again.");
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new form
      this.apiService.createExitForm(formData).subscribe({
        next: (response) => {
          console.log("✅ Exit form created:", response);
          
          // For waiver/revise LWD actions, don't show any message - just navigate back
          if (this.isWaiverAction || this.isReviseLWDAction) {
            console.log("📝 Exit form created with updated notice date (silent)");
            this.isSubmitting = false;
            this.location.back();
            return;
          }
          
          // Show success message only for non-special actions
          if (this.isHR || this.isManager) {
            console.log("📝 Exit form created successfully for employee!");
          } else if (this.isEmployee) {
            console.log("📝 Your exit form has been submitted!");
          }
          
          this.isSubmitting = false;
          
          if (this.isHR || this.isManager) {
            this.location.back();
          } else {
            this.router.navigate(['/dashboard/exit-page']);
          }
        },
        error: (error) => {
          console.error("❌ Error submitting exit form:", error);
          console.warn("Failed to submit exit form. Please try again.");
          this.isSubmitting = false;
        }
      });
    }
  }

  cancelEdit() {
    console.log('Cancelling edit');
    this.location.back();
  }

  goBack() {
    this.location.back();
  }
}