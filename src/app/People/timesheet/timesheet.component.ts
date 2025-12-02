// src/app/components/timesheet/timesheet.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Timesheet } from '../../api.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.css'],
})
export class TimesheetComponent implements OnInit {
  timesheetData: Timesheet[] = [];
  filteredTimesheetData: Timesheet[] = [];
  paginatedData: Timesheet[] = [];

  year: number;
  month: number;
  repoteTo: string = '';
  userRole: string = '';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UserService
  ) {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth(); // 0-based
  }

  ngOnInit(): void {
    this.userRole = this.userService.role || '';

    if (this.userRole === 'HR' || this.userRole === 'CEO') {
      this.repoteTo = '';
    } else {
      this.repoteTo = localStorage.getItem('employeeId') || '';
    }

    this.fetchTimesheetData();
  }

  fetchTimesheetData(): void {
    this.apiService.getTimesheetData(this.year, this.month, this.repoteTo).subscribe({
      next: (data: Timesheet[]) => {
        // Sort by Employee ID
        data.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

        this.timesheetData = data;
        this.filteredTimesheetData = [...data];
        this.currentPage = 1;
        this.setupPagination();
      },
      error: (err) => {
        console.error('Failed to load timesheet:', err);
        alert('Failed to load data. Please try again.');
      }
    });
  }

  onRowClick(employee: Timesheet): void {
    this.router.navigate(['/dashboard/timesheet1', employee.employeeId, employee.members], {
      state: {
        employeeId: employee.employeeId,
        employeeName: employee.members,
      },
    });
  }

  onSearchChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredTimesheetData = [...this.timesheetData];
    } else {
      this.filteredTimesheetData = this.timesheetData.filter(emp =>
        emp.employeeId.toLowerCase().includes(term) ||
        emp.members.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.setupPagination();
  }

  // Pagination Methods
  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredTimesheetData.length / this.pageSize);
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredTimesheetData.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }
}