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
    private userService: UserService,
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

  // ⭐ MUST HAVE → FIXES YOUR ERROR
  isMenuVisible(menu: string): boolean {

    // EXIT FORM MUST ALWAYS BE VISIBLE
    if (menu === 'exit-form') {
      return true;
    }

    // All other menus visible (you can add conditions later)
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
        // alert("hey");
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

