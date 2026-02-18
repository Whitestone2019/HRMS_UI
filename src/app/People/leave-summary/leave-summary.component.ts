import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, HrLeaveApproval } from '../../api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-leave-summary',
  templateUrl: './leave-summary.component.html',
  styleUrls: ['./leave-summary.component.css'],
  providers: [DatePipe]
})
export class LeaveSummaryComponent implements OnInit {
  enableApplyLeave = false;
  selectedLeaveType: string = 'upcoming';

  currentYear: number = new Date().getFullYear();
  startDate: string = `${this.currentYear}-01-01`;
  endDate: string = `${this.currentYear}-12-31`;

  // List of leave types that should show HR approval modal
  hrApprovalLeaveTypes = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];

  // Store leave types with dynamic values
  leaveTypes: any[] = [];

  // Default leave types configuration
  defaultLeaveTypes = [
    { 
      name: 'casual leave', 
      icon: 'fas fa-umbrella-beach', 
      color: '#4a90e2', 
      available: 18, 
      booked: 0,
      remaining: 18,
      disabled: false,
      maxDays: 18,
      totalAllocation: 18
    },
    { 
      name: 'paternity leave', 
      icon: 'fas fa-baby', 
      color: '#bd10e0', 
      available: 2, 
      booked: 0,
      remaining: 2,
      disabled: false,
      maxDays: 2,
      totalAllocation: 2
    },
    { 
      name: 'maternity leave', 
      icon: 'fas fa-female', 
      color: '#a3d39c', 
      available: 12, 
      booked: 0,
      remaining: 12,
      disabled: false,
      maxDays: 12,
      totalAllocation: 12
    },
    { 
      name: 'wedding leave', 
      icon: 'fas fa-heart', 
      color: '#f5a623', 
      available: 5, 
      booked: 0,
      remaining: 5,
      disabled: false,
      maxDays: 5,
      totalAllocation: 5
    },
    { 
      name: 'brebment leave', 
      icon: 'fas fa-hands-helping', 
      color: '#f5a623', 
      available: 5, 
      booked: 0,
      remaining: 5,
      disabled: false,
      maxDays: 5,
      totalAllocation: 5
    }
  ];

  leaveOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' }
  ];

  upcomingHolidays: any[] = [];

  // Modal properties
  showHrLeaveModal: boolean = false;
  selectedLeaveTypeForModal: string = '';
  modalIsLoading: boolean = false;
  
  // Store employee data
  employeeId: string = '';
  employeeName: string = '';
  formattedLeaveType: string = '';
  todayDate: string = '';
  defaultEndDate: string = '';
  
  // Store manager name
  managerName: string = '';
  hrName: string = '';

  // Store API response data
  leaveData: any = null;
  isLoading: boolean = false;

  // Toast notification properties
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  // Track if employee is WS type
  isWSEmployee: boolean = false;

  // Store special leaves with their maximum allowed days
  specialLeaveLimits: Map<string, number> = new Map();

  // Store the current year for leave tracking
  currentLeaveYear: number = new Date().getFullYear();

  constructor(
    private router: Router, 
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Check if year has changed and reset if needed
    this.checkAndResetLeaveYear();
    
    // Get employee ID from localStorage
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.employeeName = localStorage.getItem('username') || '';
    this.managerName = localStorage.getItem('managerName') || '';
    this.hrName = localStorage.getItem('hrName') || this.employeeName;
    
    // Check if employee is WS type
    this.isWSEmployee = this.checkIfWSEmployee(this.employeeId);
    console.log('Employee ID:', this.employeeId, 'Is WS Employee:', this.isWSEmployee);
    
    if (!this.employeeId) {
      console.error('Employee ID not found in localStorage');
      this.router.navigate(['/login']);
    } else {
      // Initialize leave types based on employee type
      this.initializeLeaveTypes();
      this.getLeaveCounts(this.employeeId);
    }
    
    this.fetchUpcomingHolidays();
    
    // Check for year change every hour
    setInterval(() => {
      this.checkAndResetLeaveYear();
    }, 3600000); // 1 hour
  }

  // Check if year has changed and reset leave balances
  checkAndResetLeaveYear(): void {
    const currentYear = new Date().getFullYear();
    const lastResetYear = localStorage.getItem('lastLeaveResetYear');
    
    if (lastResetYear !== currentYear.toString()) {
      console.log(`Year changed from ${lastResetYear} to ${currentYear}. Resetting leave balances...`);
      
      // Update the current year
      this.currentYear = currentYear;
      this.startDate = `${this.currentYear}-01-01`;
      this.endDate = `${this.currentYear}-12-31`;
      this.currentLeaveYear = currentYear;
      
      // Store the new reset year
      localStorage.setItem('lastLeaveResetYear', currentYear.toString());
      
      // Refresh leave counts to get new year's balances
      if (this.employeeId) {
        setTimeout(() => {
          this.getLeaveCounts(this.employeeId);
        }, 500);
      }
    }
  }

  // Check if employee is WS type (starts with WS or ws)
  checkIfWSEmployee(empId: string): boolean {
    if (!empId) return false;
    return empId.toLowerCase().startsWith('ws');
  }

  // Initialize leave types based on employee type
  initializeLeaveTypes(): void {
    // Start with default leave types
    this.leaveTypes = JSON.parse(JSON.stringify(this.defaultLeaveTypes));
    
    // If WS employee, adjust casual leave to 6 days
    if (this.isWSEmployee) {
      const casualLeaveIndex = this.leaveTypes.findIndex(lt => lt.name.toLowerCase() === 'casual leave');
      if (casualLeaveIndex !== -1) {
        this.leaveTypes[casualLeaveIndex].available = 6;
        this.leaveTypes[casualLeaveIndex].remaining = 6;
        this.leaveTypes[casualLeaveIndex].maxDays = 6;
        this.leaveTypes[casualLeaveIndex].totalAllocation = 6;
        console.log('WS Employee: Casual leave set to 6 days');
      }
    }
    
    // Initialize special leave limits map
    this.initializeSpecialLeaveLimits();
    
    console.log('Initialized leave types:', this.leaveTypes);
  }

  // Initialize special leave limits from defaultLeaveTypes
  initializeSpecialLeaveLimits(): void {
    this.specialLeaveLimits.clear();
    this.defaultLeaveTypes.forEach(leave => {
      if (leave.maxDays) {
        this.specialLeaveLimits.set(leave.name.toLowerCase(), leave.maxDays);
      }
    });
    console.log('Special leave limits:', this.specialLeaveLimits);
  }

  getLeaveCounts(empId: string): void {
    this.isLoading = true;
    this.apiService.getLeaveCounts(empId).subscribe({
      next: (res: any) => {
        console.log('Leave Counts API Response:', res);
        this.isLoading = false;
        
        // Store the complete response
        this.leaveData = res;
        
        // Update leave types based on API response
        this.updateLeaveTypesFromResponse(res);
      },
      error: (err: any) => {
        console.error('Error fetching leave counts:', err);
        this.isLoading = false;
        // Keep current values if API fails
      }
    });
  }

  updateLeaveTypesFromResponse(response: any): void {
    if (!response) return;

    // Update Casual Leave from API response
    let casualBalance = Number(response.casualBalance) || (this.isWSEmployee ? 6 : 18);
    const calculatedCasualLeaves = Number(response.calculatedCasualLeaves) || 0;
    const casualUsed = Number(response.casualUsed) || 0;
    const totalLop = Number(response.totalLop) || 0;
    
    console.log('Casual leave data from API:', {
      casualBalance,
      calculatedCasualLeaves,
      casualUsed,
      totalLop,
      isWSEmployee: this.isWSEmployee
    });
    
    // For WS employees, set casual balance to max 6
    if (this.isWSEmployee) {
      casualBalance = 6;
      console.log('Setting casual balance for WS employee to 6 days');
    }
    
    // FIX: Calculate remaining days and set available to show remaining, not total balance
    // This ensures it shows 0 when all leaves are taken
    let casualRemaining = Math.max(0, casualBalance - calculatedCasualLeaves);
    
    // CRITICAL FIX: If booked >= available, set remaining to 0
    if (calculatedCasualLeaves >= casualBalance) {
      casualRemaining = 0;
      console.log('All casual leaves taken - setting available to 0');
    }
    
    // Update casual leave card
    const casualLeaveIndex = this.leaveTypes.findIndex(lt => lt.name.toLowerCase() === 'casual leave');
    if (casualLeaveIndex !== -1) {
      // Store the original total allocation
      this.leaveTypes[casualLeaveIndex].totalAllocation = casualBalance;
      
      // IMPORTANT: Set available to show remaining days, NOT total balance
      this.leaveTypes[casualLeaveIndex].available = casualRemaining;
      this.leaveTypes[casualLeaveIndex].booked = calculatedCasualLeaves;
      this.leaveTypes[casualLeaveIndex].remaining = casualRemaining;
      this.leaveTypes[casualLeaveIndex].maxDays = casualBalance;
      
      // Disable casual leave card if remaining is 0 or less
      this.leaveTypes[casualLeaveIndex].disabled = casualRemaining <= 0;
      
      console.log('Updated casual leave:', {
        totalAllocation: casualBalance,
        booked: calculatedCasualLeaves,
        remaining: casualRemaining,
        displayedAvailable: this.leaveTypes[casualLeaveIndex].available,
        disabled: this.leaveTypes[casualLeaveIndex].disabled
      });
    }

    // Update special leaves if they exist in the response
    if (response.specialLeaves && Array.isArray(response.specialLeaves)) {
      response.specialLeaves.forEach((specialLeave: any) => {
        this.updateSpecialLeave(specialLeave);
      });
    }

    console.log('Updated leave types:', this.leaveTypes);
  }

  updateSpecialLeave(specialLeave: any): void {
    if (!specialLeave || !specialLeave.name) return;
    
    const leaveName = specialLeave.name.toLowerCase();
    
    // Map "bereavement" to "brebment" if needed
    const mappedLeaveName = leaveName.includes('bereavement') ? 'brebment leave' : leaveName;
    
    const leaveIndex = this.leaveTypes.findIndex(lt => lt.name.toLowerCase() === mappedLeaveName);
    
    if (leaveIndex !== -1) {
      const apiRemaining = Number(specialLeave.remaining) || 0;
      const apiBooked = Number(specialLeave.booked) || 0;
      const apiAvailable = Number(specialLeave.available) || 0;
      
      // Get the max days for this leave type
      const maxDays = this.leaveTypes[leaveIndex].maxDays || apiAvailable || 0;
      
      // CRITICAL FIX: Always use remaining for the available display
      // This ensures it shows 0 when all leaves are taken
      let displayAvailable = apiRemaining;
      
      // Double-check: If the leave is fully used, show 0
      if (apiBooked >= maxDays || apiRemaining <= 0) {
        displayAvailable = 0;
        console.log(`${mappedLeaveName} fully used - setting available to 0`);
      }
      
      // Store the original total allocation
      this.leaveTypes[leaveIndex].totalAllocation = maxDays;
      
      // IMPORTANT: Set available to show remaining days
      this.leaveTypes[leaveIndex].available = displayAvailable;
      this.leaveTypes[leaveIndex].booked = apiBooked;
      this.leaveTypes[leaveIndex].remaining = apiRemaining;
      
      // Disable the card if remaining is 0 or less
      this.leaveTypes[leaveIndex].disabled = displayAvailable <= 0;
      
      console.log(`Updated ${mappedLeaveName}:`, {
        totalAllocation: maxDays,
        apiBooked: apiBooked,
        apiRemaining: apiRemaining,
        displayAvailable: displayAvailable,
        disabled: this.leaveTypes[leaveIndex].disabled
      });
      
      // Update color and icon if provided
      if (specialLeave.color) this.leaveTypes[leaveIndex].color = specialLeave.color;
      if (specialLeave.icon) this.leaveTypes[leaveIndex].icon = specialLeave.icon;
    }
  }

  fetchUpcomingHolidays(): void {
    this.apiService.getUpcomingHolidays().subscribe({
      next: (response: any) => {
        console.log('Holidays response:', response);
        this.upcomingHolidays = response.data || [];
      },
      error: (error: any) => {
        console.error('Error fetching holidays:', error);
        this.upcomingHolidays = [];
      }
    });
  }

  applyLeave() {
    this.router.navigate(['/dashboard/apply-leave'], { 
      queryParams: { type: "", ej: "/dashboard/leave-summary" } 
    });
  }

  // Enhanced navigate method with special leave limits
  navigateToApplyLeave(leaveType: string) {
    const leaveCard = this.leaveTypes.find(lt => lt.name.toLowerCase() === leaveType.toLowerCase());
    const remainingDays = leaveCard ? leaveCard.remaining : 0;
    
    // Get the maximum days allowed for this leave type
    const maxDays = this.specialLeaveLimits.get(leaveType.toLowerCase()) || 
                   (leaveCard ? leaveCard.maxDays : remainingDays) || 
                   remainingDays;
    
    console.log(`Navigating to apply ${leaveType}: remaining=${remainingDays}, maxDays=${maxDays}`);
    
    this.router.navigate(['/dashboard/apply-leave'], { 
      queryParams: { 
        type: leaveType, 
        ej: "/dashboard/leave-summary",
        remaining: remainingDays,
        maxDays: maxDays,
        isWSEmployee: this.isWSEmployee
      } 
    });
  }

  // Method to handle card clicks
  handleCardClick(leaveTypeName: string): void {
    const leaveTypeLower = leaveTypeName.toLowerCase();
    
    // Keep as "brebment leave" (no conversion to bereavement)
    const correctedLeaveType = leaveTypeLower;
    
    // Find the leave card
    const leaveCard = this.leaveTypes.find(lt => lt.name.toLowerCase() === correctedLeaveType);
    
    // Check if card is disabled (available <= 0)
    if (leaveCard && leaveCard.disabled) {
      let message = `${this.getTitleCase(correctedLeaveType)} is not available. `;
      message += `Remaining days: ${leaveCard.remaining}`;
      
      // Add WS specific message for casual leave
      if (correctedLeaveType === 'casual leave' && this.isWSEmployee) {
        message += ' (WS employees have 6 days limit)';
      }
      
      this.showErrorMessage(message);
      return;
    }
    
    if (this.hrApprovalLeaveTypes.includes(correctedLeaveType)) {
      // Prepare data for modal
      this.selectedLeaveTypeForModal = correctedLeaveType;
      this.formattedLeaveType = this.getTitleCase(correctedLeaveType);
      this.todayDate = this.getTodayDate();
      this.defaultEndDate = this.getDefaultEndDate();
      
      // Show HR approval modal instead of navigating
      this.showHrLeaveModal = true;
    } else {
      // For casual leave, navigate to apply leave page
      this.navigateToApplyLeave(leaveTypeName);
    }
  }

  // Modal methods
  closeHrLeaveModal(): void {
    this.showHrLeaveModal = false;
    this.selectedLeaveTypeForModal = '';
    this.formattedLeaveType = '';
    this.modalIsLoading = false;
  }

  submitHrLeaveRequest(): void {
    // No validation - submit directly
    this.modalIsLoading = true;
    
    // Get the leave type display name
    const leaveTypeDisplay = this.formattedLeaveType || this.getTitleCase(this.selectedLeaveTypeForModal);
    
    // Create the HR leave approval object with a default reason
    const hrLeaveApproval: HrLeaveApproval = {
      employeeId: this.employeeId,
      leaveType: leaveTypeDisplay,
      requestedDate: this.todayDate,
      status: 'pending',
      remarks: `${leaveTypeDisplay} - Submitted via system`,
      ...(this.hrName && { hrName: this.hrName }),
      ...(this.managerName && { managerName: this.managerName })
    };

    console.log('Submitting HR leave approval request:', hrLeaveApproval);
    
    // Call the API service to create HR leave approval
    this.apiService.createHrLeaveApproval(hrLeaveApproval).subscribe({
      next: (response: any) => {
        this.modalIsLoading = false;
        
        // Check different response formats
        if (response.success || (response as any).status === 'success') {
          // Show success message
          this.showSuccessMessage(`${this.formattedLeaveType} request submitted successfully!`);
          
          // Close the modal
          this.closeHrLeaveModal();
          
          // Refresh leave counts
          setTimeout(() => {
            this.getLeaveCounts(this.employeeId);
          }, 1000);
        } else {
          // Show error message from API
          this.showErrorMessage(response.error || 'Failed to submit leave request');
        }
      },
      error: (error: any) => {
        this.modalIsLoading = false;
        console.error('Error submitting HR leave approval:', error);
        this.showErrorMessage('Error submitting leave request. Please try again.');
      }
    });
  }

  // Helper methods for dates
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '';
    return this.datePipe.transform(dateString, 'dd MMMM yyyy') || '';
  }

  // Format short date
  formatShortDate(dateString: string): string {
    if (!dateString) return '';
    return this.datePipe.transform(dateString, 'dd MMM yyyy') || '';
  }

  // Convert to title case for display
  getTitleCase(str: string): string {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Calculate progress percentage for progress bar
  calculateProgress(booked: number, available: number): number {
    if (available <= 0) return 0;
    return Math.min(100, (booked / available) * 100);
  }

  // Show success message using toast
  showSuccessMessage(message: string): void {
    this.showToast = true;
    this.toastMessage = message;
    this.toastType = 'success';
    
    // Auto hide after 5 seconds
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  // Show error message using toast
  showErrorMessage(message: string): void {
    this.showToast = true;
    this.toastMessage = message;
    this.toastType = 'error';
    
    // Auto hide after 5 seconds
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  // Close toast manually
  closeToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  // Refresh leave summary
  refreshLeaveSummary(): void {
    this.getLeaveCounts(this.employeeId);
  }

  // Get the leave type object by name
  getLeaveTypeByName(name: string): any {
    return this.leaveTypes.find(lt => lt.name.toLowerCase() === name.toLowerCase());
  }

  // Get card class for WS employees
  getCardClass(leaveTypeName: string): string {
    const leaveType = this.leaveTypes.find(lt => lt.name.toLowerCase() === leaveTypeName.toLowerCase());
    if (!leaveType) return 'leave-card';
    
    if (leaveType.disabled) {
      return 'leave-card disabled';
    }
    
    // Highlight WS casual leave differently
    if (leaveTypeName.toLowerCase() === 'casual leave' && this.isWSEmployee) {
      return 'leave-card ws-employee';
    }
    
    return 'leave-card';
  }

  // Get card tooltip for WS employees
  getCardTooltip(leaveTypeName: string): string {
    if (leaveTypeName.toLowerCase() === 'casual leave' && this.isWSEmployee) {
      return 'WS Employee: 6 days limit';
    }
    
    return '';
  }
  
  // Get the total allocation for a leave type
  getTotalAllocation(leaveTypeName: string): number {
    const leaveType = this.leaveTypes.find(lt => lt.name.toLowerCase() === leaveTypeName.toLowerCase());
    return leaveType ? leaveType.totalAllocation || 0 : 0;
  }
}