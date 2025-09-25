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
  leaveTypes = ['casual leave', 'medical leave'];
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

      if (leaveTypeFromQuery === 'permission') {
        this.leaveForm.patchValue({ requestType: 'permission', leavetype: 'permission' });
        this.leaveForm.get('leavetype')?.disable();
      } else if (leaveTypeFromQuery) {
        this.leaveForm.patchValue({ leavetype: leaveTypeFromQuery, requestType: 'leave' });
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
      requestType: ['leave', Validators.required],
      leavetype: ['', Validators.required],
      startdate: [''],
      enddate: [''],
      permissionDate: [''],
      startTime: [''],
      endTime: [''],
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
        console.log('Manager email fetched:', response.email);
      },
      () => {
        this.leaveForm.patchValue({ teamemail: '' });
        console.log('Failed to fetch manager email');
      }
    );
  }

  onRequestTypeChange(): void {
    console.log('Request type changed to:', this.leaveForm.get('requestType')?.value);
    this.calculateDuration();
    const requestType = this.leaveForm.get('requestType')?.value;
    if (requestType === 'permission') {
      this.leaveForm.get('startdate')?.clearValidators();
      this.leaveForm.get('enddate')?.clearValidators();
      this.leaveForm.get('permissionDate')?.setValidators([Validators.required]);
      this.leaveForm.get('startTime')?.setValidators([Validators.required]);
      this.leaveForm.get('endTime')?.setValidators([Validators.required]);
      this.leaveForm.get('leavetype')?.setValue('permission');
    } else {
      this.leaveForm.get('permissionDate')?.clearValidators();
      this.leaveForm.get('startTime')?.clearValidators();
      this.leaveForm.get('endTime')?.clearValidators();
      this.leaveForm.get('startdate')?.setValidators([Validators.required]);
      this.leaveForm.get('enddate')?.setValidators([Validators.required]);
      this.leaveForm.get('leavetype')?.setValue('');
    }
    this.leaveForm.get('startdate')?.updateValueAndValidity();
    this.leaveForm.get('enddate')?.updateValueAndValidity();
    this.leaveForm.get('permissionDate')?.updateValueAndValidity();
    this.leaveForm.get('startTime')?.updateValueAndValidity();
    this.leaveForm.get('endTime')?.updateValueAndValidity();
  }

  calculateDuration(): void {
    const requestType = this.leaveForm.get('requestType')?.value;
    console.log('Calculating duration for requestType:', requestType);

    if (requestType === 'leave') {
      const startDate = this.leaveForm.get('startdate')?.value;
      const endDate = this.leaveForm.get('enddate')?.value;
      const isStartHalf = this.leaveForm.get('startHalf')?.value === true || this.leaveForm.get('startHalf')?.value === 'true';
      const isEndHalf = this.leaveForm.get('endHalf')?.value === true || this.leaveForm.get('endHalf')?.value === 'true';
      console.log('Leave: startDate=', startDate, 'endDate=', endDate, 'startHalf=', isStartHalf, 'endHalf=', isEndHalf);

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
        console.log('Leave duration calculated: days=', days);
      }
    } else if (requestType === 'permission') {
      const permDate = this.leaveForm.get('permissionDate')?.value;
      const startTime = this.leaveForm.get('startTime')?.value;
      const endTime = this.leaveForm.get('endTime')?.value;
      console.log('Permission: permissionDate=', permDate, 'startTime=', startTime, 'endTime=', endTime);

      if (permDate && startTime && endTime) {
        // Combine permissionDate with startTime and endTime for validation
        const startDateTime = `${permDate}T${startTime}:00`;
        const endDateTime = `${permDate}T${endTime}:00`;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          alert('Permission date cannot be in the past.');
          this.leaveForm.get('permissionDate')?.setValue('');
          return;
        }

        if (end <= start) {
          alert('End time must be after start time.');
          this.leaveForm.get('endTime')?.setValue('');
          return;
        }

        const hours = (end.getTime() - start.getTime()) / (1000 * 3600);

        if (hours > 2) {
          alert('Permission cannot exceed 2 hours per day.');
          return;
        }

        this.leaveForm.patchValue({
          noofdays: hours,
          leavetype: 'permission'
        });
        console.log('Permission duration calculated: hours=', hours, 'startTime=', startTime, 'endTime=', endTime);
      }
    }
  }

  submitForm(): void {
    if (this.leaveForm.valid) {
      const formValues = { ...this.leaveForm.getRawValue() };
      console.log('Form values before transformation:', formValues);

      // Transform form data for permission request
      if (formValues.requestType === 'permission') {
        const permDate = formValues.permissionDate;
        formValues.startTime = `${permDate}T${formValues.startTime}:00`; // Convert to ISO 8601
        formValues.endTime = `${permDate}T${formValues.endTime}:00`;     // Convert to ISO 8601
        formValues.hours = formValues.noofdays;                         // Map noofdays to hours
        formValues.reason = formValues.leavereason;                     // Map leavereason to reason
        delete formValues.startdate;
        delete formValues.enddate;
        delete formValues.startHalf;
        delete formValues.endHalf;
        delete formValues.noofdays;
        delete formValues.leavereason;
        delete formValues.permissionDate;
      } else {
        delete formValues.permissionDate;
        delete formValues.startTime;
        delete formValues.endTime;
      }

      console.log('Form values after transformation:', formValues);

      const apiCall = formValues.requestType === 'permission'
        ? this.apiService.putPermissionReq(formValues)
        : this.apiService.putLeaveReq(formValues);

      apiCall.subscribe(
        (response) => {
          alert(response.message);
          this.location.back();
        },
        (error) => {
          console.error('Submission Error:', error);
          alert(error.error?.error || 'Failed to submit request.');
        }
      );
    } else {
      console.log('Form invalid:', this.leaveForm.errors);
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