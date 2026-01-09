import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AttendanceService } from '../../attendance.service';
import { CheckInDialogComponent } from '../check-in-dialog/check-in-dialog.component';
import { CheckOutDialogComponent } from '../check-out-dialog/check-out-dialog.component';
import { ProfileComponent } from './profile/profile.component';
import { WorkscheduleComponent } from './workschedule/workschedule.component';
import { ApiService } from '../../api.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IdCardPhotoComponent } from './id-card-photo/id-card-photo.component';
import { UserService } from '../../user.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent implements OnInit, OnDestroy {
  // User data
  username: string = localStorage.getItem('username') || 'Guest';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  userRole: string = localStorage.getItem('userRole') || 'Unknown';
  managerId: string = localStorage.getItem('managerId') || 'Unknown';
  managerName: string = localStorage.getItem('managerName') || 'Unknown';

  // Track if photo is uploaded
  hasUploaded: boolean = false;
  
  // Attendance tracking
  employeeStatus: string = 'Out';
  timerDisplay: string = '00:00:00';
  checkInTime: number = 0;
  checkOutTime: number = 0;
  checkInLocation: string = '';
  checkOutLocation: string = '';
  srlNum: number = 0;
  
  // Profile picture
  profilePicture: string | SafeUrl = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
  isProfilePictureLoading: boolean = false;
  private objectUrl: string | null = null;

  // Attendance statistics
  yesterday_present: number = 0;
  yesterday_absent: number = 0;
  yesterday_day: string = '';
  today_present: number = 0;
  today_absent: number = 0;
  today_day: string = '';
  yesterday_label: string = "Yesterday's";
  today_label: string = "Today's";
  
  // Monthly Summary
  overallSummary: any = {
    period: '',
    teamSize: 0,
    attendancePercentage: 0,
    totalWorkingDays: 0,
    totalPresent: 0,
    unplannedLeave: 0,
    leaveWithPay: 0,
    leaveWithoutPay: 0
  };
  isLoadingSummary = true;
  isAdmin: boolean = false;

  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  constructor(
    private attendanceService: AttendanceService,
    private dialog: MatDialog,
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.subscribeToAttendanceUpdates();
    this.getAttendancePieData();
    this.checkTimerStatusOnLoad();
    this.loadProfilePicture(); // Load profile picture
    this.checkIfAlreadyUploaded(); // Check if photo already uploaded
    this.loadOverallAttendanceSummary();
    this.isAdmin = this.userService.isAdmin();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.cleanupObjectUrl(); // Clean up blob URL to prevent memory leaks
  }

  // ======================
  // UPDATED PROFILE PICTURE METHODS
  // ======================

  loadProfilePicture(): void {
    this.isProfilePictureLoading = true;
    
    // Clean up any existing object URL first
    this.cleanupObjectUrl();
    
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (blob: Blob) => {
        // Check if blob is not empty (photo exists)
        if (blob && blob.size > 0) {
          // Create object URL from blob
          this.objectUrl = URL.createObjectURL(blob);
          
          // Sanitize the URL for security and use it
          this.profilePicture = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
          this.hasUploaded = true; // Photo exists
        } else {
          // If blob is empty, use default Google Storage image
          this.profilePicture = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
          this.hasUploaded = false;
        }
        this.isProfilePictureLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile picture:', error);
        
        // Use default Google Storage image on error
        this.profilePicture = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
        this.hasUploaded = false;
        this.isProfilePictureLoading = false;
      }
    });
  }

  private cleanupObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  // Handle image loading errors
  onProfilePictureError(): void {
    // If blob image fails to load, fall back to default Google Storage image
    this.profilePicture = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
    this.cleanupObjectUrl();
  }

  // Check if photo is already uploaded (but keep button visible always)
  checkIfAlreadyUploaded(): void {
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (blob: Blob) => {
        // Check if blob exists and has content
        if (blob && blob.size > 0) {
          this.hasUploaded = true;
          // Clean up the temporary blob URL
          const tempUrl = URL.createObjectURL(blob);
          URL.revokeObjectURL(tempUrl);
        } else {
          this.hasUploaded = false;
        }
      },
      error: () => {
        // If API call fails, assume no photo uploaded
        this.hasUploaded = false;
      }
    });
  }

  // ======================
  // EXISTING METHODS (UNCHANGED)
  // ======================

  private subscribeToAttendanceUpdates(): void {
    this.attendanceService.isCheckedIn$.subscribe((status) => {
      this.employeeStatus = status ? 'In' : 'Out';
      if (!status) this.timerDisplay = '00:00:00';
    });

    this.attendanceService.elapsedTime$.subscribe((time) => {
      this.timerDisplay = time;
    });
  }

  checkTimerStatusOnLoad(): void {
    this.apiService.getCheckInStatus(this.employeeId).subscribe(
      (response) => {
        this.srlNum = response.srlNum;
        if (response.isCheckedIn) {
          this.handleSuccessfulCheckInResponse(response);
        } else {
          this.handleNotCheckedInState();
        }
      },
      (error) => console.error('Error fetching check-in status:', error)
    );
  }

  private handleSuccessfulCheckInResponse(response: any): void {
    const checkInTimeString = this.formatCheckInTimeString(response.checkInTime);
    this.checkInTime = new Date(checkInTimeString).getTime();
    
    if (isNaN(this.checkInTime)) {
      console.error('Invalid check-in time');
      return;
    }

    this.checkInLocation = localStorage.getItem('checkInLocation') || '';
    this.employeeStatus = 'In';
    const elapsedTime = Date.now() - this.checkInTime;
    this.attendanceService.startTimer(elapsedTime);
  }

  private formatCheckInTimeString(timeString: string): string {
    let formatted = timeString.replace(' ', 'T');
    if (!formatted.endsWith('Z')) {
      formatted += 'Z';
    }
    return formatted;
  }

  private handleNotCheckedInState(): void {
    this.attendanceService.stopTimer();
    this.timerDisplay = '00:00:00';
    this.employeeStatus = 'Out';
  }

  checkIn(): void {
    if (this.employeeId && this.employeeId.toUpperCase().startsWith('WS')) {
      const dialogRef = this.dialog.open(CheckInDialogComponent);
      dialogRef.afterClosed().subscribe((status) => {
        if (status) {
          this.initiateCheckInProcess(status);
        }
      });
      return;
    }

    this.apiService.getCheckInEligibility(this.employeeId).subscribe(
      (response: any) => {
        if (response.eligible) {
          if (response.message) {
            alert(response.message);
          }
          const dialogRef = this.dialog.open(CheckInDialogComponent);
          dialogRef.afterClosed().subscribe((status) => {
            if (status) {
              this.initiateCheckInProcess(status);
            }
          });
        } else {
          this.router.navigate(['/dashboard/timesheet']);
        }
      },
      (error) => {
        console.error('Error checking eligibility:', error);
      }
    );
  }

  private async initiateCheckInProcess(status: string): Promise<void> {
    try {
      const location = await this.getUserLocation();
      await this.completeCheckIn(status, location);
    } catch (error) {
      this.handleCheckInError(error);
    }
  }

  private async getUserLocation(): Promise<string> {
    try {
      const coords = await this.getBrowserLocation();
      return await this.getLocationName(coords.lat, coords.lon);
    } catch (browserError) {
      console.warn('Browser geolocation failed, falling back to IP');
      const ipCoords = await this.getLocationByIP();
      return await this.getLocationName(ipCoords.lat, ipCoords.lon);
    }
  }

  private async completeCheckIn(status: string, locationName: string): Promise<void> {
    const startTime = Date.now();
    await this.apiService.checkIn(status, locationName).toPromise();
    
    this.attendanceService.checkIn();
    this.employeeStatus = 'In';
    this.checkInTime = startTime;
    this.checkInLocation = locationName;
    localStorage.setItem('checkInLocation', locationName);
    localStorage.setItem('isCheckedIn', 'true');
  }

  checkOut(): void {
    const confirmCheckout = confirm('Are you sure you want to check out?');
    if (!confirmCheckout) {
      return;
    }
    const dialogRef = this.dialog.open(CheckOutDialogComponent);

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.initiateCheckOutProcess(status);
      }
    });
  }

  private async initiateCheckOutProcess(status: string): Promise<void> {
    try {
      const location = await this.getUserLocation();
      await this.completeCheckOut(status, location);
    } catch (error) {
      this.handleCheckOutError(error);
    }
  }

  private async completeCheckOut(status: string, locationName: string): Promise<void> {
    const checkOutDuration = (Date.now() - this.checkInTime) / 1000;
    await this.apiService.checkOut(status, locationName, checkOutDuration, this.srlNum).toPromise();
    
    this.attendanceService.checkOut();
    this.employeeStatus = 'Out';
    this.saveCheckOutDetails(checkOutDuration, locationName);
    this.attendanceService.stopTimer();
  }

  // ======================
  // LOCATION SERVICES
  // ======================

  private getBrowserLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }),
        (error) => reject(`Geolocation error: ${error.message}`),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  private getLocationByIP(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      const ipInfoUrl = 'https://ipapi.co/json';

      fetch(ipInfoUrl)
        .then((response) => {
          if (!response.ok) {
            reject('Failed to fetch location based on IP.');
          }
          return response.json();
        })
        .then((data) => {
          if (data.status === 'fail') {
            reject('Failed to retrieve geolocation data.');
          } else {
            const lat = parseFloat(data.lat);
            const lon = parseFloat(data.lon);

            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              reject('Invalid geolocation data received.');
            } else {
              resolve({ lat, lon });
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching location from IP:', error);
          reject(`Error fetching location: ${error.message}`);
        });
    });
  }

  private getLocationName(lat: number, lon: number): Promise<string> {
    return this.http.get<any>(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    ).toPromise()
    .then(data => data?.display_name || 'Unknown location')
    .catch(() => 'Approximate location');
  }

  // ======================
  // HELPER METHODS
  // ======================

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(remainingSeconds)}`;
  }

  private padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private saveCheckOutDetails(duration: number, location: string): void {
    localStorage.setItem('checkOutDuration', duration.toString());
    localStorage.setItem('checkOutLocation', location);
    localStorage.setItem('isCheckedIn', 'false');
  }

  private handleCheckInError(error: any): void {
    console.error('Check-in failed:', error);
  }

  private handleCheckOutError(error: any): void {
    console.error('Check-out failed:', error);
    alert('Check-out failed. Please try again.');
  }

  stopTimer(): void {
    this.attendanceService.stopTimer();
  }

  // ======================
  // UI METHODS
  // ======================

  toggleDropdown(): void {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }

  loadComponent(componentName: string): void {
    if (!this.container) return;

    this.container.clear();
    let component: Type<any>;

    switch (componentName) {
      case 'profile':
        component = ProfileComponent;
        break;
      case 'workschedule':
        component = WorkscheduleComponent;
        break;
      default:
        component = ProfileComponent;
        break;
    }

    this.container.createComponent(component);
  }

  goToIdCardForm() {
    this.router.navigate(['dashboard/iddetails']);
  }

  getAttendancePieData(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.apiService.getAttendancePieData(this.employeeId, today).subscribe(
      (res) => {
        this.yesterday_present = res.yesterday.present;
        this.yesterday_absent = res.yesterday.absent;
        this.yesterday_day = res.yesterday.day;

        this.today_present = res.today.present;
        this.today_absent = res.today.absent;
        this.today_day = res.today.day;
      },
      (error) => console.error('Failed to load pie chart data:', error)
    );
  }

  PersonalDetails(){
    this.router.navigate(['dashboard/addcandidate']);
  }

  // REMOVED *ngIf="!hasUploaded" - Button is always visible
  openIdCardDialog(): void {
    // 🧩 Button is always visible for re-uploading
    this.dialog.open(IdCardPhotoComponent, {
      width: '600px',
      disableClose: true,
      data: { employeeId: this.employeeId }
    }).afterClosed().subscribe(result => {
      // After dialog closes, refresh the profile picture
      if (result === 'success') {
        this.loadProfilePicture();
        this.checkIfAlreadyUploaded();
      }
    });
  }

  loadOverallAttendanceSummary(): void {
    this.isLoadingSummary = true;
    this.apiService.getOverallMonthlyAttendanceSummary().subscribe({
      next: (res: any) => {
        this.overallSummary = {
          period: res.period || 'Current Cycle',
          teamSize: res.teamSize || 0,
          attendancePercentage: res.attendancePercentage || 0,
          totalWorkingDays: res.totalWorkingDays || 0,
          totalPresent: res.totalPresent || 0,
          unplannedLeave: res.unplannedLeave || 0,
          leaveWithPay: res.leaveWithPay || 0,
          leaveWithoutPay: res.leaveWithoutPay || 0
        };
        this.isLoadingSummary = false;
      },
      error: () => {
        this.isLoadingSummary = false;
      }
    });
  }
}