import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../api.service';


@Component({
  selector: 'app-add-emp',
  templateUrl: './add-emp.component.html',
  styleUrls: ['./add-emp.component.css']
})
export class AddEmpComponent {

  showAlert: boolean = false;
  alertMessage: string = '';

  user: any = {
    employeeId: '',
    firstName: '',
    lastName: '',
    emailId: ''
  };

  errorMessages: any = {
    employeeId: '',
    firstName: '',
    lastName: '',
    emailId: ''
  };

  constructor(private router: Router, private apiService: ApiService) {}

  validateForm(): void {
    let isValid = true;
   // const isValid = true;

    // Validate Employee ID
    if (this.user.employeeId.trim() === '') {
      this.errorMessages.employeeId = 'Employee ID must be entered.';
      isValid = false;
    } else {
      this.errorMessages.employeeId = '';
    }

    // Validate First Name
    if (this.user.firstName.trim() === '') {
      this.errorMessages.firstName = 'First Name must be entered.';
      isValid = false;
    } else {
      this.errorMessages.firstName = '';
    }

    // Validate Last Name
    if (this.user.lastName.trim() === '') {
      this.errorMessages.lastName = 'Last Name must be entered.';
      isValid = false;
    } else {
      this.errorMessages.lastName = '';
    }

    // Validate Email ID
    if (this.user.emailId.trim() === '') {
      this.errorMessages.emailId = 'Email ID must be entered.';
      isValid = false;
    } else if (!this.isValidEmail(this.user.emailId)) {
      this.errorMessages.emailId = 'Invalid Email ID format.';
      isValid = false;
    } else {
      this.errorMessages.emailId = '';
    }

    if (isValid) {

      {
        this.alertMessage = 'Form successfully submitted!';
      } 
  
      this.showAlert = true;
  
      const formData = {
        emp_id: this.user.employeeId,
        firstname: this.user.firstName,
        lastname: this.user.lastName,
        emailid: this.user.emailId
      };

      // Send formData to backend via ApiService
      this.apiService.addEmployee(formData).subscribe(
        (response: any) => {
          if (response.success) {
            alert(response.message); // Simple success message
            this.router.navigate(['/trigger']); // Redirect on success
          } else {
            alert(response.message); // Simple failure message
          }
        },
        (error: any) => {
          console.error('Error adding employee:', error);
          alert('Error submitting form. Please try again later.');
        }
      );
    } else {
      alert('Please fill in all required fields.');
    }
  }

  // Email validation function
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
