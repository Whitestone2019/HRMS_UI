import { Component } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  selectedOption = 'reset'; // can be 'reset' or 'forgot'
  otpSent = false;
  passwordVisible = false;
  isLoading = false;

  resetData = {
    employeeId: '',
    oldPassword: '',
    newPassword: '',
    otp: ''
  };

  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  sendOtp() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.resetData.employeeId) {
      this.errorMessage = 'Please enter your Employee ID.';
      return;
    }

    this.isLoading = true;
    this.apiService.sendOtp(this.resetData.employeeId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.otpSent = true;
        this.successMessage = res.message || 'OTP sent to registered email.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to send OTP.';
      }
    });
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.selectedOption === 'reset') {
      this.resetPassword();
    } else {
      this.changePasswordWithOtp();
    }
  }

  resetPassword() {
    if (!this.resetData.employeeId || !this.resetData.oldPassword || !this.resetData.newPassword) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.apiService.resetPassword(this.resetData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password reset successfully.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Failed to reset password.';
      }
    });
  }

  changePasswordWithOtp() {
    if (!this.resetData.employeeId || !this.resetData.otp || !this.resetData.newPassword) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.apiService.changePasswordWithOtp(this.resetData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password changed successfully.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Invalid OTP or failed to update password.';
      }
    });
  }
}
