import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-designation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" *ngIf="visible">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ designation ? 'Edit' : 'Add' }} Designation</h4>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()" class="designation-form">
            <!-- Designation Name -->
            <div class="form-group">
              <label for="designationName">Designation Name</label>
              <input 
                id="designationName" 
                type="text" 
                class="form-control" 
                [(ngModel)]="formData.title" 
                name="name" 
                placeholder="Enter Designation Name" 
                required>
            </div>

            <!-- Department -->
            <div class="form-group">
              <label for="department">Department</label>
              <select (click)="$event.stopPropagation()"
                id="department" 
                class="form-control" 
                [(ngModel)]="formData.department" 
                name="department" 
                required>
                <option *ngFor="let dept of departments" [value]="dept.id">
                  {{ dept.name }}
                </option>
              </select>
            </div>

            <!-- Salary Min -->
            <div class="form-group">
              <label for="salaryMin">Salary Min</label>
              <input 
                id="salaryMin" 
                type="number" 
                class="form-control" 
                [(ngModel)]="formData.salaryMin" 
                name="salaryMin" 
                placeholder="Enter Salary Min" 
                required>
            </div>

            <!-- Salary Max -->
            <div class="form-group">
              <label for="salaryMax">Salary Max</label>
              <input 
                id="salaryMax" 
                type="number" 
                class="form-control" 
                [(ngModel)]="formData.salaryMax" 
                name="salaryMax" 
                placeholder="Enter Salary Max" 
                required>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label for="status">Status</label>
              <select
                (click)="$event.stopPropagation()"
                id="status"
                class="form-control"
                [(ngModel)]="formData.status"
                name="status"
                required>
                <option value="Active">Active</option>
                <option value="Non Active">Non Active</option>
              </select>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="close.emit()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" [disabled]="loading">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [/* Add your modal styles here */]
})
export class DesignationFormComponent {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  @Input() visible = false;
  @Input() designation: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  formData = {
    title: '',
    department: '',
    salaryMin: null,
    salaryMax: null,
    status: '',
    rCreUserId: this.employeeId,
  };
  loading = false;
  departments: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDepartments();
  }

  ngOnChanges() {
    if (this.designation) {
      this.formData = { ...this.designation };
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      title: '',
      department: '',
      salaryMin: null,
      salaryMax: null,
      status: '',
      rCreUserId: this.employeeId,
    };
  }

  loadDepartments() {
    this.apiService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
      },
    });
  }

  onSubmit() {
    this.loading = true;

    if (this.designation) {
      this.apiService
        .updateDesignation(this.designation.id, this.formData)
        .subscribe({
          next: (response) => {
            this.save.emit(response);
            this.loading = false;
            this.close.emit();
          },
          error: (error) => {
            this.loading = false;
            console.error('Error updating designation:', error);
          },
        });
    } else {
      this.apiService
        .addDesignation(this.formData)
        .subscribe({
          next: (response) => {
            this.save.emit(response);
            this.loading = false;
            this.close.emit();
          },
          error: (error) => {
            this.loading = false;
            console.error('Error creating designation:', error);
          },
        });
    }
  }
}
