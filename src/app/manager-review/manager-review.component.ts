import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager-review',
  templateUrl: './manager-review.component.html',
  styleUrls: ['./manager-review.component.css']
})
export class ManagerReviewComponent implements OnInit {
  @Input() exitFormId!: string;
  @Input() employeeId!: string;
  @Output() submitted = new EventEmitter<any>();

  managerReviewForm!: FormGroup;
  existingReview: any = null;
  employeeName: string = 'Employee';
  selectedAction: string = '';
  submittedAction: string = ''; // Track which action was actually submitted

  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  hasExistingData = false;
  isSubmitted = false; // New flag to track submission status

  performanceOptions = ['Very Good', 'Good', 'Average', 'Poor'];
  ktOptions = ['Completed', 'In Progress', 'Not Started'];
  yesNoOptions = ['Yes', 'No'];
  expandedField: string | null = null;

  // Store the display value for notice period
  noticePeriodDisplay: string = 'Click to select';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadReviewData();
  }

  initializeForm(): void {
    this.managerReviewForm = this.fb.group({
      performance: ['', Validators.required],
      projectDependency: ['', Validators.required],
      knowledgeTransfer: ['', Validators.required],
      noticePeriod: ['', Validators.required],
      remarks: [''],
      purposeOfChange: ['']
    });

    // Listen to notice period changes to update display
    this.managerReviewForm.get('noticePeriod')?.valueChanges.subscribe(value => {
      if (value === 'Yes' && this.isSubmitted && !this.isEditMode && this.managerReviewForm.get('remarks')?.value?.trim()) {
        this.noticePeriodDisplay = 'Yes';
      } else if (value) {
        this.noticePeriodDisplay = value;
      } else {
        this.noticePeriodDisplay = 'Click to select';
      }
    });
  }

  loadReviewData(): void {
    if (!this.employeeId) {
      console.warn('No employeeId provided');
      return;
    }

    this.isLoading = true;
    console.log('Loading review data for employeeId:', this.employeeId);

    this.apiService.getManagerReviewsByEmployee(this.employeeId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('API Response:', response);

        // Check if response has data array and it's not empty
        if (response && response.data && response.data.length > 0 && response.data[0].employeeId) {
          console.log('Found existing review:', response.data[0]);
          this.existingReview = response.data[0];
          this.hasExistingData = true;
          this.isSubmitted = true; // Set submitted flag
          
          // Get employee name from review data
          this.employeeName = this.existingReview.employeeName || 'Employee';
          
          // Get selected action from the actual data
          this.selectedAction = this.existingReview.managerAction || '';
          this.submittedAction = this.existingReview.managerAction || '';

          console.log('Employee Name:', this.employeeName);
          console.log('Selected Action:', this.selectedAction);
          console.log('Submitted Action:', this.submittedAction);
          
          this.fillForm(this.existingReview);
          this.managerReviewForm.markAllAsTouched();
          
          // Disable form when data exists and not in edit mode
          if (this.hasExistingData && !this.isEditMode) {
            this.managerReviewForm.disable();
          }
        } else {
          console.log('No existing review found');
          this.hasExistingData = false;
          this.isSubmitted = false;
          this.selectedAction = '';
          this.submittedAction = '';
          this.noticePeriodDisplay = 'Click to select';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasExistingData = false;
        this.isSubmitted = false;
        this.selectedAction = '';
        this.submittedAction = '';
        this.noticePeriodDisplay = 'Click to select';
        console.error('Error loading review data:', error);
      }
    });
  }

  fillForm(review: any): void {
    console.log('Filling form with review data:', review);
    
    // Handle projectDependency conversion - it's a string "0" or "1" in your response
    let projectDep = 'No';
    if (review.projectDependency === "1" || 
        review.projectDependency === 1 || 
        review.projectDependency === true || 
        review.projectDependency === 'Yes') {
      projectDep = 'Yes';
    }
    
    // Handle noticePeriod conversion
    let noticePeriod = 'No';
    let hasRemarks = false;
    if (review.managerNoticeperiod === 90 || 
        review.noticePeriod === 90 || 
        review.managerNoticeperiod === "90" ||
        review.managerNoticeperiod === "Yes") {
      noticePeriod = 'Yes';
      hasRemarks = true;
    }
    
    // Get remarks
    const remarks = review.managerRemarks || '';

    // Update display value for notice period
    if (noticePeriod === 'Yes' && remarks.trim() && this.isSubmitted && !this.isEditMode) {
      this.noticePeriodDisplay = 'Yes ';
    } else if (noticePeriod) {
      this.noticePeriodDisplay = noticePeriod;
    }

    console.log('Converted values:', {
      performance: review.performance,
      projectDependency: projectDep,
      knowledgeTransfer: review.knowledgeTransfer,
      noticePeriod: noticePeriod,
      remarks: remarks,
      hasRemarks: hasRemarks
    });

    this.managerReviewForm.patchValue({
      performance: review.performance || '',
      projectDependency: projectDep,
      knowledgeTransfer: review.knowledgeTransfer || '',
      noticePeriod: noticePeriod,
      remarks: remarks,
      purposeOfChange: review.purposeOfChange || ''
    });
  }

  toggleField(field: string): void {
    if (field === 'noticePeriod' && this.isSubmitted && !this.isEditMode && 
        this.managerReviewForm.get('noticePeriod')?.value === 'Yes' && 
        this.managerReviewForm.get('remarks')?.value?.trim()) {
      // For submitted view mode with remarks, auto-expand to show comments
      this.expandedField = this.expandedField === field ? null : field;
    } else if (this.isSubmitted && !this.isEditMode) {
      return; // Don't allow toggling in view mode
    } else {
      this.expandedField = this.expandedField === field ? null : field;
    }
  }

  onOptionChange(field: string, value: string): void {
    if (this.isSubmitted && !this.isEditMode) return;
    this.managerReviewForm.patchValue({ [field]: value });

    if (field === 'noticePeriod') {
      if (value === 'No') {
        this.managerReviewForm.patchValue({ remarks: '' });
      }
      // Update display
      if (value === 'Yes' && this.isSubmitted && !this.isEditMode && this.managerReviewForm.get('remarks')?.value?.trim()) {
        this.noticePeriodDisplay = 'Yes ';
      } else {
        this.noticePeriodDisplay = value || 'Click to select';
      }
    }
  }

  enableEdit(): void {
    this.isEditMode = true;
    this.isSubmitted = false; // Allow editing
    this.selectedAction = ''; // Clear action so user must reselect
    this.managerReviewForm.enable(); // Enable form for editing
    
    // Reset notice period display for edit mode
    const noticePeriodValue = this.managerReviewForm.get('noticePeriod')?.value;
    if (noticePeriodValue) {
      this.noticePeriodDisplay = noticePeriodValue;
    }
    
    // Auto-expand the notice period field if there are remarks
    if (noticePeriodValue === 'Yes' && this.managerReviewForm.get('remarks')?.value?.trim()) {
      this.expandedField = 'noticePeriod';
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    if (this.existingReview) {
      this.fillForm(this.existingReview);
      this.selectedAction = this.existingReview.managerAction || '';
      this.isSubmitted = true; // Back to submitted state
      this.managerReviewForm.disable(); // Disable form again
      this.expandedField = null; // Collapse all fields
    }
  }

  // Check if form fields are valid (without checking action)
  isFormValid(): boolean {
    const v = this.managerReviewForm.value;

    // Check all 4 required fields
    const fieldsValid = !!(v.performance && v.projectDependency && v.knowledgeTransfer && v.noticePeriod);
    
    // Check notice period remarks if applicable
    const noticeRemarksValid = v.noticePeriod === 'No' || (v.noticePeriod === 'Yes' && v.remarks?.trim());
    
    // Check purpose of change if in edit mode
    const purposeValid = !this.isEditMode || v.purposeOfChange?.trim();
    
    return fieldsValid && noticeRemarksValid && purposeValid;
  }

  // Check if everything is valid (including action)
  isEverythingValid(): boolean {
    return this.isFormValid() && !!this.selectedAction;
  }

  // Keep the old isValid method for backward compatibility
  isValid(): boolean {
    return this.isEverythingValid();
  }

  // Check if fields should be disabled
  isFieldDisabled(): boolean {
    return this.isSubmitted && !this.isEditMode;
  }

  // Check if field should be clickable
  isFieldClickable(): boolean {
    return !this.isSubmitted || this.isEditMode;
  }

  // Enable buttons when form is valid (action can be selected after)
  isActionSelectable(): boolean {
    return !this.isSubmitting && this.isFormValid();
  }

  // NEW: Completely disable ALL action buttons when submitted and not editing
  isActionDisabled(action: string): boolean {
    // When review is submitted and NOT in edit mode → BLOCK ALL BUTTON CLICKS
    if (this.isSubmitted && !this.isEditMode) {
      return true;  // ← This disables ALL 4 buttons completely
    }

    // Otherwise: normal behavior (disable if form invalid or submitting)
    return this.isSubmitting || !this.isFormValid();
  }

  // Check if a specific action button should be highlighted
  isActionHighlighted(action: string): boolean {
    if (this.isSubmitted && !this.isEditMode) {
      // In view mode, highlight only the submitted action
      return action === this.submittedAction;
    } else {
      // In edit mode or new review, highlight the selected action
      return action === this.selectedAction;
    }
  }

  submitAction(action: string): void {
    // Set the selected action first
    this.selectedAction = action;
    this.submittedAction = action; // Track submitted action
    
    // Now check if everything is valid
    if (!this.isEverythingValid()) {
      alert('Please complete all required fields.');
      return;
    }

    if (action === 'Recommend Notice Period Waiver') {
      // Check if form exists first
      this.apiService.getExitFormByEmployee(this.employeeId).subscribe({
        next: (formsArray) => {
          if (formsArray && formsArray.length > 0) {
            // Form exists, navigate with edit mode
            this.router.navigate(['/dashboard/exit-form'], {
              queryParams: { 
                empId: this.employeeId, 
                formId: this.exitFormId,
                editMode: 'true'
              },
              state: { 
                fromManagerReview: true, 
                allowEdit: true,
                managerAction: 'waiver'
              }
            });
          } else {
            // No form exists, create a new one
            this.router.navigate(['/exit-form'], {
              queryParams: { 
                empId: this.employeeId, 
                formId: this.exitFormId,
                newForm: 'true'
              },
              state: { 
                fromManagerReview: true, 
                allowEdit: true,
                managerAction: 'waiver'
              }
            });
          }
        },
        error: () => {
          // On error, navigate to create new form
          this.router.navigate(['/exit-form'], {
            queryParams: { 
              empId: this.employeeId, 
              formId: this.exitFormId,
              newForm: 'true'
            },
            state: { 
              fromManagerReview: true, 
              allowEdit: true,
              managerAction: 'waiver'
            }
          });
        }
      });
      return;
    }

    // For other actions (Approve, Reject, On-Hold), submit the manager review
    this.isSubmitting = true;
    const formValue = this.managerReviewForm.value;

    console.log('Form values:', formValue);
    console.log('Selected action:', action);
    console.log('Exit Form ID:', this.exitFormId);

    // Prepare payload based on your API structure
    const payload: any = {
      id: this.exitFormId, // This should be the exit form ID
      employeeId: this.employeeId,
      performance: formValue.performance,
      projectDependency: formValue.projectDependency === 'Yes' ? "1" : "0",
      knowledgeTransfer: formValue.knowledgeTransfer,
      managerNoticeperiod: formValue.noticePeriod === 'Yes' ? "90" : "0",
      managerRemarks: formValue.noticePeriod === 'Yes' ? formValue.remarks : null,
      managerAction: action,
      managerName: localStorage.getItem('username') || 'Manager'
    };

    // For edit mode, add purpose of change
    if (this.isEditMode) {
      payload.purposeOfChange = formValue.purposeOfChange;
    }

    console.log('Submitting payload:', payload);

    // Determine which API call to make
    let request$;
    if (this.hasExistingData && this.existingReview?.id) {
      console.log('Updating existing review with ID:', this.existingReview.id);
      // Use update API - you might need to adjust the endpoint
      request$ = this.apiService.updateManagerReview(this.exitFormId, payload);
    } else {
      console.log('Creating new review');
      // Use create API - note: your endpoint is /manager/create
      request$ = this.apiService.submitManagerReview(payload);
    }

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        console.log('API Response:', res);
        
        if (res?.success || res?.status === 'success') {
          alert(`Review ${action} successfully!`);
          this.hasExistingData = true;
          this.isSubmitted = true; // Set submitted flag
          this.isEditMode = false;
          this.submittedAction = action; // Keep track of submitted action
          
          // Update notice period display if applicable
          if (formValue.noticePeriod === 'Yes' && formValue.remarks?.trim()) {
            this.noticePeriodDisplay = 'Yes ';
          } else if (formValue.noticePeriod) {
            this.noticePeriodDisplay = formValue.noticePeriod;
          }
          
          this.managerReviewForm.disable(); // Disable form after submission
          this.loadReviewData(); // Reload to get updated data
          this.submitted.emit({ success: true, action });
        } else {
          const errorMsg = res?.message || res?.error || 'Unknown error';
          console.error('Submission failed with response:', res);
          alert('Failed: ' + errorMsg);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Submission failed with error:', error);
        
        // More detailed error message
        let errorMsg = 'Submission failed';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error.error) {
            errorMsg = error.error.error;
          }
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        alert('Submission failed: ' + errorMsg);
      }
    });
  }

  getDisplayValue(field: string): string {
    if (field === 'noticePeriod') {
      return this.noticePeriodDisplay;
    }
    const value = this.managerReviewForm.get(field)?.value;
    return value || 'Click to select';
  }

  shouldShowUpdateButton(): boolean {
    return this.isSubmitted && !this.isEditMode;
  }

  getFormTitle(): string {
    if (this.isEditMode) return 'Update Manager Review';
    if (this.isSubmitted) return 'Manager Review (Submitted)';
    return 'Manager Review';
  }

  // Helper method to check if action is selected
  isActionSelected(action: string): boolean {
    if (this.isSubmitted && !this.isEditMode) {
      // In view mode, show the submitted action
      return this.submittedAction === action;
    } else {
      // In edit mode or new review, show currently selected action
      return this.selectedAction === action;
    }
  }

  // Check if card is disabled (for gray effect)
  isCardDisabled(): boolean {
    return this.isSubmitted && !this.isEditMode;
  }

  // Check if remarks should be visible (when notice period is Yes and not in edit mode)
  shouldShowRemarks(): boolean {
    return this.managerReviewForm.get('noticePeriod')?.value === 'Yes';
  }

  // Check if remarks field should be read-only
  isRemarksReadonly(): boolean {
    return this.isSubmitted && !this.isEditMode;
  }

  // Get remarks placeholder
  getRemarksPlaceholder(): string {
    if (this.isSubmitted && !this.isEditMode) {
      return 'No comments provided';
    }
    return 'Enter notice period details...';
  }

  // Check if notice period should show "click to see comments" hint
  shouldShowCommentsHint(): boolean {
    return this.isSubmitted && !this.isEditMode && 
           this.managerReviewForm.get('noticePeriod')?.value === 'Yes' && 
           this.managerReviewForm.get('remarks')?.value?.trim() &&
           this.expandedField !== 'noticePeriod';
  }
}