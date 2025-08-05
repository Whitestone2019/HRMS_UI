import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuSelectionService } from '../../menu-selection.service';

type MenuType = 'employee' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'training';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  subMenuVisibility: { [key in MenuType]: boolean } = {
    employee: false,
    attendance: false,
    payroll: false,
    performance: false,
    recruitment: false,
    training: false,
  };
   selectedMenu: string = 'home';  // Default to 'home'

  userRole: string | null = null; // Initialize userRole as null

  constructor(private router: Router,private menuSelectionService: MenuSelectionService) {
    let role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
  
    console.log('Raw userRole:', role); // Debugging output
  
    // Normalize and check for 'Unknown Role'
    if (!role || role.trim().toLowerCase() === 'unknown' || role.trim().toLowerCase() === 'unknown role') {
      this.userRole = null;  // Set to null if it's 'Unknown Role'
    } else {
      this.userRole = role;
    }
  
    console.log('Final userRole:', this.userRole); // Debugging output
  }
  
   ngOnInit(): void {
  this.menuSelectionService.selectedMenu$.subscribe((menu) => {
      this.selectedMenu = menu.mainMenu;   // Track the main menu
    });
   }

  toggleSubMenu(menuType: MenuType) {
    this.subMenuVisibility[menuType] = !this.subMenuVisibility[menuType];
  }

  isSubMenuVisible(menuType: MenuType): boolean {
    return this.subMenuVisibility[menuType];
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    console.log('User logged out');
  }
}
