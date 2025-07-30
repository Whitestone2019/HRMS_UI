import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

interface Timesheet {
  sno: number;
  employeeId: string;
  members: string;
  effectiveWorkingDays: number;
  present: number;
  absent: number;
  missPunch: number;
}

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.css'],
})
export class TimesheetComponent implements OnInit {
  timesheetData: Timesheet[] = [];
  year: number;
  month: number; // 0-based (0 = January)
  repoteTo: string = '';

  constructor(private apiService: ApiService, private router: Router) {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth(); // 0-based: July = 6
  }

  ngOnInit(): void {
    this.repoteTo = localStorage.getItem('employeeId') || '';
    this.fetchTimesheetData();
  }

  fetchTimesheetData(): void {
    this.apiService.getTimesheetData(this.year, this.month, this.repoteTo).subscribe({
      next: (data) => {
        this.timesheetData = data;
        console.log('Timesheet data loaded:', data);
      },
      error: (error) => {
        console.error('Error fetching timesheet data:', error);
      },
    });
  }

  onRowClick(employee: Timesheet): void {
    console.log('Row clicked for employee:', employee.members);
    this.router.navigate(['/dashboard/timesheet1', employee.employeeId,employee.members], {
      state: {
        employeeId: employee.employeeId,
        employeeName: employee.members,
      },
    });
  }
}