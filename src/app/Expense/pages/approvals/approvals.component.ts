import { Component, OnInit } from '@angular/core';
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
export class ApprovalsComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  expenses: any[] = [];
  advanceData: any[] = [];
  filteredExpenses: any[] = [];
  filteredAdvances: any[] = [];
  filteredRecords: any[] = []; // Combined expenses and advances
  singlePersonList: any[] = [];
  singlePersonAdvances: any[] = [];
  singlePersonFilteredRecords: any[] = []; // Combined for single employee
  singlePersonFilterStatus: string = 'all';
  filterStatus: string = 'all';
  viewingDetails: boolean = false;
  selectedExpenseOrAdvance: any = null;
  isAdvanceSelected: boolean = false;
  showRejectReason: boolean = false;
  rejectreason: string = '';
  showApproveConfirmation: boolean = false;
  searchEmpName: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedRecords: any[] = []; // Combined paged records
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

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      expenses: this.apiService.getExpensesByReportingManager(this.employeeId),
      advances: this.apiService.getAdvancepending(this.employeeId),
    }).subscribe({
      next: ({ expenses, advances }) => {
        this.processExpenses(expenses);
        this.processAdvances(advances);
        this.processPendingEmployees();
        this.filterRecords();
      },
      error: (err) => {
        console.error('Error loading data:', err);
      },
    });
  }

  processExpenses(expenses: any[]) {
    console.log("expenses",expenses);
    this.expenses = expenses.map((expense) => ({
      ...expense,
      status: expense.status.trim().toLowerCase(),
      date: new Date(expense.date),
      employeeId: expense.empId,
      employeeName: expense.employeeName,
      rejectreason: expense.rejectreason,
      type: 'expense',
    }));

    this.expenses.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.date.getTime() - a.date.getTime();
    });

    this.filterExpenses();
  }

  processAdvances(advances: any[]) {
    console.log("advances",advances);
    this.advanceData = advances.map((advance) => ({
      ...advance,
      status: advance.status.trim().toLowerCase(),
      requestDate: new Date(advance.advanceDate),
      employeeId: advance.empId,
      employeeName: advance.employeeName,
      rejectreason: advance.rejectreason,
      category : advance.applyToTrip,
      type: 'advance',
    }));

    this.advanceData.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });

    this.filterAdvances();
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

  processPendingEmployees() {
    this.apiService.getPendingEmployees().subscribe({
      next: (employeeInfo) => {
        this.pendingEmployeeObjects = employeeInfo;
        this.pendingEmployees = employeeInfo
          .map((info) => info.empName)
          .filter((empName) => {
            const hasPendingExpense = this.expenses.some(
              (expense) => expense.employeeName === empName && expense.status === 'pending'
            );
            const hasPendingAdvance = this.advanceData.some(
              (advance) => advance.employeeName === empName && advance.status === 'pending'
            );
            return hasPendingExpense || hasPendingAdvance;
          });
      },
      error: (err) => {
        console.error('Error fetching pending employees:', err);
      },
    });
  }

  getEmployeeInfo(employeeName: string): any {
    return this.pendingEmployeeObjects.find((info) => info.empName === employeeName);
  }

  get filteredPendingEmployees(): string[] {
    if (!this.pendingEmployeeSearch) {
      return this.pendingEmployees;
    }
    const searchTerm = this.pendingEmployeeSearch.toLowerCase();
    return this.pendingEmployees.filter((employee) => {
      const matchingInfo = this.pendingEmployeeObjects.find((info) => info.empName === employee);
      if (matchingInfo) {
        return (
          employee.toLowerCase().includes(searchTerm) ||
          matchingInfo.empId.toLowerCase().includes(searchTerm)
        );
      }
      return employee.toLowerCase().includes(searchTerm);
    });
  }

  filterExpenses() {
    let filtered = [...this.expenses];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((expense) => expense.status === this.filterStatus);
    }

    if (this.searchEmpName && this.searchEmpName.trim() !== '') {
      filtered = filtered.filter((expense) =>
        expense.employeeName?.toLowerCase().includes(this.searchEmpName.trim().toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.date.getTime() - a.date.getTime();
    });

    this.filteredExpenses = filtered;
  }

  filterAdvances() {
    let filtered = [...this.advanceData];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((advance) => advance.status === this.filterStatus);
    }

    if (this.searchEmpName && this.searchEmpName.trim() !== '') {
      filtered = filtered.filter((advance) =>
        advance.employeeName?.toLowerCase().includes(this.searchEmpName.trim().toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });

    this.filteredAdvances = filtered;
  }

  filterRecords() {
    this.filterExpenses();
    this.filterAdvances();
    this.filteredRecords = [...this.filteredExpenses, ...this.filteredAdvances];
    this.filteredRecords.sort((a, b) => {
      const dateA = a.type === 'advance' ? a.requestDate : a.date;
      const dateB = b.type === 'advance' ? b.requestDate : b.date;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return dateB.getTime() - dateA.getTime();
    });
    this.currentPage = 1;
    this.updatePagedRecords();
    this.calculatePaginationDetails();
  }

  filterSingleEmpList(employeeName: string) {
    this.singlePersonList = this.expenses.filter(
      (expense) => expense.employeeName === employeeName
    );
    this.singlePersonAdvances = this.advanceData.filter(
      (advance) => advance.employeeName === employeeName
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
      filteredExpenses = filteredExpenses.filter(
        (expense) => expense.status === this.singlePersonFilterStatus
      );
      filteredAdvances = filteredAdvances.filter(
        (advance) => advance.status === this.singlePersonFilterStatus
      );
    }

    filteredExpenses.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.date.getTime() - a.date.getTime();
    });

    filteredAdvances.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });

    this.singlePersonFilteredRecords = [...filteredExpenses, ...filteredAdvances];
    this.singlePersonFilteredRecords.sort((a, b) => {
      const dateA = a.type === 'advance' ? a.requestDate : a.date;
      const dateB = b.type === 'advance' ? b.requestDate : b.date;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return dateB.getTime() - dateA.getTime();
    });
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
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  viewDetails(record: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedExpenseOrAdvance = record;
    this.isAdvanceSelected = record.type === 'advance';
    this.viewingDetails = true;
    if (this.showAllExpenses) {
      this.pendingExpenses = [];
      this.pendingAdvances = [];
    }
  }

  enableRejectReason() {
    this.showRejectReason = true;
    this.rejectreason = '';
  }

  confirmApprove(record: any) {
    this.selectedExpenseOrAdvance = record;
    this.isAdvanceSelected = record.type === 'advance';
    this.showApproveConfirmation = true;
  }

  cancelApproval() {
    this.showApproveConfirmation = false;
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
    const formData = new FormData();
    formData.append('status', 'approved');

    this.apiService.updateExpense(expense.expenseId, formData).subscribe({
      next: () => {
        expense.status = 'approved';
        this.backToList();
        this.showApproveConfirmation = false;
        this.loadData();
      },
      error: (err) => console.error('Error approving expense:', err),
    });
  }

  approveAdvance(advance: any) {
    const formData = new FormData();
    formData.append('status', 'approved');

    this.apiService.updateAdvance(advance.advanceId, formData).subscribe({
      next: () => {
        advance.status = 'approved';
        this.backToList();
        this.showApproveConfirmation = false;
        this.loadData();
      },
      error: (err) => console.error('Error approving advance:', err),
    });
  }

  handleRejectButton() {
    if (this.showRejectReason) {
      if (this.isAdvanceSelected) {
        this.rejectAdvance(this.selectedExpenseOrAdvance);
      } else {
        this.rejectExpense(this.selectedExpenseOrAdvance);
      }
    } else {
      this.enableRejectReason();
    }
  }

  rejectExpense(expense: any) {
    if (!this.rejectreason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    const requestData = {
      status: 'rejected',
      reason: this.rejectreason,
    };

    this.apiService.updateExpense1(expense.expenseId, requestData).subscribe({
      next: () => {
        expense.status = 'rejected';
        expense.rejectreason = this.rejectreason;
        this.backToList();
        this.showRejectReason = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Error rejecting expense:', err);
      },
    });
  }

  rejectAdvance(advance: any) {
    if (!this.rejectreason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    const requestData = {
      status: 'rejected',
      reason: this.rejectreason,
    };

    this.apiService.updateAdvanceRej(advance.advanceId, requestData).subscribe({
      next: () => {
        advance.status = 'rejected';
        advance.rejectreason = this.rejectreason;
        this.backToList();
        this.showRejectReason = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Error rejecting advance:', err);
      },
    });
  }

  isValidStatus(status: string): boolean {
    return this.validStatuses.includes(status.toLowerCase());
  }

  backToList() {
    if (this.selectedExpenseOrAdvance && this.viewingDetails) {
      this.selectedExpenseOrAdvance = null;
      this.viewingDetails = true;
      this.showRejectReason = false;
      this.showApproveConfirmation = false;
      return;
    }

    this.viewingDetails = false;
    this.selectedExpenseOrAdvance = null;
    this.showRejectReason = false;
    this.showApproveConfirmation = false;
    this.selectedEmployee = '';
    this.showAllExpenses = false;
  }
}