import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
      <div class="header">
      <div class="left">
        <!-- Company logo section -->
        <div class="company-logo">
          <img src="/HRMS/assets/images/WHITESTONE.png" alt="Company Logo" class="company-icon" />
        </div>
      </div>

      <!-- Right Section -->
      <div class="right">
        <!-- Menu button for dropdown -->
        <div class="menu-button-dropdown" (document:click)="handleOutsideClick($event)">
          <img
            src="/HRMS/assets/images/menu-button.png"
            alt="Menu Button"
            class="menu-icon"
            (click)="toggleMenu($event)"
          />
          
          <div class="dropdown-menu" [class.show]="isMenuVisible">
          <a *ngIf="isMenuItemVisible('People')" routerLink="/dashboard/overview" (click)="closeMenu()">People</a>
          <a *ngIf="isMenuItemVisible('Expense')" routerLink="/expences/dashboardexp"  (click)="closeMenu()">Expense</a>
          <a *ngIf="isMenuItemVisible('Payroll')" routerLink="/payroll/overview" (click)="closeMenu()">Payroll</a>        
          </div>      
        </div>
      

        <!-- Logout button -->
        <button class="logout-button" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>

     `,
  styles: [`
        /* Header container */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: hsl(239, 89%, 17%);
          padding: 30px  20px;
          color: white;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: 50px; /* Slightly increased height for better spacing */
        }

        /* Left section container */
        .header .left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        /* Company logo container */
        .company-logo {
          margin-right: 20px;
        }

        .header .company-logo img.company-icon {
          width: 100px; /* Adjusted logo size */
          height: auto;
          display: block;
        }

        /* Menu links section */
        .menu-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Menu links styling */
        .menu-links a {
          text-decoration: none;
          color: white;
          padding: 8px 12px;
          font-size: 15px;
          display: inline-block;
          border-radius: 5px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .menu-links a:hover {
          background-color: #279cf6; 
          color: hsl(239, 89%, 17%);
        }

        .menu-links a.active {
          color: #eff7fc; 
          font-weight: bold;
          /* text-decoration: underline; */
        }

        /* Right section links and icons in the header */
        .header .right {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-right: 50px;
        }

        /* Notification and search icon styling */
        .header .right .icon-link {
          font-size: 20px;
          color: white;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .header .right .icon-link:hover {
          color: #277df6;
        }

        /* Mobile menu toggle button */
        .mobile-menu-toggle {
          display: none; /* Initially hidden */
          cursor: pointer;
          font-size: 24px;
          color: white;
          position: absolute;
          right: 20px; /* Positioned at the edge */
          z-index: 1100; /* Ensure toggle button stays above other elements */
        }

        /* Logout button styling */
        .logout-button {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background-color: #1a88fd;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          gap: 8px; /* Space between icon and text */
          transition: background-color 0.3s ease;
        }

        .logout-button i {
          font-size: 16px;
        }

        .logout-button:hover {
          background-color: #318def;
        }

        /* Dropdown menu styling */
        .menu-button-dropdown {
          position: relative;
        }


        .menu-button-dropdown .menu-icon {
          height: 30px;
          cursor: pointer;
          color: white; /* Updated color */
        }


        .menu-button-dropdown .dropdown-menu {
          display: none;
          position: absolute;
          top: 40px;
          right: 0;
          background-color: hsl(239, 89%, 20%);
          border: 1px solid #ccc;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border-radius: 5px;
          z-index: 1000;
          width: 150px;
        }

        .menu-button-dropdown .dropdown-menu.show {
          display: flex;
          flex-direction: column;
        }

        .menu-button-dropdown .dropdown-menu a {
          padding: 10px;
          text-decoration: none;
          color: white;
          transition: background-color 0.3s ease;
        }

        .menu-button-dropdown .dropdown-menu a:hover {
          background-color: #279cf6;
        }

        /* Mobile Responsive Design */
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block;
          }

          .menu-links {
            display: none;
            flex-direction: column;
            background-color: hsl(239, 89%, 17%);
            position: absolute;
            top: 50px;
            left: 0;
            width: 100%;
            padding: 10px 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .menu-links.show {
            display: flex;
          }

          .header .right {
            gap: 10px;
          }
        }

        a.disabled {
          pointer-events: none;
          cursor: not-allowed;
          opacity: 0.6;
        }

  `]
})
export class HeaderComponent {
  isMenuVisible = false;
  userRole: string = '';

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    this.userRole = this.userService.role;

    if (!this.userRole.trim()) {
      this.router.navigate(['/dashboard/addcandidate']);
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
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

  isMenuItemVisible(menu: string): boolean {
    return this.userRole.trim() !== '';
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('role');
    this.userRole = '';
    this.isMenuVisible = false;
    this.router.navigate(['/login']);
  }
}
