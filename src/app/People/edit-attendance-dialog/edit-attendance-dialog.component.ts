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
    const employeeId = localStorage.getItem('employeeId') || '';

    if (employeeId === this.data.employeeId) {
      // ✅ Ensure only date (yyyy-MM-dd) format is sent
      const formattedDate = this.formatDateOnly(this.data.date);

      const requestData = {
        employeeId: this.data.employeeId,
        attendanceDate: formattedDate,  // <-- Properly formatted date
        requestedStatus: formValue.status,
        remarks: formValue.remarks,
        createdBy: employeeId
      };

      console.log("📅 Sending attendance change request:", requestData);

      this.apiService.submitAttendanceChangeRequest(requestData).subscribe({
        next: (res) => {
          this.dialogRef.close({ success: true, data: res });
        },
        error: (err) => {
          this.apiService.openDialog('Error', `Failed to submit request: ${err.message}`);
          this.dialogRef.close({ success: false });
        }
      });
    } else {
      this.apiService.openDialog('Error', `You are not allowed to edit this attendance.`);
    }
  }
}

  cancel(): void {
    this.dialogRef.close();
  }

  formatDateToString(date: Date): string {
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}


}
