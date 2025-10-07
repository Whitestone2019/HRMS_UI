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

  currentPage: number = 1;
  itemsPerPage: number = 30;
  totalRecords: number = 0;

  constructor(private attendanceService: AttendanceService, private apiService: ApiService) {}

  ngOnInit(): void {}

  getAttendanceDetails(): void {
    if (this.startDate && this.endDate) {
      this.apiService.getAttendanceAll("", this.startDate, this.endDate).subscribe(
        (response) => {
          this.attendanceData = response;
          this.sortedAttendanceData = this.attendanceData.sort((a, b) =>
            a.employeeId.localeCompare(b.employeeId)
          ).map((record) => {
            record.attendanceDate = this.formatDate(record.date);
            record.checkIn = this.formatTime(record.checkIn);
            record.checkOut = this.formatTime(record.checkOut);
            return record;
          });

          this.filteredAttendanceData = [...this.sortedAttendanceData]; // initial data
          this.totalRecords = this.filteredAttendanceData.length;
          this.paginateData();
        },
        (error) => {
          console.error('Error fetching attendance data:', error);
        }
      );
    } else {
      alert('Please select both start and end dates.');
    }
  }

  formatDate(date: any): string {
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear();
    const month = (formattedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = formattedDate.getDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  formatTime(date: any): string {
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) return 'N/A';
    const hours = formattedDate.getHours().toString().padStart(2, '0');
    const minutes = formattedDate.getMinutes().toString().padStart(2, '0');
    const seconds = formattedDate.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredAttendanceData = [...this.sortedAttendanceData];
    } else {
      this.filteredAttendanceData = this.sortedAttendanceData.filter(record =>
        record.employeeId.toLowerCase().includes(term) ||
        record.employeeName.toLowerCase().includes(term)
      );
    }
    this.totalRecords = this.filteredAttendanceData.length;
    this.currentPage = 1;
    this.paginateData();
  }

  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAttendanceData = this.filteredAttendanceData.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if ((this.currentPage * this.itemsPerPage) < this.totalRecords) {
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
    return Math.ceil(this.totalRecords / this.itemsPerPage);
  }
}
