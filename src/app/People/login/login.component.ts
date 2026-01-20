import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';
import { HttpClient } from '@angular/common/http';
import { MenuSelectionService } from '../../menu-selection.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  selectedMenu: string = 'home'; 
  user = { username: '', password: '' };
  errorMessage: string | null = null;
  passwordVisible = false;
  showFingerprintSection = false;
  isFingerprintScanning = false;
  fingerprintStatus = 'Ready to scan';
  fingerprintQuality = 0;
  fingerprintScanInterval: any;

  locationName: string = 'Fetching location...';
  latitude: string = '';
  longitude: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UserService,
    private http: HttpClient,
    private menuSelectionService: MenuSelectionService
  ) {}

  async ngOnInit() {
    try {
      const { lat, lon } = await this.getDeviceLocation();
      const locationName = await this.getLocationName(lat, lon);

      const stableLat = lat.toFixed(4);
      const stableLon = lon.toFixed(4);

      localStorage.setItem('userLatitude', stableLat);
      localStorage.setItem('userLongitude', stableLon);
      localStorage.setItem('userLocationName', locationName);

      this.latitude = stableLat;
      this.longitude = stableLon;
      this.locationName = locationName;

      console.log('📍 New location detected:', locationName);
    } catch (error) {
      console.error('Location error:', error);
      this.locationName = 'Location unavailable';
    }
  }

  async login() {
    try {
      const response: any = await this.apiService.login(this.user).toPromise();
      const token = response?.token;

      if (!token) {
        this.errorMessage = 'Invalid login response.';
        return;
      }

      // LOG THE FULL RESPONSE TO SEE ALL DATA
      console.log('✅ Login successful - FULL RESPONSE:', response);
      console.log('📅 Checking for celebration data in API response:');
      console.log('   todayCelebrations:', response.todayCelebrations);
      console.log('   celebrationCount:', response.celebrationCount);
      console.log('   employeeId (logged in user):', response.employeeId);
      console.log('   All response keys:', Object.keys(response));

      this.saveUserSession(response, token);
      this.navigateToDashboard();

    } catch (error: any) {
      this.errorMessage = error?.error || 'Invalid login credentials. Please try again.';
      console.error('Login error:', error);
    }
  }

  toggleFingerprintSection() {
    this.showFingerprintSection = !this.showFingerprintSection;
    this.errorMessage = null;
    
    if (this.showFingerprintSection && this.user.username) {
      this.checkFingerprintRegistration();
    }
  }

  async checkFingerprintRegistration() {
    const employeeId = this.user.username.trim().toUpperCase();
    if (!employeeId) return;

    try {
      const check: any = await this.http.get(
        `http://localhost:8088/HRMS/api/fingerprint/check-registration/${employeeId}`
      ).toPromise();

      if (!check.registered) {
        this.fingerprintStatus = 'No fingerprint registered for this user';
      } else {
        this.fingerprintStatus = 'Ready to scan - Place your registered finger';
      }
    } catch (err) {
      this.fingerprintStatus = 'Unable to check registration status';
    }
  }

  async startFingerprintScan() {
    const employeeId = this.user.username.trim().toUpperCase();
    if (!employeeId) {
      this.errorMessage = 'Please enter your Employee ID first';
      return;
    }

    this.isFingerprintScanning = true;
    this.fingerprintStatus = 'Scanning... Place your finger on the scanner';
    this.errorMessage = null;

    // Simulate scanner animation
    this.fingerprintScanInterval = setInterval(() => {
      this.fingerprintQuality = Math.floor(Math.random() * 30) + 70; // Simulate quality 70-100%
    }, 1000);

    try {
      // Check registration first
      const check: any = await this.http.get(
        `http://localhost:8088/HRMS/api/fingerprint/check-registration/${employeeId}`
      ).toPromise();

      if (!check.registered) {
        this.handleFingerprintError('No fingerprint registered for this user');
        return;
      }

      // Verify fingerprint
      const verifyRes: any = await this.http.post(
        'http://localhost:8088/HRMS/api/fingerprint/verify-login',
        { employeeId }
      ).toPromise();

      clearInterval(this.fingerprintScanInterval);

      if (!verifyRes.matched) {
        this.handleFingerprintError(`Fingerprint did not match (Score: ${verifyRes.score || 'Low'})`);
        return;
      }

      // Perform fingerprint login
      await this.performFingerprintLogin(employeeId);

    } catch (error: any) {
      this.handleFingerprintError(error?.error || 'Fingerprint login failed. Please try again.');
    }
  }

  cancelFingerprintScan() {
    this.isFingerprintScanning = false;
    this.fingerprintStatus = 'Scan cancelled';
    this.fingerprintQuality = 0;
    
    if (this.fingerprintScanInterval) {
      clearInterval(this.fingerprintScanInterval);
    }
  }

  private async performFingerprintLogin(employeeId: string) {
    try {
      const loginRes: any = await this.http.post(
        'http://localhost:8088/HRMS/api/fingerprint/login-fingerprint',
        { username: employeeId }
      ).toPromise();

      const token = loginRes?.token;
      if (!token) {
        this.handleFingerprintError('Login failed: No token received');
        return;
      }

      // Log fingerprint login response
      console.log('✅ Fingerprint login successful:', loginRes);
      console.log('📅 Celebration data in fingerprint login:', {
        todayCelebrations: loginRes.todayCelebrations,
        celebrationCount: loginRes.celebrationCount,
        employeeId: loginRes.employeeId
      });

      this.saveUserSession(loginRes, token);
      this.isFingerprintScanning = false;
      this.fingerprintStatus = 'Login successful!';
      
      setTimeout(() => {
        this.navigateToDashboard();
      }, 1000);

    } catch (error: any) {
      this.handleFingerprintError(error?.error || 'Login failed after fingerprint verification');
    }
  }

  private handleFingerprintError(message: string) {
    this.isFingerprintScanning = false;
    this.errorMessage = message;
    this.fingerprintStatus = 'Scan failed';
    
    if (this.fingerprintScanInterval) {
      clearInterval(this.fingerprintScanInterval);
    }
  }

  private saveUserSession(response: any, token: string) {
    // Store auth token
    localStorage.setItem('authToken', token);
    
    // Store user data in UserService
    this.userService.username = response.username;
    this.userService.employeeId = response.employeeId;
    this.userService.role = response.role;
    this.userService.reportTo = response.reportTo;
    this.userService.managerName = response.managerName;

    // Store individual keys in localStorage
    localStorage.setItem('username', response.username);
    localStorage.setItem('employeeId', response.employeeId);
    localStorage.setItem('userRole', response.role ?? '');
    localStorage.setItem('reportTo', response.reportTo ?? '');
    localStorage.setItem('managerName', response.managerName ?? '');
    
    // ✅ CRITICAL: STORE DATES IN LOCALSTORAGE
    localStorage.setItem('dateOfBirth', response.dateOfBirth || '');
    localStorage.setItem('dateOfJoining', response.dateOfJoining || '');
    
    // ✅ CRITICAL: STORE TODAY'S CELEBRATIONS - This is the key data!
    if (response.todayCelebrations && Array.isArray(response.todayCelebrations)) {
      localStorage.setItem('todayCelebrations', JSON.stringify(response.todayCelebrations));
      console.log('🎉 TodayCelebrations stored in localStorage:', response.todayCelebrations);
      console.log('🎉 Number of celebrations:', response.todayCelebrations.length);
      
      // Log each celebration for debugging
      response.todayCelebrations.forEach((celebration: any, index: number) => {
        console.log(`   Celebration ${index + 1}:`, {
          employeeName: celebration.employeeName,
          employeeId: celebration.employeeId,
          type: celebration.type,
          message: celebration.message,
          years: celebration.years
        });
      });
    } else {
      console.log('⚠️ No todayCelebrations in response or not an array');
      localStorage.removeItem('todayCelebrations');
    }
    
    // ✅ STORE CELEBRATION COUNT
    if (response.celebrationCount !== undefined) {
      localStorage.setItem('celebrationCount', response.celebrationCount.toString());
      console.log('🎉 Celebration count stored:', response.celebrationCount);
    }
    
    // ✅ CREATE EMPLOYEE DATES OBJECT FOR CELEBRATIONS
    const employeeDates = {
      dateOfBirth: response.dateOfBirth,
      dateOfJoining: response.dateOfJoining
    };
    localStorage.setItem('employeeDates', JSON.stringify(employeeDates));
    console.log('📅 Employee dates stored:', employeeDates);
    
    // ✅ CREATE CONSOLIDATED userData OBJECT WITH ALL DATA
    const userData = {
      employeeId: response.employeeId,
      username: response.username,
      dateOfBirth: response.dateOfBirth || null,
      dateOfJoining: response.dateOfJoining || null,
      email: response.email || '',
      role: response.role || '',
      token: response.token || '',
      reportTo: response.reportTo || '',
      managerName: response.managerName || '',
      message: response.message || '',
      todayCelebrations: response.todayCelebrations || [],
      celebrationCount: response.celebrationCount || 0
    };
    
    // ✅ STORE CONSOLIDATED DATA
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('💾 userData stored in localStorage with celebrations');
    
    console.log('✅ ALL CELEBRATION DATA STORED:', {
      dateOfBirth: response.dateOfBirth,
      dateOfJoining: response.dateOfJoining,
      todayCelebrations: response.todayCelebrations,
      celebrationCount: response.celebrationCount,
      loggedInEmployeeId: response.employeeId
    });

    // Store session data
    sessionStorage.setItem('sessionUsername', this.user.username);
    sessionStorage.setItem('sessionPassword', this.user.password);
    
    // ✅ TRIGGER CELEBRATION EVENT WITH FULL RESPONSE
    const loginEvent = new CustomEvent('userLoggedIn', { 
      detail: response 
    });
    window.dispatchEvent(loginEvent);
    
    console.log('🎉 Celebration event dispatched with response');
  }

  private navigateToDashboard() {
    // Critical: Set the menu via MenuSelectionService so sidebar updates correctly
    this.menuSelectionService.setSelectedMenu('home', '');

    // Also update localStorage directly if other parts still read it
    localStorage.setItem('mainMenu', 'home');
    localStorage.setItem('subMenu', '');
    localStorage.setItem('activeSidebar', 'my-space');

    // Navigate to dashboard
    this.router.navigate(['/dashboard']).then(() => {
      this.userService.setActiveMenu('home');
    });
  }

  getFingerprintQualityClass(): string {
    if (this.fingerprintQuality >= 80) return 'high';
    if (this.fingerprintQuality >= 60) return 'medium';
    return 'low';
  }

  // Existing location methods remain the same
  private getDeviceLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          console.log('📍 Raw coordinates:', pos.coords.latitude, pos.coords.longitude);
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        err => reject('GPS error: ' + err.message),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    });
  }

  private async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const data: any = await this.http.get(url).toPromise();

      console.log('📍 Reverse geocode data:', data);

      if (data.city || data.locality) {
        return `${data.locality || data.city}, ${data.principalSubdivision || data.countryName}`;
      } else if (data.localityInfo?.administrative) {
        return data.localityInfo.administrative[0].name;
      } else {
        return 'Unknown precise location';
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Location unavailable';
    }
  }

  navigateToResetPassword() {
    this.router.navigate(['/reset-password']);
  }

  navigateTosetfingerPrint() {
    this.router.navigate(['/fingerprint']);
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
}