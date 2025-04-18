import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../user.service';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <h1 style="font-weight: bold; color: white;"></h1>    
      </div>
      <div></div>
      <nav>
        <a routerLink="/expences/dashboardexp/dashboard" routerLinkActive="active">
          <i class="fas fa-home"></i>
          Dashboard
        </a>
        <a routerLink="/expences/dashboardexp/exp" routerLinkActive="active">
          <i class="fas fa-receipt"></i>
          Expenses
        </a>
        <a *ngIf="isAdmin" routerLink="/expences/dashboardexp/approval" routerLinkActive="active">
          <i class="fas fa-check-double"></i>
          Approvals
        </a>
         <a routerLink="/expences/dashboardexp/reports" routerLinkActive="active">
          <i class="fas fa-chart-bar"></i>
          Reports
        </a>
        <a routerLink="/expences/dashboardexp/advances" routerLinkActive="active">
          <i class="fas fa-money-bill"></i>
          Advances
        </a>
        <a routerLink="/expences/dashboardexp/payment-status" routerLinkActive="active">
          <i class="fa-solid fa-arrows-rotate"></i>
          Payment status
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background-color: hsl(239, 89%, 17%);
      color: white;
      padding: 20px 0;
      height: 100%;
      margin-top: 0;
    }
    .logo {
      padding: 0 20px;
      margin-bottom: 30px;
    }
    .logo h1 {
      font-size: 20px;
      margin: 0;
    }
    nav {
      display: flex;
      flex-direction: column;
    }
    nav a {
      padding: 15px 20px;
      color: #dfe6e9;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    nav a:hover, nav a.active {
      background-color: #1c75f6;
      color: white;
    }
    nav a i {
      margin-right: 10px;
      width: 20px;
    }
  `]
})

export class SidebarComponent implements OnInit {
  isAdmin = false;
  

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin();
    this.isAdmin=this.userService.isManager();

    // Force Angular to detect changes
    this.cdr.detectChanges();
  }
}