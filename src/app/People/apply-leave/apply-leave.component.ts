import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-apply-leave',
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.css'],
})
export class ApplyLeaveComponent implements OnInit {
  leaveForm!: FormGroup;
  leaveTypes = ['casual leave','medical leave'];
  isModalOpen = true;
  aj: string = '';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initializeForm();

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

    this.fetchManagerEmail(this.employeeId);
  }

  initializeForm(): void {
    this.leaveForm = this.fb.group({
      empid: [this.employeeId, Validators.required],
      leavetype: ['', Validators.required],
      startdate: ['', Validators.required],
      enddate: ['', Validators.required],
      startHalf: [false],
      endHalf: [false],
      teamemail: ['', [Validators.required, Validators.email]],
      leavereason: ['', Validators.required],
      noofdays: ['', Validators.required],
      aj: ['']
    });
  }

  fetchManagerEmail(empId: string): void {
    this.apiService.getManagerEmail(empId).subscribe(
      (response) => {
        this.leaveForm.patchValue({ teamemail: response.email });
      },
      () => {
        this.leaveForm.patchValue({ teamemail: '' });
      }
    );
  }

  calculatenoofdays(): void {
    const startDate = this.leaveForm.get('startdate')?.value;
    const endDate = this.leaveForm.get('enddate')?.value;
    const isStartHalf = this.leaveForm.get('startHalf')?.value === true || this.leaveForm.get('startHalf')?.value === 'true';
    const isEndHalf = this.leaveForm.get('endHalf')?.value === true || this.leaveForm.get('endHalf')?.value === 'true';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        alert('Start date cannot be in the past.');
        this.leaveForm.get('startdate')?.setValue('');
        return;
      }

      if (end < start) {
        alert('End date cannot be before start date.');
        this.leaveForm.get('enddate')?.setValue('');
        return;
      }

      let days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

      if (start.toDateString() === end.toDateString()) {
        if (isStartHalf && isEndHalf) {
          days = 0.5;
        } else if (isStartHalf || isEndHalf) {
          days = 1;
        }
      } else {
        if (isStartHalf) days -= 0.5;
        if (isEndHalf) days -= 0.5;
      }

      this.leaveForm.get('noofdays')?.setValue(days);
    }
  }

  submitForm(): void {
    if (this.leaveForm.valid) {
      const formValues = { ...this.leaveForm.getRawValue() };
      this.apiService.putLeaveReq(formValues).subscribe(
        (response) => {
          alert(response.message);
          this.location.back();
        },
        (error) => {
          console.error('Submission Error:', error);
        }
      );
    } else {
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

  closeModal(): void {
    this.isModalOpen = false;
    this.location.back();
  }
}
