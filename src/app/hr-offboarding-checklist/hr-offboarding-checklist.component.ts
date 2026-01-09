import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hr-offboarding-checklist',
  templateUrl: './hr-offboarding-checklist.component.html',
  styleUrls: ['./hr-offboarding-checklist.component.css']
})
export class HrOffboardingChecklistComponent implements OnInit {

  @Input() exitFormId!: string;

  form!: FormGroup;
  isLoading = true;
  isSubmitted = false;
  isEditMode = false;     // EDITING MODE (for updates)
  isSubmitting = false;
  userRole: string = '';

  defaultItems = [
    'ID card',
    'Access/door pass',
    'SIM card',
    'Other physical assets (Keys / Documents etc)'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';

    if (!['HR', 'R003','CTO','CEO'].includes(this.userRole)) {
      alert('Access Denied: Only HR can access this page.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initForm();
    if (this.exitFormId) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      items: this.fb.array([]),
      newItem: ['']
    });
    this.defaultItems.forEach(label => this.addItem(label));
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItem(label: string, status = 'Cleared', comments = ''): FormGroup {
    return this.fb.group({
      label: [label],
      status: [status, Validators.required],
      comments: [comments]
    });
  }

  addItem(label: string, status = 'Cleared', comments = ''): void {
    this.items.push(this.createItem(label, status, comments));
  }

  addCustomItem(): void {
    // Allow adding items when NOT in view mode (i.e., when form is editable)
    if (this.isSubmitted && !this.isEditMode) return; // Don't allow in view mode
    
    const val = this.form.get('newItem')?.value?.trim();
    if (val) {
      this.addItem(val);
      this.form.patchValue({ newItem: '' });
    }
  }

  removeItem(index: number): void {
    // Only allow removing custom items, and only when form is editable
    if ((this.isSubmitted && !this.isEditMode) || index < this.defaultItems.length) return;
    this.items.removeAt(index);
  }

  buildString(): string {
    return this.items.value
      .map((item: any) => {
        const c = item.comments?.trim() || '';
        const commentPart = c ? ` || ${c}` : ' || ';
        return `${item.label} : ${item.status}${commentPart}`;
      })
      .join(' # ');
  }

  parseString(data: string): void {
    this.items.clear();
    if (!data || data.trim() === '' || data === 'null') {
      this.defaultItems.forEach(l => this.addItem(l));
      return;
    }

    const parts = data.split('#').map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      const colon = part.indexOf(':');
      if (colon === -1) return;
      const label = part.substring(0, colon).trim();
      const rest = part.substring(colon + 1).trim();
      const [status, comment] = rest.split('||').map(s => s.trim());
      this.addItem(label, status || 'Cleared', comment && comment !== 'null' ? comment : '');
    });

    // Always ensure default items exist
    this.defaultItems.forEach(def => {
      const exists = this.items.value.some((i: any) => i.label === def);
      if (!exists) this.addItem(def);
    });
  }

  loadData(): void {
    this.apiService.getHrOffboardingData(this.exitFormId).subscribe({
      next: (res: any) => {
        if (res.success && res.offboardingData && res.offboardingData.trim()) {
          this.parseString(res.offboardingData);
          this.isSubmitted = true;
          this.form.disable();
        } else {
          this.isSubmitted = false;
          this.form.enable();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Error loading data');
      }
    });
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.form.enable();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.loadData(); // Reload original data
  }

  // NEW METHOD: Check if form is editable
  isFormEditable(): boolean {
    return !this.isSubmitted || this.isEditMode;
  }

  submit(): void {
    if (this.isSubmitting) return;

    const invalid = this.items.controls.some((c: any) => {
      const status = c.get('status')?.value;
      const comment = c.get('comments')?.value?.trim();
      return (status === 'Pending' || status === 'Issues found') && !comment;
    });

    if (invalid) {
      alert('Please fill comments for all "Pending" or "Issues found" items!');
      return;
    }

    this.isSubmitting = true;
    const finalString = this.buildString();
    const payload = { offboarding_checks: finalString };

    const apiCall = this.isEditMode
      ? this.apiService.updateHrOffboarding(this.exitFormId, payload)
      : this.apiService.submitHrOffboarding(this.exitFormId, payload);

    apiCall.subscribe({
      next: (res: any) => {
        if (res.success) {
          alert(this.isEditMode ? 'HR Offboarding Updated Successfully!' : 'Submitted Successfully!');
          this.isSubmitted = true;
          this.isEditMode = false;
          this.form.disable();
        }
      },
      error: () => {
        alert('Failed to save. Please try again.');
        this.isSubmitting = false;
      },
      complete: () => this.isSubmitting = false
    });
  }
}