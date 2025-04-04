import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../api.service';
 
@Component({
  selector: 'app-addemployee',
  templateUrl: './addemployee.component.html',
  styleUrls: ['./addemployee.component.css']
})
export class AddEmployeeComponent {
  addEmployeeForm: FormGroup;
  successMessage: string = '';
 
  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.addEmployeeForm = this.fb.group({
      organizationName: ['', Validators.required],
      employeeName: ['', Validators.required],
      employeeId: ['', Validators.required],
      dateOfJoining: ['', Validators.required],
      role: ['', Validators.required],
      designation: [''],
      reportingManagerId: [''],
      password: ['', Validators.required],
      disableDate: [''],
      disable: [false],
      deleteDate: [''],
      delete: [false]
    });
  }
 
  onSubmit() {
    if (this.addEmployeeForm.valid) {
      const employeeData = this.addEmployeeForm.value;
      console.log('Employee Data:', employeeData);
     
      this.apiService.addEmployee(employeeData).subscribe(
        (response: HttpResponse<any>) => {
          console.log('Employee added successfully', response);
          this.successMessage = 'Employee added successfully!';
          this.addEmployeeForm.reset();
 
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        (error: HttpErrorResponse) => {
          console.error('Error adding employee', error);
        }
      );
    }
  }
}