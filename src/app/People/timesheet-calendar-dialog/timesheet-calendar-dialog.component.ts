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
    [key: string]: any;
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
  
  // Store ALL events for multiple years
  private allEvents: AttendanceEvent[] = [];
  private currentYear!: number;
  private currentMonth!: number;
  private today: Date = new Date();
  private todayStr: string;
  private yesterdayStr: string;
  private eventsMap: Map<string, AttendanceEvent[]> = new Map(); // Map of year -> events
  private yearsLoaded: Set<number> = new Set(); // Track which years are loaded
  private yearsToLoad: number[] = [2024, 2025, 2026]; // Years to load

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
    height: 'auto',
    contentHeight: 'auto',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {
    this.today.setUTCHours(0, 0, 0, 0);
    this.todayStr = this.today.toISOString().split('T')[0];
    
    // Calculate yesterday
    const yesterday = new Date(this.today);
    yesterday.setDate(this.today.getDate() - 1);
    this.yesterdayStr = yesterday.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1; // Current month (1-12)
    
    console.log(`[ngOnInit] Initializing with current date: Year=${this.currentYear}, Month=${this.currentMonth}`);
    console.log(`[ngOnInit] Today's date: ${this.todayStr}`);
    console.log(`[ngOnInit] Yesterday's date: ${this.yesterdayStr}`);
    console.log(`[ngOnInit] Will load years: ${this.yearsToLoad.join(', ')}`);

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      console.log('[ngOnInit] Data from router state:', navigation.extras.state);
      this.employeeId = navigation.extras.state['employeeId'];
      this.employeeName = navigation.extras.state['employeeName'];
      
      // If events are passed in state, use them
      if (navigation.extras.state['events']) {
        this.allEvents = navigation.extras.state['events'];
        this.organizeEventsByYear();
        this.updateCalendarForMonth(this.currentMonth);
        this.isLoading = false;
      } else {
        // Fetch data for multiple years
        this.fetchMultipleYearsData();
      }
    } else {
      this.route.paramMap.subscribe((params) => {
        const empId = params.get('employeeId');
        const empname = params.get('employeeName');
        this.employeeName = empname ?? '';
        
        if (empId) {
          this.employeeId = empId;
          console.log(`[ngOnInit] Fetching multiple years data for employeeId: ${this.employeeId}`);
          
          // Fetch data for multiple years
          this.fetchMultipleYearsData();
        } else {
          console.warn('[ngOnInit] No employeeId found');
          this.isLoading = false;
          this.employeeName = 'Employee Not Found';
        }
      });
    }
  }

  // Organize events by year for quick access
  private organizeEventsByYear(): void {
    this.eventsMap.clear();
    
    this.allEvents.forEach(event => {
      if (event.date) {
        const year = new Date(event.date).getFullYear();
        if (!this.eventsMap.has(year.toString())) {
          this.eventsMap.set(year.toString(), []);
        }
        this.eventsMap.get(year.toString())?.push(event);
      }
    });
    
    console.log('[organizeEventsByYear] Events organized by year:', 
      Array.from(this.eventsMap.keys()).map(year => `${year}: ${this.eventsMap.get(year)?.length} events`));
  }

  // Fetch multiple years of data at once
  private fetchMultipleYearsData(): void {
    this.isLoading = true;
    this.allEvents = [];
    let completedRequests = 0;
    
    // Load each year
    this.yearsToLoad.forEach(year => {
      console.log(`[fetchMultipleYearsData] Fetching year ${year} data...`);
      
      this.apiService.getAttendanceEvents(this.employeeId, year, 1).subscribe({
        next: (attendanceEvents: AttendanceEvent[]) => {
          console.log(`[fetchMultipleYearsData] Received ${attendanceEvents?.length || 0} events for year ${year}`);
          
          if (attendanceEvents && attendanceEvents.length > 0) {
            this.allEvents = [...this.allEvents, ...attendanceEvents];
          }
          
          // Mark this year as loaded
          this.yearsLoaded.add(year);
          
          completedRequests++;
          
          // When all years are loaded
          if (completedRequests === this.yearsToLoad.length) {
            // Sort all events by date
            this.allEvents.sort((a, b) => a.date.localeCompare(b.date));
            
            console.log(`[fetchMultipleYearsData] Total events loaded: ${this.allEvents.length}`);
            
            this.organizeEventsByYear();
            this.updateCalendarForMonth(this.currentMonth);
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error(`[fetchMultipleYearsData] Error fetching year ${year}:`, err);
          
          // Mark year as loaded even on error
          this.yearsLoaded.add(year);
          
          completedRequests++;
          
          // Still proceed even if one year fails
          if (completedRequests === this.yearsToLoad.length) {
            this.organizeEventsByYear();
            this.updateCalendarForMonth(this.currentMonth);
            this.isLoading = false;
          }
        }
      });
    });
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
    
    // Store current month and year
    const previousYear = this.currentYear;
    this.currentYear = year;
    this.currentMonth = month;
    
    // If we've navigated to a different year and it's not in our initial load, fetch it
    if (year !== previousYear && !this.yearsLoaded.has(year) && !this.yearsToLoad.includes(year)) {
      console.log(`[handleDatesSet] Year ${year} not loaded yet, fetching data...`);
      this.fetchYearData(year);
    } else {
      // Same year or year already loaded, just update the calendar display
      this.updateCalendarForMonth(month);
    }
  }

  // Fetch single year data (for years not in initial load)
  private fetchYearData(year: number): void {
    this.isLoading = true;
    
    console.log(`[fetchYearData] Fetching year ${year} data for employee: ${this.employeeId}`);
    
    this.apiService.getAttendanceEvents(this.employeeId, year, 1).subscribe({
      next: (attendanceEvents: AttendanceEvent[]) => {
        console.log(`[fetchYearData] Received ${attendanceEvents?.length || 0} events for year ${year}`);
        
        // Filter out any existing events from this year to avoid duplicates
        this.allEvents = this.allEvents.filter(event => {
          const eventYear = new Date(event.date).getFullYear();
          return eventYear !== year;
        });
        
        if (attendanceEvents && attendanceEvents.length > 0) {
          // Add new events for this year
          this.allEvents = [...this.allEvents, ...attendanceEvents];
          
          // Sort all events by date
          this.allEvents.sort((a, b) => a.date.localeCompare(b.date));
        }
        
        // Mark this year as loaded
        this.yearsLoaded.add(year);
        
        // Reorganize events by year
        this.organizeEventsByYear();
        
        // Update calendar with current month's data
        this.updateCalendarForMonth(this.currentMonth);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(`[fetchYearData] API error for year ${year}:`, err);
        this.isLoading = false;
        this.employeeName = 'Error Loading Data';
        
        // Mark year as loaded even on error
        this.yearsLoaded.add(year);
        
        // Still try to update calendar with existing data
        this.updateCalendarForMonth(this.currentMonth);
      }
    });
  }

  // Update calendar for specific month (when navigating between months)
  private updateCalendarForMonth(month: number): void {
    // Get events for the current year from the map
    const yearEvents = this.eventsMap.get(this.currentYear.toString()) || [];
    
    // Filter events for the selected month - SHOW ALL DATES with data
    const eventsForMonth = yearEvents.filter(event => {
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth() + 1;
      const eventYear = eventDate.getFullYear();
      
      // Only show events for the current year and month
      return (eventYear === this.currentYear && eventMonth === month);
    });
    
    // Format events for FullCalendar
    const formattedEvents = this.formatEventsForCalendar(eventsForMonth);
    
    console.log(`[updateCalendarForMonth] Showing ${formattedEvents.length} events for ${this.currentYear}-${month}`);
    
    // Update calendar events
    this.calendarOptions = {
      ...this.calendarOptions,
      events: formattedEvents,
      initialDate: new Date(Date.UTC(this.currentYear, month - 1, 1)),
      dateClick: this.handleDateClick.bind(this),
    };
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
    if (this.allEvents.length === 0) return;
    
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

    // Find event from allEvents
    const event = this.allEvents.find((ev: AttendanceEvent) => {
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
    const clickedDateStr = clickedDate.toISOString().split('T')[0];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate the date 7 days ago from today
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    console.log('[handleDateClick] Date check:', {
      clickedDate: clickedDateStr,
      sevenDaysAgo: sevenDaysAgoStr,
      today: todayStr,
      isWithinEditableRange: clickedDateStr >= sevenDaysAgoStr && clickedDateStr <= todayStr
    });

    // ✅ Allow edit if clicked date is within the last 7 days (including today)
    if (clickedDateStr >= sevenDaysAgoStr && clickedDateStr <= todayStr) {

      const event = this.allEvents.find((ev: AttendanceEvent) => {
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
          // Refresh data after editing - reload all years to ensure consistency
          this.fetchMultipleYearsData();
        }
      });

    } else if (clickedDateStr < sevenDaysAgoStr) {
      alert('You cannot edit dates older than 7 days.');
    } else if (clickedDateStr > todayStr) {
      alert('You cannot edit future dates.');
    }
}

  goBack(): void {
    this.router.navigate(['/dashboard/timesheet']);
  }
}