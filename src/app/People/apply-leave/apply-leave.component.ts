import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Location } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-apply-leave',
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.css'],
})
export class ApplyLeaveComponent implements OnInit {
  empId: string = localStorage.getItem('empId') || 'Unknown';
  leaveForm!: FormGroup;
  leaveTypes = [
    // 'medical leave',
    'casual leave', 
  ];
  isModalOpen = true;
  aj: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // Populate Employee ID from localStorage
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  
    // Handle query parameters
    this.route.queryParams.subscribe((params) => {
      const leaveTypeFromQuery = params['type'];
      const ej = params['ej'];
      
      this.leaveForm.patchValue({ aj: ej });
      this.aj = ej;
  
      if (leaveTypeFromQuery) {
        this.leaveForm.patchValue({ leavetype: leaveTypeFromQuery });
        this.leaveForm.get('leavetype')?.disable();
      } else {
        this.leaveForm.get('leavetype')?.enable();
      }
    });
    // Listen for changes in empid and fetch manager email automatically
    this.empId = localStorage.getItem('employeeId') || '';
      if (this.empId) {
        this.fetchManagerEmail(this.empId);
      } else {
        this.leaveForm.patchValue({ teamemail: '' }); // Clear if empId is empty
      }
  }
  fetchManagerEmail(empId: string): void {
    this.apiService.getManagerEmail(empId).subscribe(
      (response) => {
        this.leaveForm.patchValue({ teamemail: response.email }); // ✅ Ensure response.email exists
      },
      (error) => {
        this.leaveForm.patchValue({ teamemail: '' }); // Clear field on error
      }
    );
  }
  initializeForm(): void {
    this.leaveForm = this.fb.group({
      empid: [this.employeeId, Validators.required],
      leavetype: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      teamemail: ['', [Validators.required, Validators.email]],
      leavereason: ['', Validators.required],
      noofdays: ['', Validators.required],
    });
  }

  // Calculate No. of Days between start and end date
  calculatenoofdays(): void {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if start date is in the past
      if (start < new Date()) {
        alert('Start date cannot be in the past.');
        this.leaveForm.get('startDate')?.setValue('');
        return;
      }

      // Ensure end date is after or equal to start date
      if (end < start) {
        alert('End date cannot be before start date.');
        this.leaveForm.get('endDate')?.setValue('');
        return;
      }

      const timeDifference = end.getTime() - start.getTime();
      const days = timeDifference / (1000 * 3600 * 24) + 1;
      this.leaveForm.get('noofdays')?.setValue(days);
    }
  }

  submitForm(): void {
    if (this.leaveForm.valid) {
      // Get the form values including disabled fields
      const formValues = { ...this.leaveForm.getRawValue() };
      console.log('Form Values:', formValues);
  
      // Send the data to the API
      this.apiService.putLeaveReq(formValues).subscribe(
        (response) => {
          console.log('Response:', response);
          alert(response.message);
          this.location.back();
        },
        (error) => {
          console.error('Error:', error);
        }
      );
    } else {
      console.log('Form is invalid');
      this.markAllFieldsTouched();
    }
  }
  

  private markAllFieldsTouched(): void {
    Object.keys(this.leaveForm.controls).forEach((field) => {
      const control = this.leaveForm.get(field);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  onFieldBlur(field: string): void {
    const control = this.leaveForm.get(field);
    if (control) {
      control.markAsTouched();
    }
  }

  closeModal(): void {
    console.log('Modal closed');
    this.isModalOpen = false;
    this.location.back(); // Navigate to the previous page
  }
  
}
