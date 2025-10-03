import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuSelectionService } from '../../menu-selection.service';

type MenuType = 'employee' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'training';
type MainMenu = 'home' | 'project' | string; // allow home/project and other dynamic menus

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

  selectedMenu: MainMenu = 'home';  // ✅ Fixed default value

  userRole: string | null = null;

  constructor(private router: Router, private menuSelectionService: MenuSelectionService) {
    let role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    console.log('Raw userRole:', role);

    if (!role || role.trim().toLowerCase() === 'unknown' || role.trim().toLowerCase() === 'unknown role') {
      this.userRole = null;
    } else {
      this.userRole = role;
    }

    console.log('Final userRole:', this.userRole);
  }

  ngOnInit(): void {
    this.menuSelectionService.selectedMenu$.subscribe((menu) => {
      this.selectedMenu = menu.mainMenu;
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
