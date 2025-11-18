import { Component } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-fingerprint',
  templateUrl: './fingerprint.component.html',
  styleUrls: ['./fingerprint.component.css']
})
export class FingerprintComponent {
  employeeId: string = '';
  fingerData: string = '';
  message: string = '';

  constructor(private apiService: ApiService) {}

  // Step 1: Capture from Mantra RD Service
  captureFingerprint() {
    const pidOptions = `<?xml version="1.0"?>
      <PidOptions ver="1.0">
        <Opts fCount="1" fType="0" iCount="0" pCount="0" pgCount="2" format="0" pidVer="2.0" timeout="10000" pTimeout="20000" posh="UNKNOWN" env="P" />
      </PidOptions>`;

    fetch('https://127.0.0.1:11100/rd/capture', {
      method: 'CAPTURE',
      body: pidOptions,
      headers: { 'Content-Type': 'text/xml' }
    })
      .then(response => response.text())
      .then(xmlResponse => {
        console.log('PID Data:', xmlResponse);
        this.fingerData = xmlResponse;
        this.message = 'Fingerprint captured successfully.';
      })
      .catch(error => {
        console.error('Error capturing fingerprint:', error);
        this.message = 'Error capturing fingerprint. Ensure device and RD Service are running.';
      });
  }

  // Step 2: Save to DB via API
  saveFingerprint() {
    if (!this.employeeId || !this.fingerData) {
      this.message = 'Please capture fingerprint and enter Employee ID.';
      return;
    }

    this.apiService.saveFingerprint(this.employeeId, this.fingerData).subscribe({
      next: (res: any) => {
        this.message = res.message;
      },
      error: (err) => {
        console.error('Save Error:', err);
        this.message = 'Failed to save fingerprint.';
      }
    });
  }
}
