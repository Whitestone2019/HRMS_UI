import { Component, OnInit } from '@angular/core';
import { ChartContainerComponent } from '../../shared/components/chart-container/chart-container.component';
import { ExpenseStats } from '../../shared/models/expense.model';
import { ChartConfiguration } from 'chart.js';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../api.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ChartContainerComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponentExp implements OnInit {
  stats: ExpenseStats = {
    totalExpenses: 0,
    pendingReports: 0,
    approvedExpenses: 0,
    openAdvances: 0
  };

  advanceStats = {
    totalAdvances: 0,
    pendingAdvances: 0,
    approvedAdvances: 0,
    openAdvances: 0
  };

  expenseTrendConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Expenses',
        data: [1500, 2300, 1800, 2800, 2100, 2900],
        borderColor: '#00b894'
      }]
    }
  };

  categoryDistConfig: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Meals', 'Transportation', 'Accommodation', 'Supplies', 'Other'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#b2bec3']
      }]
    }
  };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getExpenseStats();
    this.getAdvanceStats();
  }

  getAdvanceStats(): void {
    this.apiService.getAdvanceStats().subscribe(
      (data: any) => {
        console.log("Advance Stats API Response:", data); // ✅ Log response

        this.advanceStats.totalAdvances = data.totalAdvances;
        this.advanceStats.pendingAdvances = data.pendingAdvances;
        this.advanceStats.approvedAdvances = data.approvedAdvances;
        this.advanceStats.openAdvances = data.openAdvances;
      },
      (error: any) => {
        console.error('Error fetching advance stats:', error);
      }
    );
  }
  getExpenseStats(): void {
    let completedApiCalls = 0;

    this.apiService.getTotalApprovedExpenses().subscribe(
      (approved: number) => {
        this.stats.approvedExpenses = approved;
        console.log('Total Approved Expenses Fetched:', approved);
        completedApiCalls++;
        this.tryCalculateTotalExpenses();
      },
      (error: any) => {
        console.error('Error fetching total approved expenses:', error);
      }
    );

    this.apiService.getTotalOpenAdvances().subscribe(
      (openAdvances: number) => {
        this.stats.openAdvances = openAdvances;
        console.log('Total Open Advances Fetched:', openAdvances);
      },
      (error: any) => {
        console.error('Error fetching total open advances:', error);
      }
    );

    this.apiService.getTotalPendingExpenses().subscribe(
      (pending: number) => {
        this.stats.pendingReports = pending;
        console.log('Total Pending Expenses Fetched:', pending);
        completedApiCalls++;
        this.tryCalculateTotalExpenses();
      },
      (error: any) => {
        console.error('Error fetching total pending expenses:', error);
      }
    );
  }

  tryCalculateTotalExpenses(): void {
    if (this.stats.pendingReports !== undefined && this.stats.approvedExpenses !== undefined) {
      this.calculateTotalExpenses();
    }
  }

  calculateTotalExpenses(): void {
    console.log('Calculating total expenses...');
    console.log('Pending reports:', this.stats.pendingReports);
    console.log('Approved expenses:', this.stats.approvedExpenses);
    this.stats.totalExpenses = this.stats.pendingReports + this.stats.approvedExpenses;
    console.log('Total expenses calculated:', this.stats.totalExpenses);
  }
}