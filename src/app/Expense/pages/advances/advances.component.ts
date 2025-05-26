import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../api.service';
import { Advance } from '../../shared/models/advance.model';
import { Router } from '@angular/router';

interface EmployeePending {
  empId: string;
  employeeName: string;
  advances: Advance[];
}

interface PendingEmployeesMap {
  [empId: string]: EmployeePending;
}

@Component({
  selector: 'app-advances',
  standalone: true,
  templateUrl: './advances.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./advances.component.css'],
})
export class AdvanceComponent {
  employeeName: string = localStorage.getItem('employeeName') || 'Unknown';
  empId: string = localStorage.getItem('empId') || 'Unknown';
  advances: Advance[] = [];
  showForm: boolean = false;
  filteredAdvances: Advance[] = [];
  filterStatus: string = 'all';
  searchEmployeeName: string = '';
  showPendingEmployees: boolean = true;
  pendingEmployees: any[] = [];
  selectedEmployee: string | null = null;
  showAdvanceDetails: boolean = false;
  showAddNewButton: boolean = false;
  showContent: boolean = true;
  isViewAllAdvances: boolean = true;
  newAdvance = {
    advanceDate: '',
    amount: '',
    paidThrough: '',
    applyToTrip: '',
    status: '',
  };
  editingIndex: number | undefined;
  isLoading: boolean | undefined;
  error: string | undefined;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  pagedAdvances: Advance[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;
  showbtn: boolean = false;
  headerText: string = '';
  minDate: string | undefined;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.newAdvance.paidThrough = 'Bank Transfer';
    this.empId = localStorage.getItem('employeeId') || '';
    if (!this.empId) {
      console.error('Error: Employee ID is missing.');
      this.error = 'Failed to load advances. Employee ID is missing.';
      return;
    }

    this.fetchEmployeeDetails(this.empId);
    this.fetchAdvances();
  }

  // Dedicated method to sort advances by advanceId
  sortAdvancesById() {
    this.advances.sort((a, b) => {
      const idA = a.advanceId ?? '';
      const idB = b.advanceId ?? '';
      // Use localeCompare for string IDs or numeric comparison if IDs are numbers
      return typeof idA === 'string' && typeof idB === 'string'
        ? idB.localeCompare(idA, undefined, { numeric: true })
        : Number(idB) - Number(idA); // Fixed syntax error
    });
    this.filterAdvances(); // Re-filter to update filteredAdvances and pagedAdvances
    console.log('Sorted advances:', this.advances);
  }

  fetchAdvances() {
    console.log('fetchAdvances() called');
    this.isLoading = true;
    if (!this.empId) {
      console.error('Error: Employee ID is required to fetch advances.');
      this.error = 'Failed to load advances. Employee ID is missing.';
      this.isLoading = false;
      return;
    }
    this.apiService.getAdvance(this.empId).subscribe({
      next: (advances: Advance[]) => {
        this.advances = advances.map((advance) => ({
          id: advance.id,
          expenseId: advance.expenseId,
          advanceId: advance.advanceId,
          empId: advance.empId,
          employeeName: advance.employeeName,
          advanceDate: advance.advanceDate,
          amount: advance.amount,
          paidThrough: advance.paidThrough,
          applyToTrip: advance.applyToTrip || '',
          status: advance.status || '',
          rejectreason: advance.rejectreason || 'N/A',
        }));
        this.isLoading = false;
        this.sortAdvancesById(); // Sort after fetching
        console.log('Advances fetched:', this.advances);
      },
      error: (err) => {
        console.error('Error fetching advances:', err);
        this.error = 'Failed to load advances. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  filterAdvances() {
    let filtered: Advance[] = [...this.advances];
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(
        (advance) =>
          advance.status &&
          typeof advance.status === 'string' &&
          advance.status.trim().toLowerCase() === this.filterStatus.toLowerCase()
      );
    }
    if (this.searchEmployeeName && this.searchEmployeeName.trim() !== '') {
      const searchTerm = this.searchEmployeeName.trim().toLowerCase();
      filtered = filtered.filter((advance) =>
        (advance.employeeName?.toLowerCase().includes(searchTerm) ||
          advance.empId?.toLowerCase().includes(searchTerm))
      );
    }
    this.filteredAdvances = filtered;
    this.currentPage = 1;
    this.updatePagedAdvances();
    this.calculatePaginationDetails();
    this.fetchPendingEmployees();
    console.log('Filtered advances:', this.filteredAdvances);
  }

  updatePagedAdvances() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAdvances = this.filteredAdvances.slice(startIndex, endIndex);
    console.log('Paged advances:', this.pagedAdvances);
  }

  // Other methods remain unchanged, but ensure they call filterAdvances() or updatePagedAdvances() as needed
  toggleForm() {
    this.checkstatus('New');
    this.newAdvance.paidThrough = 'Bank Transfer';
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.editingIndex = undefined;
      this.resetForm();
    }
  }

  fetchEmployeeDetails(empId: string) {
    this.apiService.getEmployeeDetails(empId).subscribe({
      next: (response: any) => {
        if (response.employeeName) {
          this.employeeName = response.employeeName;
        } else {
          console.error('Employee name not found in response:', response);
        }
      },
      error: (err) => {
        console.error('Error fetching employee details:', err);
      },
    });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return status.toLowerCase().replace(/ /g, '-');
  }

  fetchPendingEmployees() {
    const pending = this.advances.filter(
      (advance) => advance.status && advance.status.toLowerCase() === 'pending'
    );
    const grouped = pending.reduce((acc: PendingEmployeesMap, advance) => {
      if (advance.empId) {
        if (!acc[advance.empId]) {
          acc[advance.empId] = {
            empId: advance.empId,
            employeeName: advance.employeeName ?? 'Unknown',
            advances: [],
          };
        }
        acc[advance.empId].advances.push(advance);
      } else {
        console.warn('Advance with undefined empId:', advance);
      }
      return acc;
    }, {});
    this.pendingEmployees = Object.values(grouped).filter((employee) =>
      this.filteredAdvances.some(
        (advance) =>
          advance.empId === employee.empId &&
          advance.status &&
          advance.status.toLowerCase() === 'pending'
      )
    );
  }

  getEmployeeInfo(employee: any): any {
    return this.pendingEmployees.find((emp) => emp.empId === employee.empId);
  }

  showEmployeePending(employee: any) {
    this.selectedEmployee = employee.empId;
    this.showPendingEmployees = false;
    this.filterStatus = 'pending';
    this.filterAdvances();
    this.showAdvanceDetails = true;
    this.showAddNewButton = true;
    this.isViewAllAdvances = false;
  }

  showAllAdvances() {
    this.selectedEmployee = null;
    this.showPendingEmployees = false;
    this.filterStatus = 'all';
    this.filterAdvances();
    this.showAdvanceDetails = true;
    this.showAddNewButton = true;
    this.isViewAllAdvances = true;
  }

  goBack() {
    this.selectedEmployee = null;
    this.showPendingEmployees = true;
    this.filterStatus = 'all';
    this.filterAdvances();
    this.showAdvanceDetails = false;
    this.showAddNewButton = false;
    this.editingIndex = undefined;
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
    const dateParts = parts[0].split('-');
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }

  resetForm() {
    this.newAdvance = {
      advanceDate: '',
      amount: '',
      paidThrough: '',
      applyToTrip: '',
      status: '',
    };
  }

  checkstatus(status: string) {
    const statusBtn = status.trim().toLowerCase();
    console.log('statusBtn:', statusBtn);
    if (statusBtn === 'pending') {
      this.showbtn = true;
      this.headerText = 'Edit Advance';
    } else if (statusBtn === 'new') {
      this.showbtn = true;
      this.headerText = 'New Advance';
    } else {
      this.showbtn = false;
      this.headerText = 'View Advance';
    }
    console.log('showbtn:', this.showbtn);
  }

  viewExpense(advance: Advance) {
    this.onEdit(advance);
  }

  onEdit(advance: Advance) {
    const advanceId = advance.advanceId;
    if (!advanceId) {
      alert('Advance ID is missing!');
      return;
    }
    this.showForm = true;
    this.editingIndex = this.advances.findIndex((a) => a.advanceId === advanceId);
    this.apiService.getAdvanceById3(String(advanceId)).subscribe({
      next: (response: any) => {
        const advanceDetails = response.data;
        this.newAdvance = {
          advanceDate: advanceDetails.advanceDate,
          amount: advanceDetails.amount,
          paidThrough: advanceDetails.paidThrough,
          applyToTrip: advanceDetails.applyToTrip,
          status: advanceDetails.status,
        };
        this.checkstatus(advanceDetails.status);
        console.log('Advance details loaded:', this.newAdvance);
      },
      error: (err: any) => {
        console.error('Error fetching advance details:', err);
        alert('Failed to load advance details. Please try again later.');
      },
    });
  }

  onDeleteAdvance(index: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this advance?');
    if (confirmDelete) {
      const deletedItem = this.advances[index];
      this.apiService.deleteAdvance(deletedItem.advanceId).subscribe(
        () => {
          this.advances.splice(index, 1);
          this.sortAdvancesById(); // Re-sort after deletion
          console.log('Advance deleted successfully:', deletedItem);
        },
        (error) => {
          console.error('Error deleting advance from server:', error);
          alert('Failed to delete advance. Please try again.');
        }
      );
    }
  }

  submitAdvance(advanceForm: any): void {
    console.log('Form submission triggered.');
    if (advanceForm.valid) {
      const advanceDetails = {
        ...advanceForm.value,
        employeeName: this.employeeName,
        empId: this.empId,
      };
      console.log('Advance details to submit:', advanceDetails);
      if (this.editingIndex !== undefined) {
        const advanceId = this.advances[this.editingIndex].advanceId;
        this.apiService.updateAdvance1(advanceId, advanceDetails).subscribe({
          next: (response: any) => {
            alert('Advance updated successfully!');
            this.fetchAdvances();
            this.resetForm();
            this.showForm = false;
          },
          error: (error: any) => {
            alert('Error updating advance.');
            console.error('Error from API:', error);
          },
        });
      } else {
        this.apiService.submitAdvance(advanceDetails).subscribe({
          next: (response: any) => {
            alert('Advance submitted successfully!');
            this.fetchAdvances();
            this.resetForm();
            this.showForm = false;
          },
          error: (error: any) => {
            alert('Error submitting advance.');
            console.error('Error from API:', error);
          },
        });
      }
    } else {
      alert('Please fill in all required fields.');
      console.log('Form is invalid. Current values:', advanceForm.value);
    }
  }
}