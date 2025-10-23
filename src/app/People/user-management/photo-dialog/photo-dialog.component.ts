import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-photo-dialog',
  template: `
    <div class="photo-dialog">
      <img [src]="data.photoUrl" alt="User Photo" class="popup-photo">
      <a [href]="data.photoUrl" [attr.download]="data.fileName" class="download-btn">Download</a>
      <button mat-icon-button class="close-btn" (click)="close()">✖</button>
    </div>
  `,
  styles: [`
    .photo-dialog { position: relative; text-align: center; padding: 1rem; }
    .popup-photo { max-width: 100%; height: auto; margin-bottom: 10px; border-radius: 8px; }
    .download-btn { padding: 6px 12px; background: #2196f3; color: #fff; border-radius: 5px; text-decoration: none; }
    .close-btn { position: absolute; top: 5px; right: 5px; font-size: 18px; cursor: pointer; border: none; background: transparent; }
  `]
})
export class PhotoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PhotoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { photoUrl: string, fileName: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
