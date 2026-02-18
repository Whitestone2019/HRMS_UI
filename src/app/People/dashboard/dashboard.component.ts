import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuSelectionService } from '../../menu-selection.service';
import { filter, Subscription } from 'rxjs';

type MenuType = 'employee' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'training';
type MainMenu = 'home' | 'project' | string; // allow home/project and other dynamic menus

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  subMenuVisibility: { [key in MenuType]: boolean } = {
    employee: false,
    attendance: false,
    payroll: false,
    performance: false,
    recruitment: false,
    training: false,
  };

  selectedMenu: MainMenu = 'home';
  userRole: string | null = null;
  
  // Add this property to control home-header visibility
  showHomeHeader: boolean = true;
  
  // List of routes where home-header should be hidden
  private hideHomeHeaderRoutes: string[] = [
    'user/view',
    'user-view/',
    '/user-view',
    'dashboard/user-view'
  ];
  
  private routerSubscription: Subscription;

  constructor(private router: Router, private menuSelectionService: MenuSelectionService) {
    let role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    console.log('Raw userRole:', role);

    if (!role || role.trim().toLowerCase() === 'unknown' || role.trim().toLowerCase() === 'unknown role') {
      this.userRole = null;
    } else {
      this.userRole = role;
    }

    console.log('Final userRole:', this.userRole);
    
    // Subscribe to router events to detect page changes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfHomeHeaderShouldBeHidden(event.url);
    });
  }

  ngOnInit(): void {
    this.menuSelectionService.selectedMenu$.subscribe((menu) => {
      this.selectedMenu = menu.mainMenu;
    });
    
    // Check initial route when component loads
    setTimeout(() => {
      this.checkIfHomeHeaderShouldBeHidden(this.router.url);
    }, 0);
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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
    // Add your logout logic here
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
  
  // New method to check if home-header should be hidden
  private checkIfHomeHeaderShouldBeHidden(url: string): void {
    // Check if current URL contains any of the hideHomeHeaderRoutes
    const shouldHide = this.hideHomeHeaderRoutes.some(route => 
      url.includes(route) || url.endsWith(route)
    );
    
    // Update showHomeHeader based on URL check
    this.showHomeHeader = !shouldHide;
    
    // Optional: Log for debugging (remove in production)
    console.log('📍 Current URL:', url);
    console.log('🏠 Home Header visible:', this.showHomeHeader ? 'YES' : 'NO');
    console.log('📋 Selected Menu:', this.selectedMenu);
    console.log('👤 User Role:', this.userRole);
  }
  
  // Helper method to determine if home-header should be shown
  shouldShowHomeHeader(): boolean {
    // Show home-header only if:
    // 1. User role exists
    // 2. Selected menu is NOT 'home' and NOT 'project'
    // 3. Current route is NOT in hideHomeHeaderRoutes
    return this.userRole !== null && 
           this.selectedMenu !== 'home' && 
           this.selectedMenu !== 'project' &&
           this.showHomeHeader;
  }
}