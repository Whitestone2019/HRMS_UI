import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-check-in-dialog',
  templateUrl: './check-in-dialog.component.html',
  styleUrls: ['./check-in-dialog.component.css']
})
export class CheckInDialogComponent {
  checkInStatus: string = '';

  constructor(public dialogRef: MatDialogRef<CheckInDialogComponent>) {}

  onConfirm(): void {
    this.dialogRef.close(this.checkInStatus);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
