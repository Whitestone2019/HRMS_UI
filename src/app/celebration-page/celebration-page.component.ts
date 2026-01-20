import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-celebration-page',
  templateUrl: './celebration-page.component.html',
  styleUrls: ['./celebration-page.component.css']
})
export class CelebrationPageComponent implements OnInit, OnDestroy {
  // Modal control variables
  showModal = false;
  celebrationMessage = '';
  celebrationType: 'birthday' | 'anniversary' | null = null;
  employeeName = '';
  yearsCompleted = 0;
  
  // GIF URLs
  birthdayGifUrl = '/HRMS/assets/images/celebration.gif';
  anniversaryGifUrl = '/HRMS/assets/images/celebration.gif';
  
  // Private variables for data storage
  private checkInterval!: Subscription;
  private routerSubscription!: Subscription;
  private dateOfBirth: string | null = null;
  private dateOfJoining: string | null = null;
  private employeeId: string = '';
  private username: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Load user data when component initializes
    this.loadUserDataFromStorage();
    
    // Check for celebrations immediately
    this.checkForCelebrations();
    
    // Check every 5 minutes for celebrations
    this.checkInterval = interval(300000).subscribe(() => {
      this.checkForCelebrations();
    });
    
    // Listen to router events to check for celebrations on page navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.checkForCelebrations();
        }, 1000);
      });
    
    // Setup auth listeners
    this.setupAuthListeners();
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Setup auth listeners
  private setupAuthListeners() {
    // Listen for storage events
    window.addEventListener('storage', (event) => {
      if (event.key && (event.key.toLowerCase().includes('user') || event.key.includes('token') || event.key.includes('auth'))) {
        setTimeout(() => {
          this.loadUserDataFromStorage();
          this.checkForCelebrations();
        }, 500);
      }
    });
    
    // Listen for custom login events
    window.addEventListener('userLoggedIn', (event: any) => {
      if (event.detail) {
        this.processLoginResponse(event.detail);
      }
    });
  }

  // Process login response from API
  private processLoginResponse(loginResponse: any) {
    if (!loginResponse) {
      return;
    }
    
    // Extract data from API response
    this.employeeId = loginResponse.employeeId || '';
    this.username = loginResponse.username || '';
    
    // Extract dates from API response
    if (loginResponse.dateOfBirth) {
      this.dateOfBirth = this.formatDateForComparison(loginResponse.dateOfBirth);
    }
    
    if (loginResponse.dateOfJoining) {
      this.dateOfJoining = this.formatDateForComparison(loginResponse.dateOfJoining);
    }
    
    // Check alternative property names
    if (!this.dateOfBirth && loginResponse.dob) {
      this.dateOfBirth = this.formatDateForComparison(loginResponse.dob);
    }
    
    if (!this.dateOfJoining && loginResponse.doj) {
      this.dateOfJoining = this.formatDateForComparison(loginResponse.doj);
    }
    
    // Store the data properly
    this.storeUserData(loginResponse);
    
    // Check for celebrations
    setTimeout(() => {
      this.checkForCelebrations();
    }, 1000);
  }

  // Format date from API
  private formatDateForComparison(dateString: string): string {
    try {
      if (!dateString) return '';
      
      // Extract just the date part (before space)
      const datePart = dateString.split(' ')[0];
      
      // Parse DD-MM-YYYY format
      const match = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${day}-${month}-${year}`;
      }
      
      // Parse YYYY-MM-DD format
      const yyyyMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (yyyyMatch) {
        const year = yyyyMatch[1];
        const month = yyyyMatch[2].padStart(2, '0');
        const day = yyyyMatch[3].padStart(2, '0');
        return `${day}-${month}-${year}`;
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }

  // Store user data properly
  private storeUserData(loginResponse: any) {
    const userData = {
      employeeId: this.employeeId,
      username: this.username,
      dateOfBirth: this.dateOfBirth,
      dateOfJoining: this.dateOfJoining,
      email: loginResponse.email || '',
      role: loginResponse.role || '',
      token: loginResponse.token || '',
      reportTo: loginResponse.reportTo || '',
      managerName: loginResponse.managerName || ''
    };
    
    // Store consolidated data
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Also store dates separately for easy access
    if (this.dateOfBirth || this.dateOfJoining) {
      const datesData = {
        dateOfBirth: this.dateOfBirth,
        dateOfJoining: this.dateOfJoining
      };
      localStorage.setItem('employeeDates', JSON.stringify(datesData));
    }
    
    // Store individual keys for compatibility
    if (loginResponse.token) {
      localStorage.setItem('authToken', loginResponse.token);
    }
    if (this.username) {
      localStorage.setItem('username', this.username);
    }
    if (this.employeeId) {
      localStorage.setItem('employeeId', this.employeeId);
    }
    if (loginResponse.role) {
      localStorage.setItem('userRole', loginResponse.role);
    }
  }

  // Load user data from localStorage
  loadUserDataFromStorage() {
    try {
      // Check if user is logged in
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        return;
      }
      
      // METHOD 1: Try to get from userData
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          this.processStoredUserData(userData);
          return;
        } catch (error) {}
      }
      
      // METHOD 2: Try to get dates from separate storage
      const datesDataStr = localStorage.getItem('employeeDates');
      if (datesDataStr) {
        try {
          const datesData = JSON.parse(datesDataStr);
          this.dateOfBirth = datesData.dateOfBirth;
          this.dateOfJoining = datesData.dateOfJoining;
        } catch (error) {}
      }
      
      // METHOD 3: Get user info from individual keys
      this.loadUserInfoFromIndividualKeys();
      
    } catch (error) {}
  }

  // Process stored user data
  private processStoredUserData(userData: any) {
    this.employeeId = userData.employeeId || '';
    this.username = userData.username || '';
    this.dateOfBirth = userData.dateOfBirth || null;
    this.dateOfJoining = userData.dateOfJoining || null;
    
    // If dates are null but we have full API response, extract from it
    if ((!this.dateOfBirth || !this.dateOfJoining) && userData.fullApiResponse) {
      this.extractDatesFromApiResponse(userData.fullApiResponse);
    }
  }

  // Extract dates from API response in storage
  private extractDatesFromApiResponse(apiResponse: any) {
    if (apiResponse.dateOfBirth && !this.dateOfBirth) {
      this.dateOfBirth = this.formatDateForComparison(apiResponse.dateOfBirth);
    }
    
    if (apiResponse.dateOfJoining && !this.dateOfJoining) {
      this.dateOfJoining = this.formatDateForComparison(apiResponse.dateOfJoining);
    }
  }

  // Load user info from individual keys
  private loadUserInfoFromIndividualKeys() {
    const username = localStorage.getItem('username');
    const employeeId = localStorage.getItem('employeeId');
    
    if (username) {
      this.username = username;
      this.employeeId = employeeId || username;
    }
  }

  // Check for celebrations
  checkForCelebrations() {
    // Load current data
    this.loadUserDataFromStorage();
    
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    
    // Check if we have user data
    if (!this.employeeId || !this.username) {
      return;
    }
    
    if (!this.dateOfBirth && !this.dateOfJoining) {
      return;
    }
    
    let birthdayMatch = false;
    let anniversaryMatch = false;
    let yearsCompleted = 0;

    // Check birthday
    if (this.dateOfBirth) {
      const birthdayResult = this.checkDateMatch(this.dateOfBirth, todayDay, todayMonth, 'birthday');
      birthdayMatch = birthdayResult.match;
    }
    
    // Check anniversary - UPDATED: Only matches if years completed > 0
    if (this.dateOfJoining) {
      const anniversaryResult = this.checkAnniversaryMatch(this.dateOfJoining, todayDay, todayMonth, todayYear);
      anniversaryMatch = anniversaryResult.match;
      yearsCompleted = anniversaryResult.years || 0;
    }
    
    // Trigger celebrations
    if (birthdayMatch && anniversaryMatch) {
      // Show both (anniversaryMatch is already guaranteed to have yearsCompleted > 0)
      this.triggerBirthdayCelebration();
      setTimeout(() => {
        this.triggerAnniversaryCelebration(yearsCompleted);
      }, 11000);
    } else if (birthdayMatch) {
      this.triggerBirthdayCelebration();
    } else if (anniversaryMatch) {
      // anniversaryMatch is already guaranteed to have yearsCompleted > 0
      this.triggerAnniversaryCelebration(yearsCompleted);
    }
  }

  // Check if a date matches today (for birthday)
  private checkDateMatch(dateString: string, todayDay: number, todayMonth: number, type: 'birthday'): { match: boolean; years?: number } {
    try {
      const datePart = dateString.split(' ')[0];
      const parts = datePart.split('-');
      
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (month === todayMonth && day === todayDay) {
          const todayYear = new Date().getFullYear();
          const years = todayYear - year;
          return { match: true, years };
        }
      }
    } catch (error) {}
    return { match: false };
  }

  // NEW METHOD: Check anniversary match - only returns true if years completed > 0
  private checkAnniversaryMatch(dateString: string, todayDay: number, todayMonth: number, todayYear: number): { match: boolean; years?: number } {
    try {
      const datePart = dateString.split(' ')[0];
      const parts = datePart.split('-');
      
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Check if date and month match
        if (month === todayMonth && day === todayDay) {
          // Calculate years completed
          const yearsCompleted = todayYear - year;
          
          // ONLY return match if at least 1 year has been completed
          if (yearsCompleted > 0) {
            return { match: true, years: yearsCompleted };
          }
        }
      }
    } catch (error) {}
    return { match: false };
  }

  triggerBirthdayCelebration() {
    this.celebrationType = 'birthday';
    this.employeeName = this.username;
    this.celebrationMessage = `Happy Birthday ${this.employeeName}! 🎂`;
    this.showModal = true;
    
    setTimeout(() => {
      this.closeModal();
    }, 10000);
  }

  triggerAnniversaryCelebration(years: number) {
    this.celebrationType = 'anniversary';
    this.employeeName = this.username;
    this.yearsCompleted = years;
    
    // Custom message based on years
    if (years === 1) {
      this.celebrationMessage = `Congratulations on completing 1 year! 🎉`;
    } else {
      this.celebrationMessage = `Congratulations on completing ${years} years! 🎉`;
    }
    
    this.showModal = true;
    
    setTimeout(() => {
      this.closeModal();
    }, 10000);
  }

  closeModal() {
    this.showModal = false;
    this.celebrationType = null;
    this.celebrationMessage = '';
  }

  // Public method to trigger from login component
  public handleLoginResponse(loginResponse: any) {
    this.processLoginResponse(loginResponse);
  }

  // Manual refresh
  refreshCelebrationCheck() {
    this.loadUserDataFromStorage();
    this.checkForCelebrations();
  }
}