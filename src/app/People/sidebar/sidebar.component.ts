import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuSelectionService } from '../../menu-selection.service';
import { UserService } from '../../user.service';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  selectedMenu: string = '';
  selectedSubMenu: string = '';
  userRole: string = '';
  currentEmployeeId: string = '';

  constructor(
    private menuSelectionService: MenuSelectionService,
    public userService: UserService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user role
    this.userRole = this.userService.role || '';
    
    // Get employee ID from localStorage only (most reliable)
    this.currentEmployeeId = localStorage.getItem('employeeId') || '';
    
    console.log('Current Employee ID:', this.currentEmployeeId);

    // Subscribe to menu selection
    this.menuSelectionService.selectedMenu$.subscribe(menu => {
      this.selectedMenu = menu.mainMenu;
      this.selectedSubMenu = menu.subMenu;
    });
  }

  onMenuSelect(main: string, sub: string = ''): void {
    this.menuSelectionService.setSelectedMenu(main, sub);
  }

  // Menu visibility logic
  isMenuVisible(menu: string): boolean {
    // PAY SLIP - ONLY for employee ID 10018
    if (menu === 'Pay Slip') {
      return this.currentEmployeeId === '10018';
    }

    // EXIT FORM - Always visible
    if (menu === 'exit-form') {
      return true;
    }

    // HOME - Always visible
    if (menu === 'home') {
      return true;
    }

    // ONBOARDING - Admin only
    if (menu === 'onboarding') {
      return this.userService.isAdmin ? this.userService.isAdmin() : false;
    }

    // UPDATELEAVE - Admin only
    if (menu === 'updateleave') {
      return this.userService.isAdmin ? this.userService.isAdmin() : false;
    }

    // PROJECT HISTORY - Always visible
    if (menu === 'project') {
      return true;
    }

    // ATTENDANCE - Always visible
    if (menu === 'attendance') {
      return true;
    }

    // LEAVE SUMMARY - Always visible
    if (menu === 'leave-summary') {
      return true;
    }

    // REPORTS - Admin only
    if (menu === 'report') {
      return this.userService.isAdmin ? this.userService.isAdmin() : false;
    }

    // POLICY - Always visible
    if (menu === 'Policy') {
      return true;
    }

    // TRAVEL - Always visible
    if (menu === 'travel') {
      return true;
    }

    // TIMESHEET - Always visible
    if (menu === 'timesheet') {
      return true;
    }

    return true;
  }

  // Policy click handler
  onPolicyClick(): void {
    this.onMenuSelect('Policy');
    
    // Check if isExecutive method exists
    const isExec = this.userService.isExecutive ? this.userService.isExecutive() : false;
    
    if (isExec) {
      this.router.navigate(['/dashboard/admin/upload']);
    } else {
      this.router.navigate(['/dashboard/user/view']);
    }
  }

  // Pay Slip click handler
  onPayslipClick(): void {
    // Double-check access
    if (this.currentEmployeeId !== '10018') {
      console.warn('Access denied: You do not have permission to view Pay Slip');
      return;
    }
    
    this.onMenuSelect('Pay Slip');
    this.router.navigate(['/dashboard/payslip']);
  }

  // Exit Form check
  checkExitForm(): void {
    this.onMenuSelect('exit-form');
    
    // Navigate directly to exit form without API check
    this.router.navigate(['/dashboard/exit-form']);
  }
}