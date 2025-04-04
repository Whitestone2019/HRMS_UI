import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pay-schedule',
  standalone: true,
  templateUrl: './pay-schedule.component.html',
  styleUrls: ['./pay-schedule.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class PayScheduleComponent implements OnInit, OnDestroy {
  payScheduleForm!: FormGroup;
  workWeekDays: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  selectedWorkDays: Set<string> = new Set();
  minFirstPayrollDate: string;
  private subscriptions: Subscription[] = [];

  constructor(private fb: FormBuilder) {
    const today = new Date();
    this.minFirstPayrollDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.payScheduleForm = this.fb.group({
      salaryCalculation: ['actualDays', Validators.required],
      workingDaysPerMonth: [{ value: '', disabled: true }, [Validators.min(1)]],
      payOn: ['lastWorkingDay', Validators.required],
      specificDayOfMonth: [{ value: '', disabled: true }, [Validators.min(1), Validators.max(31)]],
      firstPayrollStart: ['', Validators.required],
      firstPayrollDate: ['', Validators.required],
    });

    // this.subscriptions.push(
    //   this.payScheduleForm.get('salaryCalculation')?.valueChanges.subscribe(value => {
    //     if (value === 'workingDays') {
    //       this.payScheduleForm.get('workingDaysPerMonth')?.enable();
    //     } else {
    //       this.payScheduleForm.get('workingDaysPerMonth')?.disable();
    //     }
    //   })
    // );

    // this.subscriptions.push(
    //   this.payScheduleForm.get('payOn')?.valueChanges.subscribe(value => {
    //     if (value === 'specificDay') {
    //       this.payScheduleForm.get('specificDayOfMonth')?.enable();
    //     } else {
    //       this.payScheduleForm.get('specificDayOfMonth')?.disable();
    //     }
    //   })
    //);
  }

  isDaySelected(day: string): boolean {
    return this.selectedWorkDays.has(day);
  }

  toggleDay(day: string): void {
    if (this.selectedWorkDays.has(day)) {
      this.selectedWorkDays.delete(day);
    } else {
      this.selectedWorkDays.add(day);
    }
  }

  onSubmit(): void {
    if (this.payScheduleForm.valid) {
      const formData = {
        ...this.payScheduleForm.value,
        selectedWorkDays: Array.from(this.selectedWorkDays),
      };
      console.log('Pay Schedule Form Submitted', formData);
    }
  }

  resetForm(): void {
    this.payScheduleForm.reset();
    this.selectedWorkDays.clear();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isWorkingDaysSelected(): boolean {
    return this.payScheduleForm.get('salaryCalculation')?.value === 'workingDays';
  }

  get isSpecificDaySelected(): boolean {
    return this.payScheduleForm.get('payOn')?.value === 'specificDay';
  }
}
