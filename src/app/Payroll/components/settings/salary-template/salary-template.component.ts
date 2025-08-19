import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../api.service';
import { forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface SalaryComponent {
  name: string;
  amount?: number;
  percentage?: number;
  type: 'fixed' | 'percentage' | 'remaining' | 'earnings' | 'deductions' | 'reimbursements' | 'basicPercentage';
  value?: number;
  monthlyAmount?: number;
  annualAmount?: number;
}

export interface SalaryTemplate {
  templateId: number;
  templateName: string;
  description?: string;
  annualCTC?: number;
  earnings?: SalaryComponent[];
  deductions?: SalaryComponent[];
  components?: any[];
}

@Component({
  selector: 'app-salary-template',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './salary-template.component.html',
  styleUrls: ['./salary-template.component.css']
})
export class SalaryTemplateComponent {
  @Input() form!: FormGroup;
  @Input() basic: string = '';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  templateName = '';
  description = '';
  annualCTC = 0;
  otherAllowances: SalaryComponent[] = [];
  earnings: SalaryComponent[] = [];
  deductions: SalaryComponent[] = [];
  templates: SalaryTemplate[] = [];
  selectedTemplateId: number = 0;
  selectedLocationPerDay: any;
  selectedLocationPgRent: any;
  perDayAllowanceAmount: number = 0;
  pgRentAmount: number = 0;
  locations: any[] = [];
  editPerDayAllowance: boolean = false;
  editPgRent: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadLocations();
    if (!this.form) {
      this.loadSettings();
      this.loadExistingTemplates();
      console.error("Form is undefined!");
      return;
    }

    this.annualCTC = this.form.value?.annualCTC || 0;

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

    this.updateSpecialAllowance();

    if (!this.annualCTC) {
      this.loadSettings();
      this.loadExistingTemplates();
    }
  }

  updateSpecialAllowance() {
    // Find or create special allowance component
    let specialAllowance = this.earnings.find(e => e.name === 'Special Allowance');
    
    if (!specialAllowance) {
      specialAllowance = {
        name: 'Special Allowance',
        type: 'fixed',
        amount: 0
      };
      this.earnings.push(specialAllowance);
    }

    // Calculate total of all earnings except special allowance
    const totalOtherEarnings = this.earnings
      .filter(earning => earning.name !== 'Special Allowance')
      .reduce((sum, earning) => sum + this.calculateMonthlyAmount(earning), 0);

    // Calculate total deductions
    const totalDeductions = this.calculateTotalDeductions();

    // Calculate monthly salary from annual CTC
    const monthlySalary = this.annualCTC / 12;

    // Special allowance is what's left after other earnings and deductions
    specialAllowance.amount = monthlySalary - totalOtherEarnings - totalDeductions;
  }

  onAnnualCTCChange() {
    this.updateSpecialAllowance();
  }

  loadSettings() {
    forkJoin([
      this.apiService.getComponents(),
      this.apiService.getPTSlabs(),
      this.apiService.getSettings()
    ]).pipe(
      tap(([components, ptSlabs, settings]) => {
        this.earnings = settings.earnings || [];
        this.deductions = settings.deductions || [];
        this.annualCTC = settings.annualCTC || 0;

        this.setPFAndESI(settings);
        this.setDefaultComponents(components);
        this.setPTSlabs(ptSlabs);

        this.updateSpecialAllowance();
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
        this.templateName = template.templateName;
        this.description = template.description || '';
        this.annualCTC = template.annualCTC || 0;
  
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
  
            if (componentName === 'Per Day Allowance') {
              this.perDayAllowanceAmount = value;
            } else if (componentName === 'PG Rent Allowance') {
              this.pgRentAmount = value;
            } else if (component.isEarning) {  
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
            } else {
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

        this.updateSpecialAllowance();
      },
      (error) => {
        console.error('Error loading template:', error);
      }
    );
  }

  onTemplateChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.selectedTemplateId = parseInt(selectedValue);
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
    components.forEach((component: any) => {
      if (component.type === 'earnings' && !this.earnings.some((existingComponent) => existingComponent.name === component.name)) {
        this.earnings.push({
          name: component.name,
          type: component.calculationType,
          percentage: component.amount || 0,
          amount: component.amount || 0
        });
      }
    });

    components.forEach((component: any) => {
      if (component.type === 'deductions' && !this.deductions.some((existingComponent) => existingComponent.name === component.name)) {
        this.deductions.push({
          name: component.name,
          type: component.calculationType,
          percentage: component.amount || 0,
          amount: component.amount || 0
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
    this.earnings.push({ name: '', amount: 0, percentage: 0, type: 'fixed' });
    this.updateSpecialAllowance();
  }

  removeEarning(index: number) {
    // Don't allow removal if it's the Special Allowance
    if (this.earnings[index].name !== 'Special Allowance') {
      this.earnings.splice(index, 1);
      this.updateSpecialAllowance();
    }
  }

  addDeduction() {
    this.deductions.push({ name: '', amount: 0, percentage: 0, type: 'fixed' });
    this.updateSpecialAllowance();
  }

  removeDeduction(index: number) {
    this.deductions.splice(index, 1);
    this.updateSpecialAllowance();
  }

  calculateMonthlyAmount(component: SalaryComponent): number {
    if (component.type === 'percentage') {
      return (this.annualCTC * (component.percentage || 0)) / 100 / 12;
    } else if (component.type === 'basicPercentage') {
      const basicSalary = this.earnings.find(e => e.name === 'Basic') 
        ? this.calculateMonthlyAmount(this.earnings.find(e => e.name === 'Basic')!)
        : this.annualCTC * 0.40 / 12;
      return (basicSalary * (component.percentage || 0)) / 100;
    } else if (component.type === 'fixed') {
      return component.amount || 0;
    }
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
      type: earning.type,
      percentage: earning.percentage || null,
      amount: earning.amount || null,
      monthlyAmount: this.calculateMonthlyAmount(earning),
      annualAmount: this.calculateAnnualAmount(earning),
    }));
  
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
  
    if (this.perDayAllowanceAmount) {
      earningsData.push({
        name: 'Per Day Allowance',
        type: 'fixed',
        percentage: null,
        amount: this.perDayAllowanceAmount,
        monthlyAmount: this.perDayAllowanceAmount * timesheetDaysInMonth,
        annualAmount: this.perDayAllowanceAmount * 12 * timesheetDaysInMonth
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
    const isAnnualCTCValid = this.annualCTC > 0;
    const areEarningsValid = this.earnings.length > 0;
    const areDeductionsValid = this.deductions.length > 0;

    return isAnnualCTCValid && areEarningsValid && areDeductionsValid;
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
        ...this.earnings.map((earning) => ({
          componentName: earning.name,
          calculationType: earning.type === 'basicPercentage' ? 'BASICPERCENTAGE' : (earning.type === 'percentage' ? 'PERCENTAGE' : 'FIXED'),  
          value: earning.type === 'basicPercentage' || earning.type === 'percentage' ? earning.percentage : earning.amount,  
          monthlyAmount: this.calculateMonthlyAmount(earning),
          annualAmount: this.calculateAnnualAmount(earning),
          earning: true
        })),
        ...this.otherAllowances.map((allowance) => ({
          componentName: allowance.name,
          calculationType: 'FIXED',
          value: allowance.amount,
          monthlyAmount: allowance.amount,
          earning: true
        })),
        {
          componentName: 'Per Day Allowance',
          calculationType: 'FIXED',
          value: this.perDayAllowanceAmount,
          monthlyAmount: this.perDayAllowanceAmount,
          earning: true
        },
        {
          componentName: 'PG Rent Allowance',
          calculationType: 'FIXED',
          value: this.pgRentAmount,
          monthlyAmount: this.pgRentAmount,
          earning: true
        },
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

    this.apiService.saveSalaryTemplate(template).subscribe(
      (response) => {
        console.log('Template saved successfully', response);
        this.loadExistingTemplates();
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
    this.perDayAllowanceAmount = 0;
    this.pgRentAmount = 0;
  }

  loadLocations() {
    this.apiService.getLocationsapi().subscribe({
      next: (data) => {
        this.locations = data;
      },
      error: (err) => {
        console.error("Error fetching locations:", err);
      }
    });
  }

  fetchAllowanceAmount(event: any) {
    const selectedLocation = event.target.value;
    this.selectedLocationPerDay = selectedLocation;
    this.selectedLocationPgRent = selectedLocation;
  
    this.apiService.getAllowanceAmount(selectedLocation).subscribe({
      next: (data) => {
        this.perDayAllowanceAmount = data.perDayAllowance;
        this.pgRentAmount = data.pgRent;
        this.updateSpecialAllowance();
      },
      error: (err) => {
        console.error('Error fetching allowance data:', err);
      }
    });
  }
  
  toggleEdit(allowanceType: string) {
    this.editPerDayAllowance = false;
    this.editPgRent = false;
  
    if (allowanceType === 'perDayAllowance') {
      this.editPerDayAllowance = true;
    } else if (allowanceType === 'pgRent') {
      this.editPgRent = true;
    }
  }
}