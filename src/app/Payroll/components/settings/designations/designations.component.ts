// src/app/Payroll/components/settings/designations/designations.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignationFormComponent } from './designation-form.component';
import { ApiService, Designation } from '../../../../api.service';

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [CommonModule, FormsModule, DesignationFormComponent],
  template: `
    <div class="designations-container">
      <!-- Header Section -->
      <div class="header">
        <h2 class="page-title">Designations/Roles</h2>
        <button class="btn-add" (click)="openAddModal()">
          + Add Designation
        </button>
      </div>

      <!-- Designations Table -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="designations-table">
            <thead>
              <tr>
                <th>Role ID</th>
                <th>Role Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading State -->
              <tr *ngIf="loading">
                <td colspan="5" class="loading-cell">
                  <div class="spinner"></div>
                  <span>Loading designations...</span>
                </td>
              </tr>

              <!-- No Data State -->
              <tr *ngIf="!loading && designations.length === 0">
                <td colspan="5" class="no-data">
                  No designations found. Click "+ Add Designation" to create one.
                </td>
              </tr>

              <!-- Designations List -->
              <tr *ngFor="let designation of designations" class="designation-row">
                <td class="role-id">
                  <strong>{{ designation.roleId }}</strong>
                </td>
                <td class="role-name">
                  {{ designation.roleName }}
                </td>
                <td class="description">
                  <div class="description-text" [title]="designation.description || 'No description'">
                    {{ designation.description || 'No description' }}
                  </div>
                </td>
                <td class="status">
                  <span class="status-badge" 
                        [class.active]="designation.status === 'ACTIVE'"
                        [class.inactive]="designation.status !== 'ACTIVE'">
                    {{ designation.status || 'ACTIVE' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-action edit" (click)="editDesignation(designation)" title="Edit">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button class="btn-action delete" (click)="deleteDesignation(designation)" title="Delete">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Designation Form Modal -->
      <app-designation-form 
        [visible]="showModal"
        [designation]="selectedDesignation"
        (close)="closeModal()"
        (save)="handleSave($event)">
      </app-designation-form>
    </div>
  `,
  styles: [`
    /* Main Container */
    .designations-container {
      padding: 24px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .page-title {
      margin: 0;
      color: #2c3e50;
      font-size: 24px;
      font-weight: 600;
    }

    .btn-add {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
    }

    .btn-add:hover {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    /* Table Styles */
    .designations-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .designations-table th {
      background: #f8f9fa;
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #e0e0e0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .designations-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: middle;
    }

    .designation-row:hover {
      background: #f8f9fa;
      transition: background 0.2s;
    }

    /* Table Cells */
    .role-id strong {
      color: #2c3e50;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .role-name {
      font-weight: 600;
      color: #333;
      font-size: 15px;
    }

    .description {
      max-width: 300px;
    }

    .description-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .description-text:hover {
      white-space: normal;
      overflow: visible;
      background: white;
      padding: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: absolute;
      z-index: 10;
      max-width: 400px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
      min-width: 70px;
      text-align: center;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-badge.inactive {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    /* Action Buttons */
    .actions {
      display: flex;
      gap: 8px;
      min-width: 160px;
    }

    .btn-action {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action.edit {
      background: #007bff;
      color: white;
      border: 1px solid #0056b3;
    }

    .btn-action.edit:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }

    .btn-action.delete {
      background: #dc3545;
      color: white;
      border: 1px solid #bd2130;
    }

    .btn-action.delete:hover {
      background: #bd2130;
      transform: translateY(-1px);
    }

    .btn-action i {
      font-size: 12px;
    }

    /* Loading State */
    .loading-cell {
      text-align: center;
      padding: 60px 20px !important;
    }

    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 12px;
      vertical-align: middle;
    }

    .loading-cell span {
      color: #6c757d;
      font-size: 14px;
      vertical-align: middle;
    }

    /* No Data State */
    .no-data {
      text-align: center;
      padding: 60px 20px !important;
      color: #6c757d;
      font-style: italic;
      font-size: 15px;
    }

    /* Animation */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .designations-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .page-title {
        font-size: 20px;
      }

      .btn-add {
        width: 100%;
        justify-content: center;
      }

      .designations-table th,
      .designations-table td {
        padding: 12px 16px;
      }

      .actions {
        flex-direction: column;
        gap: 4px;
      }
      
      .btn-action {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DesignationsComponent implements OnInit {
  designations: Designation[] = [];
  loading = false;
  showModal = false;
  selectedDesignation: Designation | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDesignations();
  }

  loadDesignations() {
    this.loading = true;
    this.apiService.getAllDesignation().subscribe({
      next: (data: Designation[]) => {
        console.log('Designations loaded:', data);
        this.designations = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading designations:', error);
        this.loading = false;
        alert('Error loading designations. Please check console for details.');
      }
    });
  }

  openAddModal() {
    this.selectedDesignation = null;
    this.showModal = true;
  }

  editDesignation(designation: Designation) {
    this.selectedDesignation = designation;
    this.showModal = true;
  }

  deleteDesignation(designation: Designation) {
    if (confirm(`Are you sure you want to delete "${designation.roleName}" (${designation.roleId})?`)) {
      if (designation.designationid) {
        this.apiService.deleteDesignations(designation.designationid).subscribe({
          next: () => {
            this.designations = this.designations.filter(d => d.designationid !== designation.designationid);
            alert('Designation deleted successfully!');
          },
          error: (error: any) => {
            console.error('Error deleting designation:', error);
            alert('Error deleting designation. Please try again.');
          }
        });
      }
    }
  }

  handleSave(savedDesignation: Designation) {
    if (this.selectedDesignation && this.selectedDesignation.designationid) {
      // Update existing designation
      const index = this.designations.findIndex(d => 
        d.designationid === this.selectedDesignation!.designationid
      );
      if (index !== -1) {
        this.designations[index] = savedDesignation;
      }
      alert('Designation updated successfully!');
    } else {
      // Add new designation
      this.designations.unshift(savedDesignation);
      alert('Designation added successfully!');
    }
    
    // Reload to get fresh data from server
    this.loadDesignations();
    this.closeModal();
  }

  closeModal() {
    this.showModal = false;
    this.selectedDesignation = null;
  }
}