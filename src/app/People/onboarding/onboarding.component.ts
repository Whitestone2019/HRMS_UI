import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (response: any[]) => {
        this.users = response || [];
        this.filteredUsers = [...this.users];
        this.applyFilterAndPagination();
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.users = [];
        this.filteredUsers = [];
        this.paginatedUsers = [];
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilterAndPagination();
    }
  }

  applyFilterAndPagination(): void {
    let temp = this.users;

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase();
      temp = this.users.filter(user =>
        (user.empid?.toString() || '').toLowerCase().includes(term) ||
        (user.firstName || '').toLowerCase().includes(term) ||
        (user.lastName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.officialEmail || '').toLowerCase().includes(term)
      );
    }

    this.filteredUsers = temp;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(start, end);
  }

  get fromRecord(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get toRecord(): number {
    const end = this.currentPage * this.pageSize;
    return end < this.filteredUsers.length ? end : this.filteredUsers.length;
  }

  get totalPages(): number {
    return this.filteredUsers.length === 0 ? 1 : Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  LoadEmployeeDetails(mode: string, empId: string) {
    this.router.navigate(['/dashboard/addcandidate'], { queryParams: { mode, empId } });
  }

  AddEmployeeDetails(mode: string) {
    this.router.navigate(['/dashboard/useradd'], { queryParams: { mode } });
  }

  deleteUser(empid: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.apiService.deleteEmployee(empid).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.empid !== empid);
          this.applyFilterAndPagination();
          alert('Employee deleted successfully!');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete employee.');
        }
      });
    }
  }
}