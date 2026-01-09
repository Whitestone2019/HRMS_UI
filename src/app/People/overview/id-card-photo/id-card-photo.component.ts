import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../api.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-id-card-photo',
  templateUrl: './id-card-photo.component.html',
  styleUrls: ['./id-card-photo.component.css']
})
export class IdCardPhotoComponent implements OnInit {
  employeeId: string = '';
  selectedFile: File | null = null;
  uploadMessage: string = '';
  isUploading: boolean = false;
  isPhotoAlreadyExists: boolean = false;
  
  // For displaying current photo
  currentPhoto: SafeUrl | string = 'assets/default-profile.png';
  isPhotoLoading: boolean = true;
  private objectUrl: string | null = null;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<IdCardPhotoComponent>,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedEmpId = localStorage.getItem('employeeId');
    if (storedEmpId) this.employeeId = storedEmpId;

    // Load current photo
    this.loadCurrentPhoto();
  }

  // Load and display current photo
  loadCurrentPhoto(): void {
    this.isPhotoLoading = true;
    this.cdRef.detectChanges();
    
    this.cleanupObjectUrl();
    
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (blob: Blob) => {
        // CRITICAL FIX: Better blob size check
        if (blob && blob.size > 500) { // Increased threshold to 500 bytes
          try {
            this.objectUrl = URL.createObjectURL(blob);
            this.currentPhoto = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
            this.isPhotoAlreadyExists = true;
          } catch (error) {
            console.error('Error creating object URL:', error);
            this.setNoPhotoState();
          }
        } else {
          // Empty or small blob means no photo exists
          this.setNoPhotoState();
        }
        this.isPhotoLoading = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading photo:', error);
        // 404 means no photo exists
        if (error.status === 404) {
          this.setNoPhotoState();
        } else {
          this.currentPhoto = 'assets/default-profile.png';
        }
        this.isPhotoLoading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private setNoPhotoState(): void {
    this.currentPhoto = 'assets/default-profile.png';
    this.isPhotoAlreadyExists = false;
    this.cleanupObjectUrl();
  }

  private cleanupObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  onPhotoError(): void {
    this.currentPhoto = 'assets/default-profile.png';
    this.cleanupObjectUrl();
    this.cdRef.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.uploadMessage = 'File size exceeds 10 MB limit.';
      this.selectedFile = null;
      this.cdRef.detectChanges();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.uploadMessage = 'Please select an image file (JPG, PNG).';
      this.selectedFile = null;
      this.cdRef.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.uploadMessage = '';
    this.cdRef.detectChanges();
  }

  onSubmit() {
    if (!this.selectedFile || !this.employeeId) {
      this.uploadMessage = 'Please select a file to upload.';
      this.cdRef.detectChanges();
      return;
    }

    this.isUploading = true;
    
    // ALWAYS start with isUpdate=true to avoid 409 errors
    // This is the key fix - your backend will handle it correctly
    this.tryUpload(true); // Always try as update first
  }

  private tryUpload(isUpdate: boolean = true): void {
    this.uploadMessage = isUpdate ? 'Updating photo...' : 'Uploading photo...';
    this.cdRef.detectChanges();

    const formData = new FormData();
    formData.append('employeeId', this.employeeId);
    formData.append('file', this.selectedFile!);
    
    // CRITICAL FIX: Always send isUpdate as string
    formData.append('isUpdate', isUpdate.toString());

    console.log('Sending upload request with isUpdate:', isUpdate);

    this.apiService.uploadPhoto(formData).subscribe({
      next: (response: any) => {
        this.handleUploadSuccess(response);
      },
      error: (err) => {
        this.handleUploadError(err);
      }
    });
  }

  private handleUploadSuccess(response: any): void {
    const message = response?.message || 'Operation completed successfully.';
    
    this.uploadMessage = message;
    this.isPhotoAlreadyExists = true;
    this.isUploading = false;
    
    // Refresh the displayed photo
    setTimeout(() => {
      this.loadCurrentPhoto();
    }, 500);
    
    // Reset file input
    this.selectedFile = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    // Close dialog on success
    if (message.includes('successfully')) {
      setTimeout(() => {
        this.dialogRef.close('success');
      }, 1500);
    }
    
    this.cdRef.detectChanges();
  }

  private handleUploadError(err: any): void {
    this.isUploading = false;
    
    let message = 'Error uploading photo. ';
    let errorMessage = '';
    
    // Extract error message
    if (err.error) {
      if (typeof err.error === 'string') {
        errorMessage = err.error;
      } else if (err.error.message) {
        errorMessage = err.error.message;
      }
    }
    
    console.log('Upload error details:', {
      status: err.status,
      message: errorMessage,
      error: err.error
    });
    
    if (err.status === 409 || errorMessage.toLowerCase().includes('already uploaded')) {
      // This shouldn't happen if we always send isUpdate=true
      // But just in case, we can try one more time
      message = 'Photo already exists. Please use the Update option.';
      this.isPhotoAlreadyExists = true;
    } else {
      message = errorMessage || 'Upload failed. Please try again.';
    }
    
    this.uploadMessage = message;
    this.cdRef.detectChanges();
  }

  onClose() {
    this.cleanupObjectUrl();
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.cleanupObjectUrl();
  }
}