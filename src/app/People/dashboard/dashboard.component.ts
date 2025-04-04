import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  userRole: string | null = null; // Initialize userRole as null

  constructor(private router: Router) {
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
