// src/app/app.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if the clicked element is not an input or textarea
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      (document.activeElement as HTMLElement).blur();
    }
  }
  title(title: any) {
    throw new Error('Method not implemented.');
  }

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.checkSessionValidity();
  }

  printBackendUrl() {
    console.log('Backend URL:', environment.backendUrl);
    //alert('Backend URL: ' + environment.backendUrl); // Display in an alert
  }
  // Listen for user activity and update the last activity timestamp
  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  handleUserActivity() {
    this.userService.updateLastActivity();
  }

  // Periodically check if the session is still valid
  checkSessionValidity() {
    setInterval(() => {
      if (!this.userService.isSessionValid()) {
        this.userService.clearUser();
        this.router.navigate(['/login']);
      }
    }, 5000); // Check every 5 seconds
  }
}
