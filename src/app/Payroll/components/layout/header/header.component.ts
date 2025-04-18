import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left">
        <div class="organization-select">
          <select>
            <option>Whitestone</option>
          </select>
        </div>
      </div>

      <div class="header-right">
        <div class="header-actions">
         
        </div>
        <div class="user-actions">
        <div class="right">
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
        </div>
      </div>
       <!-- Logout button -->
        <button class="logout-button" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5rem;
      position: fixed;
      top: 0;
      right: 0;
      left: 250px;
      z-index: 900;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-toggle {
      background: none;
      border: none;
      color: #666;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .organization-select select {
      padding: 0.5rem 2rem 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
      color: #333;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: none;
      border: none;
      color: #666;
      font-size: 1.1rem;
      padding: 0.5rem;
      cursor: pointer;
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ff4081;
      color: white;
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 10px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #333;
    }

    .user-role {
      font-size: 0.8rem;
      color: #666;
    }
      /* Right section links and icons in the header */
.header .right {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 50px;
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
/* Mobile Responsive Design */
@media (max-width: 768px) {
  .header .right {
    gap: 10px;
  }
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