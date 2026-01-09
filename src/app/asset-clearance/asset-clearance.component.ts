import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asset-clearance',
  templateUrl: './asset-clearance.component.html',
  styleUrls: ['./asset-clearance.component.css']
})
export class AssetClearanceComponent implements OnInit, OnChanges {
  @Input() exitFormId!: string;
  assetForm!: FormGroup;
  isSubmitting = false;
  isLoading = false;
  isSubmitted = false;
  isUpdateMode = false; 
  defaultAssets = ['Laptop', 'Laptop Charger'];
  conditions = ['Good', 'Average', 'OK', 'Bad', 'Not Received'];
  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router) {}
  ngOnInit(): void {
    this.initializeForm();
    if (this.exitFormId) this.loadExistingAssetData();
   
    // 🟢 Listen to form changes to enable/disable submit button
    this.assetForm.valueChanges.subscribe(() => {
      this.updateSubmitButtonState();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exitFormId']?.currentValue && changes['exitFormId'].currentValue !== changes['exitFormId'].previousValue) {
      this.loadExistingAssetData();
    }
  }
  initializeForm(): void {
    this.assetForm = this.fb.group({
      assets: this.fb.array([]),
      extraAssetName: ['']
    });
  }
  loadExistingAssetData(): void {
    if (!this.exitFormId) return;
    this.isLoading = true;
    this.isSubmitted = false;
    this.isUpdateMode = false;
    this.apiService.getAssetClearance(this.exitFormId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success && response.assetClearance) {
          const str = (response.assetClearance || '').toString().trim();
          if (str && str !== 'null') {
            const parsed = this.parseAssetString(str);
            const controls = parsed.map(a => this.fb.group({
              name: [a.name],
              condition: [a.condition, Validators.required],
              comments: [a.comments || '']
            }));
            this.assetForm.setControl('assets', this.fb.array(controls));
            this.isSubmitted = true; // Form is already submitted
            this.assetForm.disable(); // Disable form in view mode
            return;
          }
        }
        // Fresh form - add default assets with required validation
        this.isSubmitted = false;
        this.isUpdateMode = false;
        this.assetForm.enable();
        if (this.assets.length === 0) {
          this.defaultAssets.forEach(n => this.addAsset(n));
        }
      },
      error: () => {
        this.isLoading = false;
        this.isSubmitted = false;
        this.isUpdateMode = false;
        this.assetForm.enable();
        if (this.assets.length === 0) {
          this.defaultAssets.forEach(n => this.addAsset(n));
        }
      }
    });
  }
  // 🟢 NEW METHOD: Enable edit mode
  enableEditMode(): void {
    this.isUpdateMode = true;
    this.isSubmitted = false;
    this.assetForm.enable();
  }
  // 🟢 NEW METHOD: Cancel edit mode
  cancelEdit(): void {
    // Reload the original data
    this.loadExistingAssetData();
  }
  // 🟢 NEW METHOD: Check if all assets have a condition selected
  isFormValid(): boolean {
    if (this.isSubmitted && !this.isUpdateMode) return false;
   
    const assetsArray = this.assets;
    if (!assetsArray || assetsArray.length === 0) return false;
   
    // Check if every asset has a condition selected
    return assetsArray.controls.every(assetControl => {
      const condition = assetControl.get('condition')?.value;
      return condition && condition.trim() !== '';
    });
  }
  // 🟢 NEW METHOD: Update submit button state
  updateSubmitButtonState(): void {
    // This method is called on form value changes
  }
  // 🟢 NEW METHOD: Get submit button text based on mode
  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.isUpdateMode ? 'Updating...' : 'Submitting...';
    }
    return this.isUpdateMode ? 'Update Asset Clearance' : 'Submit Asset Clearance';
  }
  // BULLETPROOF PARSER — WORKS WITH YOUR EXACT STRING
  parseAssetString(str: string): { name: string; condition: string; comments: string }[] {
    if (!str) return [];
    return str.split('#')
      .map(p => p.trim())
      .filter(p => p)
      .map(part => {
        const colon = part.indexOf(':');
        if (colon === -1) return null;
        const name = part.substring(0, colon).trim();
        const rest = part.substring(colon + 1).trim();
        const [cond, comm = ''] = rest.split('||').map(x => x.trim());
        const comments = comm.toLowerCase() === 'null' ? '' : comm;
        return { name, condition: cond || '', comments };
      })
      .filter(Boolean) as any[];
  }
  get assets(): FormArray {
    return this.assetForm.get('assets') as FormArray;
  }
  addAsset(name: string): void {
    if (this.isSubmitted && !this.isUpdateMode) return;
    this.assets.push(this.fb.group({
      name: [name],
      condition: ['', Validators.required], // 🟢 Initially empty, required
      comments: ['']
    }));
  }
  addNewAsset(): void {
    if (this.isSubmitted && !this.isUpdateMode) return;
    const val = this.assetForm.get('extraAssetName')?.value?.trim();
    if (val) {
      this.addAsset(val);
      this.assetForm.patchValue({ extraAssetName: '' });
    }
  }
  removeAsset(i: number): void {
    if ((this.isSubmitted && !this.isUpdateMode) || i < this.defaultAssets.length) return;
    this.assets.removeAt(i);
  }
  // 🟢 UPDATED: Smart submit method that handles both create and update
  submit(): void {
    if (this.isSubmitting) return;
   
    // Validate form before submitting
    if (!this.isFormValid()) {
      alert('Please select a condition for all assets before submitting.');
      return;
    }
   
    this.isSubmitting = true;
    // Prepare payload according to your backend structure
    const payload = {
      assets: this.assets.controls.map(assetControl => ({
        name: assetControl.get('name')?.value,
        condition: assetControl.get('condition')?.value,
        comments: assetControl.get('comments')?.value || ''
      })),
      extraAssetName: this.assetForm.get('extraAssetName')?.value || ''
    };
    console.log(`${this.isUpdateMode ? 'Updating' : 'Submitting'} asset clearance:`, payload);
    // Use the appropriate API method based on mode
    const apiCall = this.isUpdateMode
      ? this.apiService.updateAssetClearance(this.exitFormId, payload)
      : this.apiService.submitAssetClearance(this.exitFormId, payload);
    apiCall.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.success) {
          const message = this.isUpdateMode
            ? 'Asset Clearance Updated Successfully!'
            : 'Asset Clearance Submitted Successfully!';
         
          alert(message);
          this.isSubmitted = true;
          this.isUpdateMode = false; // Reset to view mode after update
          this.assetForm.disable();
          // Redirect after submission
          setTimeout(() => {
            // this.router.navigate(['/exit-form', this.exitFormId]);
          }, 1000);
        } else {
          alert('Error: ' + (res.message || 'Failed to save asset clearance'));
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(`Error ${this.isUpdateMode ? 'updating' : 'submitting'} asset clearance. Please try again.`);
        console.error(err);
      }
    });
  }
  // Add this method to your component class
getConditionColor(condition: string): string {
  if (!condition) return '#6c757d';
 
  switch(condition.toLowerCase()) {
    case 'good': return '#28a745';
    case 'average': return '#ffc107';
    case 'ok': return '#17a2b8';
    case 'bad': return '#dc3545';
    case 'not received': return '#6c757d';
    default: return '#6c757d';
  }
}
}