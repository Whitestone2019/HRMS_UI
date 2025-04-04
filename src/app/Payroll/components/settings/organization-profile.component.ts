import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="organization-profile">
      <div class="page-header">
        <h4>Organization Profile</h4>
      </div>
 <div class="organization-list">
        <h5>All Organizations</h5>
        <table class="table">
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Legal Business Name</th>
              <th>Tax ID</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let org of organizations">
              <td>{{ org.organizationName }}</td>
              <td>{{ org.legalBusinessName }}</td>
              <td>{{ org.taxId }}</td>
              <td>{{ org.businessEmail }}</td>
              <td>{{ org.phoneNumber }}</td>
              <td>
                <button class="btn btn-warning" (click)="editOrganization(org)">Edit</button>
                <button class="btn btn-danger" (click)="deleteOrganization(org.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <form>
          <div class="form-section">
            <h3>Basic Information</h3>
            <div class="form-group">
              <label>Organization Name</label>
              <input type="text" class="form-control" [(ngModel)]="profile.organizationName" name="organizationName">
            </div>
            <div class="form-group">
              <label>Legal Business Name</label>
              <input type="text" class="form-control" [(ngModel)]="profile.legalBusinessName" name="legalBusinessName">
            </div>
            <div class="form-group">
              <label>Tax ID (EIN)</label>
              <input type="text" class="form-control" [(ngModel)]="profile.taxId" name="taxId">
            </div>
          </div>

          <div class="form-section">
            <h3>Contact Information</h3>
            <div class="form-group">
              <label>Business Email</label>
              <input type="email" class="form-control" [(ngModel)]="profile.businessEmail" name="businessEmail">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" class="form-control" [(ngModel)]="profile.phoneNumber" name="phoneNumber">
            </div>
            <div class="form-group">
              <label>Website</label>
              <input type="url" class="form-control" [(ngModel)]="profile.website" name="website">
            </div>
          </div>

          <div class="form-section">
            <h3>Business Address</h3>
            <div class="form-group">
              <label>Street Address</label>
              <input type="text" class="form-control" [(ngModel)]="profile.address.street" name="streetAddress">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" class="form-control" [(ngModel)]="profile.address.city" name="city">
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" class="form-control" [(ngModel)]="profile.address.state" name="state">
              </div>
              <div class="form-group">
                <label>ZIP Code</label>
                <input type="text" class="form-control" [(ngModel)]="profile.address.zip" name="zipCode">
              </div>
            </div>
            <div class="form-group">
              <label>Country</label>
              <select class="form-control" [(ngModel)]="profile.address.country" name="country">
                <option value="IN">India</option>
              </select>
            </div>
          </div>
        </form>
      </div>
 <button class="btn btn-primary" (click)="saveProfile()">Save Changes</button>
     
    </div>
  `,
  styles: [`
    .organization-profile {
      padding: 1.5rem;
    }
    .form-section {
      margin-bottom: 2rem;
    }
    .form-section h3 {
      color: #2d5bff;
      margin-bottom: 1rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .organization-list {
      margin-top: 3rem;
    }
  `],
})
export class OrganizationProfileComponent implements OnInit {
  profile = {
    id: null,
    organizationName: '',
    legalBusinessName: '',
    taxId: '',
    businessEmail: '',
    phoneNumber: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'IN',
    },
  };

  organizations: any[] = []; // Array to store organizations fetched from the API

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchOrganizations(); // Fetch all organizations when the component is initialized
  }

  // Fetch all organizations from the API
  fetchOrganizations() {
    this.apiService.getAllOrganizations().subscribe(
      (response) => {
        this.organizations = response.map((org) => ({
          ...org,
          address: org.address || { street: '', city: '', state: '', zip: '', country: 'IN' },
        }));
        console.log('Fetched organizations:', this.organizations);
      },
      (error) => {
        console.error('Error fetching organizations:', error);
      }
    );
  }

  saveProfile() {
    const requestBody = {
      id: this.profile.id,
      organizationName: this.profile.organizationName,
      legalBusinessName: this.profile.legalBusinessName,
      taxId: this.profile.taxId,
      businessEmail: this.profile.businessEmail,
      phoneNumber: this.profile.phoneNumber,
      website: this.profile.website,
      streetAddress: this.profile.address.street,
      city: this.profile.address.city,
      state: this.profile.address.state,
      zipCode: this.profile.address.zip,
      country: this.profile.address.country,
    };

    if (this.profile.id) {
      // Update existing organization
      this.apiService.updateProfile(this.profile.id, requestBody).subscribe(
        (response) => {
          alert('Profile updated successfully: ' + JSON.stringify(response));
          this.fetchOrganizations(); // Refresh the list after updating
        },
        (error) => {
          alert('Error updating profile: ' + error);
        }
      );
    } else {
      // Create new organization
      this.apiService.saveProfile(requestBody).subscribe(
        (response) => {
          alert('Profile saved successfully: ' + JSON.stringify(response));
          this.fetchOrganizations(); // Refresh the list after saving
        },
        (error) => {
          alert('Error saving profile: ' + error);
        }
      );
    }
  }

  // Edit an organization by setting the profile to the organization's details
  editOrganization(org: any) {
    this.profile = { ...org }; // Populate the form with the organization's data
  }

  // Delete an organization
  deleteOrganization(id: number) {
    if (confirm('Are you sure you want to delete this organization?')) {
      this.apiService.deleteProfile(id).subscribe(
        (response) => {
          alert('Organization deleted successfully');
          this.fetchOrganizations(); // Refresh the list after deletion
        },
        (error) => {
          alert('Error deleting organization: ' + error);
        }
      );
    }
  }
}
