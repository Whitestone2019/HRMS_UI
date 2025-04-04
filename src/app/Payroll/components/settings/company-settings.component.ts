import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="company-settings">
      <div class="page-header">
        <h2>Company Settings</h2>
        <button class="btn btn-primary" (click)="saveSettings()">
          Save Changes
        </button>
      </div>

      <div class="settings-grid">
        <!-- Company Profile -->
        <div class="card">
          <h3>Company Profile</h3>
          <form>
            <div class="form-group">
              <label>Company Name</label>
              <input type="text" class="form-control" [(ngModel)]="companyProfile.name" name="name">
            </div>
            <div class="form-group">
              <label>Legal Business Name</label>
              <input type="text" class="form-control" [(ngModel)]="companyProfile.legalName" name="legalName">
            </div>
            <div class="form-group">
              <label>Tax ID Number (EIN)</label>
              <input type="text" class="form-control" [(ngModel)]="companyProfile.taxId" name="taxId">
            </div>
            <div class="form-group">
              <label>Industry</label>
              <select class="form-control" [(ngModel)]="companyProfile.industry" name="industry">
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="retail">Retail</option>
              </select>
            </div>
          </form>
        </div>

        <!-- Contact Information -->
        <div class="card">
          <h3>Contact Information</h3>
          <form>
            <div class="form-group">
              <label>Business Address</label>
              <textarea class="form-control" rows="3" [(ngModel)]="contactInfo.address" name="address"></textarea>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" class="form-control" [(ngModel)]="contactInfo.phone" name="phone">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="contactInfo.email" name="email">
            </div>
            <div class="form-group">
              <label>Website</label>
              <input type="url" class="form-control" [(ngModel)]="contactInfo.website" name="website">
            </div>
          </form>
        </div>

        <!-- Business Hours -->
        <div class="card">
          <h3>Business Hours</h3>
          <form>
            <div class="form-group">
              <label>Work Week</label>
              <div class="checkbox-group">
                <div class="checkbox-item" *ngFor="let day of workDays">
                  <input type="checkbox" [id]="day.value" [(ngModel)]="day.checked" [name]="day.value">
                  <label [for]="day.value">{{day.label}}</label>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Work Hours Start</label>
                <input type="time" class="form-control" [(ngModel)]="businessHours.start" name="start">
              </div>
              <div class="form-group">
                <label>Work Hours End</label>
                <input type="time" class="form-control" [(ngModel)]="businessHours.end" name="end">
              </div>
            </div>
            <div class="form-group">
              <label>Time Zone</label>
              <select class="form-control" [(ngModel)]="businessHours.timezone" name="timezone">
                <option value="EST">Eastern Time (ET)</option>
                <option value="CST">Central Time (CT)</option>
                <option value="MST">Mountain Time (MT)</option>
                <option value="PST">Pacific Time (PT)</option>
              </select>
            </div>
          </form>
        </div>

        <!-- Company Policies -->
        <div class="card">
          <h3>Company Policies</h3>
          <form>
            <div class="form-group">
              <label>Overtime Policy</label>
              <select class="form-control" [(ngModel)]="policies.overtime" name="overtime">
                <option value="standard">Standard (1.5x after 40 hours)</option>
                <option value="double">Double Time (2x after 40 hours)</option>
                <option value="custom">Custom Rate</option>
              </select>
            </div>
            <div class="form-group">
              <label>Paid Time Off (PTO) Policy</label>
              <textarea class="form-control" rows="3" [(ngModel)]="policies.pto" name="pto"></textarea>
            </div>
            <div class="form-group">
              <label>Holiday Schedule</label>
              <textarea class="form-control" rows="3" [(ngModel)]="policies.holidays" name="holidays"></textarea>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-settings {
      padding: 1.5rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    textarea {
      resize: vertical;
    }
  `]
})
export class CompanySettingsComponent {
  companyProfile = {
    name: 'Acme Corporation',
    legalName: 'Acme Corp LLC',
    taxId: '12-3456789',
    industry: 'technology'
  };

  contactInfo = {
    address: '123 Business Street\nSuite 100\nBusiness City, ST 12345',
    phone: '(555) 123-4567',
    email: 'contact@acmecorp.com',
    website: 'https://www.acmecorp.com'
  };

  workDays = [
    { label: 'Monday', value: 'monday', checked: true },
    { label: 'Tuesday', value: 'tuesday', checked: true },
    { label: 'Wednesday', value: 'wednesday', checked: true },
    { label: 'Thursday', value: 'thursday', checked: true },
    { label: 'Friday', value: 'friday', checked: true },
    { label: 'Saturday', value: 'saturday', checked: false },
    { label: 'Sunday', value: 'sunday', checked: false }
  ];

  businessHours = {
    start: '09:00',
    end: '17:00',
    timezone: 'EST'
  };

  policies = {
    overtime: 'standard',
    pto: 'Employees receive 15 days of PTO annually, accrued monthly.',
    holidays: 'New Year\'s Day\nMemorial Day\nIndependence Day\nLabor Day\nThanksgiving\nChristmas'
  };

  saveSettings() {
    // Save settings logic
  }
}