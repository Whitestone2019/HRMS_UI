import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-balance',
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.css']
})
export class LeaveBalanceComponent {
  // Array of leave types and their details
  leaves = [
    {
      title: 'Casual Leave',
      available: 12,
      booked: 0,
      icon: 'fas fa-sun',
      iconColor: '#00bcd4',
      backgroundColor: '#e0f7fa',
      hover: false
    },
    {
      title: 'Earned Leave',
      available: 12,
      booked: 0,
      icon: 'fas fa-clock',
      iconColor: '#8bc34a',
      backgroundColor: '#f0f4c3',
      hover: false
    },
    {
      title: 'Leave Without Pay',
      available: 0,
      booked: 0,
      icon: 'fas fa-sun',
      iconColor: '#f44336',
      backgroundColor: '#ffebee',
      hover: false
    },
    {
      title: 'Paternity Leave',
      available: 0,
      booked: 0,
      icon: 'fas fa-baby',
      iconColor: '#ff9800',
      backgroundColor: '#ffecb3',
      hover: false
    },
    {
      title: 'Sabbatical Leave',
      available: 0,
      booked: 0,
      icon: 'fas fa-sync-alt',
      iconColor: '#ffeb3b',
      backgroundColor: '#fff9c4',
      hover: false
    },
    {
      title: 'Sick Leave',
      available: 12,
      booked: 0,
      icon: 'fas fa-stethoscope',
      iconColor: '#9c27b0',
      backgroundColor: '#e1bee7',
      hover: false
    }
  ];
  constructor(private router: Router) {}

  // Method to redirect to the Apply Leave page
  applyLeave() {
    this.router.navigate(['/dashboard/apply-leave']);
  }
}