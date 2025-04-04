import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignationFormComponent } from './designation-form.component';

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [CommonModule, FormsModule, DesignationFormComponent],
  template: `
    <div class="designations">
      <div class="page-header">
        <h4>Designations</h4>
        <button class="btn btn-primary" (click)="showAddDesignationForm()">
          <i class="fas fa-plus me-2"></i>
          Add Designation
        </button>
      </div>

      <div class="card" *ngIf="designations.length; else noData">
        <table class="table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Department</th>
              <th>Salary Range</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let designation of designations">
              <td>{{ designation.title }}</td>
              <td>{{ designation.department }}</td>
              <td>{{ designation.salaryMin }} - {{ designation.salaryMax }}</td>
              <td>
                <span [class]="'badge badge-' + designation.status.toLowerCase()">
                  {{ designation.status }}
                </span>
              </td>
              <td>
                <button class="btn-icon" (click)="editDesignation(designation)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" (click)="deleteDesignation(designation.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noData>
        <p>No designations found. Add a new one to get started.</p>
      </ng-template>

      <app-designation-form
        [visible]="showForm"
        [designation]="selectedDesignation"
        (close)="closeForm()"
        (save)="saveDesignation($event)"
      ></app-designation-form>
    </div>
  `,
  styles: [/* Add your styles here */],
})
export class DesignationsComponent implements OnInit {
  designations: any[] = [];
  showForm = false;
  selectedDesignation: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDesignations();
  }

  loadDesignations() {
    console.log('Loading designations...');
    this.apiService.getAllDesignations().subscribe(
      (data) => {
        console.log('Designations loaded:', data);
        this.designations = data;
      },
      (error) => {
        console.error('Failed to load designations', error);
      }
    );
  }

  showAddDesignationForm() {
    this.selectedDesignation = null;
    this.showForm = true;
  }

  editDesignation(designation: any) {
    this.selectedDesignation = designation;
    this.showForm = true;
  }

  deleteDesignation(id: number) {
    if (confirm('Are you sure you want to delete this designation?')) {
      this.apiService.deleteDesignation(id).subscribe(
        () => {
          this.designations = this.designations.filter((d) => d.id !== id);
          alert('Designation deleted successfully!');
        },
        (error) => {
          console.error('Failed to delete designation', error);
        }
      );
    }
  }

  closeForm() {
    this.showForm = false;
    this.selectedDesignation = null;
  }

  saveDesignation(designation: any) {
    if (this.selectedDesignation) {
      this.apiService.updateDesignation(this.selectedDesignation.id, designation).subscribe(
        (updated) => {
          const index = this.designations.findIndex((d) => d.id === updated.id);
          this.designations[index] = updated;
          alert('Designation updated successfully!');
          this.closeForm();
        },
        (error) => {
          console.error('Failed to update designation', error);
        }
      );
    } else {
      this.apiService.addDesignation(designation).subscribe(
        (newDesignation) => {
          this.designations.push(newDesignation);
          alert('Designation added successfully!');
          this.closeForm();
        },
        (error) => {
          console.error('Failed to add designation', error);
        }
      );
    }
  }
}
