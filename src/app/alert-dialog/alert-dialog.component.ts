import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-alert-dialog',
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onClose()" [attr.aria-label]="'Close dialog'">{{ data.buttonText || 'OK' }}</button>
    </div>
  `,
  styles: [
    `
      h1 {
        color:rgb(241, 242, 246);
        margin: 0;
        padding-bottom: 10px;
        font-size: 20px;
        text-align: center;
      }
      div[mat-dialog-content] {
        font-size: 16px;
        color: #555;
        padding: 20px;
        text-align: center;
      }
      div[mat-dialog-actions] {
        display: flex;
        justify-content: center;
        padding: 15px;
      }
      button {
        margin-top: 20px;
        color: white;
        background-color:rgb(165, 168, 186);
        font-weight: bold;
        padding: 10px 20px;
        transition: background-color 0.3s;
      }
      button:hover {
        background-color:rgb(4, 155, 255);
      }
      button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(2, 10, 58, 0.52);
      }
    `,
  ],
  animations: [
    // Add animations if needed, for example fade in/out
  ],
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string; buttonText?: string }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
