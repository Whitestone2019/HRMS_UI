// src/app/Payroll/components/settings/designations/designation-form.component.ts
import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { ApiService, Designation } from '../../../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-designation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Overlay -->
    <div class="modal-overlay" *ngIf="visible" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4>{{ designation ? 'Edit Designation' : 'Add Designation' }}</h4>
          <button type="button" class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()" class="designation-form">
            <!-- Role ID -->
            <div class="form-group">
              <label for="roleId">Role ID *</label>
              <input 
                id="roleId" 
                type="text" 
                class="form-control" 
                [(ngModel)]="formData.roleId" 
                name="roleId" 
                placeholder="Enter Role ID"
                required>
            </div>

            <!-- Role Name -->
            <div class="form-group">
              <label for="roleName">Role Name *</label>
              <input 
                id="roleName" 
                type="text" 
                class="form-control" 
                [(ngModel)]="formData.roleName" 
                name="roleName" 
                placeholder="Enter Role Name"
                required>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                class="form-control"
                [(ngModel)]="formData.description"
                name="description"
                placeholder="Enter role description"
                rows="3">
              </textarea>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="closeModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="loading || !formData.roleId || !formData.roleName">
                {{ loading ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }

    .modal-header h4 {
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      line-height: 1;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    /* Form Styles */
    .designation-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .form-control:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      min-width: 80px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
    }

    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.2);
    }

    /* Responsive */
    @media (max-width: 576px) {
      .modal-content {
        width: 95%;
        margin: 10px;
      }
      
      .modal-header,
      .modal-body {
        padding: 15px;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  `]
})
export class DesignationFormComponent implements OnInit, OnChanges {
  employeeId: string = localStorage.getItem('employeeId') || 'SYSTEM';
  
  @Input() visible = false;
  @Input() designation: Designation | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Designation>();

  formData: Designation = {
    designationname: '',
    roleId: '',
    roleName: '',
    description: '',
    department: '',  // Keep as empty string
    status: 'ACTIVE', // Default status
    salaryrange: '0 - 0',
    rcreuserid: this.employeeId
  };

  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Removed loadDepartments() since we don't need departments dropdown
  }

  ngOnChanges() {
    if (this.designation) {
      // Make sure to include the new properties when copying
      this.formData = { 
        ...this.designation,
        roleId: this.designation.roleId || '',
        roleName: this.designation.roleName || '',
        description: this.designation.description || ''
      };
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      designationname: '',
      roleId: '',
      roleName: '',
      description: '',
      department: '',  // Keep as empty string
      status: 'ACTIVE', // Default status
      salaryrange: '0 - 0',
      rcreuserid: this.employeeId
    };
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    // Set designationname from roleName for backward compatibility
    if (this.formData.roleName) {
      this.formData.designationname = this.formData.roleName;
    }

    // Validate required fields - only roleId and roleName now
    if (!this.formData.roleId || !this.formData.roleName) {
      alert('Please fill all required fields');
      return;
    }

    this.loading = true;

    // Add default salary range for new designations
    if (!this.designation) {
      this.formData.salaryrange = '15000 - 25000';
    }

    if (this.designation && this.designation.designationid) {
      // Update existing designation
      this.apiService.updateDesignations(this.designation.designationid, this.formData)
        .subscribe({
          next: (response: Designation) => {
            this.loading = false;
            this.save.emit(response);
            this.closeModal();
          },
          error: (error: any) => {
            this.loading = false;
            console.error('Error updating designation:', error);
            alert('Error updating designation. Please try again.');
          }
        });
    } else {
      // Add new designation
      this.formData.designationid = `DESG${Date.now()}`;
      this.apiService.addDesignations(this.formData)  // Changed to addDesignations
        .subscribe({
          next: (response: Designation) => {
            this.loading = false;
            this.save.emit(response);
            this.closeModal();
          },
          error: (error: any) => {
            this.loading = false;
            console.error('Error creating designation:', error);
            alert('Error creating designation. Please try again.');
          }
        });
    }
  }
}