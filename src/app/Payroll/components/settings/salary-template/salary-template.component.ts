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
  isEarning?: boolean;
  isDeduction?: boolean;
  isPayrollDeduction?: boolean;
}
 
export interface PayrollDeductionComponent {
  name: string;
  amount?: number;
  percentage?: number;
 type: 'fixed' | 'percentage' | 'remaining' | 'earnings' | 'deductions' | 'reimbursements' | 'basicPercentage';
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
  payrollDeductions?: PayrollDeductionComponent[];
  components?: any[];
  netSalaryMonthly?: number;
  netSalaryAnnual?: number;
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
  payrollDeductions: PayrollDeductionComponent[] = [];
  templates: SalaryTemplate[] = [];
  selectedTemplateId: number = 0;
  selectedLocationPerDay: any;
  selectedLocationPgRent: any;
  perDayAllowanceAmount: number = 0;
  pgRentAmount: number = 0;
  locations: any[] = [];
  editPerDayAllowance: boolean = false;
  editPgRent: boolean = false;
  showNegativeAllowanceError: boolean = false;
  allComponents: any[] = []; // Store all components from API
 
  constructor(private apiService: ApiService) {}
 
  ngOnInit() {
    this.loadLocations();
    this.loadAllComponents(); // Load components on init
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
 
    if (this.form.value?.payrollDeductions) {
      try {
        this.payrollDeductions = typeof this.form.value.payrollDeductions === 'string'
          ? JSON.parse(this.form.value.payrollDeductions)
          : this.form.value.payrollDeductions;
      } catch (error) {
        console.error('Error parsing payroll deductions:', error);
        this.payrollDeductions = [];
      }
    }
 
    this.updateSpecialAllowance();
    this.calculateNetSalary();
 
    if (!this.annualCTC) {
      this.loadSettings();
      this.loadExistingTemplates();
    }
  }
 
  // Load all components from API
  loadAllComponents() {
    this.apiService.getComponents().subscribe({
      next: (components) => {
        this.allComponents = components;
        console.log('All components loaded:', this.allComponents);
      },
      error: (error) => {
        console.error('Error loading components:', error);
      }
    });
  }
 
  updateSpecialAllowance() {
    let specialAllowance = this.earnings.find(e => e.name === 'Special Allowance');
   
    if (!specialAllowance) {
      specialAllowance = {
        name: 'Special Allowance',
        type: 'fixed',
        amount: 0
      };
      this.earnings.push(specialAllowance);
    }
 
    const totalOtherEarnings = this.earnings
      .filter(earning => earning.name !== 'Special Allowance')
      .reduce((sum, earning) => sum + this.calculateMonthlyAmount(earning), 0);
 
    const totalDeductions = this.calculateTotalDeductions();
    const monthlySalary = this.annualCTC / 12;
 
    specialAllowance.amount = monthlySalary - totalOtherEarnings - totalDeductions;
   
    // Check if special allowance is negative
    this.showNegativeAllowanceError = specialAllowance.amount < 0;
   
    // Recalculate net salary after special allowance update
    this.calculateNetSalary();
  }
 
  onAnnualCTCChange() {
    this.updateSpecialAllowance();
    this.calculateNetSalary();
  }
 
  isSalaryTemplateValid(): boolean {
    const isAnnualCTCValid = this.annualCTC > 0;
    const areEarningsValid = this.earnings.length > 0;
    const isSpecialAllowanceValid = !this.showNegativeAllowanceError;
 
    return isAnnualCTCValid && areEarningsValid && isSpecialAllowanceValid;
  }
 
  loadSettings() {
    forkJoin([
      this.apiService.getComponents(),
      this.apiService.getPTSlabs(),
      this.apiService.getSettings()
    ]).pipe(
      tap(([components, ptSlabs, settings]) => {
        this.allComponents = components; // Store all components
       
        // Initialize earnings with components marked as earnings
        this.earnings = components
          .filter((comp: any) => comp.type === 'earnings')
          .map((comp: any) => ({
            name: comp.name,
            type: comp.calculationType,
            percentage: comp.amount || 0,
            amount: comp.amount || 0
          }));
 
        // Clear and load ONLY statutory deductions
        this.deductions = [];
        this.setPFAndESI(settings);
        this.setPTSlabs(ptSlabs);
 
        // Initialize payroll deductions with components marked as payroll deductions
        this.payrollDeductions = components
          .filter((comp: any) => comp.type === 'deductions')
          .map((comp: any) => ({
            name: comp.name,
            type: comp.calculationType,
            percentage: comp.amount || 0,
            amount: comp.amount || 0
          }));
 
        this.annualCTC = settings.annualCTC || 0;
 
        this.setPFAndESI(settings);
        this.setPTSlabs(ptSlabs);
 
        this.updateSpecialAllowance();
        this.calculateNetSalary();
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
      this.templateName = template.templateName || '';
      this.description = template.description || '';
      this.annualCTC = template.annualCTC || 0;
 
      // Reset arrays
      this.earnings = [];
      this.deductions = [];
      this.payrollDeductions = [];
      this.perDayAllowanceAmount = 0;
      this.pgRentAmount = 0;
 
      if (template.components && Array.isArray(template.components)) {
        template.components.forEach(component => {
          const name = component.componentName || '';
          const calcType = (component.calculationType || 'FIXED').toUpperCase();
          const value = component.value || 0;
 
          // Read all possible flag variations from backend
          const isEarning = component.isEarning === true || component.earning === true;
 
          const isPayrollDeduction =
            component.isPayrollDeduction === true ||
            component.payrollDeduction === true;
 
          const hasDeductionFlag =
            component.deductionFlag === true ||
            component.isDeductionFlag === true ||
            component.deductionFlag === 1;  // safety for boolean vs number
 
          // 1. Handle special fixed allowances first
          if (name === 'Per Day Allowance') {
            this.perDayAllowanceAmount = value;
            return;
          }
          if (name === 'PG Rent Allowance') {
            this.pgRentAmount = value;
            return;
          }
 
          // 2. Payroll Deductions (Tax, mis) — HIGHEST PRIORITY for non-earnings
          if (isPayrollDeduction) {
            this.payrollDeductions.push({
              name,  
               type: calcType === 'BASICPERCENTAGE' ? 'basicPercentage' :
               calcType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              percentage: calcType === 'PERCENTAGE' ? value : 0,
              amount: calcType === 'FIXED' ? value : 0,
            });
            return; // Stop here — do NOT go to deductions
          }
 
          // 3. Regular Deductions — ONLY if deductionFlag: true AND not payroll
          if (hasDeductionFlag && !isPayrollDeduction) {
            this.deductions.push({
              name,
              type: calcType === 'BASICPERCENTAGE' ? 'basicPercentage' :
                     calcType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              percentage: (calcType === 'PERCENTAGE' || calcType === 'BASICPERCENTAGE') ? value : 0,
              amount: calcType === 'FIXED' ? value : 0,
            });
            return;
          }
 
          // 4. Earnings — everything with isEarning: true (Basic, HRA, Special Allowance, etc.)
          if (isEarning) {
            this.earnings.push({
              name,
              type: calcType === 'BASICPERCENTAGE' ? 'basicPercentage' :
                     calcType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              percentage: (calcType === 'PERCENTAGE' || calcType === 'BASICPERCENTAGE') ? value : 0,
              amount: calcType === 'FIXED' ? value : 0,
            });
          }
 
          // Note: If a component has none of the flags (rare/error case), it will be ignored
        });
      }
 
      this.addMissingComponents();
      this.updateSpecialAllowance();
      this.calculateNetSalary();
    },
    (error) => {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    }
  );
}
 
  // Add missing components from master list
  addMissingComponents() {
    if (!this.allComponents || this.allComponents.length === 0) {
      console.warn('No master components available');
      return;
    }
 
    // Add missing earnings
    this.allComponents
      .filter((comp: any) => comp.type === 'earnings')
      .forEach((comp: any) => {
        if (!this.earnings.some(e => e.name === comp.name)) {
          this.earnings.push({
            name: comp.name,
            type: comp.calculationType,
            percentage: comp.amount || 0,
            amount: comp.amount || 0
          });
        }
      });
 
    // Add missing deductions
    this.allComponents
      .filter((comp: any) => comp.type === 'deductions')
      .forEach((comp: any) => {
        if (!this.deductions.some(d => d.name === comp.name)) {
          this.deductions.push({
            name: comp.name,
            type: comp.calculationType,
            percentage: comp.amount || 0,
            amount: comp.amount || 0
          });
        }
      });
 
    // Add missing payroll deductions
    this.allComponents
      .filter((comp: any) => comp.type === 'payroll_deductions')
      .forEach((comp: any) => {
       if (!this.deductions.some(d => d.name === comp.name)) {
          this.deductions.push({
            name: comp.name,
            type: comp.calculationType,
            percentage: comp.amount || 0,
            amount: comp.amount || 0
          });
        }
      });
  }
 
  onTemplateChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.selectedTemplateId = parseInt(selectedValue);
    this.loadSelectedTemplate(this.selectedTemplateId);
  }
 
  setPFAndESI(settings: any) {
    if (settings.pfRate) {
      if (!this.deductions.some(d => d.name === 'Provident Fund')) {
        this.deductions.push({
          name: 'Provident Fund',
          type: 'percentage',
          percentage: settings.pfRate
        });
      }
    }
 
    if (settings.esiRate) {
      if (!this.deductions.some(d => d.name === 'Employee State Insurance')) {
        this.deductions.push({
          name: 'Employee State Insurance',
          type: 'percentage',
          percentage: settings.esiRate
        });
      }
    }
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
 
  addPayrollDeduction() {
    this.payrollDeductions.push({ name: '', amount: 0, percentage: 0, type: 'fixed' });
    this.calculateNetSalary();
  }
 
  removePayrollDeduction(index: number) {
    this.payrollDeductions.splice(index, 1);
    this.calculateNetSalary();
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
 
 calculatePayrollMonthlyAmount(component: PayrollDeductionComponent): number {
  if (component.type === 'percentage') {
    const grossSalary = this.calculateTotalGrossMonthly();
    return (grossSalary * (component.percentage || 0)) / 100;
  } else if (component.type === 'basicPercentage') {
    // Calculate basic salary first
    const basicSalary = this.earnings.find(e => e.name === 'Basic')
      ? this.calculateMonthlyAmount(this.earnings.find(e => e.name === 'Basic')!)
      : this.annualCTC * 0.40 / 12; // fallback 40% of CTC
    return (basicSalary * (component.percentage || 0)) / 100;
  } else if (component.type === 'fixed') {
    return component.amount || 0;
  }
  return 0;
}
 
  calculatePayrollAnnualAmount(component: PayrollDeductionComponent): number {
    return this.calculatePayrollMonthlyAmount(component) * 12;
  }
 
  calculateTotalGrossMonthly(): number {
    return this.earnings.reduce((sum, component) => sum + this.calculateMonthlyAmount(component), 0);
  }
 
  calculateTotalGrossAnnual(): number {
    return this.calculateTotalGrossMonthly() * 12;
  }
 
  calculateTotalDeductions(): number {
    return this.deductions.reduce((sum, component) => sum + this.calculateMonthlyAmount(component), 0);
  }
 
  calculateTotalPayrollDeductions(): number {
    return this.payrollDeductions.reduce((sum, component) => sum + this.calculatePayrollMonthlyAmount(component), 0);
  }
 
  calculateNetSalary(): number {
    const grossSalary = this.calculateTotalGrossMonthly();
    const deductions = this.calculateTotalDeductions();
    const payrollDeductions = this.calculateTotalPayrollDeductions();
   
    return grossSalary  - payrollDeductions;
  }
 
  getSalaryTemplateData(): any {
    const timesheetDaysInMonth = this.calculateTimesheetDays();
    const netSalaryMonthly = this.calculateNetSalary();
    const netSalaryAnnual = netSalaryMonthly * 12;
   
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
      deductions: this.deductions.map(d => ({
        name: d.name,
        type: d.type,
        percentage: d.percentage || null,
        amount: d.amount || null,
        monthlyAmount: this.calculateMonthlyAmount(d),
        annualAmount: this.calculateAnnualAmount(d)
      })),
      payrollDeductions: this.payrollDeductions.map(p => ({
        name: p.name,
        type: p.type,
        percentage: (p.type === 'percentage' || p.type === 'basicPercentage') ? (p.percentage || null) : null,
        amount: p.type === 'fixed' ? (p.amount || null) : null,
        monthlyAmount: this.calculatePayrollMonthlyAmount(p),
        annualAmount: this.calculatePayrollAnnualAmount(p)
      })),
      netSalaryMonthly,
      netSalaryAnnual
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
 
  saveTemplate() {
    if (this.showNegativeAllowanceError) {
      alert('Cannot save template: Special Allowance cannot be negative. Please adjust your components.');
      return;
    }
 
    if (!this.isSalaryTemplateValid()) {
      alert('Please fill all required fields and ensure valid values!');
      return;
    }
 
    const netSalaryMonthly = this.calculateNetSalary();
    const netSalaryAnnual = netSalaryMonthly * 12;
 
    const template = {
      template: {
        templateName: this.templateName,
        description: this.description,
        annualCTC: this.annualCTC,
        netSalaryMonthly: netSalaryMonthly,
        netSalaryAnnual: netSalaryAnnual,
        rcreuserid: this.employeeId
      },
      components: [
        ...this.earnings.map((earning) => ({
          componentName: earning.name,
          calculationType: earning.type === 'basicPercentage' ? 'BASICPERCENTAGE' : (earning.type === 'percentage' ? 'PERCENTAGE' : 'FIXED'),  
          value: earning.type === 'basicPercentage' || earning.type === 'percentage' ? earning.percentage : earning.amount,  
          monthlyAmount: this.calculateMonthlyAmount(earning),
          annualAmount: this.calculateAnnualAmount(earning),
          earning: true,
           deductionFlag:false,
           otherAllowancesFlag:false,
          payrollDeduction: false
        })),
        ...this.otherAllowances.map((allowance) => ({
          componentName: allowance.name,
          calculationType: 'FIXED',
          value: allowance.amount,
          monthlyAmount: allowance.amount,
          earning: true,
          deductionFlag:false,
           otherAllowancesFlag:true,
          payrollDeduction: false
        })),
        {
          componentName: 'Per Day Allowance',
          calculationType: 'FIXED',
          value: this.perDayAllowanceAmount,
          monthlyAmount: this.perDayAllowanceAmount,
          earning: true,
           deductionFlag:false,
            otherAllowancesFlag:true,
          payrollDeduction: false
        },
        {
          componentName: 'PG Rent Allowance',
          calculationType: 'FIXED',
          value: this.pgRentAmount,
          monthlyAmount: this.pgRentAmount,
          earning: true,
           deductionFlag:false,
          otherAllowancesFlag:true,
          payrollDeduction: false
        },
        ...this.deductions.map((deduction) => ({
          componentName: deduction.name,
          calculationType: deduction.type === 'basicPercentage' ? 'BASICPERCENTAGE' :
                          deduction.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
          value: deduction.type === 'percentage' || deduction.type === 'basicPercentage'
                 ? deduction.percentage
                 : deduction.amount,
          monthlyAmount: this.calculateMonthlyAmount(deduction),
          annualAmount: this.calculateAnnualAmount(deduction),
          earning: false,
          deductionFlag:true,
          otherAllowancesFlag:false,
          payrollDeduction: false
        })),
         ...this.payrollDeductions.map((deduction) => ({
          componentName: deduction.name,
          calculationType: deduction.type === 'basicPercentage' ? 'BASICPERCENTAGE' :
                          deduction.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
          value: deduction.type === 'percentage' || deduction.type === 'basicPercentage'
                 ? deduction.percentage  // Fixed: now correctly sends percentage
                 : deduction.amount,
          monthlyAmount: this.calculatePayrollMonthlyAmount(deduction),
          annualAmount: this.calculatePayrollAnnualAmount(deduction),
          earning: false,
          deductionFlag:false,
          otherAllowancesFlag:false,
          payrollDeduction: true
        }))
      ]
    };
 
    this.apiService.saveSalaryTemplate(template).subscribe(
      (response) => {
        console.log('Template saved successfully', response);
        this.loadExistingTemplates();
        alert('Template saved successfully!');
      },
      (error) => {
        console.error('Error saving template:', error);
        alert('Error saving template. Please try again.');
      }
    );
  }
 
  cancel() {
    this.templateName = '';
    this.description = '';
    this.earnings = [];
    this.deductions = [];
    this.payrollDeductions = [];
    this.selectedTemplateId = 0;
    this.perDayAllowanceAmount = 0;
    this.pgRentAmount = 0;
    this.showNegativeAllowanceError = false;
    this.annualCTC = 0;
   
    // Reload default components
    this.loadSettings();
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
        this.calculateNetSalary();
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
 