import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { Advance } from '../../shared/models/advance.model';
import { ApiService } from '../../../api.service';
import { Router } from '@angular/router';
import { UserService } from '../../../user.service';

interface EmployeePaymentStatus {
  empId: string;
  employeeName: string;
  advances: Advance[];
}

interface PaymentStatusEmployeesMap {
  [empId: string]: EmployeePaymentStatus;
}

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment-status.component.html',
  styleUrl: './payment-status.component.css'
})
export class PaymentStatusComponent {
  isAdmin: boolean = false;
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  employeePaymentStatus: any[] = [];
  employeeName: string = localStorage.getItem('employeeName') || 'Unknown';
  empId: string = localStorage.getItem('empId') || 'Unknown';
  advanceForm: FormGroup | undefined;
  advances: Advance[] = [];
  showForm: boolean = false;
  filteredAdvances: Advance[] = [];
  filterStatus: string = 'all';
  searchEmployeeName: string = '';
  showPaymentStatusList: boolean = true;
  selectedEmployeePaymentStatus: any;
  selectedEmployee: string | null = null;
  showContent: boolean = true; // Initially show content
  newAdvance = {
    advanceDate: '',
    amount: '',
    paidThrough: '',
    applyToTrip: '',
    status: ''
  };
  editingIndex: number | undefined;
  isLoading: boolean | undefined;
  userRole: any;
  error: string | undefined;
  advance: any;
  advanceId: any;

  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedAdvances: Advance[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;

  animatedWidths: { [empId: string]: string } = {};

  steps = ['Initiated', 'In Progress', 'Finished']; // Can be any number of steps
  currentStep = 1; // Set this to 1, 2, or 3 dynamically


  uploadedReceipt: string | ArrayBuffer | null = null;
  receiptImageUrl: string | null = null;

  getProgressWidth(status: number | undefined): string {
    if (status === undefined || status === 0) return '0%';
    if (status === 1) return '50%';
    if (status >= 2) return '100%';
    return '0%';
  }

  getStepColor(dotIndex: number, status: number | null | undefined): string {
    if (status == null || dotIndex > status) return '#e0e0e0'; // default gray for future steps

    // Step is active — return color based on index
    switch (dotIndex) {
      case 0: return 'orange';
      case 1: return 'yellow';
      case 2: return 'green';
      default: return '#e0e0e0';
    }
  }

  get paymentStatus(): number {
    return this.selectedEmployeePaymentStatus?.paymentStatus ?? 0;
  }

  get segment1Width(): string {
    return this.paymentStatus >= 1 ? '50%' : '0%';
  }

  get segment2Width(): string {
    return this.paymentStatus >= 2 ? '50%' : '0%';
  }



  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UserService,) { }

  ngOnInit(): void {
    this.empId = localStorage.getItem('employeeId') || '';
    this.isAdmin = this.userService.isAdmin();

    if (!this.empId) {
      console.error('Error: Employee ID is missing.');
      this.error = 'Failed to load payment status. Employee ID is missing.';
      return;
    }

    this.loadExpenses();


    setTimeout(() => {
      this.employeePaymentStatus.forEach(expense => {
        const width = this.getProgressWidth(expense.paymentStatus);
        this.animatedWidths[expense.empId] = width;
      });
    }, 100);
  }

  loadExpenses() {

    const processExpenses = (expenses: any[]) => {
      if (!expenses || expenses.length === 0) {
        console.warn('No expenses found.');
      }

      this.employeePaymentStatus = expenses
        .map((expense) => {
          return {
            ...expense,
            status: expense.status.trim().toLowerCase(),
            date: new Date(expense.date),
            employeeId: expense.empId,
            employeeName: expense.employeeName,
            rejectreason: expense.rejectreason,
          };
        })
        .filter((expense) => expense.status === 'approved') // ✅ Filter only 'approved'
        .sort((a, b) => b.date.getTime() - a.date.getTime()); // ✅ Newest first

      this.employeePaymentStatus.map((data) => {
        console.log('NAME :', data.employeeName, '\t Status :', data.status, '\t Payment Status ', data.paymentStatus);
      })

    };

    const handleError = (err: any) => {
      console.error('Error fetching expenses:', err);
      this.error = 'Failed to load expenses. Please try again later.';
      this.isLoading = false;
    };

    if (this.isAdmin) {
      console.log('Calling API: getExpenses()');
      this.apiService.getAllApprovals().subscribe({
        next: processExpenses,
        error: handleError,
      });
    } else {
      console.log('Calling API: getExpensesEmp()');
      this.apiService.getApprovals(this.employeeId).subscribe({
        next: processExpenses,
        error: handleError,
      });
    }
  }

  showEmpPaymentStatus(employee: any) {
    if (employee?.expenseId) {
      this.apiService.getReceiptUrl(employee?.expenseId).subscribe((blob: Blob) => {
        const fileUrl = URL.createObjectURL(blob);
        this.uploadedReceipt = fileUrl;
      });
    }
    this.selectedEmployeePaymentStatus = employee
    this.selectedEmployee = employee.empId;
    this.showPaymentStatusList = false;
  }

  goBack() {
    this.selectedEmployee = null;
    this.showPaymentStatusList = true;
  }

  updatePagedAdvances() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAdvances = this.filteredAdvances.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.filteredAdvances.length) {
      this.currentPage++;
      this.updatePagedAdvances();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedAdvances();
    }
  }

  calculatePaginationDetails() {
    this.totalRecords = this.filteredAdvances.length;
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  parseDate(dateString: string): string {
    if (!dateString) return '';

    const parts = dateString.split(' ');
    const dateParts = parts[0].split('-');  // ["23", "12", "2024"]
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }

  paymentStatusAPI(expenseId: string, paymentStatus: number) {
    this.apiService
      .updatePaymentStatus(expenseId, paymentStatus)
      .subscribe({
        next: (response: any) => {
          alert('Payment Status updated successfully!');
          this.loadExpenses();
          this.selectedEmployeePaymentStatus.paymentStatus = paymentStatus;
        },
        error: (error: any) => {
          alert('Error updating Payment Status.');
          console.error('Error from API:', error);
        },
      });
  }
}  
