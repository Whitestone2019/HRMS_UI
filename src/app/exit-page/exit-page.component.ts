import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ApiService, ExitForm, ManagerReview, HRReview } from '../api.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { HrOffboardingChecklistComponent } from '../hr-offboarding-checklist/hr-offboarding-checklist.component';

interface ChecklistItem {
  checked: boolean;
  comment: string;
}

interface Checklist {
  noticePeriod: ChecklistItem;
  leaveBalances: ChecklistItem;
  policyCompliance: ChecklistItem;
  exitEligibility: ChecklistItem;
}

type ChecklistKey = keyof Checklist;

interface HRReviewPayload {
  formId?: string;
  hrNoticePeriod: boolean;
  hrLeaveBalances: boolean;
  hrPolicyCompliance: boolean;
  hrExitEligibility: boolean;
  hrNoticePeriodComments: string;
  hrLeaveBalancesComments: string;
  hrPolicyComplianceComments: string;
  hrExitEligibilityComments: string;
  hrGeneralComments: string;
  hrAction: string;
  hrName?: string;
  hrReviewDate?: string;
  employeeId?: string;
  employeeName?: string;
  verificationRound?: number;
}

interface AssetClearanceItem {
  label: string;
  status: string;
  remarks: string;
}

@Component({
  selector: 'app-exit-page',
  templateUrl: './exit-page.component.html',
  styleUrls: ['./exit-page.component.css']
})
export class ExitPageComponent implements OnInit, OnDestroy {
  exitForms: ExitForm[] = [];
  allExitForms: ExitForm[] = [];
  managerReview: ManagerReview | null = null;
  hrReview: HRReview | null = null;
  loading = false;
  loadingReview = false;
  loadingHRReview = false;
  employeeId: string = '';
  viewingEmployee: string = '';
  currentUserRole: string = '';
  isHRUser: boolean = false;
  isCEOUser: boolean = false; // 🟢 NEW: CEO flag
  
  reviewData: any = {
    performance: '',
    projectDependency: '',
    knowledgeTransfer: '',
    noticePeriod: '',
    remarks: ''
  };

  showUserForm: boolean = false;
  showManagerReviewForm: boolean = false;
  showFinalHRForm: boolean = false;

  performanceOptions: string[] = ['Excellent', 'Good', 'Average', 'Poor'];
  yesNoOptions: string[] = ['Yes', 'No'];
  knowledgeTransferOptions: string[] = ['Completed', 'In Progress', 'Not Started'];
  expandedField: string = '';
  submitting: boolean = false;
  currentAction: string = '';

  checkList: Checklist = {
    noticePeriod: { checked: false, comment: '' },
    leaveBalances: { checked: false, comment: '' },
    policyCompliance: { checked: false, comment: '' },
    exitEligibility: { checked: false, comment: '' }
  };

  generalComments: string = "";
  hrAction: string = '';
  hrSubmitting = false;
  hrErrorMessage: string = '';
  isUpdateMode = false;
  existingHRReviewId: number | null = null;

  deleting = false;
  isEditMode = false;
  showPurpose = false;

  hrActionOptions = ['APPROVE', 'REVISE_LWD', 'REJECT'];
  employeeReportingManager: string = '';
  employeeData: any = null;
  showHRView = false;
  currentHRStep: number | null = null;
  selectedFormForHR: any = null;
  showHRVerificationForm = false;
  showHROffboardingInline = false;
  directReports: any[] = [];
  showManagerView = false;
  
  hrDashboardData: any = {
    totalForms: 0,
    pendingHRAction: 0,
    approvedForms: 0,
    rejectedForms: 0,
    onHoldForms: 0
  };

  showAssetClearanceForm: boolean = false;
  selectedFormForAssetClearance: any = null;
  assetClearanceData: AssetClearanceItem[] = [];
  loadingAssetClearance: boolean = false;
  receivedFormId: string = '';

  assetStatusOptions = ['Good', 'Damaged', 'Missing', 'Not Applicable'];

  isUserFormDisabled = false;
  isManagerFormDisabled = false;
  isHRFormDisabled = false;
  isAssetFormDisabled = false;
  isAssetViewOnly = false;

  showHROffboardingForm = false;
  selectedFormForHROffboarding: any = null;
  showPayrollCheckForm = false;
  selectedFormForPayroll: ExitForm | null = null;
  selectedFormForFinalHR: ExitForm | null = null;
  
  currentStepCard: number | null = null;

  // 🟢 NEW: HR View flags for CEO access
  showManagerReviewFormForHR: boolean = false;
  showAssetClearanceFormForHR: boolean = false;
  showPayrollCheckFormForHR: boolean = false;
  showFinalHRFormForHR: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.autoOpenPendingStep();
    }, 800);
  }

  ngOnInit(): void {
    const navState = history.state;
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.currentUserRole = localStorage.getItem('role') || '';
    
    // 🟢 UPDATED: Check for CEO role
    const roleUpper = this.currentUserRole.toUpperCase();
    this.isHRUser = roleUpper === 'R003' || roleUpper.includes('HR');
    this.isCEOUser = roleUpper === 'CEO' || roleUpper === 'R001'; // Assuming R001 is CEO role code
    
    if (navState && navState.employeeId) {
      this.viewingEmployee = navState.employeeId;
      if (navState.formId) {
        this.receivedFormId = navState.formId;
      }
    } else {
      this.viewingEmployee = this.employeeId;
    }

    if (!this.employeeId) {
      console.error('No current user employeeId found in localStorage');
      return;
    }

    setTimeout(() => {
      this.fetchExitForms();
      this.fetchManagerReview();
      this.fetchEmployeeData();
      if (this.isSystemAdmin()) {
        setTimeout(() => {
          this.debugSystemAdminAccess();
        }, 800);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🟢 UPDATED: Check if user is HR or CEO
  isHR(): boolean {
    const role = (this.currentUserRole || '').toUpperCase();
    return this.isHRUser || this.isCEOUser || role.includes('HR') || role === 'R003' || role === 'CEO' || role === 'R001';
  }

  // 🟢 UPDATED: Check if user can act as HR (includes CEO)
  canActAsHR(): boolean {
    return this.isHR() || this.isCEOUser;
  }

  // 🟢 UPDATED: Should show HR verification form (for HR and CEO)
  shouldShowHRVerificationForm(): boolean {
    return this.showHRVerificationForm && this.canActAsHR();
  }

  shouldDisableForm(formType: string): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    const hasExistingData = this.checkExistingData(formType);
    
    return hasExistingData || this.isFormCompleted(status, formType);
  }

  private checkExistingData(formType: string): boolean {
    switch (formType) {
      case 'user':
        return !!this.getFirstForm();
      case 'manager':
        return !!this.managerReview;
      case 'hr':
        return !!this.hrReview;
      case 'asset':
        return this.assetClearanceData.some(item => item.status !== '');
      default:
        return false;
    }
  }

  private isFormCompleted(status: number, formType: string): boolean {
    switch (formType) {
      case 'user':
        return status > 0;
      case 'manager':
        return status >= 1;
      case 'hr':
        return (status === 2 || status === 4 || status === 6 || status === 8);
      case 'asset':
        return status >= 3;
      default:
        return false;
    }
  }

  isAssetClearanceEditable(): boolean {
    if (!this.selectedFormForAssetClearance) return false;
    const status = this.getFormStatus(this.selectedFormForAssetClearance);
    
    const isEditable = this.isSystemAdmin() && status === 2;
    this.isAssetFormDisabled = !isEditable;
    this.isAssetViewOnly = !isEditable;
    return isEditable;
  }

  isManagerFormEditable(): boolean {
    if (!this.canEditManagerReview()) {
      this.isManagerFormDisabled = true;
      return false;
    }

    const form = this.getFirstForm();
    if (!form) {
      this.isManagerFormDisabled = true;
      return false;
    }

    const status = this.getFormStatus(form);
    const isEditable = status === 0 || (status === 1 && this.isEditMode);

    this.isManagerFormDisabled = !isEditable;
    
    return isEditable;
  }

  isHRFormEditable(): boolean {
    if (!this.canActAsHR()) return false;
    
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    const isEditable = (status === 1 || status === 3) && !this.isHRFormCompleted();
    this.isHRFormDisabled = !isEditable;
    return isEditable;
  }

  private isHRFormCompleted(): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    return (status === 2 || status === 4 || status === 6 || status === 8);
  }

  isUserFormEditable(): boolean {
    const form = this.getFirstForm();
    if (!form) return true;
    
    const status = this.getFormStatus(form);
    const isEditable = status === 0;
    this.isUserFormDisabled = !isEditable;
    return isEditable;
  }

  private deduplicateForms(forms: any[]): any[] {
    if (!forms || !Array.isArray(forms)) return [];

    const seen = new Map<string, any>();
    const result: any[] = [];

    forms.forEach(form => {
      const id = this.getFormUniqueId(form);
      if (id && !seen.has(id)) {
        seen.set(id, form);
        result.push(form);
      } else if (!id) {
        result.push(form);
      }
    });

    return result;
  }

  private getFormUniqueId(form: any): string {
    if (!form) return '';
    
    const candidates = [
      form.id,
      form.formId,
      form.exitFormId,
      form.ID,
      form.FORM_ID,
      form.formID
    ];
    
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        return candidate.toString().trim();
      }
    }
    
    const compositeKey = `${form.employeeId}-${form.createdDate || form.createdOn || form.submittedDate || ''}-${form.employeeName || ''}`;
    return compositeKey;
  }

  private fetchExitFormsByEmployeeFallback(employeeId: string) {
    this.apiService.getExitFormsByEmployee(employeeId).subscribe({
      next: (resp: any) => {
        let forms: any[] = [];
        
        if (resp?.success && Array.isArray(resp.data)) {
          forms = this.deduplicateForms(resp.data);
        } else if (Array.isArray(resp)) {
          forms = this.deduplicateForms(resp);
        }
        
        this.exitForms = forms;
        this.allExitForms = forms;
        
        this.handleFormSelectionFromNavigation();
        this.fetchManagerReview();
        this.fetchEmployeeData();
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        console.error('Fallback SA getExitFormsByEmployee error:', err);
        this.exitForms = [];
        this.cdRef.detectChanges();
      }
    });
  }

  fetchExitForms() {
    this.loading = true;
    const requesterId = this.employeeId;

    this.exitForms = [];
    this.allExitForms = [];

    // 🟢 UPDATED: CEO should see all forms like HR
    if (this.isPayrollUser() || this.isCEOUser) {
      console.log('🟢 CEO/ACC/Payroll user detected, loading all forms');
      this.apiService.getAllActiveExitForms().subscribe({
        next: (response: any) => {
          this.loading = false;
          const arr = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
          
          const uniqueForms = this.deduplicateForms(arr);
          this.allExitForms = uniqueForms;
          
          if (this.viewingEmployee) {
            this.exitForms = this.filterFormsByEmployeeId(uniqueForms, this.viewingEmployee);
          } else {
            // 🟢 UPDATED: CEO sees pending forms like HR
            if (this.isCEOUser) {
              this.exitForms = uniqueForms.filter((f: any) => 
                this.getFormStatus(f) === 1 || this.getFormStatus(f) === 3 || this.getFormStatus(f) === 5
              );
            } else {
              this.exitForms = uniqueForms.filter((f: any) => this.getFormStatus(f) === 4);
            }
          }
          
          this.handleFormSelectionFromNavigation();
          this.fetchManagerReview();
          this.fetchEmployeeData();
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          console.error('CEO/ACC fetch error:', err);
          this.loading = false;
          this.exitForms = [];
          this.cdRef.detectChanges();
        }
      });
      return;
    }

    if (this.isSystemAdmin()) {
      this.apiService.getAllActiveExitForms().subscribe({
        next: (response: any) => {
          this.loading = false;
          const arr = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
          
          const uniqueForms = this.deduplicateForms(arr);
          this.allExitForms = uniqueForms;
          
          if (this.viewingEmployee) {
            this.exitForms = this.filterFormsByEmployeeId(uniqueForms, this.viewingEmployee);
            if (!this.exitForms.length) {
              this.fetchExitFormsByEmployeeFallback(this.viewingEmployee);
            } else {
              this.handleFormSelectionFromNavigation();
              this.fetchManagerReview();
              this.fetchEmployeeData();
            }
          } else {
            this.exitForms = uniqueForms.filter((f: any) => this.getFormStatus(f) === 2);
            this.handleFormSelectionFromNavigation();
            this.autoOpenPendingStep();
            this.cdRef.detectChanges();
          }
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          console.error('SA fetch error:', err);
          this.loading = false;
          this.exitForms = [];
          this.cdRef.detectChanges();
        }
      });
      return;
    }

    // Regular users and HR
    this.apiService.getExitFormsByEmployee(requesterId).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          const allForms: any[] = response.data || [];
          
          const uniqueForms = this.deduplicateForms(allForms);
          this.allExitForms = uniqueForms;
          
          if (this.isHR()) {
            this.isHRUser = response.isHR || this.isHRUser;
            this.calculateHRDashboard(uniqueForms);
          }
          
          this.extractDirectReports(uniqueForms, requesterId);
          
          if (this.viewingEmployee) {
            const filtered = uniqueForms.filter(f => (f.employeeId || '').toString() === this.viewingEmployee.toString());
            this.exitForms = filtered;
            this.handleFormSelectionFromNavigation();
          } else {
            this.exitForms = uniqueForms;
          }
        } else {
          this.exitForms = [];
          this.allExitForms = [];
        }
        this.autoOpenPendingStep();
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching exit forms:', err);
        this.exitForms = [];
        this.allExitForms = [];
        this.loading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private handleFormSelectionFromNavigation(): void {
    if (this.receivedFormId && this.exitForms.length > 0) {
      const specificForm = this.exitForms.find(f => f.id === this.receivedFormId);
     
      if (specificForm) {
        const formStatus = this.getFormStatus(specificForm);
       
        if (this.isSystemAdmin()) {
          if (formStatus === 2 || formStatus === 3) {
            this.selectedFormForAssetClearance = specificForm;
            this.showAssetClearanceForm = true;
            this.currentHRStep = 4;
            this.fetchAssetClearanceData(specificForm.id);
          }
        } else if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          if (formStatus === 1 || formStatus === 3) {
            this.showHRVerificationForm = true;
            this.currentHRStep = formStatus === 1 ? 3 : 5;
            this.fetchExistingHRReview();
          }
        }
      }
    } else if (this.isSystemAdmin() && this.exitForms.length > 0 && !this.receivedFormId) {
      const firstForm = this.exitForms[0];
      const formStatus = this.getFormStatus(firstForm);
      if (formStatus === 2 || formStatus === 3) {
        this.selectedFormForAssetClearance = firstForm;
        this.showAssetClearanceForm = true;
        this.currentHRStep = 4;
        this.fetchAssetClearanceData(firstForm.id);
      }
    }
  }

  fetchAssetClearanceData(formId: string | undefined) {
    if (!formId) return;

    this.loadingAssetClearance = true;
    this.assetClearanceData = [];
    this.apiService.getAssetClearance(formId).subscribe({
      next: (response: any) => {
        this.loadingAssetClearance = false;

        if (response?.success && response?.assetClearance?.trim()) {
          this.assetClearanceData = this.parseAssetStringToItems(response.assetClearance);
          this.isAssetViewOnly = true;
          this.isAssetFormDisabled = true;
        } else {
          this.assetClearanceData = this.getDefaultAssetItems();
          const isEditable = this.isAssetClearanceEditable();
          this.isAssetViewOnly = !isEditable;
          this.isAssetFormDisabled = !isEditable;
        }
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.loadingAssetClearance = false;
        console.error('Error loading asset clearance:', err);
        this.assetClearanceData = this.getDefaultAssetItems();
        const isEditable = this.isAssetClearanceEditable();
        this.isAssetViewOnly = !isEditable;
        this.isAssetFormDisabled = !isEditable;
        this.cdRef.detectChanges();
      }
    });
  }

  private getDefaultAssetItems(): AssetClearanceItem[] {
    return [
      { label: 'Laptop', status: '', remarks: '' },
      { label: 'Laptop Charger', status: '', remarks: '' },
    ];
  }

  private parseAssetStringToItems(assetString: string): AssetClearanceItem[] {
    const items: AssetClearanceItem[] = [];

    if (!assetString?.trim()) return items;

    const entries = assetString.split('#').filter(e => e.trim());
    
    for (const entry of entries) {
      const [labelPart, rest] = entry.split(':');
      if (!labelPart) continue;

      const label = labelPart.trim();
      const parts = rest?.split('||') || [];
      const status = parts[0]?.trim() || 'Not Applicable';
      const remarks = parts[1]?.trim() || '';

      items.push({ label, status, remarks });
    }

    const defaultItems = this.getDefaultAssetItems();
    const result: AssetClearanceItem[] = [];

    defaultItems.forEach(def => {
      const existing = items.find(i => i.label === def.label);
      result.push(existing || { ...def, status: 'Not Applicable', remarks: '' });
    });

    return result;
  }

  private parseAssetClearanceData(data: any): AssetClearanceItem[] {
    if (!data || !data.assetData) {
      return this.initializeDefaultAssetClearanceItems();
    }
    try {
      const assetData = data.assetData;
      const items = assetData.split('#').filter((item: string) => item.trim() !== '');
      const parsedItems: AssetClearanceItem[] = [];
      items.forEach((item: string) => {
        const parts = item.split(':');
        if (parts.length >= 2) {
          const label = parts[0].trim();
          const rest = parts.slice(1).join(':').trim();
          const statusRemarks = rest.split('||');
          const status = statusRemarks[0]?.trim() || '';
          const remarks = statusRemarks[1]?.trim() || '';
          parsedItems.push({
            label,
            status,
            remarks
          });
        }
      });
      return parsedItems.length > 0 ? parsedItems : this.initializeDefaultAssetClearanceItems();
    } catch (error) {
      console.error('Error parsing asset clearance data:', error);
      return this.initializeDefaultAssetClearanceItems();
    }
  }

  private initializeDefaultAssetClearanceItems(): AssetClearanceItem[] {
    return [
      { label: 'Laptop', status: '', remarks: '' },
      { label: 'Laptop Charger', status: '', remarks: '' },
      { label: 'ID Card', status: '', remarks: '' },
      { label: 'Access Card', status: '', remarks: '' },
      { label: 'Company Mobile', status: '', remarks: '' },
      { label: 'Other Assets', status: '', remarks: '' }
    ];
  }

  saveAssetClearance() {
    if (!this.isSystemAdmin()) {
      alert('You are not authorized to save asset clearance.');
      return;
    }
    if (!this.selectedFormForAssetClearance || !this.selectedFormForAssetClearance.id) {
      alert('No form selected for asset clearance');
      return;
    }
    
    const incompleteItems = this.assetClearanceData.filter(item => !item.status);
    if (incompleteItems.length > 0) {
      alert('Please select status for all asset items');
      return;
    }
    
    const assetsPayload = this.assetClearanceData.map(item => ({
      name: item.label,
      condition: item.status,
      comments: item.remarks || ''
    }));
    
    const assetDataString = this.convertAssetDataToString();
    
    const payload = {
      assets: assetsPayload,
      extraAssetName: '',
      assetData: assetDataString,
      formId: this.selectedFormForAssetClearance.id,
      clearedBy: localStorage.getItem('username') || 'System Admin',
      clearanceDate: new Date().toISOString()
    };
    
    this.loadingAssetClearance = true;
    this.apiService.submitAssetClearance(this.selectedFormForAssetClearance.id, payload).subscribe({
      next: (response: any) => {
        this.loadingAssetClearance = false;
        if (response && response.success) {
          alert('Asset clearance saved successfully!');
          this.updateFormStatusAfterAssetClearance();
        } else {
          alert('Error saving asset clearance: ' + (response?.message || 'Unknown error'));
        }
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('Error saving asset clearance:', error);
        this.loadingAssetClearance = false;
        alert('Error saving asset clearance. Please try again.');
        this.cdRef.detectChanges();
      }
    });
  }

  private convertAssetDataToString(): string {
    return this.assetClearanceData
      .map(item => `${item.label} : ${item.status} || ${item.remarks || ''}`)
      .join(' # ');
  }

  private updateFormStatusAfterAssetClearance() {
    const form = this.selectedFormForAssetClearance;
    if (!form || !form.id) return;
    
    const updatePayload: any = {
      ...form,
      status: 3,
      updatedBy: localStorage.getItem('username') || 'System Admin',
      updatedDate: new Date().toISOString()
    };
    
    this.apiService.updateExitForm(form.id, updatePayload).subscribe({
      next: (response: any) => {
        console.log('Form status updated to HR Round 2 after asset clearance');
        this.fetchExitForms();
      },
      error: (error: any) => {
        console.error('Error updating form status after asset clearance:', error);
        alert('Asset clearance saved but status update failed. Please contact admin.');
      }
    });
  }

  onAssetStatusChange(item: AssetClearanceItem, status: string) {
    if (this.isAssetFormDisabled) return;
    
    item.status = status;
    if (status === 'Good' || status === 'Not Applicable') {
      item.remarks = '';
    }
    this.cdRef.detectChanges();
  }

  isAssetClearanceValid(): boolean {
    return this.assetClearanceData.every(item => item.status !== '');
  }

  navigateToSystemAdminStep(form: any) {
    if (form && form.id) {
      this.selectedFormForAssetClearance = form;
      this.showAssetClearanceForm = true;
      this.currentHRStep = 4;
      this.fetchAssetClearanceData(form.id);
    } else {
      console.error('Form ID not available in navigateToSystemAdminStep');
      alert('Cannot show asset clearance: Form ID is missing');
    }
    this.cdRef.detectChanges();
  }

  shouldShowAssetClearanceForm(): boolean {
    return this.showAssetClearanceForm &&
           this.selectedFormForAssetClearance &&
           this.selectedFormForAssetClearance.id;
  }

  closeAssetClearanceForm() {
    this.showAssetClearanceForm = false;
    this.selectedFormForAssetClearance = null;
    this.assetClearanceData = [];
    this.currentHRStep = null;
    this.cdRef.detectChanges();
  }

  private filterFormsByEmployeeId(forms: any[], employeeId: string): any[] {
    if (!Array.isArray(forms) || !employeeId) return [];
    const emp = (employeeId + '').toString().trim();
    return forms.filter(f => {
      if (!f) return false;
      const candidates = [
        f.employeeId, f.employee_id, f.EMPLOYEEID,
        f.employeeId?.toString?.(), f.empId, f.id, f.ID
      ];
      for (const c of candidates) {
        if (c === undefined || c === null) continue;
        if ((c + '').toString().trim() === emp) return true;
      }
      if (f.employee && (f.employee.id || f.employee.employeeId)) {
        const nested = f.employee.id || f.employee.employeeId;
        if ((nested + '').toString().trim() === emp) return true;
      }
      return false;
    });
  }

  debugSystemAdminAccess() {
    console.log('=== SYSTEM ADMIN DEBUG INFO ===');
    console.log('Current User Role:', this.currentUserRole);
    console.log('Is System Admin:', this.isSystemAdmin());
    console.log('Is CEO:', this.isCEOUser);
    console.log('Is HR:', this.isHR());
    console.log('Employee ID:', this.employeeId);
    console.log('Viewing Employee:', this.viewingEmployee);
    console.log('Exit Forms Count:', this.exitForms.length);
  }

  private autoOpenPendingStep(): void {
    const form = this.getFirstForm();
    if (!form) return;

    const status = this.getFormStatus(form);
    this.closeAllForms();

    console.log('Auto-opening step for status:', status, 'User role:', this.currentUserRole);

    // 🟢 UPDATED: Include CEO in all HR-related auto-openings
    if (status === 0 && this.isManager() && this.canEditManagerReview()) {
      this.showManagerReviewForm = true;
      this.currentHRStep = 2;
      this.fetchManagerReview();
    }
    else if (status === 1 && this.canActAsHR()) { // 🟢 Include CEO
      this.showHRVerificationForm = true;
      this.currentHRStep = 3;
      this.fetchExistingHRReview();
    }
    else if (status === 2 && this.isSystemAdmin()) {
      this.selectedFormForAssetClearance = form;
      this.showAssetClearanceForm = true;
      this.showAssetClearanceFormForHR = false;
      this.currentHRStep = 4;
      this.fetchAssetClearanceData(form.id);
    }
    else if (status === 3 && this.canActAsHR()) { // 🟢 Include CEO
      this.selectedFormForHROffboarding = form;
      this.showHROffboardingInline = true;
      this.currentHRStep = 5;
    }
    else if (status === 4 && this.isPayrollUser()) {
      this.selectedFormForPayroll = form;
      this.showPayrollCheckForm = true;
      this.showPayrollCheckFormForHR = false;
      this.currentHRStep = 6;
    }
    else if (status === 5 && this.canActAsHR()) { // 🟢 Include CEO
      this.selectedFormForFinalHR = form;
      this.showFinalHRForm = true;
      this.showFinalHRFormForHR = true;
      this.currentHRStep = 7;
    }

    this.cdRef.detectChanges();
  }

  fetchExistingHRReview() {
    if (!this.canActAsHR() || !this.getFirstForm()) return; // 🟢 UPDATED: Include CEO

    const form = this.getFirstForm();
    const formId = (form as any).id;
    const status = this.getFormStatus(form);

    this.loadingHRReview = true;

    this.apiService.getHRReviewByExitFormId(formId).subscribe({
      next: (response: any) => {
        this.loadingHRReview = false;

        if (response && response.success && response.data) {
          const review = response.data;
          const currentRound = (status === 1 || status === 2) ? 1 : 2;

          if (review.verificationRound === currentRound) {
            this.hrReview = review;
            this.existingHRReviewId = review.id;
            this.isUpdateMode = true;
            this.loadHRReviewData(review);
            this.isHRFormDisabled = (status === 2 || status === 4);
          } else {
            this.hrReview = null;
            this.existingHRReviewId = null;
            this.isUpdateMode = false;
            this.resetHRFormToEmpty();
            this.isHRFormDisabled = false;
          }
        } else {
          this.hrReview = null;
          this.existingHRReviewId = null;
          this.isUpdateMode = false;
          this.resetHRFormToEmpty();
          this.isHRFormDisabled = false;
        }

        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching HR review:', err);
        this.loadingHRReview = false;
        this.resetHRFormToEmpty();
        this.isHRFormDisabled = false;
        this.cdRef.detectChanges();
      }
    });
  }

  loadHRReviewData(hrReview: any): void {
    this.checkList.noticePeriod.checked = hrReview.hrNoticePeriod || false;
    this.checkList.leaveBalances.checked = hrReview.hrLeaveBalances || false;
    this.checkList.policyCompliance.checked = hrReview.hrPolicyCompliance || false;
    this.checkList.exitEligibility.checked = hrReview.hrExitEligibility || false;
    this.checkList.noticePeriod.comment = hrReview.hrNoticePeriodComments || '';
    this.checkList.leaveBalances.comment = hrReview.hrLeaveBalancesComments || '';
    this.checkList.policyCompliance.comment = hrReview.hrPolicyComplianceComments || '';
    this.checkList.exitEligibility.comment = hrReview.hrExitEligibilityComments || '';
    this.generalComments = hrReview.hrGeneralComments || '';
    this.hrAction = hrReview.hrAction || '';
  }

  resetHRFormToEmpty() {
    this.checkList = {
      noticePeriod: { checked: false, comment: '' },
      leaveBalances: { checked: false, comment: '' },
      policyCompliance: { checked: false, comment: '' },
      exitEligibility: { checked: false, comment: '' }
    };
    this.generalComments = '';
    this.hrAction = '';
    this.hrErrorMessage = '';
  }

  calculateHRDashboard(forms: any[]) {
    this.hrDashboardData = {
      totalForms: forms.length,
      pendingHRAction: forms.filter(f => this.getFormStatus(f) === 1 || this.getFormStatus(f) === 3).length,
      approvedForms: forms.filter(f => this.getFormStatus(f) === 4).length,
      rejectedForms: forms.filter(f => this.getFormStatus(f) === 5 || this.getFormStatus(f) === 6).length,
      onHoldForms: forms.filter(f => this.getFormStatus(f) === 7 || this.getFormStatus(f) === 8).length
    };
  }

  extractDirectReports(forms: any[], managerId: string) {
    this.directReports = [];
    if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
      this.showManagerView = false;
      return;
    }
    const reportForms = forms.filter(form =>
      form.employeeId &&
      form.employeeId.toString() !== managerId.toString()
    );
    const uniqueReports = new Map();
    reportForms.forEach(form => {
      if (form.employeeId && !uniqueReports.has(form.employeeId)) {
        uniqueReports.set(form.employeeId, {
          employeeId: form.employeeId,
          employeeName: form.employeeName || 'Unknown Employee',
          status: form.status || 0,
          noticeStartDate: form.noticeStartDate,
          noticeEndDate: form.noticeEndDate,
          hasManagerReview: (form as any).hasManagerReview,
          managerAction: form.managerAction
        });
      }
    });
    this.directReports = Array.from(uniqueReports.values());
    this.showManagerView = this.directReports.length > 0;
  }

  fetchEmployeeData() {
    if (this.exitForms && this.exitForms.length > 0) {
      const formMatch = this.exitForms.find(f => (f.employeeId || '').toString() === this.viewingEmployee.toString());
      if (formMatch) {
        this.employeeData = formMatch;
        this.extractReportingManager(formMatch);
        this.cdRef.detectChanges();
        return;
      }
    }
    this.apiService.getExitFormsByEmployee(this.employeeId).subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          const forms: any[] = response.data;
          const found = forms.find(f => (f.employeeId || '').toString() === this.viewingEmployee.toString());
          if (found) {
            this.employeeData = found;
            this.extractReportingManager(found);
          } else {
            this.employeeData = null;
            this.employeeReportingManager = '';
          }
        } else {
          this.employeeData = null;
          this.employeeReportingManager = '';
        }
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching employee data fallback:', err);
        this.employeeData = null;
        this.employeeReportingManager = '';
        this.cdRef.detectChanges();
      }
    });
  }

  extractReportingManager(formData: any) {
    const candidates = [
      formData?.REPOTE_TO,
      formData?.repote_to,
      formData?.reportingManager,
      formData?.managerId,
      formData?.managerID,
      formData?.managerName
    ];
    const found = candidates.find(v => v !== undefined && v !== null && (v + '').trim() !== '');
    if (found) {
      this.employeeReportingManager = (found + '').trim();
    } else {
      this.employeeReportingManager = '';
    }
  }

  isManager(): boolean {
    const role = (this.currentUserRole || '').toUpperCase();
    const isManagerRole = role.includes('PM') || role.includes('R004') || role.includes('MANAGER');
    const hasDirectReports = this.directReports.length > 0;
    
    return isManagerRole || this.showManagerView || hasDirectReports;
  }

  isPayrollUser(): boolean {
    const role = (this.currentUserRole || '').toUpperCase();
    const username = (localStorage.getItem('username') || '').toUpperCase();
    
    const isPayroll = role.includes('ACC') || 
                     role === 'R008' || 
                     role.includes('PAYROLL') ||
                     username.includes('PAYROLL') ||
                     username.includes('ACC');
    
    return isPayroll;
  }

  isSystemAdmin(): boolean {
    const role = this.currentUserRole || localStorage.getItem('role') || '';
    return role === 'R010' || role === 'SA' || role.toLowerCase().includes('system admin') || role.toLowerCase().includes('sa');
  }

  isDirectManager(): boolean {
    if (!this.employeeReportingManager) {
      return false;
    }
    return (this.employeeReportingManager + '').toString() === (this.employeeId + '').toString();
  }

  isManagerOfViewedEmployee(): boolean {
    if (!this.viewingEmployee || !this.directReports.length) return false;
    return this.directReports.some(report =>
      report.employeeId.toString() === this.viewingEmployee.toString()
    );
  }

  canViewManagerReview(): boolean {
    if (this.canActAsHR()) return true; // 🟢 UPDATED: Include CEO
    if (this.isDirectManager()) return true;
    if (this.isManagerOfViewedEmployee()) return true;
    return false;
  }

  canEditManagerReview(): boolean {
    return this.isDirectManager() || this.isManagerOfViewedEmployee();
  }

  viewEmployeeForm(employee: any) {
    this.viewingEmployee = employee.employeeId;
    this.exitForms = [];
    this.managerReview = null;
    this.hrReview = null;
    this.showHRVerificationForm = false;
    this.showAssetClearanceForm = false;
    this.resetHRFormToEmpty();
    this.fetchExitForms();
    this.fetchManagerReview();
    this.fetchEmployeeData();
  }

  viewMyForm() {
    this.viewingEmployee = this.employeeId;
    this.exitForms = [];
    this.managerReview = null;
    this.hrReview = null;
    this.showHRVerificationForm = false;
    this.showAssetClearanceForm = false;
    this.resetHRFormToEmpty();
    this.fetchExitForms();
    this.fetchManagerReview();
    this.fetchEmployeeData();
  }

  viewEmployeeFormAsHR(employee: any) {
    this.viewingEmployee = employee.employeeId;
    this.exitForms = [];
    this.managerReview = null;
    this.hrReview = null;
    this.showHRVerificationForm = false;
    this.showAssetClearanceForm = false;
    this.resetHRFormToEmpty();
    this.fetchManagerReview();
    this.fetchEmployeeData();
    const filtered = this.allExitForms.filter(f => (f.employeeId || '').toString() === this.viewingEmployee.toString());
    this.exitForms = filtered;
    this.cdRef.detectChanges();
  }

  getFormsRequiringHRAction(): any[] {
    return this.allExitForms.filter(form => {
      const status = this.getFormStatus(form);
      return status === 1 || status === 3;
    });
  }

  getFormsWithManagerReviews(): any[] {
    return this.allExitForms.filter(form => (form as any).hasManagerReview);
  }

  shouldHRFormBeDisabled(): boolean {
    const hasReview = !!this.hrReview;
    const form = this.getFirstForm();
    if (!form) return true;

    const status = this.getFormStatus(form);
    const completedStatuses = [2, 4, 6, 8];

    return hasReview || completedStatuses.includes(status);
  }

  navigateToHRStep(step: number, form?: any) {
    if (!this.canActAsHR() && !this.isSystemAdmin()) return; // 🟢 UPDATED: Include CEO

    this.currentHRStep = step;
    this.selectedFormForHR = form || this.getFirstForm();

    if (!this.selectedFormForHR) return;

    if (step === 3 || step === 5) {
      this.showHRVerificationForm = true;
      this.showAssetClearanceForm = false;
      this.fetchExistingHRReview();
    } else if (step === 4 && this.isSystemAdmin()) {
      this.showAssetClearanceForm = true;
      this.showHRVerificationForm = false;
      this.fetchAssetClearanceData(this.selectedFormForHR.id);
    } else {
      this.showHRVerificationForm = false;
      this.showAssetClearanceForm = false;
    }
    this.cdRef.detectChanges();
  }

  onCheckboxChange(field: ChecklistKey) {
    if (this.isHRFormDisabled) return;
    
    if (!this.checkList[field].checked) {
      this.checkList[field].comment = '';
    }
    this.hrErrorMessage = '';
  }

  submitHRReview(action: string) {
    if (!this.canActAsHR()) { // 🟢 UPDATED: Include CEO
      alert('You are not authorized to submit HR reviews.');
      return;
    }
    
    if (this.hrSubmitting) return;
    const currentForm = this.getFirstForm();
    if (!currentForm || !currentForm.id) {
      this.hrErrorMessage = 'No valid form data found.';
      return;
    }
    
    const isAnyChecked = Object.values(this.checkList).some((item: ChecklistItem) => item.checked);
    if (!isAnyChecked) {
      this.hrErrorMessage = 'Please check at least one verification item.';
      return;
    }
    
    const hasCommentsForChecked = Object.values(this.checkList)
      .filter((item: ChecklistItem) => item.checked)
      .every((item: ChecklistItem) => item.comment.trim() !== '');
    if (!hasCommentsForChecked) {
      this.hrErrorMessage = 'Please provide comments for all checked verification items.';
      return;
    }
    
    if (!action) {
      this.hrErrorMessage = 'Please select an HR action (Approve, Revise LWD, or Reject).';
      return;
    }
    
    this.hrSubmitting = true;
    this.hrErrorMessage = '';
    const currentUser = localStorage.getItem('username') || 'HR User';
    const currentFormStatus = this.getFormStatus(currentForm);
    const verificationRound = (currentFormStatus === 1 || currentFormStatus === 2) ? 1 : 2;
    
    const payload: any = {
      id: currentForm.id,
      employeeId: currentForm.employeeId,
      employeeName: currentForm.employeeName,
      verificationRound: verificationRound,
      hrNoticePeriod: Boolean(this.checkList.noticePeriod.checked),
      hrLeaveBalances: Boolean(this.checkList.leaveBalances.checked),
      hrPolicyCompliance: Boolean(this.checkList.policyCompliance.checked),
      hrExitEligibility: Boolean(this.checkList.exitEligibility.checked),
      hrNoticePeriodComments: this.checkList.noticePeriod.comment || '',
      hrLeaveBalancesComments: this.checkList.leaveBalances.comment || '',
      hrPolicyComplianceComments: this.checkList.policyCompliance.comment || '',
      hrExitEligibilityComments: this.checkList.exitEligibility.comment || '',
      hrGeneralComments: this.generalComments || '',
      hrAction: action,
      hrName: currentUser
    };
    
    this.apiService.submitHRReview(payload).subscribe({
      next: (response: any) => {
        this.hrSubmitting = false;
        if (response && response.success) {
          this.updateExitFormStatusAfterHR(action, currentFormStatus);
        } else {
          const errorMessage = response?.message || 'Unknown error occurred while submitting HR review';
          this.hrErrorMessage = errorMessage;
          alert('Error: ' + errorMessage);
        }
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('HR Review Error:', error);
        const errorMsg = error?.error?.message || error?.message || 'Please check console for details';
        this.hrErrorMessage = errorMsg;
        this.hrSubmitting = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private updateExitFormStatusAfterHR(hrAction: string, currentStatus: number) {
    const form = this.getFirstForm();
    if (!form || !form.id) {
      this.handleHRSuccess(hrAction);
      return;
    }
    
    let newStatus = currentStatus;
    switch (hrAction) {
      case 'APPROVE':
        if (currentStatus === 1) {
          newStatus = 2;
        } else if (currentStatus === 3) {
          newStatus = 4;
        }
        break;
      case 'REJECT':
        newStatus = 6;
        break;
      case 'REVISE_LWD':
        newStatus = 8;
        break;
      default:
        newStatus = currentStatus;
    }
    
    const updatePayload: any = {
      ...form,
      status: newStatus,
      updatedBy: localStorage.getItem('username') || 'HR User',
      updatedDate: new Date().toISOString()
    };
    
    this.apiService.updateExitForm(form.id, updatePayload).subscribe({
      next: (response: any) => {
        this.handleHRSuccess(hrAction);
      },
      error: (error: any) => {
        console.error('Exit Form Status Update Failed:', error);
        alert('HR review submitted but status update failed. Please contact admin.');
        this.handleHRSuccess(hrAction);
      }
    });
  }

  private handleHRSuccess(action: string) {
    this.hrSubmitting = false;
    let message = '';
    const currentForm = this.getFirstForm();
    const currentStatus = currentForm ? this.getFormStatus(currentForm) : 0;
    
    switch (action) {
      case 'APPROVE':
        if (currentStatus === 2) {
          message = `Exit form ${this.isUpdateMode ? 'updated and' : ''} approved in HR Round 1! Moving to System Admin for asset clearance.`;
        } else if (currentStatus === 4) {
          message = `Exit form ${this.isUpdateMode ? 'updated and' : ''} approved in HR Round 2! Process completed.`;
        } else {
          message = `Exit form ${this.isUpdateMode ? 'updated and' : ''} approved successfully!`;
        }
        break;
      case 'REVISE_LWD':
        message = `Exit form ${this.isUpdateMode ? 'updated and' : ''} sent for LWD revision!`;
        break;
      case 'REJECT':
        message = `Exit form ${this.isUpdateMode ? 'updated and' : ''} rejected successfully!`;
        break;
      default:
        message = `HR action ${this.isUpdateMode ? 'updated' : 'submitted'} successfully!`;
    }
    
    alert(message);
    this.fetchExitForms();
    this.fetchExistingHRReview();
    
    if (currentStatus === 2 || currentStatus === 4) {
      this.showHRVerificationForm = false;
    }
    
    this.cdRef.detectChanges();
  }

  getFieldLabel(field: ChecklistKey): string {
    const labels: Record<ChecklistKey, string> = {
      noticePeriod: 'Notice period details',
      leaveBalances: 'Leave balances',
      policyCompliance: 'Policy compliance',
      exitEligibility: 'Exit eligibility'
    };
    return labels[field];
  }

  isHRFormValid(): boolean {
    const currentForm = this.getFirstForm();
    if (!currentForm || !currentForm.id) return false;
    const isAnyChecked = Object.values(this.checkList).some((item: ChecklistItem) => item.checked);
    if (!isAnyChecked) return false;
    return Object.values(this.checkList)
      .filter((item: ChecklistItem) => item.checked)
      .every((item: ChecklistItem) => item.comment.trim() !== '');
  }

  getHRActionButtonText(action: string): string {
    if (this.hrSubmitting) {
      return 'Processing...';
    }
    if (this.isUpdateMode) {
      switch (action) {
        case 'APPROVE': return 'Update & Approve';
        case 'REVISE_LWD': return 'Update & Revise LWD';
        case 'REJECT': return 'Update & Reject';
        default: return `Update & ${action}`;
      }
    } else {
      switch (action) {
        case 'APPROVE': return 'Approve';
        case 'REVISE_LWD': return 'Revise LWD';
        case 'REJECT': return 'Reject';
        default: return action;
      }
    }
  }

  getHRFormTitle(): string {
    const currentForm = this.getFirstForm();
    if (!currentForm) return this.isUpdateMode ? 'Update HR Review' : 'HR Verification & Approval';
    const formStatus = this.getFormStatus(currentForm);
    if (formStatus === 1) {
      return this.isUpdateMode ? 'Update HR Round 1 Review' : 'HR Verification - Round 1';
    } else if (formStatus === 3) {
      return this.isUpdateMode ? 'Update HR Round 2 Review' : 'HR Verification - Round 2';
    }
    return this.isUpdateMode ? 'Update HR Review' : 'HR Verification & Approval';
  }

  getHRSectionTitle(): string {
    return this.isUpdateMode ? 'Update Exit Checklist Verification' : 'Exit Checklist Verification';
  }

  fetchManagerReview() {
    this.loadingReview = true;
    this.apiService.getManagerReviewsByEmployee(this.viewingEmployee).subscribe({
      next: (response: any) => {
        this.loadingReview = false;
        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          const reviewRaw = response.data[0];
          this.managerReview = this.convertToManagerReview(reviewRaw);
          this.fillExistingReview(this.managerReview);
          this.currentAction = this.managerReview.action || '';
          this.isManagerFormDisabled = true;
        } else {
          const form = this.exitForms.find(f => (f.employeeId || '') === this.viewingEmployee);
          if (form) {
            this.managerReview = this.convertToManagerReview(form);
            this.fillExistingReview(this.managerReview);
            this.currentAction = this.managerReview.action || '';
            this.isManagerFormDisabled = !this.isManagerFormEditable();
          } else {
            this.managerReview = null;
            this.resetFormToEmpty();
            this.isManagerFormDisabled = false;
          }
        }
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        const form = this.exitForms.find(f => (f.employeeId || '') === this.viewingEmployee);
        if (form) {
          this.managerReview = this.convertToManagerReview(form);
          this.fillExistingReview(this.managerReview);
          this.isManagerFormDisabled = true;
        } else {
          this.managerReview = null;
          this.resetFormToEmpty();
          this.isManagerFormDisabled = false;
        }
        this.loadingReview = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private convertToManagerReview(exitFormData: any): ManagerReview {
    return {
      id: exitFormData.id,
      employeeId: exitFormData.employeeId,
      employeeName: exitFormData.employeeName,
      performance: exitFormData.performance || '',
      projectDependency: exitFormData.projectDependency ? parseInt(exitFormData.projectDependency) : 0,
      knowledgeTransfer: exitFormData.knowledgeTransfer || '',
      noticePeriod: exitFormData.noticePeriod || 0,
      remarks: exitFormData.managerRemarks || '',
      managerRemarks: exitFormData.managerRemarks || '',
      action: exitFormData.managerAction || '',
      managerAction: exitFormData.managerAction || '',
      purposeOfChange: exitFormData.purposeOfChange || null,
      managerName: exitFormData.managerName || '',
      createdDate: exitFormData.createdOn,
      updatedDate: exitFormData.updatedOn,
      createdBy: exitFormData.createdBy,
      updatedBy: exitFormData.updatedBy
    } as ManagerReview;
  }

  resetFormToEmpty() {
    this.reviewData = {
      performance: '',
      projectDependency: 0,
      knowledgeTransfer: '',
      noticePeriod: 0,
      remarks: '',
      purposeOfChange: '',
      action: ''
    };
    this.currentAction = '';
    this.cdRef.detectChanges();
  }

  fillExistingReview(review: ManagerReview) {
    this.reviewData = {
      performance: review.performance || '',
      projectDependency: (review.projectDependency !== null && review.projectDependency !== undefined) ? review.projectDependency : 0,
      knowledgeTransfer: review.knowledgeTransfer || '',
      noticePeriod: (review.noticePeriod !== null && review.noticePeriod !== undefined) ? review.noticePeriod : 0,
      remarks: review.remarks || '',
      purposeOfChange: review.purposeOfChange || '',
      action: review.action || ''
    };
    this.currentAction = review.action || '';
    this.cdRef.detectChanges();
  }

  enableEdit() {
    if (!this.canEditManagerReview() || this.isManagerFormDisabled) return;
    this.isEditMode = true;
    this.showPurpose = true;
    this.cdRef.detectChanges();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.showPurpose = false;
    if (this.managerReview) {
      this.fillExistingReview(this.managerReview);
    } else {
      this.resetFormToEmpty();
    }
    this.cdRef.detectChanges();
  }

  toggleField(field: string) {
    if (this.isManagerFormDisabled && !this.isEditMode) {
      return;
    }
    this.expandedField = this.expandedField === field ? '' : field;
  }

  onOptionChange(field: string, value: string) {
    if (this.isManagerFormDisabled && !this.isEditMode) {
      return;
    }
    
    this.reviewData[field] = value;
    
    if (field === 'noticePeriod' && value === 'No') {
      this.reviewData.remarks = '';
    }
  }

  selectAction(action: string) {
    if (!this.canEditManagerReview() || this.submitting || this.isManagerFormDisabled) return;
    this.currentAction = action;
    this.reviewData.action = action;
    this.cdRef.detectChanges();
  }

  submitReview(action: string) {
    if (!this.canEditManagerReview()) {
      alert('You are not authorized to submit manager reviews for this employee.');
      return;
    }
    
    if (this.isManagerFormDisabled && !this.isEditMode) {
      alert('Manager review is already submitted and cannot be modified. Click "Update Review" to make changes.');
      return;
    }
    
    if (!this.canSubmitReview()) {
      alert('Please fill all required fields before submitting.');
      return;
    }
    
    this.submitting = true;
    this.currentAction = action;
    
    const currentUser = localStorage.getItem('username') || 'Manager';
    const currentDate = new Date().toISOString();
    
    const payload: any = {
      employeeId: this.viewingEmployee,
      employeeName: this.getEmployeeName(),
      performance: this.reviewData.performance,
      projectDependency: this.reviewData.projectDependency === 'Yes' ? 1 : 0,
      knowledgeTransfer: this.reviewData.knowledgeTransfer,
      managerRemarks: this.reviewData.remarks || '',
      managerAction: action,
      managerName: currentUser,
      noticePeriod: this.reviewData.noticePeriod === 'Yes' ? 1 : 0,
      updatedOn: currentDate,
      updatedBy: currentUser
    };
    
    if (this.isEditMode && this.reviewData.purposeOfChange) {
      payload.purposeOfChange = this.reviewData.purposeOfChange;
    }
    
    if (this.managerReview?.id) {
      payload.id = this.managerReview.id;
      if (this.managerReview.createdDate) payload.createdOn = this.managerReview.createdDate;
      if (this.managerReview.createdBy) payload.createdBy = this.managerReview.createdBy;
    } else {
      payload.createdOn = currentDate;
      payload.createdBy = currentUser;
    }
    
    let request$;
    if (this.managerReview?.id) {
      request$ = this.apiService.updateManagerReview(this.managerReview.id, payload);
    } else {
      request$ = this.apiService.submitManagerReview(payload);
    }
    
    request$.subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response && response.success) {
          this.updateExitFormStatus(action);
        } else {
          const errorMessage = response?.message || 'Unknown error occurred while submitting review';
          alert('Error: ' + errorMessage);
          this.resetSubmissionState();
        }
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        const errorMsg = error?.error?.message || error?.message || 'Please check console for details';
        alert('Error submitting review: ' + errorMsg);
        this.resetSubmissionState();
      }
    });
  }

  private updateExitFormStatus(managerAction: string) {
    const form = this.getFirstForm();
    if (!form || !form.id) {
      this.handleSuccess();
      return;
    }
    
    let newStatus = 0;
    switch (managerAction) {
      case 'Approve': newStatus = 1; break;
      case 'Reject': newStatus = 5; break;
      case 'On-Hold': newStatus = 7; break;
      default: newStatus = 0;
    }
    
    const updatePayload: any = {
      ...form,
      status: newStatus,
      updatedBy: localStorage.getItem('username') || 'Manager',
      updatedDate: new Date().toISOString()
    };
    
    if (updatePayload.REPOTE_TO === undefined && updatePayload.reportingManager) {
      updatePayload.REPOTE_TO = updatePayload.reportingManager;
    }
    
    this.apiService.updateExitForm(form.id, updatePayload).subscribe({
      next: (response: any) => {
        this.handleSuccess();
      },
      error: (error: any) => {
        alert('Manager review submitted but status update failed. Please contact admin.');
        this.handleSuccess();
      }
    });
  }

  private resetSubmissionState() {
    this.submitting = false;
    this.cdRef.detectChanges();
  }

  validateReviewData(): boolean {
    return this.canSubmitReview();
  }

  handleSuccess() {
    this.submitting = false;
    this.isEditMode = false;
    this.showPurpose = false;
    this.currentAction = '';
    this.isManagerFormDisabled = true;
    alert('Manager review submitted successfully! Status updated based on your action.');
    this.fetchManagerReview();
    this.fetchExitForms();
    this.cdRef.detectChanges();
  }

  deleteReview(reviewId: string) {
    if (!this.canEditManagerReview()) {
      alert('You are not authorized to delete manager reviews for this employee.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    this.deleting = true;
    const currentUser = localStorage.getItem('username') || 'Manager';
    
    this.apiService.deleteManagerReview(reviewId, currentUser).subscribe({
      next: () => {
        alert('Review deleted successfully');
        this.deleting = false;
        this.managerReview = null;
        this.currentAction = '';
        this.resetFormToEmpty();
        this.isManagerFormDisabled = false;
        this.fetchManagerReview();
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        alert('Error deleting review. Please try again.');
        this.deleting = false;
        this.cdRef.detectChanges();
      }
    });
  }

  canSubmitReview(): boolean {
    const requiredFields = ['performance', 'projectDependency', 'knowledgeTransfer', 'noticePeriod'];
    const allFieldsFilled = requiredFields.every(field => !!this.reviewData[field]);
    
    const remarksValid = this.reviewData.noticePeriod !== 'Yes' || 
                        (this.reviewData.noticePeriod === 'Yes' && this.reviewData.remarks?.trim());
    
    return allFieldsFilled && remarksValid;
  }

  areActionsDisabled(): boolean {
    return !this.validateReviewData() || this.submitting || this.isManagerFormDisabled;
  }

  getDisplayValue(field: string): string {
    const value = this.reviewData[field];
    if (field === 'projectDependency' || field === 'noticePeriod') {
      if (value === 1) return 'Yes';
      if (value === 0) return 'No';
      return 'Not rated';
    }
    return value || 'Not rated';
  }

  getDisplayValueForReview(field: string): string {
    if (!this.managerReview) return 'Not rated';
    const value = (this.managerReview as any)[field];
    if (field === 'projectDependency' || field === 'noticePeriod') {
      if (value === 1) return 'Yes';
      if (value === 0) return 'No';
      return 'Not rated';
    }
    return value || 'Not rated';
  }

  getCurrentForm(): ExitForm | null {
    return this.exitForms.length > 0 ? this.exitForms[0] : null;
  }

  getFirstForm(): ExitForm | null {
    return this.getCurrentForm();
  }

  getEmployeeName(): string {
    const form = this.getCurrentForm();
    return form ? (form.employeeName || 'Employee') : (this.employeeData?.employeeName || 'Employee');
  }

  getEmployeeId(): string {
    const form = this.getCurrentForm();
    return form?.employeeId?.toString() || this.viewingEmployee || '';
  }

  getFormId(): string {
    const form = this.getCurrentForm();
    return form && (form as any).id ? (form as any).id.toString() : 'N/A';
  }

  getReason(): string {
    const form = this.getCurrentForm();
    return form ? ((form as any).reason || 'N/A') : 'N/A';
  }

  isCircleClickable(step: number): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form); 
    const currentStep = this.getProgressStep(status);
    
    if (step === currentStep) {
      switch(step) {
        case 2: // Manager
          return this.canEditManagerReview() && !this.isManagerFormDisabled;
        case 3: // HR Round 1
          return this.canActAsHR() && !this.isHRFormDisabled; // 🟢 UPDATED
        case 4: // System Admin
          return this.isSystemAdmin() && !this.isAssetFormDisabled;
        case 5: // HR Round 2
          return this.canActAsHR() && !this.isHRFormDisabled; // 🟢 UPDATED
        case 6: // Payroll
          return this.isPayrollUser() && !this.isHRFormDisabled;
        case 7: // Final HR
          return this.canActAsHR() && !this.isHRFormDisabled; // 🟢 UPDATED
        default:
          return false;
      }
    }
    
    if (step < currentStep) {
      const hasViewPermission = 
        this.canActAsHR() || // 🟢 UPDATED: Include CEO
        this.isSystemAdmin() || 
        this.isPayrollUser() || 
        this.canEditManagerReview();
      
      return hasViewPermission;
    }
    
    return false;
  }

  private getAllowedStepsForStatus(status: number): number[] {
    switch (status) {
      case 0: return [1, 2];
      case 1: return [1, 2, 3];
      case 2: return [1, 2, 3, 4];
      case 3: return [1, 2, 3, 4, 5];
      case 4: return [1, 2, 3, 4, 5, 6];
      case 10: return [1, 2, 3, 4, 5, 6, 7];
      case 11: return [1, 2, 3, 4, 5, 6, 7, 8];
      case 5: case 6: case 7: case 8: return [1, 2, 3, 4, 5];
      default: return [1, 2, 3];
    }
  }

  navigateToStep(step: number) {
    const form = this.getFirstForm();
    if (!form) return;

    const status = this.getFormStatus(form);
    this.closeAllForms();

    console.log('🟢 Navigating to step:', step, 'Status:', status, 'Is HR/CEO:', this.canActAsHR());

    switch (step) {
      case 1: // User Form
        this.showUserForm = true;
        this.currentHRStep = 1;
        break;

      case 2: // Manager Review
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          if (this.canHRViewStepForm(2)) {
            this.showManagerReviewForm = true;
            this.showManagerReviewFormForHR = true;
            this.currentHRStep = 2;
            this.fetchManagerReview();
          } else {
            alert('Manager review not yet submitted. Cannot view this step.');
          }
        } else if (this.canEditManagerReview()) {
          this.showManagerReviewForm = true;
          this.showManagerReviewFormForHR = false;
          this.currentHRStep = 2;
          this.fetchManagerReview();
        } else {
          alert('You are not authorized to access manager review.');
        }
        break;

      case 3: // HR Round 1
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          this.showHRVerificationForm = true;
          this.currentHRStep = 3;
          this.fetchExistingHRReview();
        }
        break;

      case 4: // System Admin (Asset Clearance)
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          if (this.canHRViewStepForm(4)) {
            this.showAssetClearanceForm = true;
            this.showAssetClearanceFormForHR = true;
            this.currentHRStep = 4;
            this.selectedFormForAssetClearance = form;
            this.fetchAssetClearanceData(form.id);
          } else {
            alert('Asset clearance not yet completed by System Admin.');
          }
        } else if (this.isSystemAdmin()) {
          this.selectedFormForAssetClearance = form;
          this.showAssetClearanceForm = true;
          this.showAssetClearanceFormForHR = false;
          this.currentHRStep = 4;
          this.fetchAssetClearanceData(form.id);
        }
        break;

      case 5: // HR Round 2
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          this.selectedFormForHROffboarding = form;
          this.showHROffboardingInline = true;
          this.currentHRStep = 5;
        }
        break;

      case 6: // Payroll
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          if (this.canHRViewStepForm(6)) {
            this.showPayrollCheckForm = true;
            this.showPayrollCheckFormForHR = true;
            this.currentHRStep = 6;
            this.selectedFormForPayroll = form;
          } else {
            alert('Payroll clearance not yet completed. Cannot view this step.');
          }
        } else if (this.isPayrollUser()) {
          this.selectedFormForPayroll = form;
          this.showPayrollCheckForm = true;
          this.showPayrollCheckFormForHR = false;
          this.currentHRStep = 6;
        }
        break;

      case 7: // Final HR
        if (this.canActAsHR()) { // 🟢 UPDATED: Include CEO
          this.selectedFormForFinalHR = form;
          this.showFinalHRForm = true;
          this.showFinalHRFormForHR = true;
          this.currentHRStep = 7;
        }
        break;

      case 8: // Approved
        this.currentHRStep = 8;
        break;
    }

    this.cdRef.detectChanges();
  }

  private closeAllForms(): void {
    this.showUserForm = false;
    this.showManagerReviewForm = false;
    this.showHRVerificationForm = false;
    this.showAssetClearanceForm = false;
    this.showHROffboardingForm = false;
    this.showHROffboardingInline = false;
    this.showPayrollCheckForm = false;
    this.showFinalHRForm = false;
    this.currentStepCard = null;
  }

  closeStepCard() {
    this.currentStepCard = null;
    this.closeAllForms();
    this.cdRef.detectChanges();
  }

  shouldShowStepCard(step: number): boolean {
    return this.currentStepCard === step;
  }

  getReviewStatusText(): string {
    if (!this.managerReview) return 'Not Submitted';
    if (this.managerReview.action === 'Approve') return 'Approved';
    if (this.managerReview.action === 'Reject') return 'Rejected';
    if (this.managerReview.action === 'On-Hold') return 'On Hold';
    return 'Pending';
  }

  getReviewStatusClass(): string {
    if (!this.managerReview) return 'status-pending';
    if (this.managerReview.action === 'Approve') return 'status-approved';
    if (this.managerReview.action === 'Reject') return 'status-rejected';
    if (this.managerReview.action === 'On-Hold') return 'status-onhold';
    return 'status-pending';
  }

  getCompletionDate(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  createNewExitForm() {
    this.router.navigate(['/dashboard/exit-form']);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getFormStatus(form: any | null): number {
    if (!form) return 0;
    const possible = [
      form.status,
      form.STATUS,
      form.formStatus,
      form.form_status,
      (form as any).statusCode
    ];
    for (const p of possible) {
      if (p !== undefined && p !== null && p !== '') {
        const n = parseInt(p as any);
        if (!isNaN(n)) return n;
      }
    }
    if (form.meta && (form.meta.status || form.meta.STATUS)) {
      const n = parseInt(form.meta.status || form.meta.STATUS);
      if (!isNaN(n)) return n;
    }
    return 0;
  }

  getStatusText(status: number | undefined): string {
    if (status === undefined || status === null) return 'Submitted';
    
    if (this.shouldShowSimplifiedProgressBar()) {
      switch (status) {
        case 0: return "Pending with Manager";
        case 1: return "Pending with HR";
        case 2: case 3: case 4: case 5: case 6: return "Approved & Completed";
        case 7: return "Rejected by Manager";
        case 8: return "Rejected by HR";
        case 9: return "On Hold by Manager";
        case 10: return "On Hold by HR";
        default: return "Unknown Status";
      }
    }

    switch (status) {
      case 0: return "Pending with Manager";
      case 1: return "Pending with HR Round 1";
      case 2: return "Pending with System Admin";
      case 3: return "Pending with HR Round 2";
      case 4: return "Pending with Payroll";
      case 5: return "Pending Final HR Approval";
      case 6: return "Approved & Completed";
      case 7: return "Rejected by Manager";
      case 8: return "Rejected by HR";
      case 9: return "On Hold by Manager";
      case 10: return "On Hold by HR";
      default: return "Unknown Status";
    }
  }

  getProgressStep(status: number | undefined): number {
    if (status === undefined || status === null) return 1;

    if (this.shouldShowSimplifiedProgressBar()) {
      switch (status) {
        case 0:  return 2;
        case 1:  return 3;
        case 2: case 3: case 4: case 5: case 6:  return 4;
        case 7: case 8: case 9: case 10: return 2;
        default: return 1;
      }
    }

    switch (status) {
      case 0:  return 2;
      case 1:  return 3;
      case 2:  return 4;
      case 3:  return 5;
      case 4:  return 6;
      case 5:  return 7;
      case 6:  return 8;
      case 7: case 8: return 2;
      case 9: case 10: return 3;
      case 11: return 7;
      case 12: return 8;
      default: return 1;
    }
  }

  shouldShowProgressBar(): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    
    const userRole = this.currentUserRole.toUpperCase();
    
    return this.isPayrollUser() || this.canActAsHR() || this.isSystemAdmin() || this.isManager() || !!form;
  }

  isFormStepActive(form: ExitForm, step: number): boolean {
    const formStatus = this.getFormStatus(form);
    return this.getProgressStep(formStatus) >= step;
  }

  getFormCircleClass(form: ExitForm, step: number): string {
    const status = this.getFormStatus(form);
    const currentStep = this.getProgressStep(status);

    if (step > currentStep) {
      return 'circle-grey';
    }

    if (step === currentStep) {
      if ([7, 8].includes(status)) return 'circle-rejected';
      if ([9, 10].includes(status)) return 'circle-onhold';
      return 'circle-active';
    }

    if (step < currentStep) {
      return 'circle-completed';
    }

    return 'circle-grey';
  }

  getFormLineClass(form: ExitForm, step: number): string {
    const status = this.getFormStatus(form);
    const currentStep = this.getProgressStep(status);

    return step < currentStep ? 'line-completed' : 'line-grey';
  }

  getFormLabelClass(form: ExitForm, step: number): string {
    const status = this.getFormStatus(form);
    const currentStep = this.getProgressStep(status);

    if (step > currentStep) return 'label-grey';
    if (step === currentStep) {
      if ([7, 8].includes(status)) return 'label-rejected';
      if ([9, 10].includes(status)) return 'label-onhold';
      return 'label-active';
    }
    if (step < currentStep) return 'label-completed';

    return 'label-grey';
  }

  isSystemAdminStepActive(): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    const formStatus = this.getFormStatus(form);
    return formStatus === 2 || (this.currentHRStep === 4 && this.isSystemAdmin());
  }

  hasMultipleForms(): boolean {
    const uniqueForms = this.deduplicateForms(this.exitForms);
    return uniqueForms.length > 1;
  }

  isFieldEditable(): boolean {
    return this.canEditManagerReview() && (!this.managerReview || this.isEditMode) && !this.isManagerFormDisabled;
  }

  isActionSelected(action: string): boolean {
    return this.currentAction === action;
  }

  getStatusClass(status: number): string {
    switch(status) {
      case 0: return 'status-pending';
      case 1: return 'status-active';
      case 2: return 'status-active';
      case 3: return 'status-active';
      case 4: return 'status-approved';
      case 5: return 'status-rejected';
      case 6: return 'status-rejected';
      case 7: return 'status-onhold';
      case 8: return 'status-onhold';
      default: return 'status-pending';
    }
  }

  shouldShowManagerRestriction(): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    const formStatus = this.getFormStatus(form);
    return formStatus === 1 && !this.hasManagerReviewData();
  }

  hasManagerReviewData(): boolean {
    if (!this.managerReview) return false;
    return !!(this.managerReview.performance ||
             this.managerReview.projectDependency ||
             this.managerReview.knowledgeTransfer ||
             this.managerReview.managerRemarks ||
             this.managerReview.managerAction);
  }

  getHRVerificationTitle(): string {
    const currentForm = this.getFirstForm();
    if (!currentForm) return 'HR Verification';
    const formStatus = this.getFormStatus(currentForm);
    return formStatus === 1 ? 'HR Verification - Round 1' : 'HR Verification - Round 2';
  }

  getHRAccessMessage(): string {
    const currentUser = localStorage.getItem('username') || 'HR/CEO User';
    const role = this.isCEOUser ? 'CEO' : 'HR';
    return `${role} Access: You are authorized as ${role} (${currentUser}) to review and take action on this exit form.`;
  }

  shouldShowHRReviewData(): boolean {
    if (!this.canActAsHR() || !this.hrReview) return false;
    const currentForm = this.getFirstForm();
    if (!currentForm) return false;
    const formStatus = this.getFormStatus(currentForm);
    return formStatus === 2 && this.hrReview !== null;
  }

  getSystemAdminInfo(): string {
    return 'This exit form is currently with System Admin for further processing. The HR review has been completed and submitted.';
  }

  onHROffboardingSubmitted(result: any) {
    console.log('HR Offboarding submitted:', result);
    if (result && result.success) {
      alert('HR Offboarding checklist completed successfully! Opening Payroll Clearance...');
      this.fetchExitForms();
      
      setTimeout(() => {
        const form = this.getFirstForm();
        if (form && this.getFormStatus(form) === 4) {
          this.selectedFormForPayroll = form;
          this.showPayrollCheckForm = true;
          this.currentHRStep = 6;
          this.cdRef.detectChanges();
        }
      }, 1000);
    }
  }

  onPayrollSubmitted(result: any) {
    console.log('Payroll submitted:', result);
    if (result && result.success) {
      this.fetchExitForms();
      this.closeStepCard();
      alert('Payroll clearance completed successfully!');
    }
  }

  onFinalHRSubmitted(result: any) {
    console.log('Final HR submitted:', result);
    if (result && result.success) {
      this.fetchExitForms();
      this.closeStepCard();
      alert('Final HR approval completed successfully!');
    }
  }

  onUserFormSubmitted(result: any) {
    console.log('User form submitted:', result);
    if (result && result.success) {
      this.fetchExitForms();
      this.closeStepCard();
      alert('User exit form submitted successfully!');
    }
  }

  onManagerReviewSubmitted(result: any) {
    console.log('Manager review submitted:', result);
    if (result && result.success) {
      this.fetchExitForms();
      this.fetchManagerReview();
      this.closeStepCard();
      alert('Manager review submitted successfully!');
    }
  }

  onHRVerificationSubmitted(result: any) {
    console.log('HR Verification submitted:', result);
    if (result && result.success) {
      this.fetchExitForms();
      this.closeStepCard();
      alert('HR verification submitted successfully!');
    }
  }

  handleAssetClearanceSubmitted(result: any) {
    console.log('Asset clearance submitted:', result);
    if (result && result.success) {
      alert('Asset clearance submitted successfully!');
      this.fetchExitForms();
      
      if (this.isSystemAdmin()) {
        const form = this.getFirstForm();
        if (form && this.getFormStatus(form) === 2 && form.id) {
          const updatePayload: any = {
            ...form,
            status: 3,
            updatedBy: localStorage.getItem('username') || 'System Admin',
            updatedDate: new Date().toISOString()
          };
          
          const formId = form.id.toString();
          this.apiService.updateExitForm(formId, updatePayload).subscribe({
            next: (response: any) => {
              console.log('Form status updated to HR Round 2');
              this.fetchExitForms();
            },
            error: (error: any) => {
              console.error('Error updating form status:', error);
            }
          });
        }
      }
      
      this.closeStepCard();
    }
  }

  onAssetClearanceSubmitted(result: any) {
    this.handleAssetClearanceSubmitted(result);
  }

  isFormRejected(form: any): boolean {
    const status = this.getFormStatus(form);
    return status === 7 || status === 8;
  }

  isFormOnHold(form: any): boolean {
    const status = this.getFormStatus(form);
    return status === 9 || status === 10;
  }

  getStatusMessage(form: any): string {
    const status = this.getFormStatus(form);
    switch (status) {
      case 7: return 'Rejected by Manager';
      case 8: return 'Rejected by HR';
      case 9: return 'On Hold by Manager';
      case 10: return 'On Hold by HR';
      default: return this.getStatusText(status);
    }
  }

  openFinalHRForm(form?: any) {
    const targetForm = form || this.getFirstForm();
    
    if (!targetForm || !targetForm.id) {
      console.error('Cannot open Final HR form - no valid form found');
      alert('Please select a valid form for Final HR approval');
      return;
    }

    this.selectedFormForFinalHR = targetForm;
    this.showFinalHRForm = true;
    this.currentHRStep = 7;
    
    this.cdRef.detectChanges();
  }

  closeFinalHRForm() {
    this.showFinalHRForm = false;
    this.selectedFormForFinalHR = null;
    this.currentHRStep = null;
    this.cdRef.detectChanges();
  }

  isCurrentUserFormOwner(): boolean {
    const form = this.getFirstForm();
    if (!form || !this.employeeId) return false;
    
    return form.employeeId?.toString() === this.employeeId.toString();
  }

  shouldShowSimplifiedProgressBar(): boolean {
    return this.isCurrentUserFormOwner();
  }

  isViewingOthersFormAsSpecialRole(): boolean {
    return (this.canActAsHR() || this.isManager() || this.isSystemAdmin() || this.isPayrollUser()) && 
           !this.isCurrentUserFormOwner();
  }

  isFormReadOnlyForHR(step: number): boolean {
    if (!this.canActAsHR()) return false;
    
    const form = this.getFirstForm();
    if (!form) return true;
    
    const status = this.getFormStatus(form);
    
    switch (step) {
      case 3: return status !== 1;
      case 5: return status !== 3;
      case 7: return status !== 5;
      default: return true;
    }
  }

  getAssetStatusColor(status: string): string {
    if (!status) return '#6c757d';
    
    switch(status.toLowerCase()) {
      case 'good': return '#28a745';
      case 'damaged': return '#ffc107';
      case 'missing': return '#dc3545';
      case 'not applicable': return '#6c757d';
      default: return '#6c757d';
    }
  }

  // 🟢 UPDATED: Check if HR/CEO can view a particular step's form
  canHRViewStepForm(step: number): boolean {
    if (!this.canActAsHR()) return false;
    
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    
    switch(step) {
      case 2: return status >= 1;
      case 4: return status >= 3;
      case 6: return status >= 4;
      case 7: return status >= 5;
      default: return false;
    }
  }

  canHRViewFormData(step: number): boolean {
    if (!this.canActAsHR()) return false;
    
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    
    switch(step) {
      case 2: return status >= 1 && this.managerReview !== null;
      case 4: return status >= 3 && this.assetClearanceData.length > 0;
      case 6: return status >= 4;
      case 7: return status >= 5;
      default: return false;
    }
  }

  isAssetClearanceViewableForHR(): boolean {
    if (!this.canActAsHR()) return false;
    
    const form = this.getFirstForm();
    if (!form) return false;
    
    const status = this.getFormStatus(form);
    return status >= 3 && this.assetClearanceData.length > 0;
  }

  formatDateTime(dateTime: any): string {
    if (!dateTime) return 'Not submitted';
    
    try {
      if (typeof dateTime === 'string') {
        const date = new Date(dateTime);
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (dateTime.date) {
        const date = new Date(
          dateTime.year, 
          dateTime.monthValue - 1, 
          dateTime.dayOfMonth,
          dateTime.hour,
          dateTime.minute,
          dateTime.second
        );
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  }

  getUserSubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.userSubmittedOn || form.createdOn);
  }

  getManagerSubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.managerSubmittedOn);
  }

  getHRRound1SubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.hrRound1SubmittedOn);
  }

  getAssetSubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.assetSubmittedOn);
  }

  getHRRound2SubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.hrRound2SubmittedOn);
  }

  getPayrollSubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.payrollSubmittedOn);
  }

  getFinalHRSubmittedDate(): string {
    const form = this.getFirstForm();
    if (!form) return 'Not submitted';
    
    return this.formatDateTime(form.finalHrSubmittedOn);
  }

  isStepCompleted(step: string): boolean {
    const form = this.getFirstForm();
    if (!form) return false;
    
    switch(step) {
      case 'user': return !!form.userSubmittedOn;
      case 'manager': return !!form.managerSubmittedOn;
      case 'hr1': return !!form.hrRound1SubmittedOn;
      case 'asset': return !!form.assetSubmittedOn;
      case 'hr2': return !!form.hrRound2SubmittedOn;
      case 'payroll': return !!form.payrollSubmittedOn;
      case 'final': return !!form.finalHrSubmittedOn;
      default: return false;
    }
  }
}