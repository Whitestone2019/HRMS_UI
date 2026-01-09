import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';

interface ChecklistItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-final-exit-approval',
  templateUrl: './final-exit-approval.component.html',
  styleUrls: ['./final-exit-approval.component.css']
})
export class FinalExitApprovalComponent implements OnInit, OnChanges {

  @Input() exitFormId!: string;

  checklistForm!: FormGroup;
  showSuccess = false;
  isSubmitted = false;
  isLoading = true;

  finalHrData: any = {
    finalHrRemarks: '',
    finalHrApprovedBy: '',
    finalHrApprovedOn: '',
    isSubmitted: false
  };

  // UPDATED: Use the correct 8 labels from your image
  checklistItems: ChecklistItem[] = [
    { key: 'All department clearances complete', label: 'All department clearances complete' },
    { key: 'PF /ESI Exit updated (DOE updated + Verified)', label: 'PF /ESI Exit updated (DOE updated + Verified)' },
    { key: 'KT completed', label: 'KT completed' },
    { key: 'F&F Done', label: 'F&F Done' },
    { key: 'Payroll cleared', label: 'Payroll cleared' },
    { key: 'Assets returned', label: 'Assets returned' },
    { key: 'Exit interview done', label: 'Exit interview done' },
    { key: 'Relieving and Experience letter shared to employee', label: 'Relieving and Experience letter shared to employee' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadFinalHrData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exitFormId'] && changes['exitFormId'].currentValue) {
      console.log('🟢 FinalExitApprovalComponent received formId:', this.exitFormId);
      this.loadFinalHrData();
    }
  }

  createForm() {
    const controls: any = {};
    this.checklistItems.forEach(item => {
      controls[`${item.key}_checked`] = [false];
      controls[`${item.key}_comment`] = [''];
    });
    controls['finalRemarks'] = ['', Validators.required];
    this.checklistForm = this.fb.group(controls);
  }

  isChecked(item: ChecklistItem): boolean {
    return this.checklistForm.get(`${item.key}_checked`)?.value === true;
  }

  get completedCount(): number {
    return this.checklistItems.filter(item => this.isChecked(item)).length;
  }

  get canSubmit(): boolean {
    if (this.isSubmitted || this.isLoading) return false;

    const allChecked = this.checklistItems.every(item => this.isChecked(item));
    const allHaveComments = this.checklistItems.every(item =>
      this.isChecked(item)
        ? (this.checklistForm.get(`${item.key}_comment`)?.value || '').trim() !== ''
        : true
    );
    const finalRemarksValid = this.checklistForm.get('finalRemarks')?.valid === true;

    return allChecked && allHaveComments && finalRemarksValid;
  }

  onCheckboxChange(item: ChecklistItem) {
    const checked = this.isChecked(item);
    const commentCtrl = this.checklistForm.get(`${item.key}_comment`);
    if (checked) {
      commentCtrl?.setValidators(Validators.required);
    } else {
      commentCtrl?.clearValidators();
      commentCtrl?.setValue('');
    }
    commentCtrl?.updateValueAndValidity();
  }

  loadFinalHrData(): void {
    if (!this.exitFormId) {
      console.error('❌ FinalExitApprovalComponent: No exitFormId provided');
      this.isLoading = false;
      return;
    }

    console.log('🟢 Loading Final HR data for form ID:', this.exitFormId);
    this.isLoading = true;

    this.apiService.getFinalHrApprovalData(this.exitFormId).subscribe({
      next: (res: any) => {
        console.log('🟢 Final HR API Response:', res);
        
        if (res.success && res.data?.isSubmitted) {
          this.finalHrData = res.data;
          this.isSubmitted = true;
          this.showSuccess = true;

          // Auto-fill form with existing data
          this.checklistForm.patchValue({
            finalRemarks: this.finalHrData.finalHrRemarks || ''
          });

          // If we have checklist data, populate it
          if (this.finalHrData.finalChecklistData) {
            this.populateChecklistFromStoredData(this.finalHrData.finalChecklistData);
          } else {
            // Otherwise mark all as checked
            this.checklistItems.forEach(item => {
              this.checklistForm.get(`${item.key}_checked`)?.setValue(true);
            });
          }

          this.checklistForm.disable();
          console.log('✅ Final HR data loaded successfully - form is submitted');
        } else {
          console.log('🟡 Final HR data not submitted yet - showing empty form');
          this.isSubmitted = false;
          this.showSuccess = false;
          this.checklistForm.enable();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading Final HR data:', error);
        this.isLoading = false;
        this.isSubmitted = false;
        this.showSuccess = false;
        this.checklistForm.enable();
      }
    });
  }

  // NEW METHOD: Parse stored checklist data
  populateChecklistFromStoredData(checklistData: string): void {
    if (!checklistData) return;
    
    console.log('Parsing stored checklist data:', checklistData);
    
    // Reset all checkboxes
    this.checklistItems.forEach(item => {
      this.checklistForm.get(`${item.key}_checked`)?.setValue(false);
      this.checklistForm.get(`${item.key}_comment`)?.setValue('');
    });
    
    // Parse the format: "Label1 : Comment1 || Label2 : Comment2"
    const items = checklistData.split('||').map(item => item.trim());
    
    items.forEach(item => {
      if (item.includes(':')) {
        const [labelPart, ...commentParts] = item.split(':');
        const label = labelPart.trim();
        const comment = commentParts.join(':').trim();
        
        // Find matching checklist item
        const checklistItem = this.checklistItems.find(i => 
          label.includes(i.label) || i.label.includes(label)
        );
        
        if (checklistItem) {
          this.checklistForm.get(`${checklistItem.key}_checked`)?.setValue(true);
          this.checklistForm.get(`${checklistItem.key}_comment`)?.setValue(comment);
        }
      }
    });
  }

  // NEW METHOD: Prepare checklist data for submission
  prepareChecklistData(): string {
    const checklistData: string[] = [];
    
    this.checklistItems.forEach(item => {
      const checked = this.checklistForm.get(`${item.key}_checked`)?.value;
      const comment = this.checklistForm.get(`${item.key}_comment`)?.value;
      
      if (checked && comment) {
        // Format: "Label : Comment"
        checklistData.push(`${item.label} : ${comment}`);
      }
    });
    
    // Join with " || " separator
    return checklistData.join(' || ');
  }

  onSubmit() {
    if (!this.canSubmit || this.isSubmitted) {
      console.log('❌ Cannot submit:', {
        canSubmit: this.canSubmit,
        isSubmitted: this.isSubmitted,
        exitFormId: this.exitFormId
      });
      return;
    }

    if (!this.exitFormId) {
      alert('Error: No form ID available');
      return;
    }

    const finalRemarks = this.checklistForm.get('finalRemarks')?.value;
    const finalChecklistData = this.prepareChecklistData();
    
    console.log('🟢 Submitting Final HR approval for form:', this.exitFormId);
    console.log('Final Remarks:', finalRemarks);
    console.log('Final Checklist Data:', finalChecklistData);

    // Send both finalRemarks and finalChecklistData
    this.apiService.finalHrApproval(this.exitFormId, finalRemarks, finalChecklistData).subscribe({
      next: (res: any) => {
        console.log('🟢 Final HR Submission Response:', res);
        if (res.success) {
          this.showSuccess = true;
          this.isSubmitted = true;
          this.checklistForm.disable();
          alert('✅ EXIT CLOSED SUCCESSFULLY!');
        } else {
          alert('Failed to close exit: ' + (res.message || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('❌ Final HR Submission Error:', error);
        alert('Failed to close exit. Please try again.');
      }
    });
  }
}