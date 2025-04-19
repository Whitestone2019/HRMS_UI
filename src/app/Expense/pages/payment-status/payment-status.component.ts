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
  type: 'expense' | 'advance';
  expenseId?: string;
  advanceId?: string;
  amount: number;
  date: Date;
  status: string;
  paymentStatus?: number;
  category?: string;
  description?: string;
  rejectreason?: string;
  paidThrough?: string;
  applyToTrip?: string;
}

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment-status.component.html',
  styleUrls: ['./payment-status.component.css']
})
export class PaymentStatusComponent {
  isAdmin: boolean = false;
  isManager: boolean = false;
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  employeePaymentStatus: EmployeePaymentStatus[] = [];
  employeeName: string = localStorage.getItem('employeeName') || 'Unknown';
  empId: string = localStorage.getItem('empId') || 'Unknown';
  advanceForm: FormGroup | undefined;
  advances: Advance[] = [];
  showForm: boolean = false;
  filteredAdvances: Advance[] = [];
  filterStatus: string = 'all';
  searchEmployeeName: string = '';
  showPaymentStatusList: boolean = true;
  selectedEmployeePaymentStatus: EmployeePaymentStatus | null = null;
  selectedEmployee: string | null = null;
  showContent: boolean = true;
  newAdvance = {
    advanceDate: '',
    amount: '',
    paidThrough: '',
    applyToTrip: '',
    status: ''
  };
  editingIndex: number | undefined;
  isLoading: boolean = false;
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

  steps = ['Initiated', 'In Progress', 'Finished'];
  currentStep = 1;

  uploadedReceipt: string | ArrayBuffer | null = null;
  receiptImageUrl: string | null = null;

  getProgressWidth(status: number | undefined): string {
    if (status === undefined || status === 0) return '0%';
    if (status === 1) return '50%';
    if (status >= 2) return '100%';
    return '0%';
  }

  getStepColor(dotIndex: number, status: number | null | undefined): string {
    if (status == null || dotIndex > status) return '#e0e0e0';
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
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.empId = localStorage.getItem('employeeId') || '';
    this.isAdmin = this.userService.isAdmin();
    this.isManager = this.userService.isManager();

    if (!this.empId) {
      console.error('Error: Employee ID is missing.');
      this.error = 'Failed to load payment status. Employee ID is missing.';
      return;
    }

    this.loadData();

    setTimeout(() => {
      this.employeePaymentStatus.forEach(item => {
        const width = this.getProgressWidth(item.paymentStatus);
        this.animatedWidths[item.empId] = width;
      });
    }, 100);
  }

  loadData() {
    this.isLoading = true;
    if (this.isAdmin) {
      Promise.all([
        this.apiService.getAllApprovedExpenses().toPromise().then(data => data ?? []),
        this.apiService.getAllApprovedAdvances().toPromise().then(data => data ?? [])
      ])
        .then(([expenses, advances]) => {
          this.processData(expenses, advances);
        })
        .catch(err => this.handleError(err));
    } else {
      Promise.all([
        this.apiService.getApprovedExpensesByEmpId(this.employeeId).toPromise().then(data => data ?? []),
        this.apiService.getApprovedAdvancesByEmpId(this.employeeId).toPromise().then(data => data ?? [])
      ])
        .then(([expenses, advances]) => {
          this.processData(expenses, advances);
        })
        .catch(err => this.handleError(err));
    }
  }

  processData(expenses: any[], advances: any) {
    console.log('Expenses:', expenses);
    console.log('Advances:', advances);

    // Process expenses
    const processedExpenses = expenses.map(expense => {
      const paymentStatus = expense.paymentStatus !== undefined ? expense.paymentStatus : 0;
      console.log(`Expense ${expense.expenseId}: paymentStatus=${paymentStatus}`);
      return {
        ...expense,
        type: 'expense' as const,
        status: expense.status?.trim().toLowerCase() || 'unknown',
        date: new Date(expense.date || Date.now()),
        employeeId: expense.empId || 'unknown',
        employeeName: expense.employeeName || 'Unknown',
        paymentStatus,
        rejectreason: expense.rejectreason
      };
    });

    // Process advances, ensuring advances is an array
    const processedAdvances = Array.isArray(advances) ? advances.map(advance => {
      // Use paymentStatus directly if available, else map from status
      const paymentStatus = advance.paymentStatus !== undefined 
        ? advance.paymentStatus 
        : this.mapAdvanceStatusToPaymentStatus(advance.status);
      console.log(`Advance ${advance.advanceId}: paymentStatus=${paymentStatus}, status=${advance.status}`);
      return {
        type: 'advance' as const,
        empId: advance.empId || 'unknown',
        employeeName: advance.employeeName || 'Unknown',
        advanceId: advance.advanceId,
        amount: advance.amount || 0,
        date: new Date(advance.advanceDate || Date.now()),
        status: advance.status?.trim().toLowerCase() || 'unknown',
        paymentStatus,
        paidThrough: advance.paidThrough,
        applyToTrip: advance.applyToTrip,
        description: advance.description || 'Advance payment'
      };
    }) : [];

    // Combine and sort by date (newest first)
    this.employeePaymentStatus = [...processedExpenses, ...processedAdvances].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    this.employeePaymentStatus.forEach(item => {
      console.log(
        'Type:', item.type,
        'NAME:', item.employeeName,
        'Status:', item.status,
        'Payment Status:', item.paymentStatus
      );
    });

    this.isLoading = false;
    this.calculatePaginationDetails();
    this.updatePagedAdvances();
  }

  mapAdvanceStatusToPaymentStatus(status: string): number {
    switch (status?.toLowerCase()) {
      case 'initiated':
        return 0;
      case 'in progress':
        return 1;
      case 'finished':
        return 2;
      default:
        console.warn(`Unknown advance status: ${status}, defaulting to Initiated`);
        return 0;
    }
  }

  handleError(err: any) {
    console.error('Error fetching data:', err);
    this.error = 'Failed to load data. Please try again later.';
    this.isLoading = false;
  }

  showEmpPaymentStatus(item: EmployeePaymentStatus) {
    if (item.type === 'expense' && item.expenseId) {
      this.apiService.getReceiptUrl(item.expenseId).subscribe((blob: Blob) => {
        this.uploadedReceipt = URL.createObjectURL(blob);
      });
    } else if (item.type === 'advance' && item.advanceId) {
      this.apiService.getAdvanceReceiptUrl(item.advanceId).subscribe((blob: Blob) => {
        this.uploadedReceipt = URL.createObjectURL(blob);
      });
    }
    this.selectedEmployeePaymentStatus = item;
    this.selectedEmployee = item.empId;
    this.showPaymentStatusList = false;
  }

  goBack() {
    this.selectedEmployee = null;
    this.selectedEmployeePaymentStatus = null;
    this.uploadedReceipt = null;
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
    this.totalRecords = this.employeePaymentStatus.length;
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  parseDate(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split(' ');
    const dateParts = parts[0].split('-');
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }

  paymentStatusAPI(item: EmployeePaymentStatus, paymentStatus: number) {
    const requesterEmpId = this.employeeId; // Approver's empId from localStorage
    if (!requesterEmpId || requesterEmpId === 'Unknown') {
      alert('Error: Approver ID is missing.');
      console.error('Approver ID not found in localStorage');
      return;
    }
  
    const requestBody = { paymentStatus, requesterEmpId };
  
    if (item.type === 'expense') {
      this.apiService
        .updatePaymentStatus(item.expenseId!, requestBody)
        .subscribe({
          next: () => {
            alert('Expense Payment Status updated successfully!');
            this.loadData();
            if (this.selectedEmployeePaymentStatus) {
              this.selectedEmployeePaymentStatus.paymentStatus = paymentStatus;
            }
          },
          error: (error) => {
            alert('Error updating Expense Payment Status.');
            console.error('Error from API:', error);
          }
        });
    } else if (item.type === 'advance') {
      this.apiService
        .updateAdvancePaymentStatus(item.advanceId!, requestBody)
        .subscribe({
          next: () => {
            alert('Advance Payment Status updated successfully!');
            this.loadData();
            if (this.selectedEmployeePaymentStatus) {
              this.selectedEmployeePaymentStatus.paymentStatus = paymentStatus;
            }
          },
          error: (error) => {
            alert('Error updating Advance Payment Status.');
            console.error('Error from API:', error);
          }
        });
    }
  }
}