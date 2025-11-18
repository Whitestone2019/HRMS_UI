import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user = { username: '', password: '' };
  errorMessage: string | null = null;
  passwordVisible = false;

  locationName: string = 'Fetching location...'; // 🌍 show readable location name
  latitude: string = '';
  longitude: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private userService: UserService,
    private http: HttpClient
  ) {}

  // ✅ On page load — fetch stored location or get fresh one if not available
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
    
    // Optional alert
   // alert(`📍 Your location:\n${this.locationName}`);
  }

  // ✅ Login process
  async login() {
    try {
      const response: any = await this.apiService.login(this.user).toPromise();
      const token = response?.token;

      if (!token) {
        this.errorMessage = 'Invalid login response.';
        return;
      }

      // Save session details
      localStorage.setItem('authToken', token);
      this.userService.username = response.username;
      this.userService.employeeId = response.employeeId;
      this.userService.role = response.role;
      this.userService.reportTo = response.reportTo;
      this.userService.managerName = response.managerName;

      localStorage.setItem('username', response.username);
      localStorage.setItem('employeeId', response.employeeId);
      localStorage.setItem('userRole', response.role ?? '');
      localStorage.setItem('managerId', response.reportTo ?? '');
      localStorage.setItem('managerName', response.managerName ?? '');

      sessionStorage.setItem('sessionUsername', this.user.username);
      sessionStorage.setItem('sessionPassword', this.user.password);

      this.router.navigate(['/dashboard']).then(() => {
        this.userService.setActiveMenu('home');
        localStorage.setItem('activeSidebar', 'my-space');
      });

    } catch (error: any) {
      this.errorMessage = error?.error || 'Invalid login credentials. Please try again.';
      console.error('Login error:', error);
    }
  }

  // ✅ Get device coordinates
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
        enableHighAccuracy: true,  // 🔹 Force GPS
        timeout: 20000,            // Wait up to 20s
        maximumAge: 0              // No cache
      }
    );
  });
}

  // ✅ Convert coordinates → readable address
private async getLocationName(lat: number, lon: number): Promise<string> {
  try {
    // You can use OpenStreetMap (free, basic)
    // const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    // OR use BigDataCloud (more precise, faster, no key needed)
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

  loginWithFingerprint() {
  const employeeId = this.user.username.trim(); // using username field as employeeId for now
  if (!employeeId) {
    this.errorMessage = 'Please enter Employee ID before fingerprint login.';
    return;
  }

  const pidOptions = `<?xml version="1.0"?>
    <PidOptions ver="1.0">
      <Opts fCount="1" fType="0" format="0" pidVer="2.0" timeout="10000" env="P" />
    </PidOptions>`;

  fetch('http://127.0.0.1:11100/rd/capture', {
    method: 'CAPTURE',
    body: pidOptions,
    headers: { 'Content-Type': 'text/xml' }
  })
    .then(res => res.text())
    .then(pidData => {
      console.log('Captured Fingerprint:', pidData);

      this.apiService.fingerprintLogin(employeeId, pidData).subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('employeeId', response.employeeId);
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.message;
          }
        },
        error: err => {
          console.error(err);
          this.errorMessage = 'Login failed. Please try again.';
        }
      });
    })
    .catch(err => {
      console.error('Capture error:', err);
      this.errorMessage = 'Failed to capture fingerprint. Check Mantra RD Service.';
    });
}

  

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
}
