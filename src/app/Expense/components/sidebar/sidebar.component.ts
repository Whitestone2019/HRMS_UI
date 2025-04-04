import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo">
    
        <h1>Expense</h1>
        
      </div>
      <nav>
        <a routerLink="/expences/dashboardexp/dashboard" routerLinkActive="active">
          <i class="fas fa-home"></i>
          Dashboard
        </a>
        <a routerLink="/expences/dashboardexp/exp" routerLinkActive="active">
          <i class="fas fa-receipt"></i>
          Expenses
        </a>
        <a routerLink="/expences/dashboardexp/approval" routerLinkActive="active">
          <i class="fas fa-check-double"></i>
          Approvals
        </a>
        <a routerLink="/expences/dashboardexp/reports" routerLinkActive="active">
          <i class="fas fa-chart-bar"></i>
          Reports
        </a>
        <a routerLink="/trips" routerLinkActive="active">
          <i class="fas fa-plane"></i>
          Trips
        </a>
        <a routerLink="/expences/dashboardexp/advances" routerLinkActive="active">
          <i class="fas fa-money-bill"></i>
          Advances
        </a>
        <a routerLink="/expences/dashboardexp//payment-status" routerLinkActive="active">
        <i class="fa-solid fa-arrows-rotate"></i>
          Payment status
        </a>
        

      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background-color: #00008B;
      color: white;
      padding: 20px 0;
      height: 100%;
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
      background-color: #636e72;
      color: white;
    }
    nav a i {
      margin-right: 10px;
      width: 20px;
    }
  `]
})
export class SidebarComponent { }