import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../api.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-id-card-photo',
  templateUrl: './id-card-photo.component.html',
  styleUrls: ['./id-card-photo.component.css']
})
export class IdCardPhotoComponent implements OnInit {
  employeeId: string = '';
  selectedFile: File | null = null;
  uploadMessage: string = '';
  hasUploaded: boolean = false; // Restrict re-upload

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<IdCardPhotoComponent>
  ) {}

  ngOnInit(): void {
    const storedEmpId = localStorage.getItem('employeeId');
    if (storedEmpId) this.employeeId = storedEmpId;

    // Check if already uploaded
    this.checkIfAlreadyUploaded();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.uploadMessage = 'File size exceeds 10 MB. Please upload a smaller file.';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.uploadMessage = '';
  }

  onSubmit() {
    if (!this.selectedFile || !this.employeeId) {
      this.uploadMessage = 'Please select a file to upload.';
      return;
    }

    if (this.hasUploaded) {
      this.uploadMessage = 'You have already uploaded your photo.';
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', this.employeeId);
    formData.append('file', this.selectedFile);

    this.apiService.uploadPhoto(formData).subscribe({
      next: () => {
        this.uploadMessage = 'Photo uploaded successfully!';
        this.hasUploaded = true;
        // Close dialog after a short delay
        setTimeout(() => this.dialogRef.close(true), 1000);
      },
      error: (err) => {
        let message = 'Error uploading photo.';
        if (err.error) {
          if (typeof err.error === 'string') {
            message = err.error;
          } else if (err.error.message) {
            message = err.error.message;
          }
        }

        if (message.includes('already uploaded')) {
          this.uploadMessage = 'You have already uploaded your photo.';
          this.hasUploaded = true;
        } else {
          this.uploadMessage = message;
        }
      }
    });
  }

  checkIfAlreadyUploaded() {
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (data) => {
        if (data) {
          this.hasUploaded = true;
          this.uploadMessage = 'Photo already uploaded.';
        }
      },
      error: () => {
        this.hasUploaded = false;
      }
    });
  }

  onClose() {
    this.dialogRef.close(this.hasUploaded);
  }
}
