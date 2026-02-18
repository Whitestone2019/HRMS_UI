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
  managerId: string = localStorage.getItem('reportTo') || 'Unknown';
  managerName: string = localStorage.getItem('managerName') || 'Unknown';

  // CELEBRATION VARIABLES
  showCelebrationModal = false;
  celebrationMessages: string[] = [];
  celebrationTitles: string[] = [];
  celebrationUsernames: string[] = [];
  celebrationTypes: ('birthday' | 'anniversary')[] = [];
  yearsCompletedArray: number[] = [];
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
    
    this.initializeCelebrationSystem();
    
    window.addEventListener('userLoggedIn', (event: any) => {
      console.log('🎉 Login event received in OverviewComponent');
      if (event.detail) {
        this.handleLoginResponseForCelebrations(event.detail);
      }
    });
    
    setTimeout(() => {
      this.checkForCelebrations();
    }, 1000);
    
    setTimeout(() => {
      this.moveCelebrationCardForMobile();
    }, 1500);
    
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.cleanupObjectUrl();
    
    if (this.celebrationCheckInterval) {
      this.celebrationCheckInterval.unsubscribe();
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  // ============================================
  // GET DYNAMIC GREETING
  // ============================================
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  // ============================================
  // HELPER METHODS FOR SPLIT CELEBRATION CARD
  // ============================================

  /**
   * Get birthday group from grouped celebrations
   */
  getBirthdayGroup(): any {
    if (!this.groupedOtherCelebrations || this.groupedOtherCelebrations.length === 0) {
      return {
        type: 'birthday',
        title: 'Happy Birthday',
        usernames: [],
        emails: [],
        yearsArray: [],
        employeeIds: [],
        count: 0,
        message: 'No birthdays today',
        isSending: false,
        wishSent: false,
        wishError: '',
        successCount: 0,
        failureCount: 0,
        wishSuccessMessage: ''
      };
    }
    
    const birthdayGroup = this.groupedOtherCelebrations.find(g => g.type === 'birthday');
    
    if (birthdayGroup) {
      return birthdayGroup;
    }
    
    return {
      type: 'birthday',
      title: 'Happy Birthday',
      usernames: [],
      emails: [],
      yearsArray: [],
      employeeIds: [],
      count: 0,
      message: 'No birthdays today',
      isSending: false,
      wishSent: false,
      wishError: '',
      successCount: 0,
      failureCount: 0,
      wishSuccessMessage: ''
    };
  }

  /**
   * Get anniversary group from grouped celebrations
   */
  getAnniversaryGroup(): any {
    if (!this.groupedOtherCelebrations || this.groupedOtherCelebrations.length === 0) {
      return {
        type: 'anniversary',
        title: 'Congratulations',
        usernames: [],
        emails: [],
        yearsArray: [],
        employeeIds: [],
        count: 0,
        message: 'No anniversaries today',
        isSending: false,
        wishSent: false,
        wishError: '',
        successCount: 0,
        failureCount: 0,
        wishSuccessMessage: ''
      };
    }
    
    const anniversaryGroup = this.groupedOtherCelebrations.find(g => g.type === 'anniversary');
    
    if (anniversaryGroup) {
      return anniversaryGroup;
    }
    
    return {
      type: 'anniversary',
      title: 'Congratulations',
      usernames: [],
      emails: [],
      yearsArray: [],
      employeeIds: [],
      count: 0,
      message: 'No anniversaries today',
      isSending: false,
      wishSent: false,
      wishError: '',
      successCount: 0,
      failureCount: 0,
      wishSuccessMessage: ''
    };
  }

  // ============================================
  // SEND WISH TO ALL CELEBRANTS
  // ============================================
  
  sendGroupWish(group: any): void {
    console.log('🎁 Sending group wish to ALL celebrants:', group);
    
    if (!group || !group.usernames || group.usernames.length === 0) {
      console.error('❌ No usernames in group');
      return;
    }

    group.isSending = true;
    group.wishError = '';
    group.wishSent = false;
    group.successCount = 0;
    group.failureCount = 0;
    group.totalCount = group.usernames.length;
    
    const userData = this.apiService.getUserData();
    if (!userData || !userData.email || !userData.username) {
      console.error('❌ User not logged in or missing data');
      group.isSending = false;
      group.wishError = 'Please log in to send wishes';
      setTimeout(() => { group.wishError = ''; }, 5000);
      return;
    }
    
    console.log(`📧 Sending wishes to ${group.totalCount} celebrant(s)`);
    
    let completedRequests = 0;
    
    for (let i = 0; i < group.usernames.length; i++) {
      const celebrantName = group.usernames[i];
      
      let celebrantEmail = '';
      if (group.emails && group.emails[i]) {
        celebrantEmail = group.emails[i];
      } else {
        celebrantEmail = this.getRealEmailFromCelebrationData(celebrantName);
      }
      
      const employeeId = (group.employeeIds && group.employeeIds[i]) 
        ? group.employeeIds[i] 
        : this.getEmployeeIdFromCelebrationData(celebrantName);
      
      const years = (group.yearsArray && group.yearsArray[i]) 
        ? group.yearsArray[i] 
        : (group.type === 'anniversary' ? 1 : 0);
      
      if (!celebrantEmail) {
        console.warn(`⚠️ No email found for celebrant: ${celebrantName}, skipping...`);
        group.failureCount++;
        completedRequests++;
        
        if (completedRequests === group.totalCount) {
          this.finalizeGroupWish(group);
        }
        continue;
      }
      
      console.log(`📧 Sending to ${i+1}/${group.totalCount}: ${celebrantName} (${celebrantEmail})`);
      
      const celebrationRequest = {
        employeeEmail: celebrantEmail,
        employeeName: celebrantName,
        employeeId: employeeId || '',
        senderEmail: userData.email,
        senderName: userData.username,
        type: group.type,
        years: years
      };
      
      if (group.type === 'birthday') {
        this.apiService.sendCelebrationEmail(celebrationRequest).subscribe({
          next: (response: any) => {
            console.log(`✅ Birthday wish sent to ${celebrantName}:`, response);
            group.successCount++;
            completedRequests++;
            
            if (completedRequests === group.totalCount) {
              this.finalizeGroupWish(group);
            }
          },
          error: (error: any) => {
            console.error(`❌ Error sending birthday wish to ${celebrantName}:`, error);
            group.failureCount++;
            completedRequests++;
            
            if (completedRequests === group.totalCount) {
              this.finalizeGroupWish(group);
            }
          }
        });
      } else if (group.type === 'anniversary') {
        celebrationRequest.years = years && years > 0 ? years : 1;
        
        this.apiService.sendCelebrationEmail(celebrationRequest).subscribe({
          next: (response: any) => {
            console.log(`✅ Anniversary wish sent to ${celebrantName}:`, response);
            group.successCount++;
            completedRequests++;
            
            if (completedRequests === group.totalCount) {
              this.finalizeGroupWish(group);
            }
          },
          error: (error: any) => {
            console.error(`❌ Error sending anniversary wish to ${celebrantName}:`, error);
            group.failureCount++;
            completedRequests++;
            
            if (completedRequests === group.totalCount) {
              this.finalizeGroupWish(group);
            }
          }
        });
      }
    }
  }

  /**
   * Finalize group wish after all requests complete
   */
  private finalizeGroupWish(group: any): void {
    console.log(`📊 Group wish completed - Success: ${group.successCount}, Failed: ${group.failureCount}`);
    
    group.isSending = false;
    
    if (group.successCount > 0) {
      group.wishSent = true;
      group.wishSuccessMessage = `✅ Wish sent to ${group.successCount} ${group.successCount === 1 ? 'person' : 'people'}!`;
      
      if (group.failureCount > 0) {
        group.wishSuccessMessage += ` (${group.failureCount} failed)`;
      }
      
      setTimeout(() => {
        group.wishSent = false;
        group.wishSuccessMessage = '';
      }, 3000);
    } else {
      group.wishError = 'Failed to send wishes to anyone';
      
      setTimeout(() => {
        group.wishError = '';
      }, 5000);
    }
  }

  /**
   * Get REAL email from celebration data
   */
  private getRealEmailFromCelebrationData(username: string): string {
    try {
      const todayCelebrationsStr = localStorage.getItem('todayCelebrations');
      if (todayCelebrationsStr) {
        const todayCelebrations = JSON.parse(todayCelebrationsStr);
        
        const celebration = todayCelebrations.find((c: any) => 
          c.employeeName === username || 
          c.username === username || 
          c.employeeName?.toUpperCase() === username.toUpperCase()
        );
        
        if (celebration && celebration.employeeEmail) {
          console.log('✅ Found email for:', username, celebration.employeeEmail);
          return celebration.employeeEmail;
        }
      }
      return '';
    } catch (error) {
      console.error('Error getting real email:', error);
      return '';
    }
  }

  /**
   * Get employee ID from celebration data
   */
  private getEmployeeIdFromCelebrationData(username: string): string {
    try {
      const todayCelebrationsStr = localStorage.getItem('todayCelebrations');
      if (todayCelebrationsStr) {
        const todayCelebrations = JSON.parse(todayCelebrationsStr);
        
        const celebration = todayCelebrations.find((c: any) => 
          c.employeeName === username || 
          c.username === username || 
          c.employeeName?.toUpperCase() === username.toUpperCase()
        );
        
        if (celebration && celebration.employeeId) {
          return celebration.employeeId;
        }
      }
      return '';
    } catch (error) {
      console.error('Error getting employee ID:', error);
      return '';
    }
  }

  // ============================================
  // SHOW OTHER EMPLOYEE CELEBRATIONS
  // ============================================

  private showOtherEmployeeCelebrations(celebrations: any[]): void {
    console.log('\n📢 SHOWING OTHER CELEBRATIONS NOTIFICATION');
    console.log('Number of other celebrations:', celebrations.length);
    
    const birthdayCelebrations = celebrations.filter(c => c.type === 'birthday');
    const anniversaryCelebrations = celebrations.filter(c => c.type === 'anniversary');
    
    this.groupedOtherCelebrations = [];
    
    if (birthdayCelebrations.length > 0) {
      this.groupedOtherCelebrations.push({
        type: 'birthday',
        title: 'Happy Birthday',
        usernames: birthdayCelebrations.map(c => c.employeeName || 'Unknown'),
        emails: birthdayCelebrations.map(c => c.employeeEmail || ''),
        yearsArray: birthdayCelebrations.map(c => c.years || 0),
        employeeIds: birthdayCelebrations.map(c => c.employeeId || ''),
        count: birthdayCelebrations.length,
        message: `Wishing ${this.formatNameList(birthdayCelebrations.map(c => c.employeeName))} a wonderful day!`,
        isSending: false,
        wishSent: false,
        wishError: '',
        successCount: 0,
        failureCount: 0,
        wishSuccessMessage: ''
      });
    }
    
    if (anniversaryCelebrations.length > 0) {
      this.groupedOtherCelebrations.push({
        type: 'anniversary',
        title: 'Congratulations',
        usernames: anniversaryCelebrations.map(c => c.employeeName || 'Unknown'),
        emails: anniversaryCelebrations.map(c => c.employeeEmail || ''),
        yearsArray: anniversaryCelebrations.map(c => c.years || 0),
        employeeIds: anniversaryCelebrations.map(c => c.employeeId || ''),
        count: anniversaryCelebrations.length,
        message: `Congratulations to ${this.formatNameList(anniversaryCelebrations.map(c => c.employeeName))} for their work anniversary!`,
        isSending: false,
        wishSent: false,
        wishError: '',
        successCount: 0,
        failureCount: 0,
        wishSuccessMessage: ''
      });
    }
    
    console.log('Grouped celebrations to display:', this.groupedOtherCelebrations);
    this.showOtherCelebrations = true;
    this.autoHideUntilNextNoon();
  }

  formatNameList(names: string[]): string {
    if (!names || names.length === 0) return '';
    
    const validNames = names.filter(name => name && name.trim() !== '');
    
    if (validNames.length === 0) return '';
    if (validNames.length === 1) return validNames[0];
    if (validNames.length === 2) return `${validNames[0]} & ${validNames[1]}`;
    
    return `${validNames[0]}, ${validNames[1]} & ${validNames.length - 2} other${validNames.length - 2 > 1 ? 's' : ''}`;
  }

  private autoHideUntilNextNoon(): void {
    const now = new Date();
    const nextNoon = new Date(now);
    nextNoon.setHours(12, 0, 0, 0);
    
    if (now >= nextNoon) {
      nextNoon.setDate(nextNoon.getDate() + 1);
    }
    
    const timeUntilNextNoon = nextNoon.getTime() - now.getTime();
    
    console.log(`🕛 Celebration card will auto-hide at: ${nextNoon.toLocaleString()}`);
    console.log(`⏳ Time remaining: ${Math.round(timeUntilNextNoon / 1000 / 60)} minutes`);
    
    setTimeout(() => {
      this.hideOtherCelebrations();
    }, timeUntilNextNoon);
  }

  // ============================================
  // CELEBRATION MODAL METHODS
  // ============================================

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

  // ============================================
  // CELEBRATION SYSTEM INITIALIZATION
  // ============================================

  public handleLoginResponseForCelebrations(loginResponse: any): void {
    console.log('\n🔑 Direct login response received for celebrations');
    this.processLoginResponseForCelebrations(loginResponse);
  }

  private processLoginResponseForCelebrations(loginResponse: any): void {
    if (!loginResponse) return;
    
    console.log('🎉 Processing login response for celebrations');
    
    if (loginResponse.employeeId) {
      this.employeeId = loginResponse.employeeId;
      localStorage.setItem('employeeId', loginResponse.employeeId);
    }
    
    if (loginResponse.username) {
      this.username = loginResponse.username;
      localStorage.setItem('username', loginResponse.username);
    }
    
    if (loginResponse.todayCelebrations && Array.isArray(loginResponse.todayCelebrations)) {
      console.log(`✅ Found todayCelebrations array with ${loginResponse.todayCelebrations.length} item(s)`);
      localStorage.setItem('todayCelebrations', JSON.stringify(loginResponse.todayCelebrations));
      
      loginResponse.todayCelebrations.forEach((celebration: any, index: number) => {
        console.log(`   Celebration ${index + 1}:`, {
          employeeName: celebration.employeeName,
          employeeEmail: celebration.employeeEmail,
          employeeId: celebration.employeeId,
          type: celebration.type
        });
      });
      
      this.processTodayCelebrations(loginResponse.todayCelebrations);
    } else {
      console.log('❌ No todayCelebrations array in login response');
      localStorage.removeItem('todayCelebrations');
    }
  }

  private initializeCelebrationSystem(): void {
    console.log('🎉 Celebration System Initialized');
    this.loadCelebrationUserData();
    this.checkForCelebrations();
    
    this.celebrationCheckInterval = interval(300000).subscribe(() => {
      console.log('\n⏰ Periodic check for celebrations...');
      this.checkForCelebrations();
    });
  }

  private loadCelebrationUserData(): void {
    // Implementation for loading celebration user data
  }

  private checkForCelebrations(): void {
    console.log('\n🔍 Checking for celebrations...');
    
    this.loadCelebrationUserData();
    
    const todayCelebrationsStr = localStorage.getItem('todayCelebrations');
    if (todayCelebrationsStr) {
      try {
        const todayCelebrations = JSON.parse(todayCelebrationsStr);
        if (Array.isArray(todayCelebrations)) {
          this.processTodayCelebrations(todayCelebrations);
        } else {
          this.showOtherCelebrations = false;
        }
      } catch (error) {
        console.error('❌ Error parsing todayCelebrations:', error);
        this.showOtherCelebrations = false;
      }
    } else {
      this.showOtherCelebrations = false;
    }
  }

  private processTodayCelebrations(todayCelebrations: any[]): void {
    if (!todayCelebrations || todayCelebrations.length === 0) {
      this.showOtherCelebrations = false;
      return;
    }
    
    const currentUserCelebrations = todayCelebrations.filter(
      celebration => celebration.employeeId === this.employeeId
    );
    
    const otherCelebrations = todayCelebrations.filter(
      celebration => celebration.employeeId !== this.employeeId
    );
    
    if (currentUserCelebrations.length > 0) {
      this.triggerCelebrationsForCurrentUser(currentUserCelebrations);
    }
    
    if (otherCelebrations.length > 0) {
      this.showOtherEmployeeCelebrations(otherCelebrations);
    } else {
      this.showOtherCelebrations = false;
    }
  }

  private triggerCelebrationsForCurrentUser(celebrations: any[]): void {
    this.celebrationMessages = [];
    this.celebrationTitles = [];
    this.celebrationUsernames = [];
    this.celebrationTypes = [];
    this.yearsCompletedArray = [];
    this.currentCelebrationIndex = 0;
    
    celebrations.forEach((celebration) => {
      this.celebrationTypes.push(celebration.type);
      this.yearsCompletedArray.push(celebration.years || 0);
      
      if (celebration.type === 'birthday') {
        this.celebrationTitles.push('Happy Birthday');
        this.celebrationUsernames.push(celebration.employeeName || this.username);
        this.celebrationMessages.push(`Wishing you a wonderful day filled with joy and happiness!`);
      } else if (celebration.type === 'anniversary') {
        this.celebrationTitles.push('Congratulations');
        this.celebrationUsernames.push(celebration.employeeName || this.username);
        this.celebrationMessages.push(`Thank you for your dedication and hard work!`);
      }
    });
    
    this.showCelebrationModal = true;
    
    if (celebrations.length > 1) {
      this.setupCelebrationRotation();
    }
    
    setTimeout(() => {
      this.closeCelebrationModal();
    }, celebrations.length * 15000);
  }

  private setupCelebrationRotation(): void {
    const rotationInterval = setInterval(() => {
      if (!this.showCelebrationModal) {
        clearInterval(rotationInterval);
        return;
      }
      this.currentCelebrationIndex = (this.currentCelebrationIndex + 1) % this.celebrationTypes.length;
    }, 8000);
  }

  // ============================================
  // MOBILE RESPONSIVE METHODS
  // ============================================

  handleResize(): void {
    this.moveCelebrationCardForMobile();
  }

  moveCelebrationCardForMobile(): void {
    setTimeout(() => {
      const isMobile = window.innerWidth <= 768;
      const main = document.querySelector('.main');
      const celebrationCard = document.querySelector('.celebration-notification-card');
      const profileCard = document.querySelector('.profile-card');
      const content = document.querySelector('.content');
      
      if (!main || !celebrationCard || !profileCard || !content) return;
      
      if (isMobile) {
        if (content.contains(celebrationCard)) {
          celebrationCard.remove();
          main.insertBefore(celebrationCard, profileCard);
          console.log('📱 Mobile: Celebration card moved to top');
        }
      } else {
        if (!content.contains(celebrationCard) && main.contains(celebrationCard)) {
          const greeting = document.querySelector('.greeting');
          celebrationCard.remove();
          if (greeting) {
            content.insertBefore(celebrationCard, greeting);
            console.log('💻 Desktop: Celebration card moved back to content');
          }
        }
      }
    }, 100);
  }

  // ============================================
  // ATTENDANCE & OTHER METHODS
  // ============================================
  
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