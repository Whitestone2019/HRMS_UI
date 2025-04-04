import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { Advance } from '../../shared/models/advance.model';
import { ApiService } from '../../../api.service';
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
  selector: 'app-payment-status',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment-status.component.html',
  styleUrl: './payment-status.component.css'
})
export class PaymentStatusComponent {
  employeeName: string = localStorage.getItem('employeeName') || 'Unknown';
  empId: string = localStorage.getItem('empId') || 'Unknown';
  advanceForm: FormGroup | undefined;
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
  showContent: boolean = true; // Initially show content
  isViewAllAdvances: boolean = false; // Initialize to false
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
  userService: any;
  error: string | undefined;
  advance: any;
  advanceId: any;

  currentPage: number = 1;
  itemsPerPage: number = 5;
  pagedAdvances: Advance[] = [];
  totalPages: number = 0;
  totalRecords: number = 0;

  constructor(private apiService: ApiService, private router: Router) { }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
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
      }
    });
  }
  ngOnInit(): void {
    this.empId = localStorage.getItem('employeeId') || '';
    if (!this.empId) {
      console.error('Error: Employee ID is missing.');
      this.error = 'Failed to load advances. Employee ID is missing.';
      return;
    }

    this.fetchEmployeeDetails(this.empId);

    this.fetchAdvances();
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return ''; // If status is undefined, return an empty string
    return status.toLowerCase();
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
          id: advance.id, // Add id
          expenseId: advance.expenseId, // Add expenseId
          advanceId: advance.advanceId,
          empId: advance.empId, // Use empId from API
          employeeName: advance.employeeName,
          advanceDate: advance.advanceDate,
          amount: advance.amount,
          paidThrough: advance.paidThrough,
          applyToTrip: advance.applyToTrip || '', // Provide default value
          status: advance.status || '', // Provide default value
          rejectreason: advance.rejectreason || 'N/A',
        }));
        this.isLoading = false;
        console.log('Advances fetched:', this.advances);
        this.filterAdvances();
        this.fetchPendingEmployees();
      },
      error: (err) => {
        console.error('Error fetching advances:', err);
        this.error = 'Failed to load advances. Please try again later.';
        this.isLoading = false;
      },
    });
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
    this.pendingEmployees = Object.values(grouped).filter(employee => {
      return this.filteredAdvances.some(advance => advance.empId === employee.empId && advance.status && advance.status.toLowerCase() === 'pending');
    });
  }

  getEmployeeInfo(employee: any): any {
    return this.pendingEmployees.find(emp => emp.empId === employee.empId);
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
  }

  filterAdvances() {
    let filtered: Advance[] = [...this.advances];
    console.log('filter_Advances fun :', filtered);

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(
        (advance) =>
          advance.status &&
          typeof advance.status === 'string' &&
          advance.status.trim().toLowerCase() === this.filterStatus
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


  resetForm() {
    this.newAdvance = {
      advanceDate: '',
      amount: '',
      paidThrough: '',
      applyToTrip: '',
      status: ''
    };
  }

  onEdit(advance: Advance) {
    const advanceId = advance.advanceId;
    if (!advanceId) {
      alert('Advance ID is missing!');
      return;
    }

    this.showForm = true;
    this.editingIndex = this.advances.findIndex(a => a.advanceId === advanceId);

    this.apiService.getAdvanceById3(String(advanceId)).subscribe({
      next: (response: any) => {
        const advanceDetails = response.data;

        this.newAdvance = {
          advanceDate: advanceDetails.advanceDate,
          amount: advanceDetails.amount,
          paidThrough: advanceDetails.paidThrough,
          applyToTrip: advanceDetails.applyToTrip,
          status: advanceDetails.status
        };
        ;
        console.log('Advance details loaded:', this.newAdvance);
      },
      error: (err: any) => {
        console.error('Error fetching advance details:', err);
        alert('Failed to load advance details. Please try again later.');
      }
    });
  }

  onDelete(index: number) {
    const confirmDelete = confirm('Are you sure you want to delete this advance?');
    if (confirmDelete) {
      this.advances.splice(index, 1); // Remove the advance from the array
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
        // Updating existing advance
        this.apiService
          .updateAdvance1(this.advances[this.editingIndex].advanceId, advanceDetails)
          .subscribe({
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
        // Adding new advance
        const formData = new FormData();
        formData.append('advancesDetails', JSON.stringify(advanceDetails));
        //console.log('FormData to submit:', Array.from(formData.entries()));

        this.apiService.submitAdvance(formData).subscribe({
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
