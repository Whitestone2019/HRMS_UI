import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { parse } from 'date-fns';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.css']
})
export class LeaveRequestComponent implements OnInit {
  requestType: string = 'Leave'; // Default to Leave
  hasData: boolean = false;
  requests: any[] = [];
  filteredRequests: any[] = [];
  displayedRequests: any[] = []; // Subset of filteredRequests for current page
  currentEmpId: string = '';
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  filterEmpId: string = '';
  filterName: string = '';
  private filterSubject = new Subject<void>();

  constructor(private router: Router, private apiService: ApiService, private location: Location) {}

  ngOnInit(): void {
    const empId = localStorage.getItem('employeeId');
    if (empId) {
      this.currentEmpId = empId;
      this.fetchRequests(empId);
    } else {
      console.error('Employee ID not found');
    }
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => this.applyFilters());
  }

  onRequestTypeChange(type: string): void {
    this.requestType = type;
    this.currentPage = 0;
    this.filterEmpId = '';
    this.filterName = '';
    this.fetchRequests(this.currentEmpId);
  }

  fetchRequests(empId: string): void {
    if (this.requestType === 'Leave') {
      this.apiService.getLeaveRequests(empId).subscribe({
        next: (response: any) => {
          console.log('Fetched Leave Requests:', response);
          this.requests = (response.data || []).map((req: any) => ({
            ...req,
            type: 'Leave',
            leavetype: req.leavetype || 'Leave', // Ensure leavetype is set
            startdate: req.startdate ? parse(req.startdate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
            enddate: req.enddate ? parse(req.enddate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
            status: req.status || 'Pending', // Default status if missing
            entitycreflg: req.entitycreflg || 'N', // Default entitycreflg if missing
            noofdays: req.noofdays != null ? req.noofdays : null
          }));
          this.applyFilters();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching leave requests:', error.message, error.status);
          alert(`Failed to fetch leave requests: ${error.message || 'Server error'}`);
          this.hasData = false;
          this.requests = [];
          this.filteredRequests = [];
          this.displayedRequests = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
    } else {
      this.apiService.getPermissionRequests(empId).subscribe({
        next: (response: any) => {
          console.log('Fetched Permission Requests:', response);
          this.requests = (response.data || []).map((req: any) => ({
            ...req,
            type: 'Permission',
            leavetype: 'Permission', // Explicitly set for permissions
            startdate: req.startdate ? parse(req.startdate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
            enddate: req.enddate ? parse(req.enddate, 'dd-MM-yyyy HH:mm:ss', new Date()) : null,
            status: req.status || 'Pending', // Default status if missing
            entitycreflg: req.entitycreflg || 'N', // Default entitycreflg if missing
            noofdays: req.noofdays != null ? req.noofdays : null
          }));
          this.applyFilters();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching permission requests:', error.message, error.status);
          alert(`Failed to fetch permission requests: ${error.message || 'Server error'}`);
          this.hasData = false;
          this.requests = [];
          this.filteredRequests = [];
          this.displayedRequests = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
    }
  }

  applyFilters(): void {
    this.filteredRequests = this.requests.filter(request =>
      (!this.filterEmpId || request.empid?.toLowerCase().includes(this.filterEmpId.toLowerCase())) &&
      (!this.filterName || request.name?.toLowerCase().includes(this.filterName.toLowerCase()))
    );
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredRequests.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages - 1 >= 0 ? this.totalPages - 1 : 0);
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRequests = this.filteredRequests.slice(startIndex, endIndex);
    this.hasData = this.displayedRequests.length > 0;
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.filterSubject.next();
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

  deleteRequest(index: number): void {
    const request = this.displayedRequests[index];
    if (confirm(`Are you sure you want to reject this ${request.type.toLowerCase()} request?`)) {
      if (request.type === 'Leave') {
        this.apiService.rejectLeaveRequest1(request.empid, request.leavereason).subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              this.fetchRequests(this.currentEmpId);
              alert('Leave request rejected successfully!');
            } else {
              alert(`Failed to reject leave request: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error rejecting leave request:', error.message, error.status);
            alert(`Failed to reject leave request: ${error.message || 'Server error'}`);
          }
        });
      } else {
        this.apiService.rejectPermissionRequest(request.empid, request.srlnum).subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              this.fetchRequests(this.currentEmpId);
              alert('Permission request rejected successfully!');
            } else {
              alert(`Failed to reject permission request: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error rejecting permission request:', error.message, error.status);
            alert(`Failed to reject permission request: ${error.message || 'Server error'}`);
          }
        });
      }
    }
  }

  approve(request: any, index: number): void {
    if (confirm(`Do you want to approve this ${request.type.toLowerCase()} request?`)) {
      console.log('Request Object:', JSON.stringify(request, null, 2));
      if (request.type === 'Leave') {
        this.apiService.updateEntityFlag(request.empid, request.srlnum).subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              this.fetchRequests(this.currentEmpId);
              alert('Leave request approved successfully!');
            } else {
              alert(`Failed to approve leave request: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error approving leave request:', error.message, error.status);
            alert(`Failed to approve leave request: ${error.message || 'Server error'}`);
          }
        });
      } else {
        this.apiService.approvePermissionRequest(request.empid, request.srlnum).subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              this.fetchRequests(this.currentEmpId);
              alert('Permission request approved successfully!');
            } else {
              alert(`Failed to approve permission request: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error approving permission request:', error.message, error.status);
            alert(`Failed to reject permission request: ${error.message || 'Server error'}`);
          }
        });
      }
    }
  }
}