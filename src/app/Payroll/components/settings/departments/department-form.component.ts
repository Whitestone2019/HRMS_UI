import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" *ngIf="visible">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{department ? 'Edit' : 'Add'}} Department</h4>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Department Name</label>
              <input type="text" class="form-control" [(ngModel)]="formData.name" name="name" required>
            </div>
             <div class="form-group">
              <label>Department Code</label>
              <input type="text" class="form-control" [(ngModel)]="formData.code" name="Code" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" [(ngModel)]="formData.description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select (click)="$event.stopPropagation()" class="form-control" [(ngModel)]="formData.status" name="status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Department</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
  .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 400px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eaeaea;
      margin-bottom: 1rem;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-secondary {
      background: #e0e0e0;
      color: #333;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary:hover {
      background: #d6d6d6;
    }

    .btn-primary:hover {
      background: #0056b3;
    }
  `]
})
export class DepartmentFormComponent {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  @Input() visible = false;
  @Input() department: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  formData = {
    name: '',
    code: '',
    description: '',
    status: '',
    rCreUserId:this.employeeId,
  };

  employees = [
  ];

  ngOnChanges() {
    if (this.department) {
      this.formData = { ...this.department };
    } else {
      this.formData = {
        name: '',
        code: '',
        description: '',
        status: '',
        rCreUserId:this.employeeId,
      };
    }
  }

  onSubmit() {
    this.save.emit(this.formData);
  }
}