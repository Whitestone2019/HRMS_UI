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
    public userService: UserService, // Make it public to use in template
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
      return this.userService.isAdmin(); // Uses your existing method
    }
 
    // UPDATELEAVE → Only for admin roles (HR, CEO, CTO, ACC)
    if (menu === 'updateleave') {
      return this.userService.isAdmin();
    }
 
    // PROJECT HISTORY → Add your condition here
    if (menu === 'project') {
      return true; // Adjust as needed
    }
 
    // ATTENDANCE → Add your condition here
    if (menu === 'attendance') {
      return true; // Adjust as needed
    }
 
    // LEAVE SUMMARY → Add your condition here
    if (menu === 'leave-summary') {
      return true; // Adjust as needed
    }
 
    // REPORTS → Add your condition here
    if (menu === 'report') {
     return this.userService.isAdmin();
    }
 
    // TRAVEL → Add your condition here (if you uncomment it)
    if (menu === 'travel') {
      return true; // Adjust as needed
    }
 
    // TIMESHEET → Add your condition here (if you uncomment it)
    if (menu === 'timesheet') {
      return true; // Adjust as needed
    }
 
    // Default return
    return true;
  }
 
  // ⭐ FINAL WORKING EXIT FORM CHECK
  checkExitForm() {
    this.onMenuSelect('exit-form');
 
    this.api.getExitFormByEmployee(this.employeeId).subscribe({
      next: (data) => {
        console.log("Exit form data:", data);
 
        if (Array.isArray(data) && data.length > 0) {
          // Record exists → go to exit-page
          this.router.navigate(['/dashboard/exit-form']);
        } else {
          // No record → go to exit-form
          this.router.navigate(['/dashboard/exit-form']);
        }
      },
      error: (err) => {
        console.error("API Error:", err);
 
        // If error, allow creating a new form
        this.router.navigate(['/dashboard/exit-form']);
      }
    });
  }
}
