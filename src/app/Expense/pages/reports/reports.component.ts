import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { ApiService } from '../../../api.service';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../user.service';
import { Advance } from '../../../Expense/shared/models/advance.model';
import { forkJoin } from 'rxjs';

interface ReportItem {
  type: 'expense' | 'advance';
  empId: string;
  employeeName: string;
  date: Date;
  amount: number;
  currency?: string;
  category?: string;
  description?: string;
  status?: string;
}

interface MonthYear {
  year: number;
  month: number;
  label: string;
}

@Component({
  selector: 'app-expenses-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [DatePipe],
})
export class ExpensesReportComponent implements OnInit {
  expenses: any[] = [];
  selectedMonthYear: MonthYear;
  userRole: any;
  employeeId: string = '';
  showSingleReport: boolean = false;
  selectedExpense: any = null;
  monthYearOptions: MonthYear[] = [];

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe,
    private userService: UserService
  ) {
    this.populateMonthYearOptions();
    this.selectedMonthYear = this.getCurrentMonthYear();
  }

  ngOnInit(): void {
    this.employeeId = this.userService.employeeId ?? '';
    this.userRole = this.userService.role;

    console.log('Report Component - User Role:', this.userRole);
    console.log('Report Component - Employee ID:', this.employeeId);

    this.fetchMonthlyReportData(this.selectedMonthYear);
  }

  populateMonthYearOptions(): void {
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      this.monthYearOptions.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: this.datePipe.transform(date, 'MMMM YYYY')!,
      });
    }
    this.monthYearOptions.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  getCurrentMonthYear(): MonthYear {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: this.datePipe.transform(now, 'MMMM YYYY')!,
    };
  }

    onMonthYearChange(event: any): void {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const [monthStr, yearStr] = selectedValue.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      this.selectedMonthYear = {
        year: year,
        month: month,
        label: this.datePipe.transform(new Date(year, month - 1), 'MMMM yyyy')!,
      };
      this.fetchMonthlyReportData(this.selectedMonthYear);
    } else {
      this.selectedMonthYear = this.getCurrentMonthYear();
      this.fetchMonthlyReportData(this.selectedMonthYear);
    }
  }

  fetchMonthlyReportData(monthYear: MonthYear): void {
    const month = monthYear.month;
    const year = monthYear.year;
    this.expenses = [];
    console.log('Fetching report data for Employee ID:', this.employeeId);
    console.log('Selected Month-Year:', `${this.padZero(month)}-${year}`);

    const fetchExpenses$ = this.userRole === 'ADMIN'
      ? this.apiService.getAllExpenses()
      : this.apiService.getExpensesEmp(this.employeeId);

    const fetchAdvances$ = this.userRole === 'ADMIN'
      ? this.apiService.getAdvances('')
      : this.apiService.getAdvance(this.employeeId);

    forkJoin([fetchExpenses$, fetchAdvances$]).subscribe({
      next: ([expenses, advances]) => {
        const formattedExpenses: ReportItem[] = expenses.map((expense: { [x: string]: any; }) => ({
          type: 'expense',
          empId: expense['empId'],
          employeeName: expense['employeeName'],
          date: new Date(expense['date']),
          amount: expense['amount'],
          currency: expense['currency'] || 'USD',
          category: expense['category'],
          description: expense['description'],
          status: expense['status'],
        }));

        let formattedAdvances: ReportItem[] = [];
        if (advances) {
          formattedAdvances = advances.map((advance: Advance) => ({
            type: 'advance',
            empId: advance.empId ?? 'Unknown',
            employeeName: advance.employeeName ? advance.employeeName : '',
            date: new Date(advance.advanceDate),
            amount: advance.amount,
            currency: 'INR',
            category: advance.paidThrough,
            description: advance.applyToTrip,
            status: advance.status ?? 'Pending',
          }));
        }

        this.expenses = [...formattedExpenses, ...formattedAdvances].filter(item => {
          const itemMonth = item.date.getMonth() + 1;
          const itemYear = item.date.getFullYear();
          return itemMonth === month && itemYear === year;
        });

        console.log('Combined Report Items (filtered):', this.expenses);
      },
      error: (error) => {
        console.error('Error fetching report data:', error);
        this.expenses = [];
      },
      complete: () => {
        console.log('Data fetching completed.');
      }
    });
  }

  downloadReport(): void {
    if (!this.expenses || this.expenses.length === 0) {
      alert('No data to download for the selected month.');
      return;
    }
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.expenses.map((item) => ({
        'Type': item.type,
        'Employee ID': item.empId,
        'Employee Name': item.employeeName,
        Date: this.datePipe.transform(item.date, 'yyyy-MM-dd'),
        'Category/Description': `${item.category || ''} / ${item.description || ''}`,
        Amount: `${item.currency || ''} ${item.amount}`,
        Status: item.status,
      }))
    );
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');
    const formattedMonthYear = this.datePipe.transform(new Date(this.selectedMonthYear.year, this.selectedMonthYear.month - 1), 'MMMM_yyyy')!;
    XLSX.writeFile(workbook, `Monthly_Report_${formattedMonthYear}.xlsx`);
  }

  viewExpenseDetails(item: any): void {
    this.selectedExpense = item;
    this.showSingleReport = true;
  }

  downloadSingleExpenseReport(): void {
    if (!this.selectedExpense) return;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([
      {
        'Type': this.selectedExpense.type,
        Date: this.datePipe.transform(this.selectedExpense.date, 'yyyy-MM-dd'),
        Category: this.selectedExpense.category,
        Description: this.selectedExpense.description,
        Amount: this.selectedExpense.amount,
        Currency: this.selectedExpense.currency,
        Status: this.selectedExpense.status,
      },
    ]);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `${this.selectedExpense.employeeName}_${this.selectedExpense.type}_Report`
    );
    XLSX.writeFile(
      workbook,
      `${this.selectedExpense.employeeName}_${this.selectedExpense.type}_Report.xlsx`
    );
  }

  backToMainPage(): void {
    this.showSingleReport = false;
  }

  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}