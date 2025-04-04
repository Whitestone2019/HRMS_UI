import { Component } from '@angular/core';
import { ApiService } from '../../api.service';  // Assuming you have an ApiService to handle API calls
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  resetData = {
    employeeId: '',
    oldPassword: '',
    newPassword: ''
  };
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;  // Flag to indicate loading state
  passwordVisible = false;  // Flag to toggle password visibility

  constructor(private apiService: ApiService, private router: Router) {}

  // Toggle the password visibility
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  resetPassword() {
    if (!this.resetData.employeeId || !this.resetData.oldPassword || !this.resetData.newPassword) {
        this.errorMessage = 'Please fill in all fields.';
        return;
    }

    if (this.resetData.newPassword.length < 6) {
        this.errorMessage = 'Password must be at least 6 characters long.';
        return;
    }

    this.isLoading = true;

    this.apiService.resetPassword(this.resetData).subscribe(
        (response) => {
            this.successMessage = response.message || 'Password reset successful!';
            this.errorMessage = null;
            this.isLoading = false;
            this.router.navigate(['/login']);
        },
        (error) => {
            this.isLoading = false;
            this.errorMessage = error.error; // Error message from handleError
            console.error('Reset password error:', error); // Log for debugging
        }
    );
}
  }
