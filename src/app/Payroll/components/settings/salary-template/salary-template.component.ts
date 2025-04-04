import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule,ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../api.service';
import { forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface SalaryComponent {
  name: string;
  amount?: number; // Make amount optional
  percentage?: number;
  type: 'fixed' | 'percentage' | 'remaining' | 'earnings' | 'deductions' | 'reimbursements' | 'basicPercentage';
  value?: number; // Add value property
  monthlyAmount?: number; // Add monthlyAmount property
  annualAmount?: number; // Add annualAmount property
}

export interface SalaryTemplate {
  templateId: number;
  templateName: string;
  description?: string;
  annualCTC?: number;
  earnings?: SalaryComponent[];
  deductions?: SalaryComponent[];
  components?: any[];  // Add this to capture the components array
}

@Component({
  selector: 'app-salary-template',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule, FormsModule],
  template: `
    <div class="salary-template">
      <!-- Header Section -->
      <div class="template-header" >
        <h4 *ngIf="!basic">New Salary Template</h4>
        <div class="template-form">
         <div class="form-group" *ngIf="!basic">
  <label>Template Name <span class="required">*</span></label>
  <input type="text" [(ngModel)]="templateName" placeholder="Enter template name">
</div>

<div class="form-group" *ngIf="!basic">
  <label>Description</label>
  <textarea [(ngModel)]="description" placeholder="Max 500 Characters"></textarea>
</div>
          <div class="form-group">
            <label>Annual CTC</label>
            <div class="ctc-input">
              <span class="currency">₹</span>
              <input type="number" [(ngModel)]="annualCTC" placeholder="0">
              <span class="period">per year</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dropdown for Existing Templates -->
      <div class="form-group">
        <label for="existingTemplate">Select Existing Template</label>
        <select (click)="$event.stopPropagation()" (change)="onTemplateChange($event)" [(ngModel)]="selectedTemplateId" id="existingTemplate">
          <option value="0">-- Select Template --</option>
          <option *ngFor="let template of templates" [value]="template.templateId">
            {{ template.templateName }}
          </option>
        </select>
      </div>

      <!-- Salary Components Section -->
      <div class="template-body">
        <!-- Earnings Section -->
        <h3>Earnings <button (click)="addEarning()" class="add-icon">+</button></h3>
        <div class="component-list">
          <table>
            <thead>
              <tr>
                <th>SALARY COMPONENTS</th>
                <th>CALCULATION TYPE</th>
                <th>MONTHLY AMOUNT</th>
                <th>ANNUAL AMOUNT</th>
                <th>REMOVE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let component of earnings; let i = index">
                <td>
                  <input  [(ngModel)]="component.name"  placeholder="Enter salary component name">
                </td>
                <td>
                <select (click)="$event.stopPropagation()" [(ngModel)]="component.type">
  <option value="percentage">% of CTC</option>
  <option value="fixed">Fixed amount</option>
  <option value="basicPercentage">% of Basic</option>
</select>
                  <input *ngIf="component.type === 'percentage'" type="number" [(ngModel)]="component.percentage" class="percentage-input" placeholder="Enter %">
                  <input *ngIf="component.type === 'basicPercentage'" type="number" [(ngModel)]="component.percentage" class="percentage-input" placeholder="Enter % of Basic">
                  <input *ngIf="component.type === 'fixed'" type="number" [(ngModel)]="component.amount" class="fixed-input" placeholder="Enter amount">
                </td>
                <td>₹ {{calculateMonthlyAmount(component) | number:'1.0-0'}}</td>
                <td>₹ {{calculateAnnualAmount(component) | number:'1.0-0'}}</td>
                <td><button (click)="removeEarning(i)">&#10005;</button></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total Earnings</td>
                <td>₹ {{calculateTotalEarnings() | number:'1.0-0'}}</td>
                <td>₹ {{calculateTotalEarnings() * 12 | number:'1.0-0'}}</td>
              </tr>
            </tfoot>
          </table>
        </div>

 <h3>Other Allowance</h3>
<div class="component-list">
  <table>
    <thead>
      <tr>
        <th>SALARY COMPONENTS</th>
        <th>LOCATION</th>
        <th>EDIT</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      <!-- Per Day Allowance Row -->
      <tr>
        <td>Per Day Allowance</td>
        <td rowspan="2">
          <select (change)="fetchAllowanceAmount($event)" [(ngModel)]="selectedLocationPerDay" (click)="$event.stopPropagation()">
            <option *ngFor="let location of locations" [value]="location.locationName">
              {{ location.locationName }}
            </option>
          </select>
        </td>
        <td>
          <input type="radio" name="editAllowance" (change)="toggleEdit('perDayAllowance')" [checked]="editPerDayAllowance" />
        </td>
        <td>
          ₹ <input type="number" [(ngModel)]="perDayAllowanceAmount" [readonly]="!editPerDayAllowance" />
        </td>
      </tr>

      <!-- PG Rent Row -->
      <tr>
        <td>PG Rent</td>
        <td>
          <input type="radio" name="editAllowance" (change)="toggleEdit('pgRent')" [checked]="editPgRent" />
        </td>
        <td>
          ₹ <input type="number" [(ngModel)]="pgRentAmount" [readonly]="!editPgRent" />
        </td>
      </tr>
    </tbody>
  </table>
</div>




        <!-- Deductions Section -->
        <h3>Deductions <button (click)="addDeduction()" class="add-icon">+</button></h3>
        <div class="component-list">
          <table>
            <thead>
              <tr>
                <th>SALARY COMPONENTS</th>
                <th>CALCULATION TYPE</th>
                <th>MONTHLY AMOUNT</th>
                <th>ANNUAL AMOUNT</th>
                <th>REMOVE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let component of deductions; let i = index">
                <td>
                  <input [(ngModel)]="component.name" placeholder="Enter salary component name">
                </td>
                <td>
                  <select (click)="$event.stopPropagation()" [(ngModel)]="component.type">
                  <option value="basicPercentage">% of Basic</option>
                    <option value="percentage">% of CTC</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                  <input *ngIf="component.type === 'percentage'" type="number" [(ngModel)]="component.percentage" class="percentage-input" placeholder="Enter %">
                  <input *ngIf="component.type === 'basicPercentage'" type="number" [(ngModel)]="component.percentage" class="percentage-input" placeholder="Enter % of Basic">
                  <input *ngIf="component.type === 'fixed'" type="number" [(ngModel)]="component.amount" class="fixed-input" placeholder="Enter amount">
                </td>
                <td>₹ {{calculateMonthlyAmount(component) | number:'1.0-0'}}</td>
                <td>₹ {{calculateAnnualAmount(component) | number:'1.0-0'}}</td>
                <td><button (click)="removeDeduction(i)">&#10005;</button></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total Deductions</td>
                <td>₹ {{calculateTotalDeductions() | number:'1.0-0'}}</td>
                <td>₹ {{calculateTotalDeductions() * 12 | number:'1.0-0'}}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Net Salary Section -->
        <div class="net-salary">
          <div class="net-salary-row">
            <span>Net Salary (Monthly)</span>
            <span>₹ {{calculateNetSalary() | number:'1.0-0'}}</span>
          </div>
          <div class="net-salary-row">
            <span>Net Salary (Annual)</span>
            <span>₹ {{calculateNetSalary() * 12 | number:'1.0-0'}}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-save" (click)="saveTemplate()">Save</button>
          <button class="btn-cancel" (click)="cancel()">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./salary-template.component.css']
})
export class SalaryTemplateComponent {
  @Input() form!: FormGroup;
  @Input() basic: string = '';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  templateName = '';
  description = '';
  annualCTC = 0;
  otherAllowances :SalaryComponent[] = [];
  earnings: SalaryComponent[] = [];
  deductions: SalaryComponent[] = [];
  templates: SalaryTemplate[] = [];
  selectedTemplateId: number = 0;
  selectedLocationPerDay: any;
  selectedLocationPgRent: any;
  perDayAllowanceAmount: number = 0;
  pgRentAmount: number = 0;
  locations: any[] = [];
  constructor(private apiService: ApiService) {

  }
  ngOnInit() {
    alert(this.basic);
    this.loadLocations();
    alert("Locations after calling loadLocations:"+this.locations);
    if (!this.form) {
      this.loadSettings();
      this.loadExistingTemplates();
      console.error("Form is undefined!");
      return; // Prevent further execution
    }
  
    // Set annualCTC from the form value
    this.annualCTC = this.form.value?.annualCTC || 0;
  
    // Parse earnings and deductions if they are provided
    if (this.form.value?.earnings) {
      try {
        this.earnings = typeof this.form.value.earnings === 'string' 
          ? JSON.parse(this.form.value.earnings) 
          : this.form.value.earnings;
      } catch (error) {
        console.error('Error parsing earnings:', error);
        this.earnings = [];
      }
    }
  
    if (this.form.value?.deductions) {
      try {
        this.deductions = typeof this.form.value.deductions === 'string' 
          ? JSON.parse(this.form.value.deductions) 
          : this.form.value.deductions;
      } catch (error) {
        console.error('Error parsing deductions:', error);
        this.deductions = [];
      }
    }
  
    console.log('Annual CTC:', this.annualCTC);
    console.log('Earnings:', this.earnings);
    console.log('Deductions:', this.deductions);
  
    // Load existing templates if annualCTC is not set
    if (!this.annualCTC) {
      this.loadSettings();
      this.loadExistingTemplates();
    }
  }
  
  loadSettings() {
    forkJoin([
      this.apiService.getComponents(),
      this.apiService.getPTSlabs(),
      this.apiService.getSettings()
    ]).pipe(
      tap(([components, ptSlabs, settings]) => {
        console.log('Components:', components);
        console.log('PT Slabs:', ptSlabs);
        console.log('Settings:', settings);

        this.earnings = settings.earnings || [];
        this.deductions = settings.deductions || [];
        this.annualCTC = settings.annualCTC || 0;

        this.setPFAndESI(settings);
        this.setDefaultComponents(components);
        this.setPTSlabs(ptSlabs);

        console.log('Settings loaded successfully:', { components, ptSlabs, settings });
      }),
      catchError(error => {
        console.error('Error loading settings:', error);
        return [];
      })
    ).subscribe();
  }

  loadExistingTemplates() {
    this.apiService.getTemplates().subscribe(
      (response: SalaryTemplate[]) => {
        this.templates = response;
        console.log('Existing Templates:', this.templates);
      },
      error => {
        console.error('Error loading existing templates:', error);
      }
    );
  }
  loadSelectedTemplate(templateId: number) {
    if (templateId === 0) {
      this.cancel();
      return;
    }
  
    this.apiService.getTemplateById(templateId).subscribe(
      (template: SalaryTemplate) => {
        console.log('API Response:', JSON.stringify(template, null, 2));
  
        this.templateName = template.templateName;
        this.description = template.description || '';
        this.annualCTC = template.annualCTC || 0;
  
        // Reset all variables
        this.earnings = [];
        this.deductions = [];
        this.perDayAllowanceAmount = 0;
        this.pgRentAmount = 0;
        this.otherAllowances = [];
  
        if (template.components && Array.isArray(template.components)) {
          template.components.forEach(component => {
            const componentName = component.componentName || '';
            const calculationType = component.calculationType.toLowerCase();
            const value = component.value || 0;
  
            // Handle Per Day Allowance and PG Rent Allowance separately
            if (componentName === 'Per Day Allowance') {
              this.perDayAllowanceAmount = value;
            } else if (componentName === 'PG Rent Allowance') {
              this.pgRentAmount = value;
            } 
            // Properly categorize earnings
            else if (component.isEarning) {  
              this.earnings.push({
                name: componentName,
                type: calculationType === 'percentage'
                  ? 'percentage'
                  : calculationType === 'basicpercentage'
                    ? 'basicPercentage'
                    : 'fixed',
                percentage: calculationType === 'percentage' || calculationType === 'basicpercentage' ? value : 0,
                amount: calculationType === 'fixed' ? value : 0,
              });
            } 
            // Properly categorize deductions
            else {
              this.deductions.push({
                name: componentName,
                type: calculationType === 'percentage'
                  ? 'percentage'
                  : calculationType === 'basicpercentage'
                    ? 'basicPercentage'
                    : 'fixed',
                percentage: calculationType === 'percentage' || calculationType === 'basicpercentage' ? value : 0,
                amount: calculationType === 'fixed' ? value : 0,
              });
            }
          });
        }
  
        console.log('Populated Earnings:', this.earnings);
        console.log('Populated Other Allowances:', this.otherAllowances);
        console.log('Populated Deductions:', this.deductions);
        console.log('Per Day Allowance:', this.perDayAllowanceAmount);
        console.log('PG Rent Allowance:', this.pgRentAmount);
      },
      (error) => {
        console.error('Error loading template:', error);
      }
    );
  }
  onTemplateChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.loadSelectedTemplate(this.selectedTemplateId);
  }

  setPFAndESI(settings: any) {
    if (settings.pfRate) {
      this.deductions.push({ name: 'Provident Fund', type: 'percentage', percentage: settings.pfRate });
    }

    if (settings.esiRate) {
      this.deductions.push({ name: 'Employee State Insurance', type: 'percentage', percentage: settings.esiRate });
    }
  }

  setDefaultComponents(components: any) {
    const basicComponent = components.find((component: any) => component.name.toLowerCase() === 'basic' && component.type === 'earnings');
    if (basicComponent && !this.earnings.some((component) => component.name === basicComponent.name)) {
      this.earnings.unshift({
        name: basicComponent.name,
        type: basicComponent.calculationType,
        percentage: basicComponent.amount || 0
      });
    }

    components.forEach((component: any) => {
      if (component.type === 'earnings' && !this.earnings.some((existingComponent) => existingComponent.name === component.name)) {
        this.earnings.push({
          name: component.name,
          type: component.calculationType,
          percentage: component.amount || 0,
          amount:component.amount || 0
        });
      }
    });

    components.forEach((component: any) => {
      if (component.type === 'deductions' && !this.deductions.some((existingComponent) => existingComponent.name === component.name)) {
        this.deductions.push({
          name: component.name,
          type: component.calculationType,
          percentage: component.amount || 0,
          amount:component.amount || 0
        });
      }
    });
  }

  setPTSlabs(ptSlabs: any) {
    const slab = ptSlabs.find((slab: any) => slab.status === 'ACTIVE');
    if (slab) {
      this.deductions.push({
        name: 'Professional Tax',
        type: 'fixed',
        amount: slab.amount || 0
      });
    }
  }

  addEarning() {
    this.earnings.push({ name: '', amount: 0, percentage: 0, type: 'earnings' });
  }

  removeEarning(index: number) {
    this.earnings.splice(index, 1);
  }

  addDeduction() {
    this.deductions.push({ name: '', amount: 0, percentage: 0, type: 'deductions' });
  }

  removeDeduction(index: number) {
    this.deductions.splice(index, 1);
  }

  calculateMonthlyAmount(component: SalaryComponent): number {
    if (component.type === 'percentage') {
      return (this.annualCTC * (component.percentage || 0)) / 100 / 12;
    } else if (component.type === 'basicPercentage') {
      const basicSalary = this.annualCTC * 0.40; // Basic Salary is 40% of Annual CTC
      return (basicSalary * (component.percentage || 0)) / 100 / 12;
    } else if (component.type === 'fixed') {
      return component.amount || 0;
    }
    alert(component.type);
    return 0;
  }

  calculateAnnualAmount(component: SalaryComponent): number {
    return this.calculateMonthlyAmount(component) * 12;
  }

  calculateTotalEarnings(): number {
    return this.earnings.reduce((sum, component) => sum + this.calculateMonthlyAmount(component), 0);
  }

  calculateTotalDeductions(): number {
    return this.deductions.reduce((sum, component) => sum + this.calculateMonthlyAmount(component), 0);
  }

  calculateNetSalary(): number {
    return this.calculateTotalEarnings() - this.calculateTotalDeductions();
  }

  getSalaryTemplateData(): any {
    const timesheetDaysInMonth = this.calculateTimesheetDays();
    const earningsData = this.earnings.map(earning => ({
      name: earning.name,
      type: earning.type, // Ensure this type is one of the predefined ones
      percentage: earning.percentage || null,
      amount: earning.amount || null,
      monthlyAmount: this.calculateMonthlyAmount(earning),
      annualAmount: this.calculateAnnualAmount(earning),
    }));
  
    // Add PG Rent Allowance to earnings if applicable
    if (this.pgRentAmount) {
      earningsData.push({
        name: 'PG Rent Allowance',
        type: 'fixed',
        percentage: null,
        amount: this.pgRentAmount,
        monthlyAmount: this.pgRentAmount,
        annualAmount: this.pgRentAmount * 12
      });
    }
  
    // Add Per Day Allowance with correct calculation based on the timesheet cycle
    if (this.perDayAllowanceAmount) {
      earningsData.push({
        name: 'Per Day Allowance',
        type: 'fixed',
        percentage: null,
        amount: this.perDayAllowanceAmount,
        monthlyAmount: this.perDayAllowanceAmount * timesheetDaysInMonth, // Multiply by days in cycle
        annualAmount: this.perDayAllowanceAmount * 12 * timesheetDaysInMonth // Approximate yearly calculation
      });
    }
  
    return {
      templateName: this.templateName,
      description: this.description,
      annualCTC: this.annualCTC,
      earnings: earningsData,
      deductions: this.deductions.map(deduction => ({
        name: deduction.name,
        type: deduction.type,
        percentage: deduction.percentage || null,
        amount: deduction.amount || null,
        monthlyAmount: this.calculateMonthlyAmount(deduction),
        annualAmount: this.calculateAnnualAmount(deduction)
      }))
    };
  }
  
  /**
   * Function to dynamically calculate the number of days from the 27th of the previous month to the 26th of the current month.
   */
  calculateTimesheetDays(): number {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const totalDaysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
    const daysInPreviousMonth = totalDaysInPreviousMonth - 26;
    const daysInCurrentMonth = 26;
    return daysInPreviousMonth + daysInCurrentMonth;
  }
  
  
  

isSalaryTemplateValid(): boolean {
    // Ensure all required fields are filled
   // const isTemplateNameValid = !!this.templateName; // Check if templateName is not empty
    const isAnnualCTCValid = this.annualCTC > 0; // Check if annualCTC is greater than 0
    const areEarningsValid = this.earnings.length > 0; // Check if at least one earning is added
    const areDeductionsValid = this.deductions.length > 0; // Check if at least one deduction is added

    // Return true only if all conditions are met
    return  isAnnualCTCValid && areEarningsValid && areDeductionsValid;
  }

  saveTemplate() {
    const template = {
      template: {
        templateName: this.templateName,
        description: this.description,
        annualCTC: this.annualCTC,
        rcreuserid: this.employeeId
      },
      components: [
        // Earnings
        ...this.earnings.map((earning) => ({
          componentName: earning.name,
          calculationType: earning.type === 'basicPercentage' ? 'BASICPERCENTAGE' : (earning.type === 'percentage' ? 'PERCENTAGE' : 'FIXED'),  
          value: earning.type === 'basicPercentage' || earning.type === 'percentage' ? earning.percentage : earning.amount,  
          monthlyAmount: this.calculateMonthlyAmount(earning),
          annualAmount: this.calculateAnnualAmount(earning),
          earning: true
        })),
        // Adding other allowances dynamically
        ...this.otherAllowances.map((allowance) => ({
          componentName: allowance.name,
          calculationType: 'FIXED',
          value: allowance.amount,
          monthlyAmount: allowance.amount,
         // annualAmount: allowance.amount * 12, // Assuming yearly calculation
          earning: true
        })),
        // Fixed additional allowances
        {
          componentName: 'Per Day Allowance',
          calculationType: 'FIXED',
          value: this.perDayAllowanceAmount,
          monthlyAmount: this.perDayAllowanceAmount, // Assuming 30 days in a month
         // annualAmount: this.perDayAllowanceAmount, // Assuming 365 days in a year
          earning: true
        },
        {
          componentName: 'PG Rent Allowance',
          calculationType: 'FIXED',
          value: this.pgRentAmount,
          monthlyAmount: this.pgRentAmount,
          //annualAmount: this.pgRentAmount , // Yearly allowance
          earning: true
        },
        // Deductions
        ...this.deductions.map((deduction) => ({
          componentName: deduction.name,
          calculationType: deduction.type === 'basicPercentage' ? 'BASICPERCENTAGE' : (deduction.type === 'percentage' ? 'PERCENTAGE' : 'FIXED'),  
          value: deduction.type === 'basicPercentage' || deduction.type === 'percentage' ? deduction.percentage : deduction.amount,  
          monthlyAmount: this.calculateMonthlyAmount(deduction),
          annualAmount: this.calculateAnnualAmount(deduction),
          earning: false
        }))
      ]
    };  
    // Print the request to the console for debugging
    console.log('Template request:', JSON.stringify(template, null, 2));
  
    this.apiService.saveSalaryTemplate(template).subscribe(
      (response) => {
        console.log('Template saved successfully', response);
        this.loadExistingTemplates(); // Refresh templates after save
      },
      (error) => {
        console.error('Error saving template:', error);
      }
    );
  }

  cancel() {
    this.templateName = '';
    this.description = '';
    this.earnings = [];
    this.deductions = [];
    this.selectedTemplateId = 0;
  }

  loadLocations() {
    this.apiService.getLocationsapi().subscribe({
      next: (data) => {
        console.log("Locations API Response:", data); // Print response
        this.locations = data;
      },
      error: (err) => {
        console.error("Error fetching locations:", err);
      }
    });
  }
  editPerDayAllowance: boolean = false;
  editPgRent: boolean = false;
  
  fetchAllowanceAmount(event: any) {
    const selectedLocation = event.target.value;
  
    // Set both locations to the selected one
    this.selectedLocationPerDay = selectedLocation;
    this.selectedLocationPgRent = selectedLocation;
  
    // Fetch the allowance amounts based on the selected location
    this.apiService.getAllowanceAmount(selectedLocation).subscribe({
      next: (data) => {
        this.perDayAllowanceAmount = data.perDayAllowance;
        this.pgRentAmount = data.pgRent;
      },
      error: (err) => {
        console.error('Error fetching allowance data:', err);
      }
    });
  }
  
  toggleEdit(allowanceType: string) {
    // Reset both edit variables to false before enabling the selected one
    this.editPerDayAllowance = false;
    this.editPgRent = false;
  
    if (allowanceType === 'perDayAllowance') {
      this.editPerDayAllowance = true;
    } else if (allowanceType === 'pgRent') {
      this.editPgRent = true;
    }
  }
  
  



}
