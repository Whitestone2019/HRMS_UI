import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import Router if you're using routing

@Component({
  selector: 'app-userinfo',
  templateUrl: './userinfo.component.html',
  styleUrls: ['./userinfo.component.css']
})
export class UserinfoComponent {

  constructor(private router: Router) {}

  loadComponent(route: string) {
    this.router.navigate([route]); // Navigate to the passed route
  }
}
