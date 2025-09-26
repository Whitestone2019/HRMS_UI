// src/app/user-trainee/user-trainee.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-trainee',
  templateUrl: './user-trainee.component.html',
  styleUrls: ['./user-trainee.component.css']
})
export class UserTraineeComponent {
  selectedForm: string = 'user'; // default selection
  userForm: FormGroup;
  traineeForm: FormGroup;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    // User form with empType
    this.userForm = this.fb.group({
      empid: ['', Validators.required],
      password: ['', Validators.required],
      username: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      emailid: ['', [Validators.required, Validators.email]],
      phonenumber: ['', Validators.required],
      roleid: ['', Validators.required],
      empType: ['', Validators.required] // 👈 added Employee Type
    });

    // Trainee form
    this.traineeForm = this.fb.group({
      trngid: ['', Validators.required],
      password: ['', Validators.required],
      name: ['', Validators.required],
      emailid: ['', [Validators.required, Validators.email]],
      phonenumber: ['', Validators.required],
      roleid: ['', Validators.required],
      empType: [''] // optional for trainee if needed later
    });
  }

  submitUser() {
    if (this.userForm.valid) {
      this.api.saveUser(this.userForm.value).subscribe({
        next: () => {
          this.message = 'User saved successfully!';
          this.userForm.reset();
        },
        error: () => {
          this.message = 'Error saving user.';
        }
      });
    }
  }

  submitTrainee() {
    if (this.traineeForm.valid) {
      this.api.saveTrainee(this.traineeForm.value).subscribe({
        next: () => {
          this.message = 'Trainee saved successfully!';
          this.traineeForm.reset();
        },
        error: () => {
          this.message = 'Error saving trainee.';
        }
      });
    }
  }

  // ✅ Close form (works for both User & Trainee)
  closeForm(type: 'user' | 'trainee') {
    if (type === 'user') {
      this.userForm.reset();
    } else {
      this.traineeForm.reset();
    }
    this.selectedForm = ''; // hide the form
    this.router.navigate(['/dashboard/EmpDetails']); // redirect
  }
}
