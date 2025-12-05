import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../api.service';

interface Timesheet {
  employeeId: string;
  members: string;
  effectiveWorkingDays: number;
  present: number;
  absent: number;
  missPunch: number;
  od: number;
  compoff: number;
  holiday: number;
  weekoff: number;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  providers: [DatePipe]
})
export class ReportComponent implements OnInit {

  employees: (Timesheet & { halfDay?: number })[] = [];
  filteredEmployees: any[] = [];
  paginatedEmployees: any[] = [];

  selectedEmployee: any = null;
  showSingleReport = false;
  repoteTo: string = '';

  // Payroll months (27th prev → 26th current)
  payrollMonths: { label: string; value: string; year: number; month: number }[] = [];
  selectedPayrollMonth: string = '';  // "2025-03"
  selectedMonthLabel: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 25;
  searchTerm = '';
  loading = false;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.repoteTo = localStorage.getItem('employeeid') || '';
    this.generatePayrollMonths();
    this.selectedPayrollMonth = this.getCurrentPayrollMonth();
    this.updateMonthLabel();
    this.loadTimesheetData();
  }

  generatePayrollMonths(): void {
    const today = new Date();
    const months = [];

    for (let i = 0; i < 24; i++) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 27);
      if (startDate.getDate() !== 27) {
        startDate.setMonth(startDate.getMonth() + 1);
        startDate.setDate(0);
        startDate.setDate(27);
        startDate.setMonth(startDate.getMonth() - 1);
      }
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 26);

      const label = `${this.datePipe.transform(startDate, 'MMM dd, yyyy')} - ${this.datePipe.transform(endDate, 'MMM dd, yyyy')}`;
      const value = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      months.push({
        label,
        value,
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1
      });
    }
    this.payrollMonths = months;
  }

  getCurrentPayrollMonth(): string {
    const today = new Date();
    if (today.getDate() >= 27) {
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 27);
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  updateMonthLabel(): void {
    const month = this.payrollMonths.find(m => m.value === this.selectedPayrollMonth);
    this.selectedMonthLabel = month ? month.label : '';
  }

  onPayrollMonthChange(): void {
    this.updateMonthLabel();
    this.currentPage = 1;
    this.loadTimesheetData();
  }

  loadTimesheetData(): void {
    this.loading = true;
    const [yearStr, monthStr] = this.selectedPayrollMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    this.apiService.getTimesheetData(year, month, this.repoteTo).subscribe({
      next: (data: any[]) => {
        this.employees = data.map((emp: any, idx: number) => ({
          ...emp,
          halfDay: this.getHalfDayCount(emp.present || 0)
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.employees = [];
        this.filteredEmployees = [];
        this.paginatedEmployees = [];
        this.loading = false;
        alert('Failed to load timesheet data');
      }
    });
  }

  getHalfDayCount(present: number): number {
    const frac = present - Math.floor(present);
    return frac >= 0.4 && frac < 1.0 ? 1 : 0;
  }

  applyFilter(): void {
    let filtered = this.employees;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = this.employees.filter(emp =>
        (emp.employeeId?.toLowerCase().includes(term)) ||
        (emp.members?.toLowerCase().includes(term))
      );
    }

    this.filteredEmployees = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(start, end);
  }

  resetPagination(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.pageSize) || 1;
  }

  getSerialNumber(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  downloadReport(): void {
    const exportData = this.employees.map((e, i) => ({
      'S.No': i + 1,
      'Employee ID': e.employeeId,
      'Name': e.members,
      'Effective Days': e.effectiveWorkingDays,
      'Present': e.present,
      'Half Day': e.halfDay || 0,
      'Absent': e.absent,
      'Miss Punch': e.missPunch,
      'OD': e.od,
      'Comp Off': e.compoff,
      'Holidays': e.holiday,
      'Weekoffs': e.weekoff
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');
    XLSX.writeFile(wb, `Timesheet_${this.selectedMonthLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  }

  backToMainPage(): void {
    this.showSingleReport = false;
    this.selectedEmployee = null;
  }
}