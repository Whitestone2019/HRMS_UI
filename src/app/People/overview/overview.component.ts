import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AttendanceService } from '../../attendance.service';
import { CheckInDialogComponent } from '../check-in-dialog/check-in-dialog.component';
import { CheckOutDialogComponent } from '../check-out-dialog/check-out-dialog.component';
import { ProfileComponent } from './profile/profile.component';
import { WorkscheduleComponent } from './workschedule/workschedule.component';
import { ApiService } from '../../api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent implements OnInit, OnDestroy {
  // User data
  username: string = localStorage.getItem('username') || 'Guest';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  
  // Attendance tracking
  employeeStatus: string = 'Out';
  timerDisplay: string = '00:00:00';
  checkInTime: number = 0;
  checkOutTime: number = 0;
  checkInLocation: string = '';
  checkOutLocation: string = '';
  srlNum: number = 0;

  // Team data
  reportees = [
    {
      id: '10004',
      name: 'Poovarasam Murugan',
      status: 'Yet to check-in',
      imageUrl: 'https://storage.googleapis.com/a1aa/image/6avEkAv3f7zSeExA5f4FG59V05MJ2kNyeTqX4YlWbU86914OB.jpg',
    },
  ];

  // Attendance statistics
  yesterday_present: number = 0;
  yesterday_absent: number = 0;
  yesterday_day: string = '';
  today_present: number = 0;
  today_absent: number = 0;
  today_day: string = '';
  yesterday_label: string = "Yesterday's";
  today_label: string = "Today's";

  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  constructor(
    private attendanceService: AttendanceService,
    private dialog: MatDialog,
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.subscribeToAttendanceUpdates();
    this.getAttendancePieData();
    this.checkTimerStatusOnLoad();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ======================
  // CORE FUNCTIONALITY
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

  // ======================
  // CHECK-IN/CHECK-OUT
  // ======================

  checkIn(): void {
    const dialogRef = this.dialog.open(CheckInDialogComponent);

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.initiateCheckInProcess(status);
      }
    });
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
      // Make a request to ip-api.com to get the IP geolocation information
      const ipInfoUrl = 'http://ip-api.com/json';  // No API key required for basic usage

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

            // Validate latitude and longitude ranges
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              reject('Invalid geolocation data received.');
            } else {
              //alert(`Your Location: Latitude = ${lat}, Longitude = ${lon}`);
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
    alert(error instanceof Error ? error.message : 'Check-in failed. Please try again.');
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
}