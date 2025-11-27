import { Component, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { ApiService, PayrollAdjustment } from '../../../api.service';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface PayrollEmployee {
  empId: string;
  name: string;
  baseSalary: number;
  pgRentAllowance: number;
  perDayRate: number;
  allowanceDays: number;
  totalAllowanceAmount: number;
  hasAllowance: boolean;
  lopDays: number;
  effectiveWorkingDays: number;
  perDaySalary: number;
  lopDeduction: number;
  otherDeduction: number;
  deductionRemarks: string;
  netPay: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, HeaderComponent, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponentPayroll {
  @ViewChild('remarksInput') remarksInput!: ElementRef<HTMLTextAreaElement>;

  // Main Payroll Table
  showMainPayrollTable = true;
  showPayrollAdjTable = false;

  // Payroll Data
  payrollData: PayrollEmployee[] = [];
  filteredData: PayrollEmployee[] = [];
  displayedData: PayrollEmployee[] = [];
  searchTerm = '';
  sortBy = 'name';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Adjustments Table (Modal)
  adminAdjustments: PayrollAdjustment[] = [];
  filteredAdminAdjustments: PayrollAdjustment[] = [];
  displayedAdjustments: PayrollAdjustment[] = [];
  adjSearchTerm = '';
  adjustmentsMonth = '';

  currentAdjPage = 1;
  itemsPerAdjPage = 15;
  totalAdjPages = 0;

  // General
  isEditing = false;
  isLoading = false;
  payrollPeriod = '';
  totalPeriodDays = 0;

  // Modal
  selectedEmp: PayrollEmployee | null = null;
  tempDeduction = 0;
  tempRemarks = '';

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadPayrollPreview();
  }

  loadPayrollPreview() {
    this.isLoading = true;
    this.apiService.previewPayroll().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.totalPeriodDays = this.getDaysBetweenMonths();

        this.payrollData = (response.previewData || []).map((emp: any): PayrollEmployee => {
          const baseSalary = emp.basesalary || 0;
          const perDaySalary = emp.effectiveWorkingDays > 0 ? baseSalary / emp.effectiveWorkingDays : 0;

          return {
            empId: emp.empId || '',
            name: emp.bnfName || 'Unknown',
            baseSalary,
            pgRentAllowance: emp.pgRentAllowance || 0,
            perDayRate: emp.perDayRate || 0,
            allowanceDays: emp.perDayAllowanceDays || 0,
            totalAllowanceAmount: 0,
            hasAllowance: (emp.perDayRate || 0) > 0,
            lopDays: emp.lopDays || 0,
            effectiveWorkingDays: emp.effectiveWorkingDays || 25,
            perDaySalary: this.round(perDaySalary),
            lopDeduction: 0,
            otherDeduction: emp.otherDeduction || 0,
            deductionRemarks: emp.deductionRemarks || '',
            netPay: 0
          };
        });

        this.payrollData.forEach(emp => this.recalcNetPay(emp));

        this.payrollPeriod = response.month
          ? formatDate(response.month + '-01', 'MMM yyyy', 'en-US')
          : formatDate(new Date(), 'MMM yyyy', 'en-US');

        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'Failed to load payroll data.', 'error');
      }
    });
  }

  recalcNetPay(emp: PayrollEmployee) {
    const perDaySalary = emp.effectiveWorkingDays > 0 ? emp.baseSalary / emp.effectiveWorkingDays : 0;
    emp.perDaySalary = this.round(perDaySalary);
    emp.lopDeduction = this.round(perDaySalary * emp.lopDays);

    let totalAllowance = 0;
    if (emp.hasAllowance) {
      emp.totalAllowanceAmount = this.round(emp.perDayRate * emp.allowanceDays);
      totalAllowance = emp.totalAllowanceAmount;
    }

    emp.netPay = this.round(
      emp.baseSalary +
      totalAllowance +
      emp.pgRentAllowance -
      emp.lopDeduction -
      emp.otherDeduction
    );
  }

  round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  openDeductionRemarksModal(emp: PayrollEmployee) {
    this.selectedEmp = emp;
    this.tempDeduction = emp.otherDeduction;
    this.tempRemarks = emp.deductionRemarks;

    setTimeout(() => {
      const modal = new (window as any).bootstrap.Modal(document.getElementById('deductionRemarksModal'));
      modal.show();
      setTimeout(() => this.remarksInput?.nativeElement.focus(), 300);
    }, 100);
  }

  validateDeduction(emp: PayrollEmployee) {
    if (emp.otherDeduction > 0 && !emp.deductionRemarks.trim()) {
      this.openDeductionRemarksModal(emp);
    }
  }

  saveRemarks() {
    if (!this.tempRemarks.trim()) {
      Swal.fire('Required', 'Remarks are required for deduction.', 'warning');
      return;
    }

    if (this.selectedEmp) {
      this.selectedEmp.otherDeduction = this.tempDeduction;
      this.selectedEmp.deductionRemarks = this.tempRemarks.trim();
      this.recalcNetPay(this.selectedEmp);
    }

    const modalEl = document.getElementById('deductionRemarksModal');
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }

  showRemarks(emp: PayrollEmployee) {
    const remarks = emp.deductionRemarks.trim();
    Swal.fire('Remarks', remarks || 'No remarks added.', 'info');
  }

  applyFilters() {
    this.filteredData = this.payrollData.filter(emp =>
      emp.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      emp.empId.includes(this.searchTerm)
    );

    this.filteredData.sort((a, b) => {
      const aVal = (a as any)[this.sortBy] ?? '';
      const bVal = (b as any)[this.sortBy] ?? '';
      return aVal.toString().localeCompare(bVal.toString());
    });

    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedData = this.filteredData.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateDisplayedData();
  }

  enableEditing() {
    if (!this.payrollData.length) {
      Swal.fire('Empty', 'No data to edit.', 'info');
      return;
    }
    this.isEditing = true;
  }

  savePayroll() {
    const invalid = this.payrollData.some(emp => emp.otherDeduction > 0 && !emp.deductionRemarks.trim());
    if (invalid) {
      Swal.fire('Missing Remarks', 'Please add remarks for all employees with "Other Deduction".', 'error');
      return;
    }

    const payload = this.payrollData.map(emp => ({
      empId: emp.empId,
      lopDays: emp.lopDays,
      effectiveWorkingDays: emp.effectiveWorkingDays,
      allowanceDays: emp.hasAllowance ? emp.allowanceDays : null,
      perDayAllowance: emp.hasAllowance ? emp.totalAllowanceAmount : 0,
      netPay: emp.netPay,
      otherDeduction: emp.otherDeduction,
      deductionRemarks: emp.deductionRemarks
    }));

    this.apiService.savePayrollData(payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Payroll updated successfully!', 'success');
        this.isEditing = false;
        this.loadPayrollPreview();
      },
      error: () => Swal.fire('Error', 'Save failed.', 'error')
    });
  }

  runPayroll() {
    this.showPayrollAdjTable = false;
    this.showMainPayrollTable = true;
    this.apiService.runPayroll().subscribe({
      next: (response: any) => {
        const msg = response.status || response.message || 'Payroll processed successfully!';
        Swal.fire('Success', msg, 'success');
        this.loadPayrollPreview();
      },
      error: (error: any) => {
        const msg = error?.error?.error || error?.error || error.message || 'Run failed.';
        Swal.fire('Payroll Failed', msg, 'error');
      }
    });
  }

  generateAdjustments() {
    this.showPayrollAdjTable = true;
    this.showMainPayrollTable = false;
    this.apiService.generateAdjustments().subscribe({
      next: (res: any) => {
        Swal.fire('Success', res.status || 'Drafts generated successfully!', 'success');
        this.prepareAdjustmentsModal();
      },
      error: (err) => {
        Swal.fire('Error', err.error?.error || 'Generation failed', 'error');
      }
    });
  }

  exportPayroll() {
    this.apiService.exportPayrollData().subscribe({
      next: (res: any) => {
        const url = window.URL.createObjectURL(new Blob([res]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payroll_${this.payrollPeriod.replace(' ', '_')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getDaysBetweenMonths(): number {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const start = new Date(prevYear, prevMonth, 27);
    const end = new Date(year, month, 26);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  getPreviousMonthName(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return formatDate(date, 'MMM yyyy', 'en-US');
  }

  // === ADJUSTMENTS MODAL LOGIC ===
  prepareAdjustmentsModal() {
    this.showPayrollAdjTable = true;
    this.showMainPayrollTable = false;
    this.isLoading = true;
    this.adjSearchTerm = '';
    this.currentAdjPage = 1;

    this.adjustmentsMonth = formatDate(new Date(), 'MMM yyyy', 'en-US');

    this.apiService.getAllPayrollAdjustments().subscribe({
      next: (data: PayrollAdjustment[]) => {
        this.adminAdjustments = data;
        this.filteredAdminAdjustments = [...data];

        if (data.length > 0 && data[0]?.month) {
          this.adjustmentsMonth = formatDate(data[0].month + '-01', 'MMM yyyy', 'en-US');
        }

        this.filterAndPaginateAdjustments();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showMainPayrollTable = true;
        Swal.fire('Error', 'Failed to load adjustments', 'error');
      }
    });
  }

  filterAndPaginateAdjustments() {
    const term = this.adjSearchTerm.toLowerCase();
    this.filteredAdminAdjustments = this.adminAdjustments.filter(a =>
      a.empId.toLowerCase().includes(term) ||
      a.employeeName.toLowerCase().includes(term) ||
      (a.managerId && a.managerId.toLowerCase().includes(term))
    );

    this.totalAdjPages = Math.ceil(this.filteredAdminAdjustments.length / this.itemsPerAdjPage);
    this.currentAdjPage = 1;
    this.updateDisplayedAdjustments();
  }

  updateDisplayedAdjustments() {
    const start = (this.currentAdjPage - 1) * this.itemsPerAdjPage;
    const end = start + this.itemsPerAdjPage;
    this.displayedAdjustments = this.filteredAdminAdjustments.slice(start, end);
  }

  changeAdjPage(page: number) {
    if (page < 1 || page > this.totalAdjPages) return;
    this.currentAdjPage = page;
    this.updateDisplayedAdjustments();
  }

  onModalShown() {
    this.showMainPayrollTable = false;
  }

  onModalHidden() {
    this.showMainPayrollTable = true;
    this.showPayrollAdjTable = false;
    this.isLoading = false;
    this.adjSearchTerm = '';
    this.currentAdjPage = 1;
  }

  adminApprove(adj: PayrollAdjustment) {
    if (confirm(`Approve adjustment for ${adj.employeeName}?`)) {
      this.apiService.adminApproveAdjustment(adj.id!).subscribe({
        next: () => {
          adj.approvalStatus = 'APPROVED';
          Swal.fire('Approved', 'Adjustment approved successfully', 'success');
        },
        error: (err) => Swal.fire('Error', err.error?.error || 'Approval failed', 'error')
      });
    }
  }

  adminReject(adj: PayrollAdjustment) {
    Swal.fire({
      title: 'Reject Adjustment',
      input: 'textarea',
      inputLabel: 'Rejection Remarks (sent to manager)',
      inputPlaceholder: 'Enter reason...',
      showCancelButton: true,
      confirmButtonText: 'Reject & Notify',
      confirmButtonColor: '#dc3545',
      preConfirm: (remarks) => {
        if (!remarks?.trim()) {
          Swal.showValidationMessage('Remarks are required');
        }
        return remarks.trim();
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.adminRejectAdjustment(adj.id!, result.value).subscribe({
          next: () => {
            adj.approvalStatus = 'REJECTED';
            adj.payrollRejectRemarks = '[REJECTED BY ADMIN] ' + result.value;
            Swal.fire('Rejected', 'Adjustment rejected and manager notified', 'success');
          },
          error: (err) => Swal.fire('Error', err.error?.error || 'Rejection failed', 'error')
        });
      }
    });
  }
}