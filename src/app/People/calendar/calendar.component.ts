import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() mode: 'attendance' | 'report' = 'attendance'; // default purpose
  @Input() employeeId: string | null = null;
  @Input() employeeName: string | null = null;

  currentMonth!: string;
  currentYear!: number;
  daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthDates: any[] = [];
  employeeAttendanceData: any[] = [];
  currentDate: Date = new Date();

  constructor() {}

  ngOnInit(): void {
    this.updateCalendar();

    // Only load attendance data when in report mode
    if (this.mode === 'report' && this.employeeId) {
      this.loadEmployeeAttendance(this.employeeId);
    }
  }

  changeMonth(direction: number): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.updateCalendar();

    if (this.mode === 'report' && this.employeeId) {
      this.loadEmployeeAttendance(this.employeeId);
    }
  }

  updateCalendar(): void {
    const month = this.currentDate.getMonth();
    const year = this.currentDate.getFullYear();
    this.currentMonth = this.getMonthName(month);
    this.currentYear = year;
    this.monthDates = this.getMonthDates(month, year);
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  getMonthDates(month: number, year: number): any[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const dates = [];
    const firstDayOfWeek = firstDay.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push({ day: '', isEmpty: true, status: '' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = this.employeeAttendanceData.find(r => r.date === dateStr);
      const status = record ? record.status : '';
      const isSunday = (firstDayOfWeek + day - 1) % 7 === 0;
      dates.push({ day, isEmpty: false, isSunday, status });
    }

    return dates;
  }

  loadEmployeeAttendance(empId: string): void {
    // Replace this mock with your API call
    this.employeeAttendanceData = [
      { date: '2025-10-01', status: 'present' },
      { date: '2025-10-02', status: 'absent' },
      { date: '2025-10-03', status: 'half-day' },
      { date: '2025-10-05', status: 'present' },
    ];
  }

  getStatusClass(date: any): string {
    if (date.isEmpty) return '';
    if (date.isSunday) return 'holiday';
    return date.status;
  }

  onDateClick(date: any): void {
    if (date.isEmpty) return;
    console.log(`Date: ${date.day}, Status: ${date.status}`);
  }
}
