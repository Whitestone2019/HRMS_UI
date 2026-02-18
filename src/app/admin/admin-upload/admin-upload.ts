import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-upload.html',
  styleUrls: ['./admin-upload.css']
})
export class AdminUpload implements OnInit {
  selectedFile: File | null = null;
  selectedFileName: string = '';
  isUploading: boolean = false;
  uploadError: string = '';
  uploadSuccess: boolean = false;
  maxFileSize: number = 50 * 1024 * 1024; // 50MB max size

  constructor(private apiService: ApiService) {}

  ngOnInit() {}

  // Method name must match template: onFileChange
  onFileChange(event: any): void {
    const file = event.target.files[0];
    
    // Reset states
    this.uploadError = '';
    this.uploadSuccess = false;
    
    if (!file) {
      return;
    }

    // Check if file is a PDF
    const isPDF = this.isPDFFile(file);
    
    if (!isPDF) {
      this.uploadError = 'Only PDF files are allowed. Please select a PDF file.';
      this.selectedFile = null;
      this.selectedFileName = '';
      event.target.value = ''; // Clear file input
      return;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.uploadError = `File size too large. Maximum allowed size is ${this.formatFileSize(this.maxFileSize)}.`;
      this.selectedFile = null;
      this.selectedFileName = '';
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.uploadError = ''; // Clear any previous errors
  }

  // Method name must match template: upload
  upload(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a PDF file to upload.';
      return;
    }

    // Double-check it's a PDF
    if (!this.isPDFFile(this.selectedFile)) {
      this.uploadError = 'Selected file is not a PDF. Please select a valid PDF file.';
      return;
    }

    // Check file size again
    if (this.selectedFile.size > this.maxFileSize) {
      this.uploadError = `File size too large. Maximum allowed size is ${this.formatFileSize(this.maxFileSize)}.`;
      return;
    }

    this.isUploading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    this.apiService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        this.uploadSuccess = true;
        this.selectedFile = null;
        this.selectedFileName = '';
        this.isUploading = false;
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadError = 'Upload failed: ' + (error.error?.message || error.message || 'Unknown error');
        this.isUploading = false;
        this.uploadSuccess = false;
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  // Helper method to check if file is PDF
  private isPDFFile(file: File): boolean {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const isExtensionPDF = fileName.endsWith('.pdf');
    
    // Check MIME type
    const isMimeTypePDF = file.type === 'application/pdf' || 
                          file.type === 'application/x-pdf' || 
                          file.type === 'text/pdf';
    
    // Return true if either check passes (some browsers may not set MIME type correctly)
    return isExtensionPDF || isMimeTypePDF;
  }

  // Helper method to format file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file size for display
  getFileSize(): string {
    if (!this.selectedFile) return '';
    return this.formatFileSize(this.selectedFile.size);
  }

  // Clear the selected file
  clearFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.uploadError = '';
    this.uploadSuccess = false;
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}