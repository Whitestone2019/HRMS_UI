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
import { Subscription, interval } from 'rxjs';

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

  // CELEBRATION VARIABLES - UPDATED FOR MULTIPLE CELEBRATIONS
  showCelebrationModal = false;
  celebrationMessages: string[] = []; // Array to store multiple celebration messages
  celebrationTitles: string[] = []; // Array to store multiple celebration titles
  celebrationUsernames: string[] = []; // Array to store multiple usernames
  celebrationTypes: ('birthday' | 'anniversary')[] = []; // Array to store multiple celebration types
  yearsCompletedArray: number[] = []; // Array to store years for multiple celebrations
  
  // Current celebration index (for cycling through multiple celebrations)
  currentCelebrationIndex = 0;
  
  // Notification cards for other employees' celebrations
  showOtherCelebrations = false;
  otherCelebrations: any[] = [];
  
  // Celebration GIF URLs
  birthdayGifUrl = '/HRMS/assets/images/celebration.gif';
  anniversaryGifUrl = '/HRMS/assets/images/celebration.gif';
  
  // Grouped celebrations for other employees
  groupedOtherCelebrations: any[] = [];
  
  // Private celebration variables
  private celebrationCheckInterval!: Subscription;
  private dateOfBirth: string | null = null;
  private dateOfJoining: string | null = null;

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
    this.loadProfilePicture();
    this.checkIfAlreadyUploaded();
    this.loadOverallAttendanceSummary();
    this.isAdmin = this.userService.isAdmin();
    
    // CELEBRATION INITIALIZATION
    this.initializeCelebrationSystem();
    
    // Listen for login events to trigger celebrations
    window.addEventListener('userLoggedIn', (event: any) => {
      console.log('🎉 Login event received in OverviewComponent');
      if (event.detail) {
        this.handleLoginResponseForCelebrations(event.detail);
      }
    });
    
    // Check localStorage for celebration data on component load
    setTimeout(() => {
      this.checkForCelebrations();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.cleanupObjectUrl();
    
    // CELEBRATION CLEANUP
    if (this.celebrationCheckInterval) {
      this.celebrationCheckInterval.unsubscribe();
    }
  }

  // ======================
  // UPDATED CELEBRATION METHODS FOR MULTIPLE CELEBRATIONS
  // ======================

  private initializeCelebrationSystem(): void {
    console.log('🎉 Celebration System Initialized');
    
    // Load user data for celebrations
    this.loadCelebrationUserData();
    
    // Check for celebrations immediately
    this.checkForCelebrations();
    
    // Check every 5 minutes for celebrations
    this.celebrationCheckInterval = interval(300000).subscribe(() => {
      console.log('\n⏰ Periodic check for celebrations...');
      this.checkForCelebrations();
    });
  }

  private loadCelebrationUserData(): void {
    try {
      // Check if user is logged in
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        console.log('🔒 No auth token found - user not logged in');
        return;
      }
      
      console.log('✅ User is logged in with auth token');
      
      // Try to get dates from storage
      const datesDataStr = localStorage.getItem('employeeDates');
      if (datesDataStr) {
        try {
          const datesData = JSON.parse(datesDataStr);
          this.dateOfBirth = datesData.dateOfBirth;
          this.dateOfJoining = datesData.dateOfJoining;
          console.log('📅 Loaded dates from employeeDates:', {
            dateOfBirth: this.dateOfBirth,
            dateOfJoining: this.dateOfJoining
          });
        } catch (error) {
          console.error('Error parsing employeeDates:', error);
        }
      }
      
      // Also check userData storage
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (!this.dateOfBirth && userData.dateOfBirth) {
            this.dateOfBirth = userData.dateOfBirth;
          }
          if (!this.dateOfJoining && userData.dateOfJoining) {
            this.dateOfJoining = userData.dateOfJoining;
          }
        } catch (error) {
          console.error('Error parsing userData:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading user data from storage:', error);
    }
  }

  private checkForCelebrations(): void {
    console.log('\n🔍 Checking for celebrations...');
    console.log('===============================');
    
    // Load current data
    this.loadCelebrationUserData();
    
    // Check if we have todayCelebrations data in localStorage
    const todayCelebrationsStr = localStorage.getItem('todayCelebrations');
    if (todayCelebrationsStr) {
      console.log('🎉 Found todayCelebrations data in localStorage');
      try {
        const todayCelebrations = JSON.parse(todayCelebrationsStr);
        console.log('📊 TodayCelebrations data:', todayCelebrations);
        console.log('📊 Number of celebrations:', todayCelebrations.length);
        
        if (Array.isArray(todayCelebrations)) {
          this.processTodayCelebrations(todayCelebrations);
        } else {
          console.log('❌ todayCelebrations is not an array');
          this.showOtherCelebrations = false;
        }
      } catch (error) {
        console.error('❌ Error parsing todayCelebrations:', error);
        this.showOtherCelebrations = false;
      }
    } else {
      console.log('📝 No todayCelebrations data found in localStorage');
      this.showOtherCelebrations = false;
    }
  }

  private processTodayCelebrations(todayCelebrations: any[]): void {
    if (!todayCelebrations || todayCelebrations.length === 0) {
      console.log('📝 No celebrations found in todayCelebrations array');
      this.showOtherCelebrations = false;
      return;
    }
    
    console.log(`🎉 Processing ${todayCelebrations.length} celebration(s) from API response`);
    console.log('👤 Current user ID:', this.employeeId);
    console.log('👤 Current username:', this.username);
    
    // Separate celebrations for current user and others
    const currentUserCelebrations = todayCelebrations.filter(
      celebration => celebration.employeeId === this.employeeId
    );
    
    const otherCelebrations = todayCelebrations.filter(
      celebration => celebration.employeeId !== this.employeeId
    );
    
    console.log(`Current user celebrations: ${currentUserCelebrations.length}`);
    console.log(`Other celebrations: ${otherCelebrations.length}`);
    
    // Process current user's celebrations
    if (currentUserCelebrations.length > 0) {
      console.log('✅ Found celebration(s) for current user');
      
      // Show modal for current user's celebrations (handles multiple)
      this.triggerCelebrationsForCurrentUser(currentUserCelebrations);
    } else {
      console.log('👤 No celebrations found for current user');
      // No modal for current user
    }
    
    // Process other users' celebrations
    if (otherCelebrations.length > 0) {
      console.log(`👥 Found ${otherCelebrations.length} celebration(s) for other employees`);
      this.showOtherEmployeeCelebrations(otherCelebrations);
    } else {
      console.log('👥 No celebrations found for other employees');
      this.showOtherCelebrations = false;
    }
  }

  private triggerCelebrationsForCurrentUser(celebrations: any[]): void {
    console.log('\n🎉🎉🎉 TRIGGERING CELEBRATION MODAL FOR CURRENT USER 🎉🎉🎉');
    console.log(`Processing ${celebrations.length} celebration(s) for current user`);
    
    // Reset arrays
    this.celebrationMessages = [];
    this.celebrationTitles = [];
    this.celebrationUsernames = [];
    this.celebrationTypes = [];
    this.yearsCompletedArray = [];
    this.currentCelebrationIndex = 0;
    
    // Process each celebration
    celebrations.forEach((celebration, index) => {
      console.log(`Celebration ${index + 1}:`, {
        type: celebration.type,
        employeeName: celebration.employeeName,
        employeeId: celebration.employeeId,
        years: celebration.years,
        message: celebration.message
      });
      
      this.celebrationTypes.push(celebration.type);
      this.yearsCompletedArray.push(celebration.years || 0);
      
      // Set separate title and username
      if (celebration.type === 'birthday') {
        this.celebrationTitles.push('Happy Birthday');
        this.celebrationUsernames.push(celebration.employeeName || this.username);
      } else if (celebration.type === 'anniversary') {
        this.celebrationTitles.push('Congratulations');
        this.celebrationUsernames.push(celebration.employeeName || this.username);
      }
      
      // Use the message from API if available
      if (celebration.message) {
        this.celebrationMessages.push(celebration.message);
      } else {
        // Generate default message based on type
        if (celebration.type === 'birthday') {
          this.celebrationMessages.push(`Wishing you a wonderful day filled with joy and happiness!`);
        } else if (celebration.type === 'anniversary') {
          const yearsText = celebration.years ? `for completing ${celebration.years} ${celebration.years === 1 ? 'year' : 'years'}!` : '';
          this.celebrationMessages.push(`Thank you for your dedication and hard work! ${yearsText}`);
        }
      }
    });
    
    this.showCelebrationModal = true;
    
    // Set up auto-rotation if there are multiple celebrations
    if (celebrations.length > 1) {
      this.setupCelebrationRotation();
    }
    
    // Auto-close modal after 15 seconds (per celebration)
    setTimeout(() => {
      this.closeCelebrationModal();
    }, celebrations.length * 15000);
  }

  private setupCelebrationRotation(): void {
    // Rotate celebrations every 8 seconds if there are multiple
    const rotationInterval = setInterval(() => {
      if (!this.showCelebrationModal) {
        clearInterval(rotationInterval);
        return;
      }
      
      this.currentCelebrationIndex = (this.currentCelebrationIndex + 1) % this.celebrationTypes.length;
      console.log(`🔄 Rotated to celebration ${this.currentCelebrationIndex + 1} of ${this.celebrationTypes.length}`);
    }, 8000);
  }

  private showOtherEmployeeCelebrations(celebrations: any[]): void {
    console.log('\n📢 SHOWING OTHER CELEBRATIONS NOTIFICATION');
    console.log('Number of other celebrations:', celebrations.length);
    
    // Group celebrations by type
    const birthdayCelebrations = celebrations.filter(c => c.type === 'birthday');
    const anniversaryCelebrations = celebrations.filter(c => c.type === 'anniversary');
    
    // Clear previous grouped celebrations
    this.groupedOtherCelebrations = [];
    
    // Create grouped celebration entries
    if (birthdayCelebrations.length > 0) {
      this.groupedOtherCelebrations.push({
        type: 'birthday',
        title: 'Happy Birthday',
        usernames: birthdayCelebrations.map(c => c.employeeName || 'Unknown'),
        yearsArray: birthdayCelebrations.map(c => c.years || 0),
        count: birthdayCelebrations.length,
        message: `Wishing ${this.formatNameList(birthdayCelebrations.map(c => c.employeeName))} a wonderful day!`
      });
    }
    
    if (anniversaryCelebrations.length > 0) {
      this.groupedOtherCelebrations.push({
        type: 'anniversary',
        title: 'Congratulations',
        usernames: anniversaryCelebrations.map(c => c.employeeName || 'Unknown'),
        yearsArray: anniversaryCelebrations.map(c => c.years || 0),
        count: anniversaryCelebrations.length,
        message: `Congratulations to ${this.formatNameList(anniversaryCelebrations.map(c => c.employeeName))} for their work anniversary!`
      });
    }
    
    console.log('Grouped celebrations to display:', this.groupedOtherCelebrations);
    this.showOtherCelebrations = true;
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
      this.hideOtherCelebrations();
    }, 30000);
  }

  // FIXED: Made this method public since it's called from the template
  formatNameList(names: string[]): string {
    if (!names || names.length === 0) return '';
    
    // Filter out any null/undefined names
    const validNames = names.filter(name => name && name.trim() !== '');
    
    if (validNames.length === 0) return '';
    if (validNames.length === 1) return validNames[0];
    if (validNames.length === 2) return `${validNames[0]} & ${validNames[1]}`;
    
    // For more than 2 names, show first two with "& others"
    return `${validNames[0]}, ${validNames[1]} & ${validNames.length - 2} other${validNames.length - 2 > 1 ? 's' : ''}`;
  }

  // Helper method to get current celebration data
  get currentCelebration(): any {
    if (this.celebrationTypes.length === 0) return null;
    
    return {
      type: this.celebrationTypes[this.currentCelebrationIndex],
      title: this.celebrationTitles[this.currentCelebrationIndex],
      username: this.celebrationUsernames[this.currentCelebrationIndex],
      message: this.celebrationMessages[this.currentCelebrationIndex],
      years: this.yearsCompletedArray[this.currentCelebrationIndex]
    };
  }

  closeCelebrationModal(): void {
    console.log('❌ Closing celebration modal');
    this.showCelebrationModal = false;
    this.celebrationMessages = [];
    this.celebrationTitles = [];
    this.celebrationUsernames = [];
    this.celebrationTypes = [];
    this.yearsCompletedArray = [];
    this.currentCelebrationIndex = 0;
  }

  hideOtherCelebrations(): void {
    this.showOtherCelebrations = false;
    console.log('📢 Hiding other celebrations notification');
  }

  // Public method to trigger celebration check from login
  public handleLoginResponseForCelebrations(loginResponse: any): void {
    console.log('\n🔑 Direct login response received for celebrations');
    this.processLoginResponseForCelebrations(loginResponse);
  }

  private processLoginResponseForCelebrations(loginResponse: any): void {
    if (!loginResponse) return;
    
    console.log('🎉 Processing login response for celebrations');
    console.log('Logged in user from response:', loginResponse.employeeId, loginResponse.username);
    
    // Update current user data from login response
    if (loginResponse.employeeId) {
      this.employeeId = loginResponse.employeeId;
      localStorage.setItem('employeeId', loginResponse.employeeId);
    }
    
    if (loginResponse.username) {
      this.username = loginResponse.username;
      localStorage.setItem('username', loginResponse.username);
    }
    
    // Check for todayCelebrations array
    if (loginResponse.todayCelebrations && Array.isArray(loginResponse.todayCelebrations)) {
      console.log(`✅ Found todayCelebrations array with ${loginResponse.todayCelebrations.length} item(s)`);
      // Store todayCelebrations in localStorage for later use
      localStorage.setItem('todayCelebrations', JSON.stringify(loginResponse.todayCelebrations));
      
      // Log all celebrations for debugging
      loginResponse.todayCelebrations.forEach((celebration: any, index: number) => {
        console.log(`   Celebration ${index + 1}:`, {
          employeeName: celebration.employeeName,
          employeeId: celebration.employeeId,
          type: celebration.type,
          message: celebration.message,
          years: celebration.years
        });
      });
      
      // Process celebrations immediately
      this.processTodayCelebrations(loginResponse.todayCelebrations);
    } else {
      console.log('❌ No todayCelebrations array in login response or not an array');
      localStorage.removeItem('todayCelebrations');
    }
    
    // Check for celebrations after a delay
    setTimeout(() => {
      this.checkForCelebrations();
    }, 500);
  }

  // ======================
  // EXISTING METHODS (UNCHANGED BELOW)
  // ======================

  loadProfilePicture(): void {
    this.isProfilePictureLoading = true;
    this.cleanupObjectUrl();
    
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          this.objectUrl = URL.createObjectURL(blob);
          this.profilePicture = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
          this.hasUploaded = true;
        } else {
          this.profilePicture = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
          this.hasUploaded = false;
        }
        this.isProfilePictureLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile picture:', error);
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

  onProfilePictureError(): void {
    this.profilePicture = 'https://storage.googleapis.com/a1aa/image/oQEVSAf4BeghEk50BK00HRRTlWINaRzTbHB9MpfA7AjCf14OB.jpg';
    this.cleanupObjectUrl();
  }

  checkIfAlreadyUploaded(): void {
    this.apiService.getPhotoByEmpId(this.employeeId).subscribe({
      next: (blob: Blob) => {
        this.hasUploaded = blob && blob.size > 0;
        if (this.hasUploaded) {
          const tempUrl = URL.createObjectURL(blob);
          URL.revokeObjectURL(tempUrl);
        }
      },
      error: () => {
        this.hasUploaded = false;
      }
    });
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

  openIdCardDialog(): void {
    this.dialog.open(IdCardPhotoComponent, {
      width: '600px',
      disableClose: true,
      data: { employeeId: this.employeeId }
    }).afterClosed().subscribe(result => {
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