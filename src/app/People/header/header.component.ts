import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isMenuVisible = false; // Flag to track menu visibility
  userRole: string = ''; // Store the role of the user
  isAdmin: boolean = false;

  constructor(private router: Router,private userService: UserService) {}

  ngOnInit(): void {
    // Fetch role from session or service
    this.userRole = this.userService.role;
    this.isAdmin = this.userService.isAdmin();
    //this.userRole ='employee';
   // alert(this.userRole);

    // Redirect to onboarding if the role is empty
    if (!this.userRole.trim()) {
      this.router.navigate(['/dashboard/addcandidate']);
    }
  }

  isActive(route: string): boolean {
    return this.router.url === `/${route}`;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation(); // Prevents the click event from propagating to the document
    this.isMenuVisible = !this.isMenuVisible;
  }
  closeMenu(): void {
    this.isMenuVisible = false;
  }

  handleOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const menuButtonDropdown = document.querySelector('.menu-button-dropdown');
    if (menuButtonDropdown && !menuButtonDropdown.contains(target)) {
      this.isMenuVisible = false;
    }
  }

  // Determine menu visibility based on the user's role
  isMenuItemVisible(menu: string): boolean {
    // If userRole is empty, show no menus
    if (!this.userRole || this.userRole.trim() === '') {
      return false; // No menus are visible
    }

    // For non-empty userRole, show all menus
    return true;
  }
 
  logout() {
    // Clear session storage or local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('role');
    // Optionally clear user-related data
    this.userRole = '';
    this.isMenuVisible = false;
  
    // Redirect to the login page
    this.router.navigate(['/login']);
  }
  isDropdownVisible = false;

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown() {
    this.isDropdownVisible = false;
  }
}
