import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payroll-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-settings">
      <div class="page-header">
        <h4>Payroll Settings</h4>
        <button class="btn btn-primary" (click)="saveSettings()">
          Save Changes
        </button>
      </div>

      <div class="settings-grid">
        <!-- Pay Schedule -->
        <div class="card">
          <h3>Pay Schedule</h3>
          <form>
            <div class="form-group">
              <label>Pay Frequency</label>
              <select class="form-control" [(ngModel)]="paySchedule.frequency" name="frequency">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="semimonthly">Semi-Monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Pay Period Start Day</label>
              <select class="form-control" [(ngModel)]="paySchedule.startDay" name="startDay">
                <option value="1">1st of month</option>
                <option value="15">15th of month</option>
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment Method</label>
              <select class="form-control" [(ngModel)]="paySchedule.paymentMethod" name="paymentMethod">
                <option value="direct_deposit">Direct Deposit</option>
                <option value="check">Paper Check</option>
                <option value="both">Both Options</option>
              </select>
            </div>
          </form>
        </div>

        <!-- Tax Settings -->
        <div class="card">
          <h3>Tax Settings</h3>
          <form>
            <div class="form-group">
              <label>Federal Tax Rate</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="taxSettings.federalRate" name="federalRate">
                <span class="input-group-text">%</span>
              </div>
            </div>
            <div class="form-group">
              <label>State Tax Rate</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="taxSettings.stateRate" name="stateRate">
                <span class="input-group-text">%</span>
              </div>
            </div>
            <div class="form-group">
              <label>Medicare Rate</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="taxSettings.medicareRate" name="medicareRate">
                <span class="input-group-text">%</span>
              </div>
            </div>
            <div class="form-group">
              <label>Social Security Rate</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="taxSettings.socialSecurityRate" name="socialSecurityRate">
                <span class="input-group-text">%</span>
              </div>
            </div>
          </form>
        </div>

        <!-- Deductions -->
        <div class="card">
          <h3>Deductions</h3>
          <form>
            <div class="form-group">
              <label>Health Insurance</label>
              <div class="input-group">
                <select class="form-control" [(ngModel)]="deductions.healthInsurance.type" name="healthInsuranceType">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input type="number" class="form-control" [(ngModel)]="deductions.healthInsurance.value" name="healthInsuranceValue">
                <span class="input-group-text">{{deductions.healthInsurance.type === 'percentage' ? '%' : '$'}}</span>
              </div>
            </div>
            <div class="form-group">
              <label>401(k)</label>
              <div class="input-group">
                <select class="form-control" [(ngModel)]="deductions.retirement.type" name="retirementType">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input type="number" class="form-control" [(ngModel)]="deductions.retirement.value" name="retirementValue">
                <span class="input-group-text">{{deductions.retirement.type === 'percentage' ? '%' : '$'}}</span>
              </div>
            </div>
          </form>
        </div>

        <!-- Overtime Rules -->
        <div class="card">
          <h3>Overtime Rules</h3>
          <form>
            <div class="form-group">
              <label>Standard Overtime Rate</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="overtimeRules.standardRate" name="standardRate" step="0.1">
                <span class="input-group-text">x</span>
              </div>
            </div>
            <div class="form-group">
              <label>Weekly Overtime Threshold</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="overtimeRules.weeklyThreshold" name="weeklyThreshold">
                <span class="input-group-text">hours</span>
              </div>
            </div>
            <div class="form-group">
              <label>Daily Overtime Threshold</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="overtimeRules.dailyThreshold" name="dailyThreshold">
                <span class="input-group-text">hours</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payroll-settings {
      padding: 1.5rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .input-group {
      display: flex;
      align-items: center;
    }

    .input-group-text {
      padding: 0.375rem 0.75rem;
      background: #f8f9fa;
      border: 1px solid #ddd;
      border-left: none;
      border-radius: 0 4px 4px 0;
    }

    .input-group .form-control {
      border-radius: 4px 0 0 4px;
    }

    .input-group select + input {
      border-radius: 0;
    }
  `]
})
export class PayrollSettingsComponent {
  paySchedule = {
    frequency: 'biweekly',
    startDay: '1',
    paymentMethod: 'direct_deposit'
  };

  taxSettings = {
    federalRate: 22,
    stateRate: 5,
    medicareRate: 1.45,
    socialSecurityRate: 6.2
  };

  deductions = {
    healthInsurance: {
      type: 'percentage',
      value: 5
    },
    retirement: {
      type: 'percentage',
      value: 3
    }
  };

  overtimeRules = {
    standardRate: 1.5,
    weeklyThreshold: 40,
    dailyThreshold: 8
  };

  saveSettings() {
    // Save settings logic
  }
}