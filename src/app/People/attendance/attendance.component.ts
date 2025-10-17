import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../attendance.service';
import { ApiService } from '../../api.service';
import { HttpClient } from '@angular/common/http';
import { CheckInDialogComponent } from '../check-in-dialog/check-in-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CheckOutDialogComponent } from '../check-out-dialog/check-out-dialog.component';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  isCheckedIn: boolean = false;
  elapsedTime: string = '00:00:00';
  dateRange: string = ''; // Added the missing dateRange property
  employeeStatus: string = 'Out';
  checkInLocation: string = '';
  checkOutLocation: string = '';
  startDate: string = '';
  endDate: string = '';
  attendanceData: any[] = []; 
  srlNum:number=0;

  constructor(
    private attendanceService: AttendanceService,
    private apiService: ApiService,
    private http: HttpClient, 
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // Subscribe to the shared state of check-in status and elapsed time
    this.attendanceService.isCheckedIn$.subscribe((status) => {
      this.checkTimerStatusOnLoad();
      this.isCheckedIn = status;
    });

    this.attendanceService.elapsedTime$.subscribe((time) => {
      this.elapsedTime = time;
    });
  }
  getAttendanceDetails(): void {
    if (this.startDate && this.endDate) {
      this.apiService.fetchAttendanceData(this.employeeId, this.startDate, this.endDate).subscribe(
        (response) => {
          // Store the response in attendanceData array
          this.attendanceData = response;
  
          // Format the date and time fields (attendanceDate, checkInTime, checkOutTime)
          this.attendanceData = this.attendanceData.map((record) => {
            // Format the date and time fields
            record.attendanceDate = this.formatDate(record.date);
            record.checkIn = this.formatTime(record.checkIn);
            record.checkOut = this.formatTime(record.checkOut);
            return record;
          });
        },
        (error) => {
          console.error('Error fetching attendance data:', error);
        }
      );
    } else {
      alert('Please select both start and end dates.');
    }
  }
  // Method to format date as 'yyyy-MM-dd HH:mm:ss'
  formatDate(date: any): string {
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear();
    const month = (formattedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = formattedDate.getDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
  
  formatTime(date: any): string {
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      return 'N/A'; // Return 'N/A' if the date is invalid
    }
    const hours = formattedDate.getHours().toString().padStart(2, '0');
    const minutes = formattedDate.getMinutes().toString().padStart(2, '0');
    const seconds = formattedDate.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
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
    // Using IP-based location instead of geolocation permission
    this.getLocationByIP()
      .then((coords) => this.getLocationName(coords.lat, coords.lon))
      .then((locationName) => {
        this.checkOutLocation = locationName; // Capture checkout location

        const checkOutDuration = (Date.now() - this.checkInTime) / 1000; // Duration in seconds
        const formattedDuration = this.formatDuration(checkOutDuration); // Convert seconds to HH:MM:SS format
        //alert('Checkout Duration OVERVIEW: ' + formattedDuration); // Display formatted duration

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

  checkIn(): void {
    const dialogRef = this.dialog.open(CheckInDialogComponent);

    dialogRef.afterClosed().subscribe((status) => {
      if (status) {
        this.handleCheckIn(status);
      }
    });
  }

  private handleCheckIn(status: string): void {
    // Using IP-based location instead of geolocation permission
    this.getLocationByIP()
      .then((coords) => this.getLocationName(coords.lat, coords.lon))
      .then((locationName) => {
        console.log('User Location:', locationName);
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

  private saveCheckOutDetails(duration: number, location: string): void {
    // Store check-out details for persistence
    localStorage.setItem('checkOutDuration', duration.toString());
    localStorage.setItem('checkOutLocation', location);
    localStorage.setItem('isCheckedIn', 'false'); // Mark as checked out
  }

  checkInTime: number = 0;

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(remainingSeconds)}`;
    return formattedTime;
  }

  private padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private getLocationByIP(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by this browser.');
      return;
    }
 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        resolve({ lat, lon });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject('User denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            reject('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            reject('The request to get user location timed out.');
            break;
          default:
            reject('An unknown error occurred while retrieving location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

//   private getLocationByIP(): Promise<{ lat: number; lon: number }> {
//     return new Promise((resolve, reject) => {
//       // Make a request to ip-api.com to get the IP geolocation information
//       const ipInfoUrl = 'https://ipapi.co/json';  // No API key required for basic usage

//       fetch(ipInfoUrl)
//         .then((response) => {
//           if (!response.ok) {
//             reject('Failed to fetch location based on IP.');
//           }
//           return response.json();
//         })
//        .then((data) => {
//   if (data.status === 'fail') {
//     reject('Failed to retrieve geolocation data.');
//   } else {
//     const lat = parseFloat(data.lat);
//     const lon = parseFloat(data.lon);

//     // Validate latitude and longitude ranges
//     if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       reject('Invalid geolocation data received.');
//     } else {
//      // alert(`Your Location: Latitude = ${lat}, Longitude = ${lon}`);
//       resolve({ lat, lon });
//     }
//   }
// })
//         .catch((error) => {
//           console.error('Error fetching location from IP:', error);
//           reject(`Error fetching location: ${error.message}`);
//         });
//     });
//   }

  private checkTimerStatusOnLoad(): void {
    this.apiService.getCheckInStatus(this.employeeId).subscribe(
      (response) => {
       // alert("STATUS"+response.isCheckedIn);
        //alert("TIME"+response.isCheckedIn)
        if (response.isCheckedIn) {
          // Convert the ISO 8601 string to a Date object, then get the timestamp
          this.checkInTime = new Date(response.checkInTime).getTime();
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
          this.attendanceService.stopTimer();
          this.elapsedTime = '00:00:00';
          this.employeeStatus = 'Out';
        }
      },
      (error) => console.error('Error fetching check-in status:', error)
    );
  }

  private getLocationName(lat: number, lon: number): Promise<string> {
    console.log("LAT>>"+lat+"LONG>>"+lon);
   // const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
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
}
