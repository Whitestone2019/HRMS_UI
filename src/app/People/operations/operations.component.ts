import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import Router if you're using routing

@Component({
  selector: 'app-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.css']
})
export class OperationsComponent {

  constructor(private router: Router) {}

  // loadComponent(route: string) {
  //   alert("click")
  //   this.router.navigate([route]); // Navigate to the passed route
  // }
}
