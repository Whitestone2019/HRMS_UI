import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../api.service';

interface EditAttendanceDialogData {
  date: Date;
  currentStatus: string;
  remarks: string;
  employeeId: string;
  employeeName: string;
}

@Component({
  selector: 'app-edit-attendance-dialog',
  templateUrl: './edit-attendance-dialog.component.html',
  styleUrls: ['./edit-attendance-dialog.component.css']
})
export class EditAttendanceDialogComponent {
  editForm: FormGroup;
  formattedDate: string;

  constructor(
    public dialogRef: MatDialogRef<EditAttendanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditAttendanceDialogData,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(data.date);

    this.editForm = this.fb.group({
      status: [data.currentStatus || '', Validators.required],
      remarks: [data.remarks || '']
    });
  }

save(): void {
  if (this.editForm.valid) {
    const formValue = this.editForm.value;
    const rmoduserid = localStorage.getItem('employeeId') || '';


    if (rmoduserid === this.data.employeeId) {
      this.apiService.openDialog('Error', `You are not allowed to edit this attendance.`);
      return; // stop execution
    }

    const requestData = {
      attendancedate: this.data.date,
      status: formValue.status,
      remarks: formValue.remarks,
      attendanceid: this.data.employeeId, // Fixed, cannot be changed
      employeeName: this.data.employeeName,
      rmoduserid: rmoduserid,
      rmodtime: this.formatDateToString(new Date())
    };

    this.apiService.updateAttendance(requestData).subscribe({
      next: (res) => {
        this.dialogRef.close({ success: true, data: res });
      },
      error: (err) => {
        this.apiService.openDialog('Error', `Failed to update attendance: ${err.message}`);
        console.error('Error updating attendance', err);
        this.dialogRef.close({ success: false });
      }
    });
  }
}



  cancel(): void {
    this.dialogRef.close();
  }

  formatDateToString(date: Date): string {
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

}
