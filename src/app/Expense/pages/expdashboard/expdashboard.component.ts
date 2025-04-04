import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DashboardComponentExp } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-expdashboard',
  standalone: true,
  imports: [SidebarComponent, RouterModule],
  templateUrl: './expdashboard.component.html',
  styleUrl: './expdashboard.component.css'
})
export class ExpdashboardComponent {

}
