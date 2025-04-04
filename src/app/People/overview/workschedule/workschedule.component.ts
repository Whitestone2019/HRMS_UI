import { Component } from '@angular/core';

@Component({
  selector: 'app-workschedule',
  templateUrl: './workschedule.component.html',
  styleUrl: './workschedule.component.css'
})
export class WorkscheduleComponent {
  workSchedule = {
    dateRange: '03-Nov-2024 - 09-Nov-2024',
    time: 'General\n9:00 AM - 6:00 PM',
    calendar: [
      { day: 'Sun', date: '03' },
      { day: 'Mon', date: '04' },
      { day: 'Tue', date: '05' },
      { day: 'Wed', date: '06' },
      { day: 'Thu', date: '07' },
      { day: 'Fri', date: '08' },
      { day: 'Sat', date: '09' },
    ],
  };
}
