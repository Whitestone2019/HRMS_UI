import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../attendance.service';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-employee-attendance-summary',
  templateUrl: './employee-attendance-summary.component.html',
  styleUrls: ['./employee-attendance-summary.component.css']
})
export class EmployeeAttendanceSummaryComponent implements OnInit {

  startDate: string = '';
  endDate: string = '';
  attendanceData: any[] = [];
  sortedAttendanceData: any[] = [];
  filteredAttendanceData: any[] = [];
  paginatedAttendanceData: any[] = [];

  searchTerm: string = '';
  sortOrder: 'desc' | 'asc' = 'desc'; // 'desc' = newest first

  currentPage: number = 1;
  itemsPerPage: number = 30;
  totalRecords: number = 0;

  constructor(private attendanceService: AttendanceService, private apiService: ApiService) {}

  ngOnInit(): void {}

  getAttendanceDetails(): void {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    this.apiService.getAttendanceAll("", this.startDate, this.endDate).subscribe(
      (response) => {
        this.attendanceData = response;
        this.sortByDate(); // Apply sorting (with current sortOrder)
      },
      (error) => {
        console.error('Error fetching attendance data:', error);
        alert('Failed to fetch attendance data.');
      }
    );
  }

  private sortByDate(): void {
    const multiplier = this.sortOrder === 'desc' ? -1 : 1;

    this.sortedAttendanceData = this.attendanceData
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (dateB - dateA) * multiplier || a.employeeId.localeCompare(b.employeeId);
      })
      .map((record: any) => {
        record.attendanceDate = this.formatDate(record.date);
        record.checkIn = this.formatTime(record.checkIn);
        record.checkOut = this.formatTime(record.checkOut);
        return record;
      });

    this.applyFilter(); // Re-apply search filter and pagination
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.sortByDate();
  }

  formatDate(date: any): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatTime(time: any): string {
    if (!time) return 'N/A';
    const d = new Date(time);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toTimeString().slice(0, 8); // HH:MM:SS
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredAttendanceData = [...this.sortedAttendanceData];
    } else {
      this.filteredAttendanceData = this.sortedAttendanceData.filter(record =>
        record.employeeId.toLowerCase().includes(term) ||
        (record.employeeName && record.employeeName.toLowerCase().includes(term))
      );
    }
    this.totalRecords = this.filteredAttendanceData.length;
    this.currentPage = 1;
    this.paginateData();
  }

  paginateData(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedAttendanceData = this.filteredAttendanceData.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateData();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateData();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
  }
}