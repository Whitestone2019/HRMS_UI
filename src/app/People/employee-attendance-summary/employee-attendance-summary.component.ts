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
  paginatedAttendanceData: any[] = []; // Paginated data
  errorMessage: string = '';
  sortedAttendanceData: any[] = []; // Sorted data
  
  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 30;
  totalRecords: number = 0;

  constructor(private attendanceService: AttendanceService, private apiService: ApiService) {}

  ngOnInit(): void {
    // You can initialize the date fields with default values if needed
  }

  getAttendanceDetails(): void {
    if (this.startDate && this.endDate) {
      this.apiService.getAttendanceAll("", this.startDate, this.endDate).subscribe(
        (response) => {
          // Store the response in attendanceData array
          this.attendanceData = response;
          this.totalRecords = this.attendanceData.length; // Total number of records
          
          // Format the date fields (attendanceDate, checkInTime, checkOutTime) and sort by employeeId
          this.sortedAttendanceData = this.attendanceData.sort((a, b) =>
            a.employeeId.localeCompare(b.employeeId)
          ).map((record) => {
            // Format dates as 'yyyy-MM-dd HH:mm:ss'
            record.attendanceDate = this.formatDate(record.date);
            record.checkIn = this.formatTime(record.checkIn);
            record.checkOut = this.formatTime(record.checkOut);
            return record;
          });

          // Paginate the data
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

  // Method to format date as 'yyyy-MM-dd HH:mm:ss'
  formatDate(date: any): string {
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear();
    const month = (formattedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = formattedDate.getDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  formatTime(date: any): string {
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      return 'N/A'; // Return 'N/A' if the date is invalid
    }
    const hours = formattedDate.getHours().toString().padStart(2, '0');
    const minutes = formattedDate.getMinutes().toString().padStart(2, '0');
    const seconds = formattedDate.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  }

  // Method to paginate the attendance data
  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAttendanceData = this.sortedAttendanceData.slice(startIndex, endIndex);
  }

  // Method to go to the next page
  nextPage(): void {
    if ((this.currentPage * this.itemsPerPage) < this.totalRecords) {
      this.currentPage++;
      this.paginateData();
    }
  }

  // Method to go to the previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateData();
    }
  }

  // Method to set the current page to a specific page
  goToPage(page: number): void {
    this.currentPage = page;
    this.paginateData();
  }

  // Method to calculate total pages
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage);
  }
}
