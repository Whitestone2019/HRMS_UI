import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="/assets/images/SMALL_WHITESTONE.png" alt="" class="logo">
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-group">
            <a routerLink="/payroll/overview" routerLinkActive="active" class="nav-item">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
            
            <a routerLink="/payroll/overview/employees" routerLinkActive="active" class="nav-item">
              <i class="fas fa-users"></i>
              <span>Employees</span>
            </a>
            <a routerLink="/payroll/overview/list" routerLinkActive="active" class="nav-item">
              <i class="fas fa-users"></i>
              <span>Employees Salary Details</span>
            </a>

            <a routerLink="/payroll/overview/payroll" routerLinkActive="active" class="nav-item">
              <i class="fas fa-money-bill-wave"></i>
              <span>Payroll</span>
            </a>

          
          </div>

          <div class="nav-group">
            <div class="group-title">Settings</div>
            <a routerLink="/payroll/overview/settings/organization-profile" routerLinkActive="active" class="nav-item">
              <i class="fas fa-building"></i>
              <span>Organization Profile</span>
            </a>
            <a routerLink="/payroll/overview/settings/work-locations" routerLinkActive="active" class="nav-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Work Locations</span>
            </a>
            <a routerLink="/payroll/overview/settings/departments" routerLinkActive="active" class="nav-item">
              <i class="fas fa-sitemap"></i>
              <span>Departments</span>
            </a>
            <a routerLink="/payroll/overview/settings/designations" routerLinkActive="active" class="nav-item">
              <i class="fas fa-id-badge"></i>
              <span>Designations</span>
            </a>
            <a routerLink="/payroll/overview/settings/statutory-components" routerLinkActive="active" class="nav-item">
              <i class="fas fa-file-contract"></i>
              <span>Statutory Components</span>
            </a>
            <a routerLink="/payroll/overview/settings/salary-components" routerLinkActive="active" class="nav-item">
              <i class="fas fa-money-check-alt"></i>
              <span>Salary Components</span>
            </a>
            <a routerLink="/payroll/overview/settings/salary-templates" routerLinkActive="active" class="nav-item">
              <i class="fas fa-file-invoice-dollar"></i>
              <span>Salary Templates</span>
            </a>
            <a routerLink="/payroll/overview/settings/taxes" routerLinkActive="active" class="nav-item">
              <i class="fas fa-percent"></i>
              <span>Taxes</span>
            </a>
            <a routerLink="/payroll/overview/settings/pay-schedule" routerLinkActive="active" class="nav-item">
              <i class="fas fa-calendar-alt"></i>
              <span>Pay Schedule</span>
            </a>
            <a routerLink="/payroll/overview/settings/payslip" routerLinkActive="active" class="nav-item">
              <i class="fas fa-calendar-alt"></i>
              <span>Pay Slip</span>
            </a>
          </div>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: #2d3250;
      color: #ffffff;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
      z-index: 1000;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      height: 40px;
    }

    .sidebar-nav {
      padding: 1rem 0;
    }

    .nav-group {
      margin-bottom: 1.5rem;
    }

    .group-title {
      padding: 0.5rem 1.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.5px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .nav-item.active {
      background: #4a5491;
      color: #ffffff;
    }

    .nav-item i {
      width: 20px;
      margin-right: 10px;
      font-size: 1rem;
    }

    .nav-item span {
      font-size: 0.9rem;
    }
  `]
})
export class SidebarComponent {}