import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../api.service';
import { DatePipe, TitleCasePipe, DecimalPipe } from '@angular/common';

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
  filteredExpenses: any[] = [];
  filterStatus: string = 'all';
  viewingDetails: boolean = false;
  selectedExpense: any = null;
  showRejectReason: boolean = false;
  rejectreason: string = '';
  showApproveConfirmation: boolean = false;
  searchEmpName: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedExpenses: any[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;

  validStatuses: string[] = ['approved', 'rejected', 'pending'];
  pendingEmployees: string[] = [];
  pendingExpenses: any[] = [];
  selectedEmployee: string = '';
  showAllExpenses: boolean = false;
  pendingEmployeeSearch: string = '';
  pendingEmployeeObjects: any[] = []; 
  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadExpenses();
  }

  showAllExpensesList() {
    this.showAllExpenses = true;
    this.viewingDetails = false;
  }

  hideAllExpensesList() {
    this.showAllExpenses = false;
    this.selectedEmployee = "";
    this.filterStatus = "all";
    this.searchEmpName = "";
    this.filteredExpenses = this.expenses; 
    this.pagedExpenses = this.filteredExpenses.slice(0, this.itemsPerPage);
    this.currentPage = 1;
}
  loadExpenses() {
    console.log('Loading expenses for employee:', this.employeeId);
    this.apiService.getApprovals(this.employeeId).subscribe({
      next: (expenses: any[]) => {
        console.log('Fetched expenses:', expenses);

        this.expenses = expenses.map((expense) => {
          console.log('Expense fields:', expense);

          return {
            ...expense,
            status: expense.status.trim().toLowerCase(),
            date: new Date(expense.date),
            employeeId: expense.empId,
            employeeName: expense.employeeName, // Add employee name
            rejectreason: expense.rejectreason
          };
        });

        this.expenses.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.date.getTime() - a.date.getTime();
        });

        this.filterExpenses();
        this.updatePagedExpenses();
        this.processPendingEmployees();
      },
      error: (err) => {
        console.error('Error fetching expenses:', err);
      },
    });
  }
  processPendingEmployees() {
    this.apiService.getPendingEmployees().subscribe({
        next: (employeeInfo: any[]) => {
            this.pendingEmployeeObjects = employeeInfo;
            this.pendingEmployees = employeeInfo
                .map(info => info.empName)
                .filter(empName => {
                    // Check if there are any pending expenses for this employee
                    return this.expenses.some(expense =>
                        expense.employeeName === empName &&
                        expense.status.toLowerCase() === 'pending'
                    );
                });
        },
        error: (err) => {
            console.error('Error fetching pending employees:', err);
        },
    });
}

getEmployeeInfo(employeeName: string): any {
  return this.pendingEmployeeObjects.find(info => info.empName === employeeName);
}

  get filteredPendingEmployees(): string[] {
    if (!this.pendingEmployeeSearch) {
      return this.pendingEmployees;
    }
    const searchTerm = this.pendingEmployeeSearch.toLowerCase();
    return this.pendingEmployees.filter(employee => {
      const matchingInfo = this.pendingEmployeeObjects.find(info => info.empName === employee);
      if (matchingInfo) {
        return employee.toLowerCase().includes(searchTerm) || matchingInfo.empId.toLowerCase().includes(searchTerm);
      } else {
        return employee.toLowerCase().includes(searchTerm);
      }
    });
  }
  showEmployeeExpenses(employeeName: string) {
    this.pendingExpenses = this.expenses.filter(
        (expense) =>
            expense.employeeName === employeeName &&
            expense.status.toLowerCase() === 'pending'
    );
    this.viewingDetails = true;
    this.selectedEmployee = employeeName;
    this.showAllExpenses = false;
    // Added this line to reset viewingDetails when moving to employee list
    this.viewingDetails = true;
}

  filterExpenses() {
    let filtered = [...this.expenses];

    console.log('All Employee Names:', this.expenses.map((e) => e.empName));
    console.log('Search Name:', this.searchEmpName);

    if (this.expenses.length > 0) {
      console.log('Sample Record:', this.expenses[0]);
    }

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((expense) => expense.status === this.filterStatus);
    }
    if (this.searchEmpName && this.searchEmpName.trim() !== '') {
      filtered = filtered.filter((expense) =>
        expense.employeeName
          ?.toLowerCase()
          .includes(this.searchEmpName.trim().toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.date.getTime() - a.date.getTime();
    });
    this.filteredExpenses = filtered;
    console.log('Filtered Expenses:', this.filteredExpenses);
    this.currentPage = 1;
    this.updatePagedExpenses();
    this.calculatePaginationDetails();
  }

  updatePagedExpenses() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedExpenses = this.filteredExpenses.slice(startIndex, endIndex);
  }
  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.filteredExpenses.length) {
      this.currentPage++;
      this.updatePagedExpenses();
    }
  }
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedExpenses();
    }
  }

  calculatePaginationDetails() {
    this.totalRecords = this.filteredExpenses.length;
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  viewExpenseDetails(expense: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedExpense = expense;
    this.viewingDetails = true;
    if (this.showAllExpenses === true) {
      this.pendingExpenses = [];
    }
  }

  enableRejectReason() {
    this.showRejectReason = true;
    this.rejectreason = '';
  }

  confirmApprove(expense: any) {
    this.showApproveConfirmation = true;
  }

  cancelApproval() {
    this.showApproveConfirmation = false;
  }

  approveExpense(expense: any) {
    const newStatus = 'approved';
    if (this.isValidStatus(newStatus)) {
      const formData = new FormData();
      formData.append('status', newStatus);
      this.apiService.updateExpense(expense.expenseId, formData).subscribe({
        next: () => {
          expense.status = newStatus;
          this.backToList();
        },
        error: (err) => console.error('Error approving expense:', err),
      });
    }
  }

  handleRejectButton() {
    if (this.showRejectReason) {
      this.rejectExpense(this.selectedExpense);
    } else {
      this.enableRejectReason();
    }
  }

  rejectExpense(expense: any) {
    if (!this.rejectreason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    const newStatus = 'rejected';
    const requestData = {
      status: newStatus,
      reason: this.rejectreason,
    };

    console.log('Reject Expense Request:', {
      expenseId: expense.expenseId,
      status: newStatus,
      reason: this.rejectreason,
    });

    this.apiService.updateExpense1(expense.expenseId, requestData).subscribe({
      next: (response) => {
        console.log('Reject Expense Response:', response);

        expense.status = newStatus;
        this.backToList();
        this.showRejectReason = false;
      },
      error: (err) => {
        console.error('Error rejecting expense:', err);
      },
    });
  }

  isValidStatus(status: string): boolean {
    return this.validStatuses.includes(status.toLowerCase());
  }
  backToList() {
    if (this.selectedExpense && this.viewingDetails) {
        // Back from Expense Details
        this.selectedExpense = null;
        this.viewingDetails = true;
        this.showRejectReason = false;
        this.showApproveConfirmation = false;
        return;
    }

    // Reset all state to initial values
    this.viewingDetails = false;
    this.selectedExpense = null;
    this.showRejectReason = false;
    this.showApproveConfirmation = false;
    this.selectedEmployee = "";
    this.showAllExpenses = false;
}
}