import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddTimeEntryFormComponent } from '../forms/add-time-entry-form.component';

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [CommonModule, AddTimeEntryFormComponent],
  template: `
    <div class="time-tracking">
      <div class="page-header">
        <h4>Time Tracking</h4>
        <div class="actions">
          <button class="btn btn-secondary">
            <i class="fas fa-download me-2"></i>
            Export
          </button>
          <button class="btn btn-primary" (click)="showAddTimeEntryForm()">
            <i class="fas fa-plus me-2"></i>
            Add Time Entry
          </button>
        </div>
      </div>

      <!-- Rest of the time tracking component template remains the same -->

      <app-add-time-entry-form></app-add-time-entry-form>
    </div>
  `
})
export class TimeTrackingComponent {
  @ViewChild(AddTimeEntryFormComponent) addTimeEntryForm!: AddTimeEntryFormComponent;

  showAddTimeEntryForm() {
    this.addTimeEntryForm.show();
  }
}