import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { ApiService } from '../../api.service'; // Adjust path as needed
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

// Interface for FullCalendar event to improve typing
interface CustomEvent extends Omit<EventApi, 'backgroundColor' | 'borderColor' | 'textColor'> {
  startStr: string;
  backgroundColor?: string; // Align with EventApi's optional nature
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    status?: string;
    dayOfWeek?: string;
  };
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

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin,interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    eventDisplay: 'none',
    dayCellDidMount: this.handleDayCellDidMount.bind(this),

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    initialDate: new Date(),
    firstDay: 1,
    timeZone: 'UTC', // Use UTC to avoid local timezone shifts
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
       private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const today = new Date();
    let targetYear = today.getFullYear();
    let targetMonth = today.getMonth();

    if (targetMonth === 0) {
      targetMonth = 11;
      targetYear--;
    } else {
      targetMonth--;
    }

    const monthForApi = targetMonth + 1;

    console.log(`[ngOnInit] Calculating target: Year=${targetYear}, Month(1-indexed)=${monthForApi}`);

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      console.log('[ngOnInit] Data from router state:', navigation.extras.state);
      this.processCalendarData(
        navigation.extras.state['employeeId'],
        navigation.extras.state['employeeName'],
        navigation.extras.state['events'],
        targetYear,
        monthForApi
      );
//alert("EMPNAME::::"+this.employeeName);
    } else {
      this.route.paramMap.subscribe((params) => {
        const empId = params.get('employeeId');
        const empname = params.get('employeeName');
       // alert("EMPNAME::::"+empname);
         this.employeeName = empname ?? ''; // Assign for HTML
        if (empId) {
          this.employeeId = empId;
          console.log(`[ngOnInit] Fetching attendance for employeeId: ${this.employeeId}, Year: ${targetYear}, Month: ${monthForApi}`);
          this.apiService.getAttendanceEvents(this.employeeId, targetYear, monthForApi).subscribe({
            next: (attendanceEvents: AttendanceEvent[]) => {
              console.log('[ngOnInit] API Response (raw):', attendanceEvents);
              this.processCalendarData(empId, 'Unknown Employee', attendanceEvents, targetYear, monthForApi);
            },
            error: (err) => {
              console.error('[ngOnInit] API error fetching attendance events:', err);
              this.isLoading = false;
              this.employeeName = 'Error Loading Data';
            },
          });
        } else {
          console.warn('[ngOnInit] No employeeId found in route parameters or navigation state.');
          this.isLoading = false;
          this.employeeName = 'Employee Not Found';
        }
      });
    }
  }

  private processCalendarData(
    employeeId: string,
    employeeName: string,
    apiEvents: AttendanceEvent[],
    year: number,
    month: number
  ): void {
    this.employeeId = employeeId || '';
   // this.employeeName = employeeName || 'Unknown Employee';
 // this.employeeName = empname ?? ''; // Assign for HTML
    const formattedApiEvents = this.formatApiEvents(apiEvents);
    const finalEvents = this.prepareFinalEvents(formattedApiEvents);

    console.log(`[processCalendarData] Target Month for FullCalendar: Year=${year}, Month(0-indexed)=${month - 1}`);
    console.log('[processCalendarData] Final Events for FullCalendar:', finalEvents);

    this.calendarOptions = {
      ...this.calendarOptions,
      initialDate: new Date(Date.UTC(year, month - 1, 1)),
      events: finalEvents,
    dateClick: this.handleDateClick.bind(this),
    };

    this.isLoading = false;
  }

  private formatApiEvents(apiEvents: AttendanceEvent[]): any[] {
    return apiEvents.map((event) => {
      // Parse date and ensure YYYY-MM-DD format
      const date = new Date(event.date);
      const formattedDate = isNaN(date.getTime()) ? event.date.split('T')[0] : date.toISOString().split('T')[0];
      const status = event.extendedProps?.status || '';
      const backgroundColor = this.isValidColor(event.backgroundColor) ? event.backgroundColor : this.getStatusColor(status);
      console.log(`[formatApiEvents] Date: ${formattedDate}, Status: ${status}, BackgroundColor: ${backgroundColor}`);
      return {
        date: formattedDate,
        backgroundColor,
        status,
        dayOfWeek: event.extendedProps?.dayOfWeek || '',
        title: event.title,
      };
    });
  }

  private prepareFinalEvents(events: any[]): any[] {
    return events.map((event) => {
      const backgroundColor = this.isValidColor(event.backgroundColor) ? event.backgroundColor : this.getStatusColor(event.status);
      const textColor = this.getContrastTextColor(backgroundColor);
      const result = {
        title: event.status,
        start: event.date,
        allDay: true,
        backgroundColor,
        borderColor: backgroundColor,
        textColor,
        extendedProps: {
          status: event.status,
          dayOfWeek: event.dayOfWeek,
        },
      };
      console.log(`[prepareFinalEvents] Event Date: ${event.date}, Status: ${event.status}, BackgroundColor: ${backgroundColor}, TextColor: ${textColor}`);
      return result;
    });
  }

  private isValidColor(color: string | undefined): boolean {
    if (!color) return false;
    const testElement = document.createElement('div');
    testElement.style.backgroundColor = color;
    return testElement.style.backgroundColor !== '';
  }

  private getStatusColor(status: string): string {
    const normalizedStatus = status?.toLowerCase()?.trim();
    switch (normalizedStatus) {
      case 'present':
        return '#28a745'; // Green
      case 'absent':
        return '#dc3545'; // Red
      case 'week off':
        return '#ffc107'; // Yellow
      default:
        console.warn(`[getStatusColor] Unknown status: "${status}", using default color`);
        return '#cccccc'; // Gray
    }
  }

  private getContrastTextColor(backgroundColor: string): string {
    const color = backgroundColor.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  }

  handleDayCellDidMount(args: any): void {
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

    // Find event by normalizing event start date
    const event = args.view.calendar.getEvents().find((ev: CustomEvent) => {
      if (!ev.start) return false; // Handle null start date
      const eventDate = new Date(ev.start);
      eventDate.setUTCHours(0, 0, 0, 0);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      return eventDateStr === dateStr;
    }) as CustomEvent | undefined;

    const frame = dayCell.querySelector('.fc-daygrid-day-frame') as HTMLElement;
    const inner = dayCell.querySelector('.fc-scrollgrid-sync-inner') as HTMLElement;
    const dayNumber = dayCell.querySelector('.fc-daygrid-day-number') as HTMLElement;

    if (event) {
      const bgColor = event['backgroundColor'] || this.getStatusColor(event.extendedProps?.status || '');
      const textColor = this.getContrastTextColor(bgColor);

      dayCell.style.backgroundColor = bgColor;
      dayCell.style.color = textColor;
      dayCell.style.borderRadius = '6px';
      dayCell.dataset['bgColor'] = bgColor; // Use bracket notation for dataset

      if (frame) frame.style.backgroundColor = bgColor;
      if (inner) inner.style.backgroundColor = bgColor;
      if (dayNumber) dayNumber.style.color = textColor;

      const statusText = event.extendedProps?.status || 'N/A';
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

      // Dynamic date range for logging
      const calendarDate = args.view.calendar.getDate(); // Get current calendar date
      const currentMonth = calendarDate.getUTCMonth();
      const currentYear = calendarDate.getUTCFullYear();

      // Calculate the last 5 days of the previous month
      const prevMonthLastDay = new Date(Date.UTC(currentYear, currentMonth, 0)); // Day 0 of current month is last day of previous
      const datesToLog: string[] = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(prevMonthLastDay);
        date.setUTCDate(prevMonthLastDay.getUTCDate() - i);
        datesToLog.push(date.toISOString().split('T')[0]);
      }

      // Calculate the first 5 days of the current month
      for (let i = 1; i <= 5; i++) {
        const date = new Date(Date.UTC(currentYear, currentMonth, i));
        datesToLog.push(date.toISOString().split('T')[0]);
      }
      
      // Check if the current cell's date is within the dynamic logging range
      if (datesToLog.includes(dateStr)) {
        console.log(`[handleDayCellDidMount] Rendered Cell Date: ${dateStr}`);
        console.log(`                       Original Cell Date: ${cellDate.toISOString().split('T')[0]}`);
        console.log(`                       Found Event Start: ${event.startStr || 'No event'}`);
        console.log(`                       Event Date (normalized): ${event.start ? new Date(event.start).toISOString().split('T')[0] : 'N/A'}`);
        console.log(`                       Rendered Status: ${statusText}`);
        console.log(`                       Rendered DayOfWeek: ${dayOfWeekText}`);
        console.log(`                       Background Color: ${bgColor}`);
        console.log(`                       Text Color: ${textColor}`);
      }
    } else {
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

      // Dynamic date range for logging
      const calendarDate = args.view.calendar.getDate(); // Get current calendar date
      const currentMonth = calendarDate.getUTCMonth();
      const currentYear = calendarDate.getUTCFullYear();

      // Calculate the last 5 days of the previous month
      const prevMonthLastDay = new Date(Date.UTC(currentYear, currentMonth, 0)); // Day 0 of current month is last day of previous
      const datesToLog: string[] = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(prevMonthLastDay);
        date.setUTCDate(prevMonthLastDay.getUTCDate() - i);
        datesToLog.push(date.toISOString().split('T')[0]);
      }

      // Calculate the first 5 days of the current month
      for (let i = 1; i <= 5; i++) {
        const date = new Date(Date.UTC(currentYear, currentMonth, i));
        datesToLog.push(date.toISOString().split('T')[0]);
      }

      if (datesToLog.includes(dateStr)) {
        console.log(`[handleDayCellDidMount] Rendered Cell Date: ${dateStr}, No event found`);
      }
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

    const event = arg.view.calendar.getEvents().find((ev: any) => {
      if (!ev.start) return false;
      const evDate = new Date(ev.start);
      evDate.setUTCHours(0, 0, 0, 0);
      return evDate.toISOString().split('T')[0] === clickedDateStr;
    });

    const currentStatus = event?.extendedProps?.status || '';
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
        // TODO: Update event or trigger API call to save changes
      }
    });

  } else {
    alert('You can only edit attendance from the 27th of the previous month up to yesterday’s date.');
  }
}

goBack(): void {
    this.router.navigate(['/dashboard/timesheet']);
  }
}
