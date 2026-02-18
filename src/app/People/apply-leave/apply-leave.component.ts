import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-apply-leave',
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.css'],
})
export class ApplyLeaveComponent implements OnInit {
  leaveForm!: FormGroup;
  leaveTypes = ['casual leave']; // Default leave types
  approvedLeaveTypes: string[] = []; // For storing approved special leaves
  isModalOpen = true;
  aj: string = '';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  isLoading = false;
  specialLeavesData: any[] = []; // Store special leaves data from API
  
  // Store WS employee status from query params
  isWSEmployee: boolean = false;
  maxCasualLeaveDays: number = 18; // Default
  remainingCasualDays: number = 18;
  
  // Store max days for special leaves from query params
  maxSpecialLeaveDays: number = 0;
  
  // Store the selected leave type details
  selectedLeaveTypeDetails: any = null;
  
  // Store maximum end date for date picker
  maxEndDate: string = '';
  minEndDate: string = '';
  
  // Today's date for min date validation
  todayDate: string = new Date().toISOString().split('T')[0];
  
  // Store available days for the selected special leave
  availableSpecialDays: number = 0;
  
  // Track if current leave is a special leave
  isSpecialLeave: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.route.queryParams.subscribe((params) => {
      const leaveTypeFromQuery = params['type'];
      const ej = params['ej'];
      const remaining = params['remaining'];
      const isWSEmployeeParam = params['isWSEmployee'];
      const maxDays = params['maxDays'];
      
      this.leaveForm.patchValue({ aj: ej });
      this.aj = ej;

      // Get WS employee status from query params
      this.isWSEmployee = isWSEmployeeParam === 'true';
      this.maxCasualLeaveDays = this.isWSEmployee ? 6 : 18;
      
      // Store max days for special leaves
      this.maxSpecialLeaveDays = maxDays ? parseInt(maxDays, 10) : 0;
      
      console.log('Apply Leave - Is WS Employee:', this.isWSEmployee, 
                  'Max Casual Days:', this.maxCasualLeaveDays,
                  'Max Special Days:', this.maxSpecialLeaveDays);

      if (leaveTypeFromQuery === 'permission') {
        this.leaveForm.patchValue({ requestType: 'permission', leavetype: 'permission' });
        this.leaveForm.get('leavetype')?.disable();
      } else if (leaveTypeFromQuery) {
        this.leaveForm.patchValue({ leavetype: leaveTypeFromQuery, requestType: 'leave' });
        this.leaveForm.get('leavetype')?.disable();
        
        // Set remaining days for validation
        if (remaining) {
          this.remainingCasualDays = parseFloat(remaining);
          console.log('Remaining days from query:', this.remainingCasualDays);
        }
        
        // Load special leave details if it's a special leave
        this.loadSpecialLeaveDetails(leaveTypeFromQuery);
      } else {
        this.leaveForm.get('leavetype')?.enable();
      }
    });

    this.loadUserApprovedLeaves(); // Load approved leaves on initialization
    this.loadLeaveCounts(); // Load leave counts to check booked status
    this.fetchManagerEmail(this.employeeId);
    
    // Watch for start date changes to calculate max end date
    this.leaveForm.get('startdate')?.valueChanges.subscribe((startDate: string) => {
      this.onStartDateChange(startDate);
    });
    
    // Watch for leave type changes
    this.leaveForm.get('leavetype')?.valueChanges.subscribe((leaveType: string) => {
      this.onLeaveTypeChange(leaveType);
    });
  }

  // Load special leave details
  loadSpecialLeaveDetails(leaveType: string): void {
    // Check if it's one of the special leaves
    const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
    const normalizedLeaveType = leaveType.toLowerCase().trim();
    
    if (specialLeaves.includes(normalizedLeaveType)) {
      console.log(`Loading details for special leave: ${normalizedLeaveType}`);
      
      // Set the maximum days for this special leave
      const maxDaysMap: { [key: string]: number } = {
        'paternity leave': 2,
        'maternity leave': 182,
        'wedding leave': 5,
        'brebment leave': 5
      };
      
      this.selectedLeaveTypeDetails = {
        name: normalizedLeaveType,
        maxDays: maxDaysMap[normalizedLeaveType] || 0
      };
      
      // Get available days for this special leave
      this.availableSpecialDays = this.getAvailableSpecialLeaveDays(normalizedLeaveType);
      this.isSpecialLeave = true;
      
      console.log('Selected leave type details:', this.selectedLeaveTypeDetails);
      console.log('Available days for special leave:', this.availableSpecialDays);
    } else {
      this.isSpecialLeave = false;
      this.selectedLeaveTypeDetails = null;
      this.availableSpecialDays = 0;
    }
  }

  // Handle start date change
  onStartDateChange(startDate: string): void {
    if (!startDate) {
      this.maxEndDate = '';
      this.minEndDate = '';
      return;
    }
    
    const leaveType = this.leaveForm.get('leavetype')?.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    
    // Check if start date is in past
    if (start < today) {
      alert('Start date cannot be in the past.');
      this.leaveForm.get('startdate')?.setValue('');
      this.maxEndDate = '';
      this.minEndDate = '';
      return;
    }
    
    // For SPECIAL LEAVES ONLY: Apply automatic date selection
    const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
    const isSpecialLeave = specialLeaves.includes(leaveType?.toLowerCase()?.trim());
    
    if (isSpecialLeave && this.availableSpecialDays > 0) {
      // Calculate maximum end date based on available days for special leave
      const maxEnd = new Date(start);
      maxEnd.setDate(start.getDate() + this.availableSpecialDays - 1);
      
      // Format dates for HTML date input (YYYY-MM-DD)
      this.maxEndDate = maxEnd.toISOString().split('T')[0];
      this.minEndDate = startDate; // End date can't be before start date
      
      console.log(`For SPECIAL LEAVE ${leaveType}: Start: ${startDate}, Max End: ${this.maxEndDate}, Available Days: ${this.availableSpecialDays}`);
      
      // Auto-set end date to start date + (available days - 1)
      // This automatically selects the maximum available date for special leaves
      this.leaveForm.patchValue({ enddate: this.maxEndDate });
      this.calculateDuration(); // Recalculate duration
      
    } else {
      // For CASUAL LEAVE and other leaves: NO automatic date selection
      this.maxEndDate = '';
      this.minEndDate = startDate;
    }
  }

  // Handle leave type change
  onLeaveTypeChange(leaveType: string): void {
    if (!leaveType) {
      this.selectedLeaveTypeDetails = null;
      this.maxEndDate = '';
      this.minEndDate = '';
      this.availableSpecialDays = 0;
      this.isSpecialLeave = false;
      return;
    }
    
    const normalizedLeaveType = leaveType.toLowerCase().trim();
    const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
    
    if (specialLeaves.includes(normalizedLeaveType)) {
      const maxDaysMap: { [key: string]: number } = {
        'paternity leave': 2,
        'maternity leave': 182,
        'wedding leave': 5,
        'brebment leave': 5
      };
      
      this.selectedLeaveTypeDetails = {
        name: normalizedLeaveType,
        maxDays: maxDaysMap[normalizedLeaveType] || 0
      };
      
      // Get available days for special leave
      this.availableSpecialDays = this.getAvailableSpecialLeaveDays(normalizedLeaveType);
      this.isSpecialLeave = true;
      
      console.log(`Selected SPECIAL LEAVE ${normalizedLeaveType} with max ${this.selectedLeaveTypeDetails.maxDays} days, Available: ${this.availableSpecialDays}`);
      
      // If start date is already selected, recalculate max end date
      const startDate = this.leaveForm.get('startdate')?.value;
      if (startDate) {
        this.onStartDateChange(startDate);
      }
    } else {
      // For CASUAL LEAVE and other leaves: NO restrictions
      this.selectedLeaveTypeDetails = null;
      this.maxEndDate = '';
      this.minEndDate = '';
      this.availableSpecialDays = 0;
      this.isSpecialLeave = false;
    }
  }

  // Load user's approved special leaves
  loadUserApprovedLeaves(): void {
    this.isLoading = true;
    
    // Get current logged-in user ID
    const currentEmployeeId = localStorage.getItem('employeeId');
    
    if (!currentEmployeeId) {
      console.error('No employee ID found in localStorage');
      this.isLoading = false;
      return;
    }

    this.apiService.getAllHrLeaveApprovals().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response.success && response.data) {
          let approvalsData: any[] = [];
          
          // Handle different response formats
          if (Array.isArray(response.data)) {
            approvalsData = response.data;
          } else if (typeof response.data === 'object' && response.data !== null) {
            approvalsData = [response.data];
          }
          
          // Filter for current user's approved leaves only
          const userApprovals = approvalsData.filter(approval => {
            // Check if it's the current user and status is approved
            const isCurrentUser = approval.employeeId?.toString() === currentEmployeeId;
            const isApproved = (approval.status?.toLowerCase() || '') === 'approved';
            const hasLeaveType = approval.leaveType && approval.leaveType.trim() !== '';
            
            return isCurrentUser && isApproved && hasLeaveType;
          });
          
          console.log('User approved leaves:', userApprovals);
          
          // Extract unique leave types from approved leaves
          const uniqueLeaveTypes = new Set<string>();
          
          userApprovals.forEach(approval => {
            if (approval.leaveType) {
              // Format the leave type nicely
              const formattedType = approval.leaveType
                .toLowerCase()
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              uniqueLeaveTypes.add(formattedType);
            }
          });
          
          // Convert Set to array
          this.approvedLeaveTypes = Array.from(uniqueLeaveTypes);
          
          // Update available leave types
          this.updateAvailableLeaveTypes();
          
          console.log('Approved leave types:', this.approvedLeaveTypes);
        } else {
          console.error('Failed to load approved leaves:', response.error);
          // Keep default casual leave if API fails
          this.updateAvailableLeaveTypes();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading approved leaves:', error);
        // Keep default casual leave on error
        this.updateAvailableLeaveTypes();
      }
    });
  }

  // Load leave counts to check booked status
  loadLeaveCounts(): void {
    const currentEmployeeId = localStorage.getItem('employeeId');
    
    if (!currentEmployeeId) {
      console.error('No employee ID found in localStorage');
      return;
    }

    this.apiService.getLeaveCounts(currentEmployeeId).subscribe({
      next: (response: any) => {
        console.log('Leave counts response:', response);
        
        // Check if response has specialLeaves array
        if (response && Array.isArray(response.specialLeaves)) {
          this.specialLeavesData = response.specialLeaves;
          console.log('Special leaves data:', this.specialLeavesData);
          
          // Update available leave types
          this.updateAvailableLeaveTypes();
          
          // Update available days for current leave type
          const currentLeaveType = this.leaveForm.get('leavetype')?.value;
          if (currentLeaveType) {
            const normalizedLeaveType = currentLeaveType.toLowerCase().trim();
            const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
            
            if (specialLeaves.includes(normalizedLeaveType)) {
              this.availableSpecialDays = this.getAvailableSpecialLeaveDays(normalizedLeaveType);
            }
          }
        } else {
          console.error('Invalid response format for leave counts:', response);
        }
      },
      error: (error: any) => {
        console.error('Error loading leave counts:', error);
      }
    });
  }

  // Update available leave types based on approved leaves and booked status
  updateAvailableLeaveTypes(): void {
    // Start with casual leave (only if remaining > 0)
    let availableLeaves: string[] = [];
    
    // Add casual leave only if remaining days > 0
    if (this.remainingCasualDays > 0) {
      availableLeaves.push('casual leave');
    } else {
      console.log('Casual leave not available - remaining days: 0');
    }
    
    // Add approved special leaves that are NOT booked (booked === 0)
    this.approvedLeaveTypes.forEach(approvedLeave => {
      // Check if this approved leave type is available (not booked)
      const isAvailable = this.isLeaveAvailable(approvedLeave);
      
      // Only add if it's available (not booked)
      if (isAvailable) {
        availableLeaves.push(approvedLeave);
      }
    });
    
    this.leaveTypes = availableLeaves;
    
    // If the currently selected leave type is now unavailable, reset it
    const currentSelection = this.leaveForm.get('leavetype')?.value;
    if (currentSelection && 
        currentSelection !== 'casual leave' && 
        currentSelection !== 'permission' &&
        !this.leaveTypes.includes(currentSelection)) {
      this.leaveForm.patchValue({ leavetype: '' });
    }
    
    console.log('Final available leave types:', this.leaveTypes);
    
    // Show warning if no leave types available
    if (this.leaveTypes.length === 0) {
      console.warn('No leave types available for this employee');
      alert('No leave types available. You have exhausted all your leave balances.');
    }
  }

  // Check if a leave is available (booked === 0)
  isLeaveAvailable(leaveType: string): boolean {
    // Normalize the leave type for comparison
    const normalizedLeaveType = leaveType.toLowerCase().trim();
    
    // Find the special leave in the data
    const specialLeave = this.specialLeavesData.find(leave => {
      const leaveName = leave.name.toLowerCase().trim();
      return leaveName === normalizedLeaveType;
    });
    
    // If we found the leave data, check if booked === 0
    if (specialLeave) {
      console.log(`Checking availability for ${leaveType}: booked=${specialLeave.booked}, available=${specialLeave.available}, remaining=${specialLeave.remaining}`);
      return specialLeave.booked === 0;
    }
    
    // If we don't have data for this leave, assume it's available
    console.log(`No data found for ${leaveType}, assuming available`);
    return true;
  }

  initializeForm(): void {
    this.leaveForm = this.fb.group({
      empid: [this.employeeId, Validators.required],
      requestType: ['leave', Validators.required],
      leavetype: ['', Validators.required],
      startdate: [''],
      enddate: [''],
      permissionDate: [''],
      startTime: [''],
      endTime: [''],
      startHalf: [false],
      endHalf: [false],
      teamemail: ['', [Validators.required, Validators.email]],
      leavereason: ['', Validators.required],
      noofdays: ['', Validators.required],
      aj: ['']
    });
  }

  fetchManagerEmail(empId: string): void {
    this.apiService.getManagerEmail(empId).subscribe(
      (response) => {
        this.leaveForm.patchValue({ teamemail: response.email });
        console.log('Manager email fetched:', response.email);
      },
      () => {
        this.leaveForm.patchValue({ teamemail: '' });
        console.log('Failed to fetch manager email');
      }
    );
  }

  onRequestTypeChange(): void {
    console.log('Request type changed to:', this.leaveForm.get('requestType')?.value);
    this.calculateDuration();
    const requestType = this.leaveForm.get('requestType')?.value;
    if (requestType === 'permission') {
      this.leaveForm.get('startdate')?.clearValidators();
      this.leaveForm.get('enddate')?.clearValidators();
      this.leaveForm.get('permissionDate')?.setValidators([Validators.required]);
      this.leaveForm.get('startTime')?.setValidators([Validators.required]);
      this.leaveForm.get('endTime')?.setValidators([Validators.required]);
      this.leaveForm.get('leavetype')?.setValue('permission');
    } else {
      this.leaveForm.get('permissionDate')?.clearValidators();
      this.leaveForm.get('startTime')?.clearValidators();
      this.leaveForm.get('endTime')?.clearValidators();
      this.leaveForm.get('startdate')?.setValidators([Validators.required]);
      this.leaveForm.get('enddate')?.setValidators([Validators.required]);
      this.leaveForm.get('leavetype')?.setValue('');
    }
    this.leaveForm.get('startdate')?.updateValueAndValidity();
    this.leaveForm.get('enddate')?.updateValueAndValidity();
    this.leaveForm.get('permissionDate')?.updateValueAndValidity();
    this.leaveForm.get('startTime')?.updateValueAndValidity();
    this.leaveForm.get('endTime')?.updateValueAndValidity();
  }

  calculateDuration(): void {
    const requestType = this.leaveForm.get('requestType')?.value;
    console.log('Calculating duration for requestType:', requestType);

    if (requestType === 'leave') {
      const startDate = this.leaveForm.get('startdate')?.value;
      const endDate = this.leaveForm.get('enddate')?.value;
      const leaveType = this.leaveForm.get('leavetype')?.value;
      const isStartHalf = this.leaveForm.get('startHalf')?.value === true || this.leaveForm.get('startHalf')?.value === 'true';
      const isEndHalf = this.leaveForm.get('endHalf')?.value === true || this.leaveForm.get('endHalf')?.value === 'true';
      
      console.log('Leave: startDate=', startDate, 'endDate=', endDate, 'leaveType=', leaveType, 'startHalf=', isStartHalf, 'endHalf=', isEndHalf);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          alert('Start date cannot be in the past.');
          this.leaveForm.get('startdate')?.setValue('');
          return;
        }

        if (end < start) {
          alert('End date cannot be before start date.');
          this.leaveForm.get('enddate')?.setValue('');
          return;
        }

        let days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

        if (start.toDateString() === end.toDateString()) {
          if (isStartHalf && isEndHalf) {
            days = 0.5;
          } else if (isStartHalf || isEndHalf) {
            days = 1;
          }
        } else {
          if (isStartHalf) days -= 0.5;
          if (isEndHalf) days -= 0.5;
        }

        // For CASUAL LEAVE: NO RESTRICTIONS - users can request any number of days
        // No validation needed - users can request unlimited days
        if (leaveType && leaveType.toLowerCase() === 'casual leave') {
          console.log(`Casual leave: ${days} days requested (NO LIMIT CHECK)`);
        }

        // For SPECIAL LEAVES ONLY: Check if days exceed available days
        const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
        const normalizedLeaveType = leaveType?.toLowerCase()?.trim();
        
        if (normalizedLeaveType && specialLeaves.includes(normalizedLeaveType)) {
          const availableDays = this.getAvailableSpecialLeaveDays(normalizedLeaveType);
          
          if (days > availableDays) {
            alert(`Cannot apply for ${days} days. ${this.getTitleCase(normalizedLeaveType)} is limited to ${availableDays} days only. You have ${availableDays} days available.`);
            this.leaveForm.get('noofdays')?.setValue('');
            return;
          }
          
          const maxDaysMap: { [key: string]: number } = {
            'paternity leave': 2,
            'maternity leave': 182,
            'wedding leave': 5,
            'brebment leave': 5
          };
          
          const maxDays = maxDaysMap[normalizedLeaveType] || 0;
          
          if (days > maxDays) {
            alert(`Cannot apply for ${days} days. ${this.getTitleCase(normalizedLeaveType)} is limited to maximum ${maxDays} days.`);
            this.leaveForm.get('noofdays')?.setValue('');
            return;
          }
        }

        this.leaveForm.get('noofdays')?.setValue(days);
        console.log('Leave duration calculated: days=', days);
      }
    } else if (requestType === 'permission') {
      const permDate = this.leaveForm.get('permissionDate')?.value;
      const startTime = this.leaveForm.get('startTime')?.value;
      const endTime = this.leaveForm.get('endTime')?.value;
      console.log('Permission: permissionDate=', permDate, 'startTime=', startTime, 'endTime=', endTime);

      if (permDate && startTime && endTime) {
        // Combine permissionDate with startTime and endTime for validation
        const startDateTime = `${permDate}T${startTime}:00`;
        const endDateTime = `${permDate}T${endTime}:00`;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          alert('Permission date cannot be in the past.');
          this.leaveForm.get('permissionDate')?.setValue('');
          return;
        }

        if (end <= start) {
          alert('End time must be after start time.');
          this.leaveForm.get('endTime')?.setValue('');
          return;
        }

        const hours = (end.getTime() - start.getTime()) / (1000 * 3600);

        if (hours > 2) {
          alert('Permission cannot exceed 2 hours per day.');
          return;
        }

        this.leaveForm.patchValue({
          noofdays: hours,
          leavetype: 'permission'
        });
        console.log('Permission duration calculated: hours=', hours, 'startTime=', startTime, 'endTime=', endTime);
      }
    }
  }

  // Helper to get available days for special leave
  getAvailableSpecialLeaveDays(leaveType: string): number {
    const normalizedLeaveType = leaveType.toLowerCase().trim();
    const specialLeave = this.specialLeavesData.find(leave => {
      const leaveName = leave.name.toLowerCase().trim();
      return leaveName === normalizedLeaveType || 
             (leaveName.includes('bereavement') && normalizedLeaveType === 'brebment leave');
    });
    
    if (specialLeave) {
      const remaining = Number(specialLeave.remaining) || 0;
      console.log(`Found ${normalizedLeaveType} in API data: remaining=${remaining}`);
      return remaining;
    }
    
    // If not found in API data, use default limits
    const defaultLimits: { [key: string]: number } = {
      'paternity leave': 2,
      'maternity leave': 182,
      'wedding leave': 5,
      'brebment leave': 5
    };
    
    const defaultDays = defaultLimits[normalizedLeaveType] || 0;
    console.log(`Using default limit for ${normalizedLeaveType}: ${defaultDays} days`);
    
    return defaultDays;
  }

  // Helper to convert to title case
  getTitleCase(str: string): string {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  submitForm(): void {
    if (this.leaveForm.valid) {
      const formValues = { ...this.leaveForm.getRawValue() };
      console.log('Form values before transformation:', formValues);

      const selectedLeaveType = formValues.leavetype;
      const requestedDays = parseFloat(formValues.noofdays) || 0;
      
      // For CASUAL LEAVE: NO RESTRICTIONS - users can request any number of days
      // No validation needed - users can request unlimited days
      if (selectedLeaveType && selectedLeaveType.toLowerCase() === 'casual leave') {
        console.log(`Casual leave: ${requestedDays} days requested (NO VALIDATION)`);
      }
      
      // For SPECIAL LEAVES ONLY: Apply restrictions
      const specialLeaves = ['paternity leave', 'maternity leave', 'wedding leave', 'brebment leave'];
      const normalizedLeaveType = selectedLeaveType?.toLowerCase()?.trim();
      
      if (normalizedLeaveType && specialLeaves.includes(normalizedLeaveType)) {
        const availableDays = this.getAvailableSpecialLeaveDays(normalizedLeaveType);
        
        if (requestedDays > availableDays) {
          alert(`Cannot apply for ${requestedDays} days. You have only ${availableDays} days available for ${this.getTitleCase(normalizedLeaveType)}.`);
          return;
        }
        
        const maxDaysMap: { [key: string]: number } = {
          'paternity leave': 2,
          'maternity leave': 182,
          'wedding leave': 5,
          'brebment leave': 5
        };
        
        const maxDays = maxDaysMap[normalizedLeaveType] || 0;
        
        if (requestedDays > maxDays) {
          alert(`Cannot apply for ${requestedDays} days. ${this.getTitleCase(normalizedLeaveType)} is limited to maximum ${maxDays} days.`);
          return;
        }
      }

      // Check if it's a special approved leave (not casual leave or permission)
      if (formValues.requestType === 'leave' && 
          selectedLeaveType !== 'casual leave' &&
          selectedLeaveType !== 'permission') {
        
        // Update the special leave data locally to mark it as booked
        this.updateSpecialLeaveAsBooked(selectedLeaveType, requestedDays);
      }

      // Transform form data for permission request
      if (formValues.requestType === 'permission') {
        const permDate = formValues.permissionDate;
        formValues.startTime = `${permDate}T${formValues.startTime}:00`; // Convert to ISO 8601
        formValues.endTime = `${permDate}T${formValues.endTime}:00`;     // Convert to ISO 8601
        formValues.hours = formValues.noofdays;                         // Map noofdays to hours
        formValues.reason = formValues.leavereason;                     // Map leavereason to reason
        delete formValues.startdate;
        delete formValues.enddate;
        delete formValues.startHalf;
        delete formValues.endHalf;
        delete formValues.noofdays;
        delete formValues.leavereason;
        delete formValues.permissionDate;
      } else {
        delete formValues.permissionDate;
        delete formValues.startTime;
        delete formValues.endTime;
      }

      console.log('Form values after transformation:', formValues);

      const apiCall = formValues.requestType === 'permission'
        ? this.apiService.putPermissionReq(formValues)
        : this.apiService.putLeaveReq(formValues);

      apiCall.subscribe(
        (response) => {
          alert(response.message);
          
          // Refresh leave counts after successful submission
          this.loadLeaveCounts();
          
          this.location.back();
        },
        (error) => {
          console.error('Submission Error:', error);
          alert(error.error?.error || 'Failed to submit request.');
          
          // If submission fails, refresh leave counts to revert any local changes
          this.loadLeaveCounts();
        }
      );
    } else {
      console.log('Form invalid:', this.leaveForm.errors);
      this.markAllFieldsTouched();
    }
  }

  // Update special leave as booked locally
  updateSpecialLeaveAsBooked(leaveType: string, daysBooked: number): void {
    const normalizedLeaveType = leaveType.toLowerCase().trim();
    
    // Find the special leave in the data
    const specialLeaveIndex = this.specialLeavesData.findIndex(leave => {
      const leaveName = leave.name.toLowerCase().trim();
      return leaveName === normalizedLeaveType;
    });
    
    if (specialLeaveIndex !== -1) {
      // Update the booked count
      this.specialLeavesData[specialLeaveIndex].booked += daysBooked;
      
      // Update remaining count
      this.specialLeavesData[specialLeaveIndex].remaining = 
        this.specialLeavesData[specialLeaveIndex].available - 
        this.specialLeavesData[specialLeaveIndex].booked;
      
      console.log(`Updated ${leaveType}: booked=${this.specialLeavesData[specialLeaveIndex].booked}, remaining=${this.specialLeavesData[specialLeaveIndex].remaining}`);
      
      // Update dropdown
      this.updateAvailableLeaveTypes();
    }
  }

  private markAllFieldsTouched(): void {
    Object.keys(this.leaveForm.controls).forEach((field) => {
      const control = this.leaveForm.get(field);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.location.back();
  }

  // Helper method to check if a leave type is a special approved leave
  isSpecialApprovedLeave(leaveType: string): boolean {
    return this.approvedLeaveTypes.some(approvedType => 
      approvedType.toLowerCase() === leaveType.toLowerCase()
    );
  }
}