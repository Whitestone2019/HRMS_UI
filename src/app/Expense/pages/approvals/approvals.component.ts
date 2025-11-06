import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../api.service';
import { DatePipe, TitleCasePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-approvals',
  standalone: true,
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css'],
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe, DecimalPipe],
})
export class ApprovalsComponent implements OnInit, OnDestroy {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  expenses: any[] = [];
  advanceData: any[] = [];
  filteredExpenses: any[] = [];
  filteredAdvances: any[] = [];
  filteredRecords: any[] = [];
  singlePersonList: any[] = [];
  singlePersonAdvances: any[] = [];
  singlePersonFilteredRecords: any[] = [];
  singlePersonFilterStatus: string = 'all';
  filterStatus: string = 'all';
  viewingDetails: boolean = false;
  selectedExpenseOrAdvance: any = null;
  isAdvanceSelected: boolean = false;
  showReason: boolean = false;
  reason: string = '';
  approvedAmount : number = 0;
  showApproveConfirmation: boolean = false;
  showRejectConfirmation: boolean = false;
  searchEmpName: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  pagedRecords: any[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;
  validStatuses: string[] = ['approved', 'rejected', 'pending'];
  pendingEmployees: string[] = [];
  pendingExpenses: any[] = [];
  pendingAdvances: any[] = [];
  selectedEmployee: string = '';
  showAllExpenses: boolean = false;
  pendingEmployeeSearch: string = '';
  pendingEmployeeObjects: any[] = [];
  receiptUrl: string | null = null;
  showbtn: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.receiptUrl) {
      URL.revokeObjectURL(this.receiptUrl);
      this.receiptUrl = null;
    }
  }

  private reloadData(employeeName?: string) {
    this.loadData();
  }

  loadData() {
    console.log('loadData: Using employeeId:', this.employeeId);
    forkJoin({
      expenses: this.apiService.getExpensesByReportingManager(this.employeeId),
      advances: this.apiService.getAdvancepending(this.employeeId),
    }).subscribe({
      next: ({ expenses, advances }) => {
        console.log('loadData: Raw expenses:', expenses);
        console.log('loadData: Raw advances:', advances);
        this.processExpenses(expenses || []);
        this.processAdvances(advances || []);
        this.processPendingEmployees();
        if (this.selectedEmployee) {
          this.filterSingleEmpList(this.selectedEmployee);
        } else if (this.showAllExpenses) {
          this.filterRecords();
        } else {
          this.filterRecords();
        }
      },
      error: (err) => {
        console.error('loadData: Error loading data:', err);
        alert('Failed to load data. Please try again.');
      },
    });
  }

  processExpenses(expenses: any[]) {
    this.expenses = expenses
      .map((expense) => {
        const processed = {
          ...expense,
          status: expense.status?.trim().toLowerCase() || 'pending',
          date: new Date(expense.date || Date.now()),
          employeeId: expense.empId?.trim() || 'Missing ID',
          employeeName: expense.employeeName?.trim() || 'Unknown Employee',
          reason: expense.rejectreason?.trim() || '',
          approver: expense.approver?.trim() || '',
          type: 'expense' as const,
        };
        if (!expense.empId) console.warn('Missing empId in expense:', expense);
        if (!expense.employeeName) console.warn('Missing employeeName in expense:', expense);
        return processed;
      })
      .filter((expense) => {
        if (expense.employeeId === 'Missing ID' && expense.employeeName === 'Unknown Employee') {
          console.warn('Skipping expense with no valid employee data:', expense);
          return false;
        }
        return true;
      });

    console.log('processExpenses: Raw expenses:', expenses);
    console.log('processExpenses: Processed expenses:', this.expenses);
    this.filterExpenses();
  }

  processAdvances(advances: any[]) {
    this.advanceData = advances
      .map((advance) => {
        const processed = {
          ...advance,
          status: advance.status?.trim().toLowerCase() || 'pending',
          requestDate: new Date(advance.advanceDate || Date.now()),
          employeeId: advance.empId?.trim() || 'Missing ID',
          employeeName: advance.employeeName?.trim() || 'Unknown Employee',
          reason: advance.rejectreason?.trim() || '',
          category: advance.applyToTrip?.trim() || '',
          approver: advance.approver?.trim() || '',
          type: 'advance' as const,
        };
        if (!advance.empId) console.warn('Missing empId in advance:', advance);
        if (!advance.employeeName) console.warn('Missing employeeName in advance:', advance);
        return processed;
      })
      .filter((advance) => {
        if (advance.employeeId === 'Missing ID' && advance.employeeName === 'Unknown Employee') {
          console.warn('Skipping advance with no valid employee data:', advance);
          return false;
        }
        return true;
      });

    console.log('processAdvances: Raw advances:', advances);
    console.log('processAdvances: Processed advances:', this.advanceData);
    this.filterAdvances();
  }

  processPendingEmployees() {
    const pendingNames = new Set<string>();
    const pendingEmployeeObjects: { empId: string; empName: string }[] = [];

    this.expenses
      .filter((expense) => {
        const isPending = expense.status?.includes('pending') || false;
        console.log('processPendingEmployees: Expense status:', expense.status, 'Is pending:', isPending);
        return isPending;
      })
      .forEach((expense) => {
        if (expense.employeeName?.trim() || expense.employeeId) {
          const empName = expense.employeeName?.trim() || 'Unknown Employee';
          const empId = expense.employeeId || 'Missing ID';
          pendingNames.add(empName);
          pendingEmployeeObjects.push({ empId, empName });
        } else {
          console.warn('Skipping expense with no valid employee data:', expense);
        }
      });

    this.advanceData
      .filter((advance) => {
        const isPending = advance.status?.includes('pending') || false;
        console.log('processPendingEmployees: Advance status:', advance.status, 'Is pending:', isPending);
        return isPending;
      })
      .forEach((advance) => {
        if (advance.employeeName?.trim() || advance.employeeId) {
          const empName = advance.employeeName?.trim() || 'Unknown Employee';
          const empId = advance.employeeId || 'Missing ID';
          pendingNames.add(empName);
          pendingEmployeeObjects.push({ empId, empName });
        } else {
          console.warn('Skipping advance with no valid employee data:', advance);
        }
      });

    const uniqueEmployeeMap = new Map<string, { empId: string; empName: string }>();
    pendingEmployeeObjects.forEach((emp) => {
      uniqueEmployeeMap.set(emp.empId, emp);
    });

    this.pendingEmployeeObjects = Array.from(uniqueEmployeeMap.values());
    this.pendingEmployees = Array.from(pendingNames);

    console.log('processPendingEmployees: pendingEmployeeObjects:', this.pendingEmployeeObjects);
    console.log('processPendingEmployees: pendingEmployees:', this.pendingEmployees);
    if (this.pendingEmployees.length === 0) {
      console.warn('No pending employees found. Check expenses and advances for pending statuses.');
    }
  }

  getEmployeeInfo(employeeName: string): { empName: string; empId: string } {
    const emp = this.pendingEmployeeObjects.find(
      (info) => info.empName?.trim().toUpperCase() === employeeName?.trim().toUpperCase()
    );
    if (!emp) {
      console.warn(`No employee info found for name: ${employeeName}`);
    }
    return emp || { empName: employeeName || 'Unknown Employee', empId: 'N/A' };
  }

  get filteredPendingEmployees(): string[] {
    console.log('filteredPendingEmployees: pendingEmployees:', this.pendingEmployees);
    console.log('filteredPendingEmployees: pendingEmployeeSearch:', this.pendingEmployeeSearch);
    if (!this.pendingEmployeeSearch) {
      return this.pendingEmployees;
    }
    const searchTerm = this.pendingEmployeeSearch.toLowerCase().trim();
    const filtered = this.pendingEmployees.filter((employee) => {
      const matchingInfo = this.getEmployeeInfo(employee);
      const matches =
        employee.toLowerCase().includes(searchTerm) ||
        (matchingInfo.empId && matchingInfo.empId.toLowerCase().includes(searchTerm));
      console.log('filteredPendingEmployees: Employee:', employee, 'Matches:', matches);
      return matches;
    });
    console.log('filteredPendingEmployees: Result:', filtered);
    return filtered;
  }

  filterExpenses() {
    let filtered = [...this.expenses];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((expense) =>
        this.filterStatus === 'pending'
          ? expense.status?.includes('pending')
          : expense.status === this.filterStatus
      );
    }

    if (this.searchEmpName?.trim()) {
      const searchTerm = this.searchEmpName.trim().toLowerCase();
      filtered = filtered.filter((expense) => {
        const name = expense.employeeName?.toLowerCase() || '';
        return name.includes(searchTerm);
      });
    }

    filtered.sort((a, b) => {
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return b.date.getTime() - a.date.getTime();
    });

    console.log('filterExpenses: Filtered expenses:', filtered);
    this.filteredExpenses = filtered;
  }

  filterAdvances() {
    let filtered = [...this.advanceData];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((advance) =>
        this.filterStatus === 'pending'
          ? advance.status?.includes('pending')
          : advance.status === this.filterStatus
      );
    }

    if (this.searchEmpName?.trim()) {
      const searchTerm = this.searchEmpName.trim().toLowerCase();
      filtered = filtered.filter((advance) => {
        const name = advance.employeeName?.toLowerCase() || '';
        return name.includes(searchTerm);
      });
    }

    filtered.sort((a, b) => {
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return b.requestDate.getTime() - a.requestDate.getTime();
    });

    console.log('filterAdvances: Filtered advances:', filtered);
    this.filteredAdvances = filtered;
  }

  filterRecords() {
    this.filterExpenses();
    this.filterAdvances();
    this.filteredRecords = [...this.filteredExpenses, ...this.filteredAdvances];
    this.filteredRecords.sort((a, b) => {
      const dateA = a.type === 'advance' ? a.requestDate : a.date;
      const dateB = b.type === 'advance' ? b.requestDate : b.date;
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return dateB.getTime() - dateA.getTime();
    });
    this.currentPage = 1;
    this.calculatePaginationDetails();
    this.updatePagedRecords();
    console.log('filterRecords: Filtered records:', this.filteredRecords);
  }

  filterSingleEmpList(employeeName: string) {
    this.singlePersonList = this.expenses.filter(
      (expense) => expense.employeeName?.trim() === employeeName?.trim()
    );
    this.singlePersonAdvances = this.advanceData.filter(
      (advance) => advance.employeeName?.trim() === employeeName?.trim()
    );
    this.viewingDetails = true;
    this.selectedEmployee = employeeName;
    this.showAllExpenses = false;
    this.filterSingleEmpRecords();
  }

  filterSingleEmpRecords() {
    let filteredExpenses = [...this.singlePersonList];
    let filteredAdvances = [...this.singlePersonAdvances];
    
    if (this.singlePersonFilterStatus !== 'all') {
      filteredExpenses = filteredExpenses.filter((expense) =>
        this.singlePersonFilterStatus === 'pending'
          ? expense.status?.includes('pending')
          : expense.status.toLowerCase() === this.singlePersonFilterStatus.toLowerCase()
      );
      filteredAdvances = filteredAdvances.filter((advance) =>
        this.singlePersonFilterStatus === 'pending'
          ? advance.status?.includes('pending')
          : advance.status.toLowerCase() === this.singlePersonFilterStatus.toLowerCase()
      );
    }

    filteredExpenses.sort((a, b) => {
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return b.date.getTime() - a.date.getTime();
    });

    filteredAdvances.sort((a, b) => {
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return b.requestDate.getTime() - a.requestDate.getTime();
    });

    this.singlePersonFilteredRecords = [...filteredExpenses, ...filteredAdvances];
    this.singlePersonFilteredRecords.sort((a, b) => {
      const dateA = a.type === 'advance' ? a.requestDate : a.date;
      const dateB = b.type === 'advance' ? b.requestDate : b.date;
      const aIsPending = a.status?.includes('pending') || false;
      const bIsPending = b.status?.includes('pending') || false;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return dateB.getTime() - dateA.getTime();
    });
    console.log('filterSingleEmpRecords: Filtered records:', this.singlePersonFilteredRecords);
  }

  updatePagedRecords() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedRecords = this.filteredRecords.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.filteredRecords.length) {
      this.currentPage++;
      this.updatePagedRecords();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedRecords();
    }
  }

  calculatePaginationDetails() {
    this.totalRecords = this.filteredRecords.length;
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
  }

  viewDetails(record: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedExpenseOrAdvance = record;
    this.isAdvanceSelected = record.type === 'advance';
    this.viewingDetails = true;
    this.showReason = false;
    this.reason = '';
    this.checkstatus(record.status);

    if (this.receiptUrl) {
      URL.revokeObjectURL(this.receiptUrl);
      this.receiptUrl = null;
    }

    if (!this.isAdvanceSelected && record.expenseId) {
      this.apiService.getReceiptUrl(record.expenseId).subscribe({
        next: (blob: Blob) => {
          this.receiptUrl = URL.createObjectURL(blob);
        },
        error: (err) => {
          console.error(`Error fetching receipt for expense ${record.expenseId}:`, err);
          this.receiptUrl = '';
        },
      });
    }

    if (this.showAllExpenses) {
      this.pendingExpenses = [];
      this.pendingAdvances = [];
    }
  }

  handleApproveButton() {
    if (
      !this.selectedExpenseOrAdvance ||
      !this.selectedExpenseOrAdvance.approver ||
      this.selectedExpenseOrAdvance.approver.trim().toLowerCase() !== this.employeeId.trim().toLowerCase()
    ) {
      alert('You are not authorized to approve this request.');
      return;
    }
    if (!this.reason.trim()) {
      alert('Please enter a reason for approval');
      return;
    }
    this.confirmApprove(this.selectedExpenseOrAdvance);
  }

  handleRejectButton() {
    if (!this.reason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }
    this.confirmReject(this.selectedExpenseOrAdvance);
  }

  confirmApprove(record: any) {
    this.selectedExpenseOrAdvance = record;
    this.isAdvanceSelected = record.type === 'advance';
    this.showApproveConfirmation = true;
  }

  confirmReject(record: any) {
    this.selectedExpenseOrAdvance = record;
    this.isAdvanceSelected = record.type === 'advance';
    this.showRejectConfirmation = true;
  }

  cancelApproval() {
    this.showApproveConfirmation = false;
    this.showRejectConfirmation = false;
    this.reason = '';
  }

  approveRecord(record: any) {
    const newStatus = 'approved';
    if (this.isValidStatus(newStatus)) {
      if (record.type === 'expense') {
        this.approveExpense(record);
      } else {
        this.approveAdvance(record);
      }
    }
  }

  approveExpense(expense: any) {
    const requestData = {
      status: 'approved',
      approvedAmount:this.approvedAmount,
      reason: this.reason,
    };

    this.apiService.updateExpense(expense.expenseId, requestData).subscribe({
      next: () => {
        expense.status = 'approved';
        expense.reason = this.reason;
        expense.approvedAmount=this.approvedAmount;
        this.backToList();
        this.showApproveConfirmation = false;
        this.reason = '';
        this.reloadData(expense.employeeName);
      },
      error: (err) => {
        console.error('Error approving expense:', err);
        alert('Failed to approve expense. Please try again.');
      },
    });
  }

  approveAdvance(advance: any) {
    const requestData = {
      approvedAmount: this.approvedAmount,
      status: 'approved',
      reason: this.reason,
    };

    this.apiService.updateAdvance(advance.advanceId, requestData).subscribe({
      next: () => {
        advance.status = 'approved';
        advance.reason = this.reason;
        advance.approvedAmount=this.approvedAmount;
        this.backToList();
        this.showApproveConfirmation = false;
        this.reason = '';
        this.reloadData(advance.employeeName);
      },
      error: (err) => {
        console.error('Error approving advance:', err);
        alert('Failed to approve advance. Please try again.');
      },
    });
  }

  rejectExpense(expense: any) {
    const requestData = {
      status: 'rejected',
      reason: this.reason,
    };

    this.apiService.updateExpense1(expense.expenseId, requestData).subscribe({
      next: () => {
        expense.status = 'rejected';
        expense.reason = this.reason;
        this.backToList();
        this.showRejectConfirmation = false;
        this.reason = '';
        this.reloadData(expense.employeeName);
      },
      error: (err) => {
        console.error('Error rejecting expense:', err);
        alert('Failed to reject expense. Please try again.');
      },
    });
  }

  rejectAdvance(advance: any) {
    const requestData = {
      status: 'rejected',
      reason: this.reason,
    };

    this.apiService.updateAdvanceRej(advance.advanceId, requestData).subscribe({
      next: () => {
        advance.status = 'rejected';
        advance.reason = this.reason;
        this.backToList();
        this.showRejectConfirmation = false;
        this.reason = '';
        this.reloadData(advance.employeeName);
      },
      error: (err) => {
        console.error('Error rejecting advance:', err);
        alert('Failed to reject advance. Please try again.');
      },
    });
  }

  isValidStatus(status: string): boolean {
    return this.validStatuses.includes(status.toLowerCase());
  }

  backToList() {
    if (this.receiptUrl) {
      URL.revokeObjectURL(this.receiptUrl);
      this.receiptUrl = null;
    }

    if (this.selectedExpenseOrAdvance && this.viewingDetails) {
      this.selectedExpenseOrAdvance = null;
      this.viewingDetails = true;
      this.showReason = false;
      this.showApproveConfirmation = false;
      this.showRejectConfirmation = false;
      this.reason = '';
      return;
    }

    this.viewingDetails = false;
    this.selectedExpenseOrAdvance = null;
    this.showReason = false;
    this.showApproveConfirmation = false;
    this.showRejectConfirmation = false;
    this.reason = '';
    this.selectedEmployee = '';
    this.showAllExpenses = false;
  }

  showAllExpensesList() {
    this.showAllExpenses = true;
    this.viewingDetails = false;
    this.filterRecords();
  }

  hideAllExpensesList() {
    this.showAllExpenses = false;
    this.selectedEmployee = '';
    this.filterStatus = 'all';
    this.searchEmpName = '';
    this.filteredRecords = [...this.expenses, ...this.advanceData];
    this.currentPage = 1;
    this.updatePagedRecords();
  }

  isPendingStatus(status: string): boolean {
    return status?.trim().toLowerCase().includes('pending') || false;
  }

  checkstatus(status: string) {
    const statusBtn = status?.trim().toLowerCase() || '';
    this.showbtn = this.isPendingStatus(status) || statusBtn === 'new';
    console.log('checkstatus: status:', statusBtn, 'showbtn:', this.showbtn);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return status.toLowerCase().replace(/ /g, '-');
  }
}