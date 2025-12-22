// header.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';
import { ApiService } from '../../api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuVisible = false;
  userRole: string = '';
  isAdmin: boolean = false;
  isTrainee: boolean = false;
  userLocation: string = '';
  
  // Notification counts
  employeeId: string = '';
  totalPending = 0;
  attendanceCount = 0;
  leaveCount = 0;
  permissionCount = 0;
  payrollCount = 0;

  private pollSubscription!: Subscription;

  constructor(
    private router: Router,
    private userService: UserService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Get employeeId from localStorage/sessionStorage
    this.employeeId = localStorage.getItem('employeeId') 
                    || sessionStorage.getItem('employeeId') 
                    || this.userService.employeeId 
                    || '';

    this.userRole = this.userService.role || localStorage.getItem('userRole') || '';
    this.isAdmin = this.userService.isAdmin();
    this.isTrainee = this.userService.isTrainee();
    this.userLocation = this.userService.location || sessionStorage.getItem('userLocation') || '';

    if (!this.userRole.trim()) {
      this.router.navigate(['/dashboard/addcandidate']);
      return;
    }

    // Only load notifications if user is manager/HR/admin
    if (this.employeeId && (this.isAdmin || this.userRole.toLowerCase().includes('manager') || this.userRole.toLowerCase().includes('hr'))) {
      this.loadPendingApprovals();
      
      // Auto-refresh every 30 seconds
      this.pollSubscription = interval(30000).subscribe(() => {
        this.loadPendingApprovals();
      });
    }
  }

  loadPendingApprovals() {
    if (!this.employeeId) {
      console.warn('employeeId not found – notifications disabled');
      return;
    }

    this.apiService.getPendingCounts(this.employeeId).subscribe({
      next: (res: any) => {
        if (res?.success && res.counts) {
          this.totalPending = res.counts.total || 0;
          this.attendanceCount = res.counts.attendance || 0;
          this.leaveCount = res.counts.leave || 0;
          this.permissionCount = res.counts.permission || 0;
          this.payrollCount = res.counts.payroll || 0;
        }
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.totalPending = 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  // ... rest of your methods (toggleMenu, logout, etc.)
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuVisible = !this.isMenuVisible;
  }

  closeMenu(): void {
    this.isMenuVisible = false;
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  isMenuItemVisible(menu: string): boolean {
    return !!this.userRole.trim();
  }

  
  handleOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const menuButtonDropdown = document.querySelector('.menu-button-dropdown');
    if (menuButtonDropdown && !menuButtonDropdown.contains(target)) {
      this.isMenuVisible = false;
    }
  }
}