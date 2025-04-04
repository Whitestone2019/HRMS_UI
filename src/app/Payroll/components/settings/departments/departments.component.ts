import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentFormComponent } from './department-form.component';
import { ApiService } from '../../../../api.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, DepartmentFormComponent],
  template: `
    <div class="departments">
      <div class="page-header">
        <h4>Departments</h4>
        <button class="btn btn-primary" (click)="showAddDepartmentForm()">
          <i class="fas fa-plus me-2"></i>
          Add Department
        </button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let dept of departments">
              <td>{{dept.name}}</td>
              <td>{{dept.code}}</td>
               <td>{{dept.status}}</td>
              <td>
                <button class="btn-icon" (click)="editDepartment(dept)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" (click)="deleteDepartment(dept)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-department-form
        [visible]="showForm"
        [department]="selectedDepartment"
        (close)="closeForm()"
        (save)="saveDepartment($event)"
      ></app-department-form>
    </div>
  `,
  styles: [`
    .departments {
      padding: 1.5rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .badge-active {
      background: #e6ffed;
      color: #00c853;
    }

    .badge-inactive {
      background: #ffebee;
      color: #ff3d00;
    }
  `]
})
export class DepartmentsComponent {
  departments: any[] = [];
  showForm = false;
  selectedDepartment: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.apiService.getDepartments().subscribe(data => {
      this.departments = data;
    });
  }

  saveDepartment(department: any) {
    if (this.selectedDepartment) {
      this.apiService.updateDepartment(this.selectedDepartment.id, department).subscribe(() => {
        this.loadDepartments();
      });
    } else {
      this.apiService.saveDepartment(department).subscribe(() => {
        this.loadDepartments();
      });
    }
    this.closeForm();
  }

  deleteDepartment(department: any) {
    if (confirm('Are you sure you want to delete this department?')) {
      this.apiService.deleteDepartment(department.id).subscribe(() => {
        this.loadDepartments();
      });
    }
  }

  showAddDepartmentForm() {
    this.selectedDepartment = null;
    this.showForm = true;
  }

  editDepartment(department: any) {
    this.selectedDepartment = department;
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.selectedDepartment = null;
  }
}