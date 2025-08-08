import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, Type, Input } from '@angular/core';
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
  username: string = localStorage.getItem('username') || 'Guest';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  employeeStatus: string = 'Out';
  timerDisplay: string = '00:00:00';
  reportees = [
    {
      id: '10004',
      name: 'Poovarasam Murugan',
      status: 'Yet to check-in',
      imageUrl:
        'https://storage.googleapis.com/a1aa/image/6avEkAv3f7zSeExA5f4FG59V05MJ2kNyeTqX4YlWbU86914OB.jpg',
    },
  ];
  checkInTime: number = 0; // Track the check-in time for calculating the duration
  checkOutTime: number = 0; // Track the check-out time
  checkInLocation: string = ''; // Track the check-in location
  checkOutLocation: string = ''; // Track the check-out location
  yesterday_present: number = 0;
  yesterday_absent: number = 0;
  yesterday_day: string = '';

  today_present: number = 0;
  today_absent: number = 0;
  today_day: string = '';
 yesterday_label: string = "Yesterday's";
  today_label: string = "Today's";
  srlNum : number=0;

  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true })
  container: ViewContainerRef | undefined;

  constructor(
    private attendanceService: AttendanceService,
    private dialog: MatDialog,
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.subscribeToAttendanceUpdates();
    console.log(`Welcome, ${this.username}! Employee ID: ${this.employeeId}`);
    this.getAttendancePieData(); 

    this.checkTimerStatusOnLoad();

  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

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
    //alert(this.employeeId);
    this.apiService.getCheckInStatus(this.employeeId).subscribe(
      (response) => {
         this.srlNum = response.srlNum;
       // alert("response.srlnum"+response.srlNum);
        if (response.isCheckedIn) {
          // Fix the date format if needed (ensure it's in ISO 8601 format)
          let checkInTimeString = response.checkInTime.replace(' ', 'T'); // Convert space to 'T'
         
          // If the backend does not provide time in UTC (Z), you can manually add the 'Z' (indicating UTC)
          if (!checkInTimeString.endsWith('Z')) {
            checkInTimeString += 'Z'; // Add 'Z' for UTC time
          }
       
          // Convert the corrected string to a Date object
          this.checkInTime = new Date(checkInTimeString).getTime();
          console.log("Check-in time in milliseconds:", this.checkInTime);  // Debug log to verify the value
  
          // Check if checkInTime is valid
          if (isNaN(this.checkInTime)) {
            console.error('Invalid check-in time:', this.checkInTime);
            return; // Prevent further execution if the check-in time is invalid
          }
  
          // Get check-in location from localStorage (if available)
          this.checkInLocation = localStorage.getItem('checkInLocation') || '';
  
          // Set employee status to "In"
          this.employeeStatus = 'In';
  
          // Calculate the elapsed time since the check-in time
          const elapsedTime = Date.now() - this.checkInTime;
          console.log("Elapsed time in milliseconds:", elapsedTime);  // Debug log to verify the value
  
          // Pass the calculated elapsed time to the timer service
          this.attendanceService.startTimer(elapsedTime);
        } else {
          // If the user is not checked in, stop the timer
          this.attendanceService.stopTimer();
          this.timerDisplay='00:00:00';
          this.employeeStatus = 'Out';
        }
      },
      (error) => console.error('Error fetching check-in status:', error)
    );
  }
  stopTimer(): void {
    this.attendanceService.stopTimer();
  }

  checkIn(): void {
    const dialogRef = this.dialog.open(CheckInDialogComponent);

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.handleCheckIn(status);
      }
    });
  }

  private handleCheckIn(status: string): void {
    this.getLocationByIP()
      .then((coords) => this.getLocationName(coords.lat, coords.lon))
      .then((locationName) => {
        console.log('User Location:', locationName);
        // alert('User Location: ' + locationName);

        const startTime = Date.now();
        this.apiService.checkIn(status, locationName).subscribe(
          (response) => {
            console.log('Check-in successful:', response);
            this.attendanceService.checkIn();
            this.employeeStatus = 'In';
            this.checkInTime = startTime; // Store check-in time
            this.checkInLocation = locationName; // Store check-in location
            localStorage.setItem('checkInLocation', locationName); // Save to localStorage
            localStorage.setItem('isCheckedIn', 'true'); // Flag as checked in
          },
          (error) => {
            console.error('Error during check-in:', error);
          }
        );
      })
      .catch((error) => {
        console.error('Error getting location:', error);
        alert('Failed to get location. Please check your internet or location settings.');
      });
  }

  // private requestGeolocationPermission(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     if (navigator.geolocation) {
  //       navigator.geolocation.getCurrentPosition(
  //         () => resolve(),
  //         (error) => {
  //           console.error('Geolocation permission denied or error:', error.message);
  //           reject('Geolocation permission denied or error occurred.');
  //         }
  //       );
  //     } else {
  //       reject('Geolocation is not supported by this browser.');
  //     }
  //   });
  // }
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
  // private getLocation(): Promise<{ lat: number; lon: number }> {
  //   return new Promise((resolve, reject) => {
  //     if (navigator.geolocation) {
  //       navigator.geolocation.getCurrentPosition(
  //         (position) => resolve({
  //           lat: position.coords.latitude,
  //           lon: position.coords.longitude
  //         }),
  //         (error) => {
  //           console.error('Geolocation error:', error.message);
  //           reject(`Error fetching location: ${error.message}`);
  //         },
  //         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  //       );
  //     } else {
  //       reject('Geolocation is not supported by this browser.');
  //     }
  //   });
  // }

  private getLocationName(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    return this.http.get<any>(url).toPromise().then((data) => {
      if (data?.display_name) {
        return data.display_name;
      } else {
        throw new Error('No location name found for the given coordinates.');
      }
    }).catch((error) => {
      console.error('Error during reverse geocoding:', error);
      throw new Error('Reverse geocoding failed.');
    });
  }

  checkOut(): void {
     
    const dialogRef = this.dialog.open(CheckOutDialogComponent);

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.handleCheckOut(status);
      }
    });
  }

  private handleCheckOut(status: string): void {
    // alert(this.srlNum);
    // this.requestGeolocationPermission()
    // .then(() =>
    this.getLocationByIP()//)
      .then((coords) => this.getLocationName(coords.lat, coords.lon))
      .then((locationName) => {
        this.checkOutLocation = locationName; // Capture checkout location

        const checkOutDuration = (Date.now() - this.checkInTime) / 1000; // Duration in seconds
        const formattedDuration = this.formatDuration(checkOutDuration); // Convert seconds to HH:MM:SS format
       // alert('Checkout Duration OVERVIEW: ' + formattedDuration); // Display formatted duration

        this.apiService.checkOut(status, locationName, checkOutDuration,this.srlNum).subscribe(
          (response) => {
            console.log('Check-out successful:', response);
            this.attendanceService.checkOut();
            this.employeeStatus = 'Out';
            this.saveCheckOutDetails(checkOutDuration, locationName);
            this.attendanceService.stopTimer();
          },
          (error) => {
            console.error('Error during check-out:', error);
            alert('Error during check-out: ' + error.message);
          }
        );
      })
      .catch((error) => {
        console.error('Error getting location:', error);
        alert('Failed to get location. Please check your internet or location settings.');
      });
  }

  // Helper function to format seconds into HH:MM:SS
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(remainingSeconds)}`;
    return formattedTime;
  }

  // Helper function to pad numbers with leading zeros
  private padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }


  private saveCheckOutDetails(duration: number, location: string): void {
    // Store check-out details for persistence
    localStorage.setItem('checkOutDuration', duration.toString());
    localStorage.setItem('checkOutLocation', location);
    localStorage.setItem('isCheckedIn', 'false'); // Mark as checked out
  }

  toggleDropdown(): void {
    const dropdown = document.getElementById('dropdownMenu') as HTMLElement;
    dropdown.classList.toggle('show');
  }

  loadComponent(componentName: string): void {
    if (this.container) {
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

      const componentRef = this.container.createComponent(component);
    }
  }


getAttendancePieData(): void {
  const today = new Date().toISOString().slice(0, 10); // "2025-08-05"
  this.apiService.getAttendancePieData(this.employeeId, today).subscribe(
    (res) => {
      this.yesterday_present = res.yesterday.present;
      this.yesterday_absent = res.yesterday.absent;
      this.yesterday_day = res.yesterday.day;

      this.today_present =res.today.present;
      this.today_absent = res.today.absent;
      this.today_day = res.today.day;
    },
    (error) => {
      console.error('Failed to load pie chart data:', error);
    }
  );
}

}
