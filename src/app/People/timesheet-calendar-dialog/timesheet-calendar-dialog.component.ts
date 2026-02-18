import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { ApiService } from '../../api.service';
import { EditAttendanceDialogComponent } from '../edit-attendance-dialog/edit-attendance-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import interactionPlugin from '@fullcalendar/interaction';

// Interface for attendance events from the API
interface AttendanceEvent {
  date: string;
  backgroundColor?: string;
  extendedProps?: {
    dayOfWeek?: string;
    status?: string;
  };
  title?: string;
}

@Component({
  selector: 'app-timesheet-calendar-dialog',
  templateUrl: './timesheet-calendar-dialog.component.html',
  styleUrls: ['./timesheet-calendar-dialog.component.css'],
})
export class TimesheetCalendarDialogComponent implements OnInit {
  employeeId: string = '';
  employeeName: string = '';
  isLoading: boolean = true;
  
  // Store ALL events for the entire year
  private allYearEvents: AttendanceEvent[] = [];
  private currentYear!: number;
  private currentMonth!: number;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    eventDisplay: 'none',
    dayCellDidMount: this.handleDayCellDidMount.bind(this),
    
    // Add datesSet handler for month navigation
    datesSet: this.handleDatesSet.bind(this),
    
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    initialDate: new Date(),
    firstDay: 1,
    timeZone: 'UTC',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1; // Current month (1-12)
    
    console.log(`[ngOnInit] Initializing with current date: Year=${this.currentYear}, Month=${this.currentMonth}`);

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      console.log('[ngOnInit] Data from router state:', navigation.extras.state);
      this.employeeId = navigation.extras.state['employeeId'];
      this.employeeName = navigation.extras.state['employeeName'];
      
      // If events are passed in state, use them
      if (navigation.extras.state['events']) {
        this.allYearEvents = navigation.extras.state['events'];
        this.initializeCalendarWithYearData(this.currentMonth);
      } else {
        // Fetch data for current year
        this.fetchYearData(this.currentYear);
      }
    } else {
      this.route.paramMap.subscribe((params) => {
        const empId = params.get('employeeId');
        const empname = params.get('employeeName');
        this.employeeName = empname ?? '';
        
        if (empId) {
          this.employeeId = empId;
          console.log(`[ngOnInit] Fetching year data for employeeId: ${this.employeeId}, Year: ${this.currentYear}`);
          
          // Fetch data for the current year
          this.fetchYearData(this.currentYear);
        } else {
          console.warn('[ngOnInit] No employeeId found');
          this.isLoading = false;
          this.employeeName = 'Employee Not Found';
        }
      });
    }
  }

  // Handler for when calendar changes view (month navigation)
  private handleDatesSet(arg: any): void {
    if (!this.employeeId) {
      return;
    }
    
    const view = arg.view;
    const currentDate = view.currentStart;
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth() + 1; // Convert to 1-12 format
    
    console.log(`[handleDatesSet] Calendar changed to: Year=${year}, Month=${month}`);
    
    // Store current month
    this.currentMonth = month;
    
    // If we've navigated to a different year, fetch data for that year
    if (year !== this.currentYear) {
      this.currentYear = year;
      this.fetchYearData(year);
    } else {
      // Same year, just update the calendar display
      this.updateCalendarForMonth(month);
    }
  }

  // Fetch entire year's data
  private fetchYearData(year: number): void {
    this.isLoading = true;
    
    // Always fetch data for January of the target year
    // Your API returns entire year's data regardless of the month parameter
    console.log(`[fetchYearData] Fetching year ${year} data for employee: ${this.employeeId}`);
    
    this.apiService.getAttendanceEvents(this.employeeId, year, 1).subscribe({
      next: (attendanceEvents: AttendanceEvent[]) => {
        console.log(`[fetchYearData] Received ${attendanceEvents?.length || 0} events for year ${year}`);
        
        if (attendanceEvents && attendanceEvents.length > 0) {
          // Store all events for the year
          this.allYearEvents = attendanceEvents;
          
          // Initialize calendar with current month's data
          this.initializeCalendarWithYearData(this.currentMonth);
        } else {
          console.warn('[fetchYearData] No events received from API');
          this.allYearEvents = [];
          this.isLoading = false;
          // Still initialize calendar with empty data
          this.initializeCalendarWithYearData(this.currentMonth);
        }
      },
      error: (err) => {
        console.error('[fetchYearData] API error:', err);
        this.isLoading = false;
        this.employeeName = 'Error Loading Data';
        // Initialize calendar with empty data
        this.initializeCalendarWithYearData(this.currentMonth);
      }
    });
  }

  // Initialize calendar with year data
  private initializeCalendarWithYearData(currentMonth: number): void {
    // Filter events for the current month and previous months up to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const eventsForDisplay = this.allYearEvents.filter(event => {
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth() + 1;
      
      // If viewing past years, show entire year's data
      if (this.currentYear < today.getFullYear()) {
        return eventYear === this.currentYear;
      }
      // If viewing current year
      else if (this.currentYear === today.getFullYear()) {
        // If viewing past months, show entire month
        if (currentMonth < today.getMonth() + 1) {
          return eventYear === this.currentYear && eventMonth === currentMonth;
        }
        // If viewing current month, show up to today
        else if (currentMonth === today.getMonth() + 1) {
          return eventYear === this.currentYear && 
                 eventMonth === currentMonth &&
                 event.date <= todayStr;
        }
        // If viewing future months, show nothing (no data yet)
        else {
          return false;
        }
      }
      // If viewing future years, show nothing
      else {
        return false;
      }
    });
    
    // Format events for FullCalendar
    const formattedEvents = this.formatEventsForCalendar(eventsForDisplay);
    
    console.log(`[initializeCalendarWithYearData] Setting ${formattedEvents.length} events for ${this.currentYear}-${currentMonth}`);
    
    this.calendarOptions = {
      ...this.calendarOptions,
      initialDate: new Date(Date.UTC(this.currentYear, currentMonth - 1, 1)),
      events: formattedEvents,
      dateClick: this.handleDateClick.bind(this),
    };

    this.isLoading = false;
  }

  // Update calendar for specific month (when navigating between months)
  private updateCalendarForMonth(month: number): void {
    if (this.allYearEvents.length === 0) return;
    
    // Filter events for the selected month based on year
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const eventsForMonth = this.allYearEvents.filter(event => {
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth() + 1;
      
      // If viewing past years, show entire year's data
      if (this.currentYear < today.getFullYear()) {
        return eventYear === this.currentYear;
      }
      // If viewing current year
      else if (this.currentYear === today.getFullYear()) {
        // If viewing past months, show entire month
        if (month < today.getMonth() + 1) {
          return eventYear === this.currentYear && eventMonth === month;
        }
        // If viewing current month, show up to today
        else if (month === today.getMonth() + 1) {
          return eventYear === this.currentYear && 
                 eventMonth === month &&
                 event.date <= todayStr;
        }
        // If viewing future months, show nothing (no data yet)
        else {
          return false;
        }
      }
      // If viewing future years, show nothing
      else {
        return false;
      }
    });
    
    // Format events for FullCalendar
    const formattedEvents = this.formatEventsForCalendar(eventsForMonth);
    
    console.log(`[updateCalendarForMonth] Showing ${formattedEvents.length} events for ${this.currentYear}-${month}`);
    
    // Update calendar events
    this.calendarOptions.events = formattedEvents;
    
    // Force calendar to re-render
    setTimeout(() => {
      // This will trigger the calendar to update
      this.calendarOptions = { ...this.calendarOptions };
    }, 0);
  }

  // Format API events for FullCalendar
  private formatEventsForCalendar(apiEvents: AttendanceEvent[]): any[] {
    return apiEvents.map((event) => {
      const backgroundColor = event.backgroundColor || '#ffffff';
      const textColor = this.getContrastTextColor(backgroundColor);
      
      return {
        title: event.title || event.extendedProps?.status || 'N/A',
        start: event.date,
        allDay: true,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: textColor,
        extendedProps: {
          ...event.extendedProps,
          date: event.date,
          backgroundColor: backgroundColor
        }
      };
    });
  }

  private getContrastTextColor(backgroundColor: string): string {
    if (!backgroundColor || backgroundColor === '#ffffff') return 'black';
    
    try {
      const color = backgroundColor.replace('#', '');
      if (color.length === 3) {
        const r = parseInt(color.charAt(0) + color.charAt(0), 16);
        const g = parseInt(color.charAt(1) + color.charAt(1), 16);
        const b = parseInt(color.charAt(2) + color.charAt(2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? 'black' : 'white';
      } else if (color.length === 6) {
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? 'black' : 'white';
      }
    } catch (e) {
      console.error('Error calculating contrast color:', e);
    }
    
    return 'black';
  }

  handleDayCellDidMount(args: any): void {
    // Use the allYearEvents array instead of calendar events
    if (this.allYearEvents.length === 0) return;
    
    // Normalize cell date to UTC YYYY-MM-DD
    const cellDate = new Date(args.date);
    cellDate.setUTCHours(0, 0, 0, 0);
    let dateStr = cellDate.toISOString().split('T')[0];

    // Fallback adjustment for IST timezone (Asia/Kolkata)
    const isIST = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata';
    if (isIST) {
      const adjustedDate = new Date(cellDate.getTime() - 5.5 * 60 * 60 * 1000);
      dateStr = adjustedDate.toISOString().split('T')[0];
    }

    const dayCell = args.el.closest('.fc-daygrid-day') as HTMLElement;
    if (!dayCell) return;

    // Find event from allYearEvents
    const event = this.allYearEvents.find((ev: AttendanceEvent) => {
      if (!ev.date) return false;
      
      const eventDate = new Date(ev.date);
      eventDate.setUTCHours(0, 0, 0, 0);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      
      return eventDateStr === dateStr;
    });

    const frame = dayCell.querySelector('.fc-daygrid-day-frame') as HTMLElement;
    const inner = dayCell.querySelector('.fc-scrollgrid-sync-inner') as HTMLElement;
    const dayNumber = dayCell.querySelector('.fc-daygrid-day-number') as HTMLElement;

    if (event) {
      const bgColor = event.backgroundColor || '#ffffff';
      const textColor = this.getContrastTextColor(bgColor);

      dayCell.style.backgroundColor = bgColor;
      dayCell.style.color = textColor;
      dayCell.style.borderRadius = '6px';
      dayCell.dataset['bgColor'] = bgColor;

      if (frame) frame.style.backgroundColor = bgColor;
      if (inner) inner.style.backgroundColor = bgColor;
      if (dayNumber) dayNumber.style.color = textColor;

      const statusText = event.extendedProps?.status || event.title || 'N/A';
      const dayOfWeekText = event.extendedProps?.dayOfWeek || '';

      const existingStatusDiv = dayCell.querySelector('.custom-status-label');
      const existingDayOfWeekDiv = dayCell.querySelector('.custom-dayofweek-label');
      existingStatusDiv?.remove();
      existingDayOfWeekDiv?.remove();

      const statusDiv = document.createElement('div');
      statusDiv.classList.add('custom-status-label');
      statusDiv.textContent = statusText;
      statusDiv.style.color = textColor;
      statusDiv.style.fontWeight = 'bold';
      statusDiv.style.fontSize = '0.8em';
      statusDiv.style.textAlign = 'center';
      statusDiv.style.marginTop = '2px';

      const dayOfWeekDiv = document.createElement('div');
      dayOfWeekDiv.classList.add('custom-dayofweek-label');
      dayOfWeekDiv.textContent = dayOfWeekText;
      dayOfWeekDiv.style.color = textColor;
      dayOfWeekDiv.style.fontSize = '0.7em';
      dayOfWeekDiv.style.textAlign = 'center';
      dayOfWeekDiv.style.opacity = '0.8';

      if (frame) {
        frame.appendChild(statusDiv);
        frame.appendChild(dayOfWeekDiv);
      }
    } else {
      // Reset styling if no event
      dayCell.style.backgroundColor = '';
      dayCell.style.color = '';
      dayCell.style.borderRadius = '';
      dayCell.dataset['bgColor'] = '';

      if (frame) frame.style.backgroundColor = '';
      if (inner) inner.style.backgroundColor = '';
      if (dayNumber) dayNumber.style.color = '';

      const existingStatusDiv = dayCell.querySelector('.custom-status-label');
      const existingDayOfWeekDiv = dayCell.querySelector('.custom-dayofweek-label');
      existingStatusDiv?.remove();
      existingDayOfWeekDiv?.remove();
    }
  }

  handleDateClick(arg: any): void {
    const clickedDate = new Date(arg.dateStr);
    clickedDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 📅 Payroll editable range: 27th of previous month → Yesterday of current month
    const firstEditableDate = new Date(today.getFullYear(), today.getMonth() - 1, 27);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    // ✅ Allow edit only if clicked date is within this range
    if (clickedDate >= firstEditableDate && clickedDate <= yesterday) {
      const clickedDateStr = clickedDate.toISOString().split('T')[0];

      // Find event from allYearEvents
      const event = this.allYearEvents.find((ev: AttendanceEvent) => {
        if (!ev.date) return false;
        const evDate = new Date(ev.date);
        evDate.setUTCHours(0, 0, 0, 0);
        return evDate.toISOString().split('T')[0] === clickedDateStr;
      });

      const currentStatus = event?.extendedProps?.status || event?.title || '';
      const remarks = '';

      const dialogRef = this.dialog.open(EditAttendanceDialogComponent, {
        width: '400px',
        data: {
          date: clickedDate,
          currentStatus,
          remarks,
          employeeId: this.employeeId,
          employeeName: this.employeeName
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.value) {
          console.log('[Dialog Result]', result.value);
          // Refresh data after editing
          this.fetchYearData(this.currentYear);
        }
      });

    } else {
      alert('You can only edit attendance from the 27th of the previous month up to yesterday\'s date.');
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/timesheet']);
  }
}