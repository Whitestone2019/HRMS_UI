// src/app/fingerprint/fingerprint.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface CaptureResponse {
  success: boolean;
  quality?: number;
  nfiq?: number;
  imageBase64?: string;
  templateBase64?: string;
  message?: string;
  score?: number;
  matched?: boolean;
  templateSize?: number;
}

@Component({
  selector: 'app-fingerprint',
  templateUrl: './fingerprint.component.html',
  styleUrls: ['./fingerprint.component.css']
})
export class FingerprintComponent implements OnInit, OnDestroy {
  status = 'Initializing fingerprint device...';
  imageSrc: string | null = null;
  quality = 0;
  nfiq = 0;
  isCapturing = false;
  isMatching = false;
  isRegistering = false;
  savedTemplate: string | null = null;
  templateSize = 0;
  sdkInitialized = false;
  deviceConnected = false;
  deviceModel = '';
  lastUpdate = new Date();
  employeeId = '';
  captureSuccess = false;

  private apiUrl = 'http://localhost:8088/HRMS/api/fingerprint';
  private interval: any;

  constructor(private http: HttpClient,private router: Router) {}

  ngOnInit() {
    this.checkStatus();
    this.interval = setInterval(() => this.checkStatus(), 3000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  checkStatus() {
    this.http.get<any>(`${this.apiUrl}/status`).subscribe({
      next: (res) => {
        this.sdkInitialized = res.sdkInitialized;
        this.deviceConnected = res.deviceConnected;
        this.deviceModel = res.deviceModel || 'Unknown Device';
        this.lastUpdate = new Date();

        if (this.sdkInitialized) {
          this.status = `Ready - ${this.deviceModel} connected`;
        } else if (this.deviceConnected) {
          this.status = 'Device found but not ready. Click Reinitialize.';
        } else {
          this.status = 'No fingerprint scanner detected';
        }
      },
      error: () => this.status = 'Backend service not running'
    });
  }

  captureFinger() {
    if (!this.sdkInitialized) {
      alert('Device not ready!');
      return;
    }

    this.status = 'Place your finger on the scanner...';
    this.isCapturing = true;
    this.captureSuccess = false;
    this.imageSrc = null;
    this.employeeId = '';

    this.http.post<CaptureResponse>(`${this.apiUrl}/capture-sync`, { quality: 60 }).subscribe({
      next: (res) => {
        this.isCapturing = false;
        if (res.success && res.templateBase64) {
          this.imageSrc = 'data:image/bmp;base64,' + res.imageBase64;
          this.quality = res.quality || 0;
          this.nfiq = res.nfiq || 0;
          this.savedTemplate = res.templateBase64;
          this.templateSize = res.templateSize || 0;
          this.status = `Captured! Quality: ${this.quality} | NFIQ: ${this.nfiq}`;
          this.captureSuccess = true;
        } else {
          this.status = res.message || 'Capture failed';
          this.savedTemplate = null;
        }
      },
      error: () => {
        this.isCapturing = false;
        this.status = 'Capture failed. Try again.';
      }
    });
  }

  registerFingerprint() {
    if (!this.savedTemplate || !this.employeeId) {
      alert('Please capture your fingerprint and enter Employee ID first!');
      return;
    }

    if (!this.isEmployeeIdValid()) {
      alert('Please enter a valid Employee ID!');
      return;
    }

    this.isRegistering = true;
    this.status = 'Registering fingerprint...';

    // CLEAN THE BASE64 STRING — THIS FIXES THE ERROR
    const cleanTemplate = this.savedTemplate
      .replace(/[\r\n]+/gm, '')           // Remove all line breaks
      .replace(/ /g, '')                  // Remove spaces
      .trim();

    const payload = {
      employeeId: this.employeeId.trim().toUpperCase(),
      template: cleanTemplate                    // Send clean template
    };

    this.http.post<any>(`${this.apiUrl}/register`, payload).subscribe({
      next: (res) => {
        this.isRegistering = false;
        if (res.success) {
          this.status = `Registered for ${this.employeeId}`;
          alert(`Fingerprint registered successfully!\n\nEmployee ID: ${this.employeeId}\n\nYou can now login with fingerprint.`);
          this.resetProcess();
          this.router.navigate(['/login']);
        } else {
          alert('Failed: ' + res.message);
        }
      },
      error: (err) => {
        this.isRegistering = false;
        console.error(err);
        alert('Server error: ' + (err.error?.message || 'Try again'));
      }
    });
  }

  verifyFinger() {
    if (!this.savedTemplate) {
      alert('Capture a fingerprint first!');
      return;
    }
    this.isMatching = true;
    this.status = 'Place the same finger again...';

    this.http.post<any>(`${this.apiUrl}/verify`, {}).subscribe({
      next: (res) => {
        this.isMatching = false;
        if (res.matched) {
          this.status = `MATCHED! Score: ${res.score}`;
          alert('Fingerprint matched!');
        } else {
          this.status = `NOT matched (Score: ${res.score})`;
        }
      },
      error: () => {
        this.isMatching = false;
        this.status = 'Verification failed';
      }
    });
  }

  isEmployeeIdValid(): boolean {
    // Allow alphanumeric characters, hyphens, and underscores
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(this.employeeId) && this.employeeId.length > 0;
  }

  getQualityClass(): string {
    if (this.quality >= 80) return 'high';
    if (this.quality >= 60) return 'medium';
    return 'low';
  }

  resetProcess() {
    this.savedTemplate = null;
    this.imageSrc = null;
    this.employeeId = '';
    this.status = 'Ready to capture fingerprint';
  }
}