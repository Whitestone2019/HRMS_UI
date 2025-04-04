import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../api.service';


@Component({
  selector: 'app-work-location-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" *ngIf="visible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{location ? 'Edit' : 'Add'}} Location</h3>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Location Name</label>
              <input type="text" class="form-control" [(ngModel)]="formData.name" name="name" required>
            </div>
            <div class="form-group">
              <label>Address</label>
              <input type="text" class="form-control" [(ngModel)]="formData.address" name="address" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" class="form-control" [(ngModel)]="formData.city" name="city" required>
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" class="form-control" [(ngModel)]="formData.state" name="state" required>
              </div>
              <div class="form-group">
                <label>ZIP Code</label>
                <input type="text" class="form-control" [(ngModel)]="formData.zip" name="zip" required>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Location</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`/* Styles remain unchanged */`]
})
export class WorkLocationFormComponent {
  @Input() visible = false;
  @Input() location: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  formData = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  };

  // Fetch states via an API call (if needed in future)
  states = [
    { code: 'NY', name: 'New York' },
    { code: 'CA', name: 'California' },
    // Add more states here if necessary
  ];

  constructor(private apiService: ApiService) {}

  ngOnChanges() {
    if (this.location) {
      this.formData = { ...this.location };
    } else {
      this.formData = {
        name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      };
    }
  }

  onSubmit() {
    if (this.location) {
      this.apiService.updateLocation(this.formData).subscribe(response => {
        this.save.emit(response); // Emit updated location data
      });
    } else {
      this.apiService.addLocation(this.formData).subscribe(response => {
        this.save.emit(response); // Emit new location data
      });
    }
  }
}
