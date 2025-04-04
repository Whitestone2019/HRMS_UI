import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-time-entry-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Time Entry</h3>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Employee</label>
              <select class="form-control" [(ngModel)]="formData.employeeId" name="employeeId" required>
                <option value="">Select Employee</option>
                <option value="1">John Smith</option>
                <option value="2">Sarah Johnson</option>
                <option value="3">Michael Brown</option>
              </select>
            </div>

            <div class="form-group">
              <label>Date</label>
              <input type="date" class="form-control" [(ngModel)]="formData.date" name="date" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Clock In</label>
                <input type="time" class="form-control" [(ngModel)]="formData.clockIn" name="clockIn" required>
              </div>
              <div class="form-group">
                <label>Clock Out</label>
                <input type="time" class="form-control" [(ngModel)]="formData.clockOut" name="clockOut" required>
              </div>
            </div>

            <div class="form-group">
              <label>Break Duration (minutes)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.breakDuration" name="breakDuration" min="0">
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea class="form-control" [(ngModel)]="formData.notes" name="notes" rows="3"></textarea>
            </div>

            <div class="time-summary" *ngIf="formData.clockIn && formData.clockOut">
              <div class="summary-item">
                <span>Total Hours:</span>
                <strong>{{calculateTotalHours()}}</strong>
              </div>
              <div class="summary-item">
                <span>Regular Hours:</span>
                <strong>{{calculateRegularHours()}}</strong>
              </div>
              <div class="summary-item" >
                <span>Overtime Hours:</span>
                <strong>{{calculateOvertimeHours()}}</strong>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Entry</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
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
      width: 500px;
      max-width: 90%;
    }

    .modal-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .time-summary {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .summary-item:last-child {
      margin-bottom: 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  `]
})
export class AddTimeEntryFormComponent {
  isVisible = false;
  formData = {
    employeeId: '',
    date: '',
    clockIn: '',
    clockOut: '',
    breakDuration: 0,
    notes: ''
  };

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
  }

  calculateTotalHours(): string {
    if (!this.formData.clockIn || !this.formData.clockOut) return '0';
    const start = new Date(`2024-01-01 ${this.formData.clockIn}`);
    const end = new Date(`2024-01-01 ${this.formData.clockOut}`);
    const diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    return diff.toFixed(2);
  }

  calculateRegularHours(): string {
    const total = parseFloat(this.calculateTotalHours());
    return Math.min(8, total).toFixed(2);
  }

  calculateOvertimeHours(): string {
    const total = parseFloat(this.calculateTotalHours());
    return Math.max(0, total - 8).toFixed(2);
  }

  onSubmit() {
    console.log('Adding time entry:', this.formData);
    this.close();
  }
}