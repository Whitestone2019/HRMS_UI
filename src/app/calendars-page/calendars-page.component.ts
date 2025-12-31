import { Component, OnInit } from '@angular/core';
import { ApiService, CalendarEvent, ApiResponse } from '../api.service';
import { Router } from '@angular/router';

interface EventFormRow {
  eventName: string;
  eventDate: string;
  description: string;
}

@Component({
  selector: 'app-calendars-page',
  templateUrl: './calendars-page.component.html',
  styleUrls: ['./calendars-page.component.css']
})
export class CalendarsPageComponent implements OnInit {
  // Events array - loaded from backend on init (only future events)
  events: CalendarEvent[] = [];
  
  // Form rows for adding multiple events
  formRows: EventFormRow[] = [{
    eventName: '',
    eventDate: this.formatDate(new Date()),
    description: ''
  }];
  
  // UI State
  isSubmitting: boolean = false;
  submissionMessage: string = '';
  messageType: 'success' | 'error' = 'success';
  loading: boolean = false;
  showHolidaysTable: boolean = false;
  submittedCount: number = 0;
  
  // Authorization properties
  isAuthorized: boolean = false;
  isLoadingAuth: boolean = true;

  constructor(
    private apiService: ApiService,
    public router: Router // Changed from private to public
  ) { }

  ngOnInit(): void {
    // Check user authorization first
    this.checkAuthorization();
  }

  // =============== AUTHORIZATION METHODS ===============
  private checkAuthorization(): void {
    this.isLoadingAuth = true;
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      this.redirectToLogin();
      return;
    }
    
    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole') || '';
    
    console.log('User Role from localStorage:', userRole);
    
    // Check if user has HR role (case-insensitive)
    const userRoleUpper = userRole.toUpperCase();
    
    // Only allow HR roles
    const hasAccess = userRoleUpper === 'HR' || 
                      userRoleUpper === 'HR_ADMIN' || 
                      userRoleUpper === 'HUMAN_RESOURCES' ||
                      userRoleUpper.includes('HR');
    
    if (hasAccess) {
      this.isAuthorized = true;
      this.isLoadingAuth = false;
      // Load data only if authorized
      this.loadFutureEventsOnInit();
    } else {
      this.isAuthorized = false;
      this.isLoadingAuth = false;
      console.log('Access denied for non-HR role:', userRole);
    }
  }

  private redirectToLogin(): void {
    this.isLoadingAuth = false;
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  // =============== EXISTING METHODS ===============
  private loadFutureEventsOnInit(): void {
    this.loading = true;
    this.apiService.getAllCalendarEvents().subscribe({
      next: (response: ApiResponse) => {
        this.loading = false;
        
        if (response.success && response.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          this.events = response.data.filter((event: CalendarEvent) => {
            if (!event.eventDate) return false;
            try {
              const eventDate = new Date(event.eventDate);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            } catch (error) {
              console.error('Error parsing date:', event.eventDate, error);
              return false;
            }
          });
          
          // Format the createdDate for display
          this.events = this.events.map(event => ({
            ...event,
            formattedCreatedDate: this.formatCreatedDateForDisplay(event.createdDate || '')
          }));
          
          this.sortEventsByDateAscending();
          
          if (this.events.length > 0) {
            this.showHolidaysTable = true;
          }
        } else {
          console.error('Failed to load holidays:', response.message);
          this.showHolidaysTable = true;
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading holidays:', error);
        this.showHolidaysTable = true;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Format date to yyyy-MM-dd for HTML date input
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  // Format date to dd/MM/yyyy for display
  private formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  }

  // Format CREATED_DATE from database format to dd-MM-yyyy HH:mm:ss.SSS
  formatCreatedDateForDisplay(dateStr: string): string {
    if (!dateStr || dateStr.trim() === '') return '-';
    
    try {
      // Your DB format: "24-12-24 05:38:07.605129000 PM"
      // Parse the date string
      const parts = dateStr.split(' ');
      if (parts.length < 2) return this.formatSimpleDate(dateStr);
      
      const datePart = parts[0]; // "24-12-24"
      const timePart = parts[1]; // "05:38:07.605129000"
      const period = parts[2] || ''; // "PM"
      
      // Parse the date part (assuming format: dd-MM-yy)
      const dateParts = datePart.split('-');
      if (dateParts.length !== 3) return this.formatSimpleDate(dateStr);
      
      let day = dateParts[0];
      let month = dateParts[1];
      let year = dateParts[2];
      
      // Convert 2-digit year to 4-digit year
      if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        const yearNum = parseInt(year);
        year = (currentCentury + yearNum).toString();
      }
      
      // Parse time part
      const timeParts = timePart.split(':');
      if (timeParts.length < 3) return `${day}-${month}-${year}`;
      
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const secondsWithMs = timeParts[2];
      
      // Adjust for AM/PM
      if (period.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Format hours to 2 digits
      const formattedHours = ('0' + hours).slice(-2);
      
      // Extract seconds and milliseconds
      const secondsParts = secondsWithMs.split('.');
      const seconds = secondsParts[0] || '00';
      const milliseconds = secondsParts[1] ? secondsParts[1].substring(0, 3) : '000';
      
      // Return formatted string: dd-MM-yyyy HH:mm:ss.SSS
      return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds}.${milliseconds}`;
      
    } catch (error) {
      console.error('Error formatting created date:', dateStr, error);
      return this.formatSimpleDate(dateStr);
    }
  }

  // Helper method to format simple dates
  private formatSimpleDate(dateStr: string): string {
    if (!dateStr) return '-';
    
    try {
      // Try to parse as a date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      
      // If it's already in dd-MM-yy format
      const match = dateStr.match(/(\d{2})-(\d{2})-(\d{2})/);
      if (match) {
        let day = match[1];
        let month = match[2];
        let year = match[3];
        
        if (year.length === 2) {
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          const yearNum = parseInt(year);
          year = (currentCentury + yearNum).toString();
        }
        
        return `${day}-${month}-${year}`;
      }
      
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  }

  // Add new row for event entry
  addFormRow(): void {
    this.formRows.push({
      eventName: '',
      eventDate: this.formatDate(new Date()),
      description: ''
    });
  }

  // Remove event row
  removeFormRow(index: number): void {
    if (this.formRows.length > 1) {
      this.formRows.splice(index, 1);
    }
  }

  // Submit all events at once
  submitAllEvents(): void {
    // Check authorization before submitting
    if (!this.isAuthorized) {
      this.showMessage('You are not authorized to perform this action', 'error');
      return;
    }

    // Validate all rows
    const invalidRows = this.formRows.filter(row => 
      !row.eventName.trim() || !row.eventDate
    );

    if (invalidRows.length > 0) {
      this.showMessage('Please fill all required fields (Event Name and Date) in all rows', 'error');
      return;
    }

    // Check for duplicate dates
    const dateSet = new Set<string>();
    const duplicateDates: string[] = [];
    
    this.formRows.forEach(row => {
      if (dateSet.has(row.eventDate)) {
        duplicateDates.push(row.eventDate);
      } else {
        dateSet.add(row.eventDate);
      }
    });

    if (duplicateDates.length > 0) {
      const formattedDates = duplicateDates.map(date => this.formatDateForDisplay(date));
      this.showMessage(`Duplicate dates found in form: ${formattedDates.join(', ')}. Please remove duplicates.`, 'error');
      return;
    }

    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastDates: string[] = [];
    
    this.formRows.forEach(row => {
      try {
        const eventDate = new Date(row.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          pastDates.push(row.eventDate);
        }
      } catch (error) {
        console.error('Error parsing date:', row.eventDate, error);
      }
    });

    if (pastDates.length > 0) {
      const formattedDates = pastDates.map(date => this.formatDateForDisplay(date));
      this.showMessage(`Cannot add holidays for past dates: ${formattedDates.join(', ')}. Please choose future dates.`, 'error');
      return;
    }

    this.isSubmitting = true;
    this.submissionMessage = 'Submitting holidays...';
    this.messageType = 'success';

    let completed = 0;
    let successCount = 0;
    let errorCount = 0;
    
    const successfulEvents: CalendarEvent[] = [];

    // FIXED: Always use "admin" as createdBy, not from localStorage
    const createdBy = 'admin'; // Always use "admin" only

    // Submit each event row
    this.formRows.forEach((row, index) => {
      const requestData = {
        eventName: row.eventName,
        eventDate: row.eventDate,
        eventType: 'Holiday',
        description: row.description || '',
        isPublic: 'Y',
        createdBy: createdBy 
      };

      this.apiService.createCalendarEvent(requestData).subscribe({
        next: (response: ApiResponse) => {
          completed++;
          if (response.success && response.data) {
            successCount++;
            successfulEvents.push(response.data);
          } else {
            errorCount++;
            if (response.message && response.message.includes('already exists for date')) {
              const errorMessage = this.formatErrorMessage(response.message);
              this.showMessage(errorMessage, 'error');
            } else if (response.message) {
              this.showMessage(response.message, 'error');
            }
          }
          
          this.checkCompletion(completed, successCount, errorCount, successfulEvents);
        },
        error: (error: any) => {
          console.error(`Error creating event ${index + 1}:`, error);
          errorCount++;
          completed++;
          this.checkCompletion(completed, successCount, errorCount, successfulEvents);
        }
      });
    });
  }

  // Format error message to show date in dd/MM/yyyy format
  private formatErrorMessage(message: string): string {
    try {
      const datePattern = /(\d{4}-\d{2}-\d{2})/g;
      const matches = message.match(datePattern);
      
      if (matches && matches.length > 0) {
        let formattedMessage = message;
        matches.forEach(match => {
          const formattedDate = this.formatDateForDisplay(match);
          formattedMessage = formattedMessage.replace(match, formattedDate);
        });
        return formattedMessage;
      }
      return message;
    } catch (error) {
      console.error('Error formatting error message:', error);
      return message;
    }
  }

  private checkCompletion(completed: number, successCount: number, errorCount: number, successfulEvents: CalendarEvent[]): void {
    if (completed === this.formRows.length) {
      this.isSubmitting = false;
      this.submittedCount = successCount;
      
      if (successCount > 0) {
        this.events = [...successfulEvents, ...this.events];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.events = this.events.filter((event: CalendarEvent) => {
          if (!event.eventDate) return false;
          try {
            const eventDate = new Date(event.eventDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          } catch (error) {
            console.error('Error parsing date:', event.eventDate, error);
            return false;
          }
        });
        
        // Format created dates for newly added events
        this.events = this.events.map(event => ({
          ...event,
          formattedCreatedDate: this.formatCreatedDateForDisplay(event.createdDate || '')
        }));
        
        this.sortEventsByDateAscending();
        this.showHolidaysTable = true;
      }
      
      if (errorCount === 0) {
        this.showMessage(`Successfully submitted ${successCount} holiday event(s)!`, 'success');
        this.resetForm();
      } else if (successCount > 0) {
        this.showMessage(`Submitted ${successCount} event(s) successfully, ${errorCount} failed.`, 'error');
        this.resetForm();
      } else {
        this.showMessage('Failed to submit all events. Please try again.', 'error');
      }
    }
  }

  // Sort events by date ascending (closest date first)
  private sortEventsByDateAscending(): void {
    this.events.sort((a: CalendarEvent, b: CalendarEvent) => {
      try {
        const dateA = new Date(a.eventDate).getTime();
        const dateB = new Date(b.eventDate).getTime();
        return dateA - dateB;
      } catch (error) {
        console.error('Error sorting dates:', error);
        return 0;
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.submissionMessage = message;
    this.messageType = type;
    
    setTimeout(() => {
      this.submissionMessage = '';
    }, 5000);
  }

  // Reset form to single row
  resetForm(): void {
    this.formRows = [{
      eventName: '',
      eventDate: this.formatDate(new Date()),
      description: ''
    }];
  }

  // Load all FUTURE events manually
  loadAllEvents(): void {
    if (!this.isAuthorized) {
      this.showMessage('You are not authorized to perform this action', 'error');
      return;
    }

    this.loading = true;
    this.showHolidaysTable = true;
    this.apiService.getAllCalendarEvents().subscribe({
      next: (response: ApiResponse) => {
        this.loading = false;
        if (response.success && response.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          this.events = response.data.filter((event: CalendarEvent) => {
            if (!event.eventDate) return false;
            try {
              const eventDate = new Date(event.eventDate);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            } catch (error) {
              console.error('Error parsing date:', event.eventDate, error);
              return false;
            }
          });
          
          // Format the createdDate for display
          this.events = this.events.map(event => ({
            ...event,
            formattedCreatedDate: this.formatCreatedDateForDisplay(event.createdDate || '')
          }));
          
          this.sortEventsByDateAscending();
        } else {
          console.error('Failed to load holidays:', response.message);
          this.showMessage(response.message || 'Failed to load holidays', 'error');
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading holidays:', error);
        this.showMessage('Error loading holidays', 'error');
      }
    });
  }

  // Delete event
  deleteEvent(id: number): void {
    if (!this.isAuthorized) {
      this.showMessage('You are not authorized to perform this action', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this holiday?')) {
      this.apiService.deleteCalendarEvent(id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.events = this.events.filter(event => event.calenderId !== id);
            this.showMessage('Holiday deleted successfully!', 'success');
            
            if (this.events.length === 0) {
              this.showHolidaysTable = false;
            }
          } else {
            this.showMessage(response.message || 'Failed to delete holiday', 'error');
          }
        },
        error: (error: any) => {
          console.error('Error deleting holiday:', error);
          this.showMessage('Error deleting holiday', 'error');
        }
      });
    }
  }

  // Helper method to format date for display in template
  formatEventDate(dateStr: string): string {
    return this.formatDateForDisplay(dateStr);
  }

  // Navigate to dashboard
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}