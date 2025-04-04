import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkLocationFormComponent } from './work-location-form.component';
import { ApiService } from '../../../../api.service';

@Component({
  selector: 'app-work-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkLocationFormComponent],
  template: `
    <div class="work-locations">
      <div class="page-header">
        <h2>Work Locations</h2>
        <button class="btn btn-primary" (click)="showAddLocationForm()">
          <i class="fas fa-plus me-2"></i>
          Add Location
        </button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Location Name</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>Employees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let location of locations">
              <td>{{location.name}}</td>
              <td>{{location.address}}</td>
              <td>{{location.city}}</td>
              <td>{{location.state}}</td>
              <td>{{location.employeeCount}}</td>
              <td>
                <button class="btn-icon" (click)="editLocation(location)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" (click)="deleteLocation(location)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-work-location-form
        [visible]="showForm"
        [location]="selectedLocation"
        (close)="closeForm()"
        (save)="saveLocation($event)"
      ></app-work-location-form>
    </div>
  `,
  styles: [`/* Styles remain unchanged */`]
})
export class WorkLocationsComponent implements OnInit {
  locations: any[] = [];
  showForm = false;
  selectedLocation: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchLocations();
  }

  fetchLocations() {
    this.apiService.getLocations().subscribe((locations) => {
      this.locations = locations;
    });
  }

  showAddLocationForm() {
    this.selectedLocation = null;
    this.showForm = true;
  }

  editLocation(location: any) {
    this.selectedLocation = location;
    this.showForm = true;
  }

  deleteLocation(location: any) {
    if (confirm('Are you sure you want to delete this location?')) {
      this.apiService.deleteLocation(location.id).subscribe(() => {
        this.fetchLocations(); // Refresh the locations list
      });
    }
  }

  closeForm() {
    this.showForm = false;
    this.selectedLocation = null;
  }

  saveLocation(location: any) {
    if (this.selectedLocation) {
      // Update existing location
      this.apiService.updateLocation(location).subscribe(() => {
        this.fetchLocations(); // Refresh the locations list
        this.closeForm();
      });
    } else {
      // Add new location
      this.apiService.addLocation(location).subscribe(() => {
        this.fetchLocations(); // Refresh the locations list
        this.closeForm();
      });
    }
  }
}