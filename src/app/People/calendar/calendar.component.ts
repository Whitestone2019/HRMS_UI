import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentMonth!: string;
  currentYear!: number;
  daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthDates: any[] = [];

  // Current date to track the selected month and year
  currentDate: Date = new Date();

  constructor() {}

  ngOnInit(): void {
    this.updateCalendar();
  }

  // Method to update the calendar when navigating to the next or previous month
  changeMonth(direction: number): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.updateCalendar();
  }

  // Method to update the month and year display, and the calendar days
  updateCalendar(): void {
    const month = this.currentDate.getMonth();
    const year = this.currentDate.getFullYear();

    // Update current month and year
    this.currentMonth = this.getMonthName(month);
    this.currentYear = year;

    // Generate the dates for the calendar grid
    this.monthDates = this.getMonthDates(month, year);
  }

  // Method to get the name of the month based on the month number
  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  // Method to generate the days of the month to display in the calendar
  getMonthDates(month: number, year: number): any[] {
    // Get the first day of the month and the number of days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create an array to hold the dates
    const dates = [];
    const firstDayOfWeek = firstDay.getDay(); // Get the day of the week for the first day

    // Add empty days for the previous month's overflow
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push({ day: '', isEmpty: true, status: '' });
    }

    // Add the actual days for the current month with status
    for (let day = 1; day <= daysInMonth; day++) {
      const isSunday = (firstDayOfWeek + day - 1) % 7 === 0; // Check if the day is Sunday
      const status = this.getStatusForDay(day);
      dates.push({ day, isEmpty: false, isSunday, status });
    }

    return dates;
  }

  // Logic to determine the status of each day
  getStatusForDay(day: number): string {
    // You can modify this logic to set status dynamically
    // For now, using some placeholder logic for demo purposes
    if (day % 3 === 0) return 'present';
    if (day % 3 === 1) return 'half-day';
    return 'absent';
  }

  // Method to get the status class based on the date
  getStatusClass(date: any): string {
    if (date.isEmpty) return '';
    if (date.isSunday) return 'holiday'; // Sundays get a 'holiday' class
    return date.status; // Use the status (present, half-day, absent)
  }

  // Method when a date is clicked
  onDateClick(date: any): void {
    if (date.isEmpty) return;
    // Logic for handling date click
    console.log(`Selected Date: ${date.day}, Status: ${date.status}`);
  }
}
