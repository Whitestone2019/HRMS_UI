import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../shared/models/expense.model';
import { ApiService } from '../../../api.service';
import { UserService } from '../../../user.service';
import { forkJoin, map,catchError,of } from 'rxjs';

interface EmployeeNameResult {
  empId: string;
  employeeName: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'],
})
export class ExpensesComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  expenses: any[] = []; 
  filteredExpenses: any[] = []; 
  isLoading: boolean = true;
  error: string | null = null;
  userRole: any;
  filterExpenses: any;
  filterStatus: string = 'all';
  searchEmpId: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedExpenses: any[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;
  pendingEmployees: { empId: string; employeeName: string }[] = [];
  selectedEmployee: string = '';
  showFullTable: boolean = false;
  employeeNames: { [key: string]: string } = {};
  isSpecificEmployeeView: boolean = false;
  searchEmpName: string = ''; 
  searchQuery: string = ''; 
  isAdmin: boolean = false;

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log(' ngOnInit() called in Expense Component');

    this.employeeId = this.userService.employeeId ?? '';
    this.userRole = this.userService.role;
    this.isAdmin = this.userService.isAdmin();
    console.log('User Role:', this.userRole);
    console.log(' Employee ID:', this.employeeId);

    if (!this.employeeId || !this.userRole) {
      console.log(' Redirecting to login: Missing employeeId or role');
      this.router.navigate(['/login']);
      return;
    }
    console.log('Calling loadExpenses()');
    this.loadExpenses();
  }

  loadExpenses() {
    console.log('loadExpenses() called');

    this.isLoading = true;
    this.userRole = this.userService.role;

    const processExpenses = (expenses: any[]) => {
      if (!expenses || expenses.length === 0) {
        console.warn('No expenses found.');
      }

      this.expenses = expenses.map((expense) => ({
        ...expense,
        rejectreason: expense.rejectreason || 'N/A',
        status: expense.status.toLowerCase(),
        employeeName: expense.employeeName

    }));

      this.filteredExpenses = [...this.expenses];
      this.isLoading = false;
      this.applyFilter();
      this.processPendingEmployees();
      this.fetchEmployeeNames();

    };

    const handleError = (err: any) => {
      console.error('Error fetching expenses:', err);
      this.error = 'Failed to load expenses. Please try again later.';
      this.isLoading = false;
    };
    // alert("Exp"+this.userRole);
    if (this.isAdmin) {
      console.log('Calling API: getExpenses()');
      this.apiService.getExpenses().subscribe({
        next: processExpenses,
        error: handleError,
      });
    } else {
      console.log('Calling API: getExpensesEmp()');
      this.apiService.getExpensesEmp(this.employeeId).subscribe({
        next: processExpenses,
        error: handleError,
      });
    }
  }
  fetchEmployeeNames() {
    this.expenses.forEach(expense => {
      if (!this.employeeNames[expense.empId] && expense.employeeName) {
          this.employeeNames[expense.empId] = expense.employeeName;
      }
  });
  this.processPendingEmployees();
}

processPendingEmployees() {
  const pending = this.expenses.filter(
      (expense) => expense.status.toLowerCase() === 'pending'
  );
  const employeeIds = [...new Set(pending.map((expense) => expense.empId))];
  const filteredEmployeeIds = employeeIds.filter(empId =>
      this.filteredExpenses.some(expense => expense.empId === empId && expense.status.toLowerCase() === 'pending')
  );

  this.pendingEmployees = filteredEmployeeIds.map((empId) => ({
      empId,
      employeeName: this.employeeNames[empId] || 'Unknown',
  }));
}

  showEmployeePending(employeeId: string) {
    this.selectedEmployee = employeeId;
    this.filterStatus = 'pending';
    this.searchEmpId = employeeId;
    this.applyFilter();
    this.showFullTable = true;
    this.isSpecificEmployeeView = true;

  }
  getEmployeeName(empId: string): string {
    return this.employeeNames[empId] || 'Unknown';
  }
  
  showAllExpenses() {
    this.showFullTable = true;
    this.selectedEmployee = '';
    this.filterStatus = 'all';
    this.searchEmpId = '';
    this.applyFilter();
    this.isSpecificEmployeeView = false; 

  }
  showInitialView() {
    this.showFullTable = false;
    this.selectedEmployee = '';
    this.filterStatus = 'all';
    this.searchEmpId = '';
    this.currentPage = 1;
    this.applyFilter(); 
    this.isSpecificEmployeeView = false;
  }
  
  applyFilter() {
    // console.log('Filter Status:', this.filterStatus);
    // console.log('All Expenses:', this.expenses);
    // console.log('Search EmpId:', this.searchEmpId);
    // console.log('Search EmpName:', this.searchEmpName); 

    let filtered = [...this.expenses];
    if (this.showFullTable && !this.isSpecificEmployeeView) {
      // Use separate search inputs for full table view
      if (this.searchEmpId) {
          filtered = filtered.filter((expense) =>
              expense.empId.toLowerCase().includes(this.searchEmpId.toLowerCase())
          );
      }
      if (this.searchEmpName) {
          filtered = filtered.filter((expense) =>
              expense.employeeName.toLowerCase().includes(this.searchEmpName.toLowerCase())
          );
      }
  } else {
      // Use combined search input for pending employees view
      if (this.searchQuery) {
          const searchTerm = this.searchQuery.toLowerCase();
          filtered = filtered.filter((expense) =>
              expense.empId.toLowerCase().includes(searchTerm) ||
              expense.employeeName.toLowerCase().includes(searchTerm)
          );
      }
  }

  if (this.filterStatus !== 'all') {
      filtered = filtered.filter((expense) => expense.status.toLowerCase() === this.filterStatus.toLowerCase());
  }

    this.filteredExpenses = filtered;
    console.log('Filtered Expenses:', this.filteredExpenses);
    this.updatePagedExpenses();
    this.calculatePaginationDetails();
    this.processPendingEmployees();
  }

  updatePagedExpenses() {
    console.log('updatePagedExpenses() called');
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedExpenses = this.filteredExpenses.slice(startIndex, endIndex);
    console.log('pagedExpenses length:', this.pagedExpenses.length);
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

  onEdit(expense: Expense) {
    const expenseId = expense.expenseId;
    if (!expenseId) {
      alert('Expense ID is missing!');
      return;
    }

    this.apiService.getExpenseById1(String(expenseId)).subscribe({
      next: (response: any) => {
        const expenseDetails = response.data;
        this.router.navigate(['/expences/dashboardexp/new'], {
          queryParams: {
            expenseId: expenseDetails.expenseId,
            amount: expenseDetails.amount,
            category: expenseDetails.category,
            date: expenseDetails.date,
            currency: expenseDetails.currency,
            description: expenseDetails.description,
          },
        });
      },
      error: (err) => {
        console.error('Error fetching expense details:', err);
        alert('Failed to load expense details. Please try again later.');
      },
    });
  }

  onDelete(expense: any) {
    const newStatus = 'deleted';

    const formData = new FormData();
    formData.append('status', newStatus);

    this.apiService.updateExpense2(expense.expenseId, formData).subscribe({
      next: () => {
        console.log(`Expense with ID ${expense.expenseId} marked as deleted.`);
        alert('Expense deleted successfully!');
        this.loadExpenses();
      },
      error: (err: any) => {
        console.error('Error deleting expense:', err);
        alert('Failed to delete the expense. Please try again later.');
      },
    });
  }

  approveExpense(expense: any) { // Type any
    expense.status = 'approved';
    this.apiService.updateExpense1(expense.expenseId, {status: 'approved'}).subscribe({
        next: () => {
            console.log(`Expense with ID ${expense.expenseId} approved.`);
            alert('Expense approved successfully!');
            this.loadExpenses();
        },
        error: (err: any) => {
            console.error('Error approving expense:', err);
            alert('Failed to approve the expense. Please try again later.');
        },
    });
  }

  rejectExpense(expense: any) { // Type any
    expense.status = 'rejected';
     this.apiService.updateExpense1(expense.expenseId, {status: 'rejected'}).subscribe({
        next: () => {
            console.log(`Expense with ID ${expense.expenseId} rejected.`);
            alert('Expense rejected successfully!');
            this.loadExpenses();
        },
        error: (err: any) => {
            console.error('Error rejecting expense:', err);
            alert('Failed to reject the expense. Please try again later.');
        },
    });
  }
  addExpense() {
    console.log('Add Expense clicked!');
    this.router.navigate(['/expenses/add']);
  }
}