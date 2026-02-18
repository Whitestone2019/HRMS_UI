import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, HrLeaveApproval, HrLeaveApprovalResponse } from '../api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-hr-leave-approvals',
  templateUrl: './hr-leave-approvals.component.html',
  styleUrls: ['./hr-leave-approvals.component.css'],
  providers: [DatePipe]
})
export class HrLeaveApprovalsComponent implements OnInit {
  // All approvals data
  allApprovals: HrLeaveApproval[] = [];
  filteredApprovals: HrLeaveApproval[] = [];
  displayedApprovals: HrLeaveApproval[] = [];
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Loading states
  isLoading: boolean = false;
  hasData: boolean = false;
  
  // User info
  currentUserRole: string = '';
  currentEmployeeId: string = '';
  
  // Stats
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;
  totalCount: number = 0;
  
  // Modal properties
  showApprovalModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedApproval: HrLeaveApproval | null = null;
  modalStatus: string = '';
  modalRemarks: string = '';
  isSubmitting: boolean = false;
  
  // Debug property
  debugData: any = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Get user info from localStorage
    this.currentEmployeeId = localStorage.getItem('employeeId') || '';
    this.currentUserRole = localStorage.getItem('role') || '';
    
    // Load all HR leave approvals
    this.loadAllApprovals();
  }

  // Load all HR leave approvals
  loadAllApprovals(): void {
    this.isLoading = true;
    
    this.apiService.getAllHrLeaveApprovals().subscribe({
      next: (response: HrLeaveApprovalResponse) => {
        console.log('API Response:', response);
        
        if (response.success && response.data) {
          // Handle different response formats
          let approvalsData: HrLeaveApproval[] = [];
          
          if (Array.isArray(response.data)) {
            approvalsData = response.data;
          } else if (typeof response.data === 'object' && response.data !== null) {
            // If it's a single object, wrap it in an array
            approvalsData = [response.data as HrLeaveApproval];
          }
          
          console.log('Parsed Approvals:', approvalsData);
          
          // Filter to only include HR leave types
          this.allApprovals = approvalsData.filter(approval => {
            const leaveType = approval.leaveType?.toLowerCase() || '';
            return leaveType.includes('paternity') || 
                   leaveType.includes('maternity') || 
                   leaveType.includes('wedding') || 
                   leaveType.includes('brebment') ||
                   leaveType.includes('bereavement');
          });
          
          console.log('Filtered HR approvals:', this.allApprovals);
          this.applyFilters();
          this.hasData = this.allApprovals.length > 0;
        } else {
          console.error('Failed to load approvals:', response.error);
          this.hasData = false;
          this.allApprovals = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading approvals:', error);
        this.isLoading = false;
        this.hasData = false;
        this.allApprovals = [];
      }
    });
  }

  // Apply filters
  applyFilters(): void {
    this.filteredApprovals = [...this.allApprovals];
    
    // Calculate stats
    this.calculateStats();
    
    // Sort by requested date (newest first)
    this.filteredApprovals.sort((a, b) => {
      const dateA = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
      const dateB = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
      return dateB - dateA;
    });
    
    this.updatePagination();
  }

  // Calculate statistics
  calculateStats(): void {
    this.totalCount = this.filteredApprovals.length;
    this.pendingCount = this.filteredApprovals.filter(a => 
      (a.status?.toLowerCase() || '') === 'pending'
    ).length;
    this.approvedCount = this.filteredApprovals.filter(a => 
      (a.status?.toLowerCase() || '') === 'approved'
    ).length;
    this.rejectedCount = this.filteredApprovals.filter(a => 
      (a.status?.toLowerCase() || '') === 'rejected'
    ).length;
  }

  // Update pagination
  updatePagination(): void {
    this.totalItems = this.filteredApprovals.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(this.totalPages - 1, 0));
    
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedApprovals = this.filteredApprovals.slice(startIndex, endIndex);
  }

  // Change page
  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Refresh data
  refreshData(): void {
    this.loadAllApprovals();
  }

  // Format date for display
  formatDate(date: any): string {
    if (!date) return 'N/A';
    try {
      return this.datePipe.transform(date, 'dd-MM-yyyy') || 'N/A';
    } catch (error) {
      return 'N/A';
    }
  }

  // Format date with time
  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    try {
      return this.datePipe.transform(date, 'dd-MM-yyyy HH:mm') || 'N/A';
    } catch (error) {
      return 'N/A';
    }
  }

  // Get status badge class
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      case 'onhold': return 'status-onhold';
      default: return 'status-default';
    }
  }

  // Get status display text
  getStatusDisplay(status: string | undefined): string {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Open row details modal - FIXED VERSION
  openDetailsModal(approval: HrLeaveApproval): void {
    console.log('Opening details modal for approval:', approval);
    this.debugData = approval; // For debugging
    
    // Store the approval data
    this.selectedApproval = { ...approval }; // Create a copy to avoid reference issues
    
    // Show the modal
    this.showDetailsModal = true;
    
    // Log to check if data is being set
    console.log('Selected approval data:', this.selectedApproval);
    console.log('Employee ID:', this.selectedApproval?.employeeId);
    console.log('Leave Type:', this.selectedApproval?.leaveType);
    console.log('Status:', this.selectedApproval?.status);
  }

  // Close row details modal
  closeDetailsModal(): void {
    console.log('Closing details modal');
    this.showDetailsModal = false;
    this.selectedApproval = null;
    this.debugData = null;
  }

  // Open approval modal
  openApprovalModal(approval: HrLeaveApproval, action: string): void {
    console.log('Opening approval modal for action:', action);
    this.selectedApproval = { ...approval };
    this.modalStatus = action;
    this.modalRemarks = '';
    this.showApprovalModal = true;
    this.showDetailsModal = false; // Close details modal if open
  }

  // Close approval modal
  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedApproval = null;
    this.modalStatus = '';
    this.modalRemarks = '';
    this.isSubmitting = false;
  }

  // Submit approval action
  submitApprovalAction(): void {
    if (!this.selectedApproval || !this.selectedApproval.id) return;
    
    this.isSubmitting = true;
    
    const updateData: Partial<HrLeaveApproval> = {
      status: this.modalStatus,
      hrName: localStorage.getItem('username') || 'HR User'
    };
    
    // Add remarks if provided
    if (this.modalRemarks.trim()) {
      updateData.remarks = this.modalRemarks;
    }
    
    this.apiService.updateHrLeaveApproval(this.selectedApproval.id, updateData).subscribe({
      next: (response: HrLeaveApprovalResponse) => {
        this.isSubmitting = false;
        if (response.success) {
          alert(`Leave request ${this.modalStatus} successfully!`);
          this.closeApprovalModal();
          this.refreshData();
        } else {
          alert(`Failed to update status: ${response.error}`);
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error updating status:', error);
        alert('Error updating status. Please try again.');
      }
    });
  }

  // Delete approval (soft delete)
  deleteApproval(approval: HrLeaveApproval): void {
    if (!approval.id) return;
    
    if (confirm(`Are you sure you want to delete this ${approval.leaveType} request?`)) {
      this.apiService.deleteHrLeaveApproval(approval.id).subscribe({
        next: (response: HrLeaveApprovalResponse) => {
          if (response.success) {
            alert(`${approval.leaveType} request deleted successfully!`);
            this.refreshData();
          } else {
            alert(`Failed to delete: ${response.error}`);
          }
        },
        error: (error: any) => {
          console.error('Error deleting approval:', error);
          alert('Error deleting request. Please try again.');
        }
      });
    }
  }

  // Get icon for leave type
  getLeaveTypeIcon(leaveType: string): string {
    if (!leaveType) return 'fas fa-calendar-alt';
    
    const lowerType = leaveType.toLowerCase();
    if (lowerType.includes('paternity')) return 'fas fa-baby';
    if (lowerType.includes('maternity')) return 'fas fa-female';
    if (lowerType.includes('wedding')) return 'fas fa-heart';
    if (lowerType.includes('brebment') || lowerType.includes('bereavement')) return 'fas fa-hands-helping';
    return 'fas fa-calendar-alt';
  }

  // Get color for leave type
  getLeaveTypeColor(leaveType: string): string {
    if (!leaveType) return '#4a90e2';
    
    const lowerType = leaveType.toLowerCase();
    if (lowerType.includes('paternity')) return '#bd10e0';
    if (lowerType.includes('maternity')) return '#a3d39c';
    if (lowerType.includes('wedding')) return '#f5a623';
    if (lowerType.includes('brebment') || lowerType.includes('bereavement')) return '#f5a623';
    return '#4a90e2';
  }

  // TrackBy function for better performance
  trackByApprovalId(index: number, approval: HrLeaveApproval): any {
    return approval.id || index;
  }
}