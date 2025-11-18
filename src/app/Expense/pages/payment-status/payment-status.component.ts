import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  approvedAmount: number;
  date: Date;
  status: string;
  paymentStatus?: number;
  category?: string;
  description?: string;
  rejectreason?: string;
  paidThrough?: string;
  applyToTrip?: string;
  approver?: string;
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
  isHr: boolean = false;
  isAcc:boolean = false;
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  employeePaymentStatus: EmployeePaymentStatus[] = [];
  employeeName: string = localStorage.getItem('employeeName') || 'Unknown';
  empId: string = localStorage.getItem('empId') || 'Unknown';
  showPaymentStatusList: boolean = true;
  selectedEmployeePaymentStatus: EmployeePaymentStatus | null = null;
  selectedEmployee: string | null = null;
  showContent: boolean = true;
  showApproveConfirmation: boolean = false;
  isLoading: boolean = false;
  isAdvanceSelected: 'expense' | 'advance' | null = null;
  error: string | undefined;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedAdvances: EmployeePaymentStatus[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;
  animatedWidths: { [empId: string]: string } = {};
  steps = ['Initiated', 'In Progress', 'Finished'];
  uploadedReceipt: string | ArrayBuffer | null = null;

  private paymentStatusOptions = [
    { value: 0, label: 'Payment To Be Initiated' },
    { value: 1, label: 'Payment Initiated' },
    { value: 2, label: 'Payment Done' }
  ];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.empId = localStorage.getItem('employeeId') || '';
    this.isAdmin = this.userService.isAdmin();
    this.isManager = this.userService.isManager();
    this.isHr = this.userService.isHr();
    this.isAcc = this.userService.isAccountant();

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

  getPaymentStatusLabel(status: number | undefined): string {
    const option = this.paymentStatusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Unknown';
  }

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

  loadData() {
    this.isLoading = true;
    this.error = undefined;
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
    const processedExpenses = expenses.map(expense => ({
      ...expense,
      type: 'expense' as const,
      status: expense.status?.trim().toLowerCase() || 'unknown',
      date: new Date(expense.date || Date.now()),
      employeeId: expense.empId || 'unknown',
      employeeName: expense.employeeName || 'Unknown',
      paymentStatus: expense.paymentStatus !== undefined ? expense.paymentStatus : 0,
      rejectreason: expense.rejectreason,
      approvedAmount: expense.approvedAmount,
      approver: expense.approver
    }));

    const processedAdvances = Array.isArray(advances) ? advances.map(advance => ({
      type: 'advance' as const,
      empId: advance.empId || 'unknown',
      employeeName: advance.employeeName || 'Unknown',
      advanceId: advance.advanceId,
      amount: advance.amount || 0,
      date: new Date(advance.advanceDate || Date.now()),
      status: advance.status?.trim().toLowerCase() || 'unknown',
      paymentStatus: advance.paymentStatus !== undefined 
        ? advance.paymentStatus 
        : this.mapAdvanceStatusToPaymentStatus(advance.status),
      paidThrough: advance.paidThrough,
      applyToTrip: advance.applyToTrip,
      approver: advance.approver,
      approvedAmount: advance.approvedAmount,
      description: advance.description || 'Advance payment'
    })) : [];

    this.employeePaymentStatus = [...processedExpenses, ...processedAdvances].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    this.isLoading = false;
    this.calculatePaginationDetails();
    this.updatePagedAdvances();
  }

  mapAdvanceStatusToPaymentStatus(status: string): number {
    switch (status?.toLowerCase()) {
      case 'initiated': return 0;
      case 'in progress': return 1;
      case 'finished': return 2;
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
    this.error = undefined;
    // Ensure paymentStatus is initialized
    this.selectedEmployeePaymentStatus = {
      ...item,
      paymentStatus: item.paymentStatus ?? 0 // Default to 0 if undefined
    };
    this.selectedEmployee = item.empId;
    this.showPaymentStatusList = false;

    // Fetch receipt
    if (item.type === 'expense' && item.expenseId) {
      this.apiService.getReceiptUrl(item.expenseId).subscribe({
        next: (blob: Blob) => {
          this.uploadedReceipt = URL.createObjectURL(blob);
        },
        error: (err) => {
          console.error('Error fetching receipt:', err);
          this.uploadedReceipt = null;
        }
      });
    } else if (item.type === 'advance' && item.advanceId) {
      this.apiService.getAdvanceReceiptUrl(item.advanceId).subscribe({
        next: (blob: Blob) => {
          this.uploadedReceipt = URL.createObjectURL(blob);
        },
        error: (err) => {
          console.error('Error fetching receipt:', err);
          this.uploadedReceipt = null;
        }
      });
    }
  }

  goBack() {
    this.selectedEmployee = null;
    this.selectedEmployeePaymentStatus = null;
    this.uploadedReceipt = null;
    this.showPaymentStatusList = true;
    this.error = undefined;
  }

  updatePagedAdvances() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAdvances = this.employeePaymentStatus.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
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

  paymentStatusAPI(item: EmployeePaymentStatus, paymentStatus: number) {
    const requesterEmpId = this.employeeId;
    if (!requesterEmpId || requesterEmpId === 'Unknown') {
      this.error = 'Error: Approver ID is missing.';
      console.error('Approver ID not found in localStorage');
      return;
    }

    const requestBody = { paymentStatus, requesterEmpId };

    const apiCall =
      item.type === 'expense'
        ? this.apiService.updatePaymentStatus(item.expenseId!, requestBody)
        : this.apiService.updatePaymentStatusadvance(item.advanceId!, requestBody);

    apiCall.subscribe({
      next: () => {
        this.error = undefined;
        // Update the local status
        if (this.selectedEmployeePaymentStatus) {
          this.selectedEmployeePaymentStatus.paymentStatus = paymentStatus;
        }
        // Reload data to ensure consistency
        this.loadData();
        this.showApproveConfirmation = false;
      },
      error: (error) => {
        this.error = `Error updating ${item.type === 'expense' ? 'Expense' : 'Advance'} Payment Status.`;
        console.error('Error from API:', error);
        this.showApproveConfirmation = false;
      }
    });
  }

  handleApproveButton() {
    if (
      !this.selectedEmployeePaymentStatus ||
      !this.selectedEmployeePaymentStatus.approver ||
      this.selectedEmployeePaymentStatus.approver.trim().toLowerCase() !== this.employeeId.trim().toLowerCase()
    ) {
      this.error = 'You are not authorized to approve this request.';
      return;
    }
    this.confirmApprove(this.selectedEmployeePaymentStatus);
  }

  confirmApprove(record: EmployeePaymentStatus) {
    this.selectedEmployeePaymentStatus = record;
    this.isAdvanceSelected = record.type;
    this.showApproveConfirmation = true;
  }

  cancelApproval() {
    this.showApproveConfirmation = false;
    this.error = undefined;
  }

  onPaymentStatusChange(newStatus: number) {
    if (this.selectedEmployeePaymentStatus) {
      this.selectedEmployeePaymentStatus.paymentStatus = newStatus;
      this.confirmApprove(this.selectedEmployeePaymentStatus);
    }
  }

  getAvailableOptions(paymentStatus: number | undefined): { value: number; label: string }[] {
    const status = paymentStatus ?? 0; // Default to 0 if undefined
    if (status === 0) {
      // Allow transition to Initiated (1) or Done (2)
      return this.paymentStatusOptions.filter(option => option.value === 1 || option.value === 2);
    } else if (status === 1) {
      // Allow transition to Done (2)
      return this.paymentStatusOptions.filter(option => option.value === 2);
    } else if (status === 2) {
      // No further transitions
      return [];
    }
    return [];
  }
}