import { Component } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  user = {
    username: '',
    password: ''
  };
  errorMessage: string | null = null;
  passwordVisible = false; // Initially, password is hidden

  constructor(
    private apiService: ApiService, 
    private router: Router, 
    private userService: UserService
  ) {}

  login() {
    this.apiService.login(this.user).subscribe(
      (response) => {
        const token = response.token;
        if (token) {
          localStorage.setItem('authToken', token);
  
          // Save user details
          this.userService.username = response.username;
          this.userService.employeeId = response.employeeId;
          this.userService.role = response.role; // Avoid null value
          this.userService.reportTo=response.reportTo;
            this.userService.managerName=response.managerName;
  
          localStorage.setItem('username', response.username);
          localStorage.setItem('employeeId', response.employeeId);
          localStorage.setItem('userRole', response.role ?? '');
          localStorage.setItem('managerId', response.reportTo ?? '');
          localStorage.setItem('managerName', response.managerName ?? '');
  
          sessionStorage.setItem('sessionUsername', this.user.username);
          sessionStorage.setItem('sessionPassword', this.user.password);
  
          // Check if role is null or empty
          if (!response.role) {
           // this.errorMessage = 'User role is missing. Please contact administrator.';
            this.router.navigate(['/dashboard']); // or another fallback page
            return;
          }
  
          // Proceed to dashboard
          this.router.navigate(['/dashboard']).then(() => {
            this.userService.setActiveMenu('home');
            localStorage.setItem('activeSidebar', 'my-space');
          });
        }
      },
      (error) => {
        this.errorMessage = error.error || 'Invalid login credentials. Please try again.';
        console.error('Login error:', error);
      }
    );
  }
  
  

  // Navigate to the Reset Password page
  navigateToResetPassword() {
    this.router.navigate(['/reset-password']);
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
}
