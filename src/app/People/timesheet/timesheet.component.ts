import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { UserService } from '../../user.service';

interface Timesheet {
  sno: number;
  employeeId: string;
  members: string;
  effectiveWorkingDays: number;
  present: number;
  absent: number;
  missPunch: number;
}

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.css'],
})
export class TimesheetComponent implements OnInit {
  timesheetData: Timesheet[] = [];
  filteredTimesheetData: Timesheet[] = [];
  paginatedData: Timesheet[] = []; // current page
  year: number;
  month: number; // 0-based
  repoteTo: string = '';
  userRole: string = '';
  searchTerm: string = '';

  // Pagination variables
  currentPage: number = 1;
  pageSize: number = 10; // items per page
  totalPages: number = 0;

  constructor(private apiService: ApiService, private router: Router, private userService: UserService) {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth();
  }

  ngOnInit(): void {
    this.userRole = this.userService.role;

    if (this.userRole === 'HR') {
      this.repoteTo = '';
    } else {
      this.repoteTo = localStorage.getItem('employeeId') || '';
    }

    this.fetchTimesheetData();
  }

 fetchTimesheetData(): void {
  this.apiService.getTimesheetData(this.year, this.month + 1, this.repoteTo).subscribe({
    next: (data) => {
      // Sort by employeeId
      data.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

      this.timesheetData = data;
      this.filteredTimesheetData = [...data]; // initialize filtered list
      this.currentPage = 1; // reset pagination
      this.setupPagination();
      console.log('Timesheet data loaded:', data);
    },
    error: (error) => {
      console.error('Error fetching timesheet data:', error);
    },
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

  // Filter based on Employee ID or Name
  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredTimesheetData = this.timesheetData.filter(
      (emp) => emp.employeeId.toLowerCase().includes(term) || emp.members.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.setupPagination();
  }

  // Pagination setup
  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredTimesheetData.length / this.pageSize);
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredTimesheetData.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedData();
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
