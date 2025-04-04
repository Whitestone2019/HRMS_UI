import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings">
      <div class="settings-header">
        <h4>Settings</h4>
        <button class="btn primary">Save Changes</button>
      </div>

      <div class="settings-grid">
        <div class="settings-section">
          <h3>Company Information</h3>
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" value="Acme Corporation">
          </div>
          <div class="form-group">
            <label>Tax ID</label>
            <input type="text" value="12-3456789">
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea rows="3">123 Business Street, Suite 100, Business City, ST 12345</textarea>
          </div>
        </div>

        <div class="settings-section">
          <h3>Payroll Settings</h3>
          <div class="form-group">
            <label>Pay Period</label>
            <select>
              <option>Monthly</option>
              <option>Bi-weekly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select>
              <option>Direct Deposit</option>
              <option>Check</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h3>Tax Settings</h3>
          <div class="form-group">
            <label>Tax Calculation Method</label>
            <select>
              <option>Percentage</option>
              <option>Fixed Amount</option>
            </select>
          </div>
          <div class="form-group">
            <label>Default Tax Rate (%)</label>
            <input type="number" value="20">
          </div>
        </div>

        <div class="settings-section">
          <h3>Notifications</h3>
          <div class="form-group checkbox">
            <input type="checkbox" id="email-notifications" checked>
            <label for="email-notifications">Email Notifications</label>
          </div>
          <div class="form-group checkbox">
            <input type="checkbox" id="payroll-reminders" checked>
            <label for="payroll-reminders">Payroll Reminders</label>
          </div>
          <div class="form-group checkbox">
            <input type="checkbox" id="tax-updates">
            <label for="tax-updates">Tax Updates</label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings {
      padding: 2rem;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .settings-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .settings-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #666;
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group.checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group.checkbox input {
      width: auto;
    }

    .form-group.checkbox label {
      margin: 0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      border: none;
      font-weight: 500;
      cursor: pointer;
    }

    .btn.primary {
      background: #2d5bff;
      color: white;
    }
  `]
})
export class SettingsComponent {}