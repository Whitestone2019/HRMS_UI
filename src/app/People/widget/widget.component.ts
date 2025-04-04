import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})
export class WidgetComponent implements OnInit {

  leavePendingCount: number = 0;
  upcomingBirthdays: { name: string, birthday: Date }[] = [];
  totalAttendance: number = 0;

  constructor() { }

  ngOnInit(): void {
    // Mock data for demo purposes
    this.loadLeavePending();
    this.loadUpcomingBirthdays();
    this.loadAttendance();
  }

  // Mock function to get leave pending count
  loadLeavePending() {
    this.leavePendingCount = 5; // Example data: 5 pending leave requests
  }

  // Mock function to load upcoming birthdays
  loadUpcomingBirthdays() {
    this.upcomingBirthdays = [
      // { name: 'John Doe', birthday: new Date('2024-11-08') },
      // { name: 'Jane Smith', birthday: new Date('2024-11-12') },
    ];
  }

  // Mock function to load attendance
  loadAttendance() {
   // this.totalAttendance = 25; // Example data: 25 employees are present today
  }

}
