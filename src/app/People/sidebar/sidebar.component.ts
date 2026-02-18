// sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { MenuSelectionService } from '../../menu-selection.service';
import { UserService } from '../../user.service';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  selectedMenu: string = '';
  selectedSubMenu: string = '';
  userRole: string = "";

  employeeId: string = localStorage.getItem('employeeId') || '';
  employeeName: string = localStorage.getItem('username') || '';

  constructor(
    private menuSelectionService: MenuSelectionService,
    public userService: UserService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.userService.role || '';
    this.menuSelectionService.selectedMenu$.subscribe(menu => {
      this.selectedMenu = menu.mainMenu;
      this.selectedSubMenu = menu.subMenu;
    });
  }

  onMenuSelect(main: string, sub: string = '') {
    this.menuSelectionService.setSelectedMenu(main, sub);
  }

  // ⭐ UPDATED → Role-based menu visibility
  isMenuVisible(menu: string): boolean {
    // EXIT FORM MUST ALWAYS BE VISIBLE
    if (menu === 'exit-form') {
      return true;
    }

    // HOME → Visible to everyone
    if (menu === 'home') {
      return true;
    }

    // ONBOARDING → Only for admin roles (HR, CEO, CTO, ACC)
    if (menu === 'onboarding') {
      return this.userService.isAdmin();
    }

    // UPDATELEAVE → Only for admin roles (HR, CEO, CTO, ACC)
    if (menu === 'updateleave') {
      return this.userService.isAdmin();
    }

    // PROJECT HISTORY → Add your condition here
    if (menu === 'project') {
      return true;
    }

    // ATTENDANCE → Add your condition here
    if (menu === 'attendance') {
      return true;
    }

    // LEAVE SUMMARY → Add your condition here
    if (menu === 'leave-summary') {
      return true;
    }

    // REPORTS → Only for admin
    if (menu === 'report') {
      return this.userService.isAdmin();
    }

    // POLICY → Visible to everyone, but routing differs
    if (menu === 'Policy') {
      return true;
    }

    // TRAVEL → Add your condition here
    if (menu === 'travel') {
      return true;
    }

    // TIMESHEET → Add your condition here
    if (menu === 'timesheet') {
      return true;
    }

    // Default return
    return true;
  }

  // New method for Policy menu click
  onPolicyClick(): void {
    this.onMenuSelect('Policy');
    
    // Navigate based on user role
    if (this.userService.isExecutive()) {
      this.router.navigate(['/dashboard/admin/upload']);
    } else {
      this.router.navigate(['/dashboard/user/view']);
    }
  }

  // ⭐ FINAL WORKING EXIT FORM CHECK
  checkExitForm() {
    this.onMenuSelect('exit-form');

    this.api.getExitFormByEmployee(this.employeeId).subscribe({
      next: (data) => {
        console.log("Exit form data:", data);

        if (Array.isArray(data) && data.length > 0) {
          this.router.navigate(['/dashboard/exit-form']);
        } else {
          this.router.navigate(['/dashboard/exit-form']);
        }
      },
      error: (err) => {
        console.error("API Error:", err);
        this.router.navigate(['/dashboard/exit-form']);
      }
    });
  }
}