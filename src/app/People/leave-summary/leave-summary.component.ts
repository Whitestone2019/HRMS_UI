import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';


@Component({
  selector: 'app-leave-summary',
  templateUrl: './leave-summary.component.html',
  styleUrls: ['./leave-summary.component.css']
})
export class LeaveSummaryComponent implements OnInit {
  enableApplyLeave = false;
  selectedLeaveType: string = 'upcoming';

  currentYear: number = new Date().getFullYear();
  startDate: string = `${this.currentYear}-01-01`;
  endDate: string = `${this.currentYear}-12-31`;

  leaveTypes = [
    { name: 'casual leave', icon: 'fas fa-umbrella-beach', color: '#4a90e2', available: 12, booked: 0 },
    { name: 'medical leave', icon: 'fas fa-stethoscope', color: '#bd10e0', available: 12, booked: 0 },
    { name: 'earned leave', icon: 'fas fa-stopwatch', color: '#a3d39c', available: 0, booked: 0 },
    { name: 'leavewithoutpay', icon: 'fas fa-sun', color: '#f5a623', available: 0, booked: 0 },
    // { name: 'sabbatical leave', icon: 'fas fa-sync-alt', color: '#f8e71c', available: 12, booked: 0 },
   
  ];

  leaveOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' }
  ];

  upcomingHolidays: any[] = [];

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    const empId = localStorage.getItem('employeeId'); // Fetch empid from localStorage
    if (empId) {
      this.getLeaveCounts(empId); // Fetch the leave counts when the component initializes
    } else {
      console.error('Employee ID not found in localStorage');
    }
    this.fetchUpcomingHolidays(); // Fetch the upcoming holidays
  }

  // Fetch leave counts from the backend API
  getLeaveCounts(empId: string): void {
    this.apiService.getLeaveCounts(empId).subscribe((leaveCounts: any) => {
      // Update the leaveTypes array with the booked counts and adjust the available value
      this.leaveTypes.forEach(leaveType => {
        const leaveTypeKey = leaveType.name.toLowerCase().replace(' ', ''); // Convert 'Sick Leave' to 'sickleave'
        if (leaveCounts[leaveTypeKey] !== undefined) {
          leaveType.booked = leaveCounts[leaveTypeKey]; // Assign booked count to the correct leave type
          leaveType.available = 12 - leaveType.booked; // Update available based on booked
          if(leaveType.name == "earned leave" || leaveType.name == "leavewithoutpay"){
            leaveType.available = 0;
          }
        }
      });
    });
  }

  // Fetch upcoming holidays from the backend API
  fetchUpcomingHolidays(): void {
    this.apiService.getUpcomingHolidays().subscribe((response: any) => {
      console.log(response.data);  // Check the response structure
      this.upcomingHolidays = response.data || [];
    });
  }

  applyLeave() {
    this.router.navigate(['/dashboard/apply-leave'], { queryParams: { type: "", ej: "/dashboard/leave-summary" } });
  }

  navigateToApplyLeave(leaveType: string) {
    this.router.navigate(['/dashboard/apply-leave'], { queryParams: { type: leaveType, ej: "/dashboard/leave-summary" } });
  }
}
