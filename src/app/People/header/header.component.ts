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
  isDropdownOpen = false;
  private closeTimeout: any;

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

    if (this.employeeId && (this.isAdmin || this.userRole.toLowerCase().includes('manager') || this.userRole.toLowerCase().includes('hr'))) {
      this.loadPendingApprovals();

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

  // Dropdown control methods
  openDropdown(): void {
    if (this.totalPending > 0) {
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
      this.isDropdownOpen = true;
    }
  }

  closeDropdownWithDelay(): void {
    this.closeTimeout = setTimeout(() => {
      this.isDropdownOpen = false;
    }, 300); // 300ms delay to allow moving to dropdown
  }

  cancelCloseDropdown(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  // Navigation method for notification clicks
  navigateTo(type: string): void {
    this.closeDropdown(); // Close dropdown after click
    
    switch(type) {
      case 'leave':
        // Navigate to leave approvals page
        if (this.userRole.toLowerCase().includes('hr')) {
          this.router.navigate(['/dashboard/hrleaveapproval']);
        } else if (this.userRole.toLowerCase().includes('manager')) {
          this.router.navigate(['/dashboard/leave-request']);
        } else {
          this.router.navigate(['/dashboard/leave-request']);
        }
        break;
        
      case 'attendance':
        // Navigate to attendance approval page
        this.router.navigate(['/dashboard/attendanceApproval']);
        break;
        
      case 'permission':
        // Navigate to permission/attendance approval page
        this.router.navigate(['/dashboard/attendanceApproval']);
        break;
        
      case 'payroll':
        // Navigate to payroll adjustments page
        this.router.navigate(['/dashboard/payrollAdjustment']);
        break;
        
      default:
        console.warn('Unknown notification type:', type);
    }
  }

  viewAllApprovals(): void {
    this.closeDropdown();
    // Navigate to a page that shows all pending approvals
    this.router.navigate(['/dashboard/operations']);
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

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