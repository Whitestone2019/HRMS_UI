import { Component, OnInit } from '@angular/core';
import { ApiService, TraineeMaster, Usermaintenance } from '../../api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PhotoDialogComponent } from './photo-dialog/photo-dialog.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  userType: string = 'employee';
  employees: Usermaintenance[] = [];
  trainees: TraineeMaster[] = [];
  filteredEmployees: Usermaintenance[] = [];
  filteredTrainees: TraineeMaster[] = [];
  paginatedEmployees: Usermaintenance[] = [];
  paginatedTrainees: TraineeMaster[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  selectedPhotoUrl: string | null = null;
  isPhotoPopupOpen: boolean = false;

  constructor(private apiService: ApiService, private router: Router,private dialog: MatDialog) {}

  ngOnInit(): void { 
    this.loadUsers();
  }

  loadUsers(): void {
    if (this.userType === 'employee') {
      this.apiService.getEmployees1().subscribe({
        next: (data) => { this.employees = data; this.filterUsers(); },
        error: (err) => console.error('Error loading employees:', err)
      });
    } else {
      this.apiService.getTrainees().subscribe({
        next: (data) => { this.trainees = data; this.filterUsers(); },
        error: (err) => console.error('Error loading trainees:', err)
      });
    }
  }

  onUserTypeChange(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  filterUsers(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (this.userType === 'employee') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.userid.toLowerCase().includes(query) ||
        (employee.empid && employee.empid.toLowerCase().includes(query)) ||
        `${employee.firstname} ${employee.lastname}`.toLowerCase().includes(query)
      );
    } else {
      this.filteredTrainees = this.trainees.filter(trainee =>
        trainee.userid.toLowerCase().includes(query) ||
        (trainee.trngid && trainee.trngid.toLowerCase().includes(query)) ||
        `${trainee.firstname} ${trainee.lastname}`.toLowerCase().includes(query)
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.userType === 'employee' ? this.filteredEmployees.length / this.pageSize
                                   : this.filteredTrainees.length / this.pageSize
    );
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    if (this.userType === 'employee') {
      this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
    } else {
      this.paginatedTrainees = this.filteredTrainees.slice(startIndex, endIndex);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
  }

  editUser(user: any): void {
    const query = this.userType === 'employee' ? { type: 'employee', empid: user.empid } 
                                               : { type: 'trainee', trngid: user.trngid };
    this.router.navigate(['/dashboard/useradd'], { queryParams: query });
  }

  moveToEmployee(trainee: TraineeMaster): void {
    this.router.navigate(['/dashboard/useradd'], { queryParams: { type: 'employee' }, state: { traineeData: trainee } });
  }

  toggleStatus(user: any): void {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    if (this.userType === 'employee') {
      this.apiService.updateEmployeeStatus(user.userid, newStatus).subscribe({
        next: () => { user.status = newStatus; },
        error: (err) => console.error('Error updating employee status:', err)
      });
    } else {
      this.apiService.updateTraineeStatus(user.userid, newStatus).subscribe({
        next: () => { user.status = newStatus; },
        error: (err) => console.error('Error updating trainee status:', err)
      });
    }
  }

openPhotoPopup(employeeId: string): void {
  this.apiService.getPhotoByEmpId(employeeId).subscribe({
    next: (blob: Blob) => {
      // Create a new Blob with type image/jpeg
      const imageBlob = new Blob([blob], { type: 'image/jpeg' });
      const url = URL.createObjectURL(imageBlob);

      // Open dialog
      const dialogRef = this.dialog.open(PhotoDialogComponent, {
        data: { photoUrl: url, fileName: `${employeeId}.jpg` }, // pass filename
        width: '400px'
      });

      dialogRef.afterClosed().subscribe(() => {
        URL.revokeObjectURL(url); // cleanup memory
      });
    },
    error: (err) => {
      console.error('Error fetching photo:', err);
      alert('Failed to load photo.');
    }
  });
}


}