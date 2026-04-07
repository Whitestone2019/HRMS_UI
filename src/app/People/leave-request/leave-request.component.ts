import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { parse } from 'date-fns';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.css']
})
export class LeaveRequestComponent implements OnInit {
  requestType: string = 'Leave'; // Leave / Permission
  userCategory: string = 'Employee'; // Employee / Trainee
  currentEmpId: string = '';
  userRole: string = ''; // HR / EMPLOYEE / TRAINEE
  currentUserReportees: string[] = []; // Store reportees of current user

  hasData: boolean = false;
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  displayedRequests: any[] = [];

  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  filterEmpId: string = '';
  filterName: string = '';
  searchTerm: string = '';
  private filterSubject = new Subject<void>();

  constructor(private router: Router, private apiService: ApiService, private location: Location) {}

  ngOnInit(): void {
    const empId = localStorage.getItem('employeeId');
    const role = localStorage.getItem('role');
    if (empId) {
      this.currentEmpId = empId;
      this.userRole = role ? role.toUpperCase() : '';
      
      // Fetch direct reports for current user (people who report to them)
      this.fetchDirectReports(empId);
      this.fetchRequests(empId);
    } else {
      console.error('Employee ID not found');
    }

    this.filterSubject.pipe(debounceTime(300)).subscribe(() => this.applyFilters());
  }

  /** Fetch users who directly report to current user (where repoteTo = currentEmpId) */
  fetchDirectReports(empId: string): void {
    console.log('Fetching direct reports for user:', empId);
    
    this.apiService.getDirectReports(empId).subscribe({
      next: (response: any) => {
        console.log('Direct reports response:', response);
        
        // Extract reportees from response
        if (response && response.status === 'success' && response.data) {
          this.currentUserReportees = response.data.map((user: any) => user.empid);
          console.log('Direct reportees fetched:', this.currentUserReportees);
          console.log('Total reportees count:', this.currentUserReportees.length);
        } else if (response && response.data && Array.isArray(response.data)) {
          this.currentUserReportees = response.data.map((user: any) => user.empid);
        } else if (Array.isArray(response)) {
          this.currentUserReportees = response.map((user: any) => user.empid);
        } else {
          console.warn('Unexpected response format:', response);
          this.currentUserReportees = [];
        }
        
        // Refresh the displayed requests to update approve button visibility
        this.updatePagination();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching direct reports:', err);
        this.currentUserReportees = [];
      }
    });
  }

  /** Check if user can approve/reject a request */
  canApproveRequest(request: any): boolean {
    // Don't show approve/reject for user's own requests
    if (request.empid === this.currentEmpId) {
      return false;
    }
    
    // Check if request status is Pending
    if (request.status !== 'Pending') {
      return false;
    }
    
    // Check if this request's employee is in the reportees list
    const isReportee = this.currentUserReportees.includes(request.empid);
    console.log(`Checking ${request.empid}: isReportee = ${isReportee}`);
    
    return isReportee;
  }

  /** Switch Leave / Permission */
  onRequestTypeChange(type: string): void {
    this.requestType = type;
    this.currentPage = 0;
    this.fetchRequests(this.currentEmpId);
  }

  /** Fetch Leave or Permission requests */
  fetchRequests(empId: string): void {
    const fetchMethod =
      this.requestType === 'Leave'
        ? this.apiService.getLeaveRequests(empId)
        : this.apiService.getPermissionRequests(empId);

    fetchMethod.subscribe({
      next: (response: any) => {
        const data = response.data || [];

        this.allRequests = data.map((req: any) => {
          const isEmployee = /^\d/.test(req.empid);
          const isTrainee = /^WS/.test(req.empid);
          return {
            ...req,
            isEmployee,
            isTrainee,
            type: this.requestType,
            startdate: req.startdate ? parse(req.startdate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
            enddate: req.enddate ? parse(req.enddate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
          };
        });

        console.log('Total requests fetched:', this.allRequests.length);
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching requests:', err.message);
        this.hasData = false;
      }
    });
  }

  /** Filter Employee / Trainee */
  filterByCategory(category: string): void {
    this.userCategory = category;
    this.currentPage = 0;
    this.applyFilters();
  }

  /** Apply filters and sorting */
  applyFilters(): void {
    this.filteredRequests = this.allRequests.filter(request => {
      let categoryMatch = true;

      if (this.userRole === 'HR') {
        if (this.userCategory === 'Employee') categoryMatch = request.isEmployee;
        if (this.userCategory === 'Trainee') categoryMatch = request.isTrainee;
      }

      const searchMatch =
        (!this.filterEmpId || request.empid?.toLowerCase().includes(this.filterEmpId.toLowerCase())) &&
        (!this.filterName || request.name?.toLowerCase().includes(this.filterName.toLowerCase())) &&
        (!this.searchTerm ||
          request.empid?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          request.name?.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return categoryMatch && searchMatch;
    });

    // Sort Pending first for all users
    const order: Record<string, number> = { Pending: 1, Approved: 2, Rejected: 3, Withdrawn: 4 };
    this.filteredRequests.sort((a: any, b: any) => (order[a.status] || 5) - (order[b.status] || 5));

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredRequests.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(this.totalPages - 1, 0));
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRequests = this.filteredRequests.slice(startIndex, endIndex);
    this.hasData = this.displayedRequests.length > 0;
    
    console.log('Displayed requests count:', this.displayedRequests.length);
    this.displayedRequests.forEach(req => {
      console.log(`Request - Emp: ${req.empid}, Status: ${req.status}, CanApprove: ${this.canApproveRequest(req)}`);
    });
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  addRequest(): void {
    this.router.navigate([`/dashboard/apply-${this.requestType.toLowerCase()}`]);
  }

  deleteRequest(request: any, index: number): void {
    // Check if user has permission to reject this request
    if (!this.canApproveRequest(request)) {
      alert('You do not have permission to reject this request.');
      return;
    }

    if (confirm(`Reject this ${request.type.toLowerCase()} request?`)) {
      if (request.type === 'Leave') {
        const formattedDate = this.formatDateForBackend(request.startdate);
        
        if (!formattedDate) {
          alert('Error: Could not format start date. Please check the date format.');
          return;
        }
        
        this.apiService.rejectLeaveRequest1(request.empid, formattedDate)
          .subscribe({
            next: (response: any) => {
              if (response.status === 'success') {
                alert(`${request.type} request rejected successfully!`);
                this.fetchRequests(this.currentEmpId);
              } else {
                alert(`Failed: ${response.message || 'Unknown error'}`);
              }
            },
            error: (err: HttpErrorResponse) => {
              console.error('Full error details:', err);
              const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
              alert(`Error: ${errorMessage}`);
            }
          });
      } else {
        this.apiService.rejectPermissionRequest(request.empid, request.srlnum)
          .subscribe({
            next: (response: any) => {
              if (response.status === 'success') {
                alert(`${request.type} request rejected successfully!`);
                this.fetchRequests(this.currentEmpId);
              } else {
                alert(`Failed: ${response.message || 'Unknown error'}`);
              }
            },
            error: (err: HttpErrorResponse) => alert(`Error: ${err.message}`)
          });
      }
    }
  }

  private formatDateForBackend(date: any): string {
    if (!date) {
      console.error('No date provided');
      return '';
    }
    
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date string:', date);
          return '';
        }
      } else {
        console.error('Unknown date type:', date);
        return '';
      }
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
      
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  approve(request: any, index: number): void {
    // Check if user has permission to approve this request
    if (!this.canApproveRequest(request)) {
      alert('You do not have permission to approve this request.');
      return;
    }

    if (confirm(`Approve this ${request.type.toLowerCase()} request?`)) {
      const action =
        request.type === 'Leave'
          ? this.apiService.updateEntityFlag(request.empid, request.srlnum)
          : this.apiService.approvePermissionRequest(request.empid, request.srlnum);

      action.subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            alert(`${request.type} request approved successfully!`);
            this.fetchRequests(this.currentEmpId);
          } else {
            alert(`Failed: ${response.message || 'Unknown error'}`);
          }
        },
        error: (err: HttpErrorResponse) => alert(`Error: ${err.message}`)
      });
    }
  }

  exportToExcel(): void {
    const dataToExport = this.filteredRequests.map(req => ({
      'Employee ID': req.empid || 'N/A',
      'Employee Name': req.name || 'N/A',
      'Type': req.leavetype || req.type || 'N/A',
      'Reason': req.leavereason || req.permissionreason || 'N/A',
      'No. of Days': req.noofdays ?? 'N/A',
      'Start Date': req.startdate ? this.formatDate(req.startdate) : 'N/A',
      'End Date': req.enddate ? this.formatDate(req.enddate) : 'N/A',
      'Status': req.status || 'N/A'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    const colWidths = [
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 12 }, // Type
      { wch: 40 }, // Reason
      { wch: 12 }, // No. of Days
      { wch: 15 }, // Start Date
      { wch: 15 }, // End Date
      { wch: 12 }  // Status
    ];
    worksheet['!cols'] = colWidths;

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Requests': worksheet },
      SheetNames: ['Requests']
    };

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    const fileName = `${this.requestType}_Requests_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    FileSaver.saveAs(blob, fileName);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  isFutureOrPresentDate(request: any): boolean {
    if (!request || !request.startdate) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(request.startdate);
    startDate.setHours(0, 0, 0, 0);
    
    return startDate >= today;
  }

  withdrawRequest(request: any, index: number): void {
    if (!this.isFutureOrPresentDate(request)) {
      alert('Cannot withdraw past leave requests. Please contact HR.');
      return;
    }
    
    if (confirm(`Are you sure you want to withdraw this ${request.type.toLowerCase()} request?`)) {
      this.apiService.withdrawLeaveRequest(request.empid, request.srlnum, request.status)
        .subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              alert(`${request.type} request withdrawn successfully!`);
              this.fetchRequests(this.currentEmpId);
            } else {
              alert(`Failed: ${response.message || 'Unknown error'}`);
            }
          },
          error: (err: HttpErrorResponse) => {
            alert(`Error: ${err.message}`);
          }
        });
    }
  }
}