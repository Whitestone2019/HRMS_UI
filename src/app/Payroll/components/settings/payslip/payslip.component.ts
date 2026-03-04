import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../api.service';
import { UserService } from '../../../../user.service';

@Component({
  selector: 'app-payslip',
  templateUrl: './payslip.component.html',
  styleUrls: ['./payslip.component.css']
})
export class PayslipComponent implements OnInit {
  employeeId: string = '';
  username: string = '';
  employeeDisplay: string = '';
  selectedMonth: string = '';
  userRole: string = '';
  isAdmin: boolean = false;
  months: { name: string, value: string, month: number, year: number }[] = [];
  
  // Loading state
  isDownloading: boolean = false;

  // Month names array
  private monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private apiService: ApiService, 
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Get user details from localStorage
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.userRole = localStorage.getItem('userRole') || '';
    this.username = localStorage.getItem('username') || '';
    
    console.log('Logged in user details:', {
      employeeId: this.employeeId,
      username: this.username,
      role: this.userRole
    });
    
    // Set the display string
    if (this.employeeId) {
      if (this.username) {
        this.employeeDisplay = `${this.employeeId} - ${this.username}`;
      } else {
        this.employeeDisplay = `${this.employeeId} - No Name`;
      }
    } else {
      this.employeeDisplay = 'No employee details found';
    }

    this.populateMonths();
  }

  /**
   * Populates months based on current date:
   * - PREVIOUS month is ALWAYS shown
   * - CURRENT month is shown ONLY AFTER 28th
   * - On the 1st of new month, previous month automatically updates
   */
  populateMonths(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (0=January)
    const currentDay = currentDate.getDate();
    
    console.log('\n========== MONTH SELECTION LOGIC ==========');
    console.log(`Current Date: ${this.monthNames[currentMonth]} ${currentDay}, ${currentYear}`);
    
    this.months = [];
    
    // ===========================================
    // STEP 1: Calculate PREVIOUS MONTH
    // This changes automatically when month changes
    // ===========================================
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    
    // Handle January (month 0) - previous month is December of previous year
    if (previousMonth < 0) {
      previousMonth = 11; // December
      previousYear = currentYear - 1;
    }
    
    const previousMonthName = this.monthNames[previousMonth];
    const previousMonthValue = `${previousMonthName} ${previousYear}`;
    
    // ALWAYS add previous month
    this.months.push({
      name: previousMonthName,
      value: previousMonthValue,
      month: previousMonth + 1, // Convert to 1-12 format for backend
      year: previousYear
    });
    
    console.log(`✅ PREVIOUS MONTH: ${previousMonthValue} (ALWAYS available)`);
    
    // ===========================================
    // STEP 2: Check if CURRENT MONTH should be added
    // Only add if on or after 28th of current month
    // ===========================================
    if (currentDay >= 28) {
      const currentMonthName = this.monthNames[currentMonth];
      const currentMonthValue = `${currentMonthName} ${currentYear}`;
      
      this.months.push({
        name: currentMonthName,
        value: currentMonthValue,
        month: currentMonth + 1, // Convert to 1-12 format for backend
        year: currentYear
      });
      
      console.log(`✅ CURRENT MONTH: ${currentMonthValue} (available after 28th)`);
    } else {
      console.log(`⏸️ CURRENT MONTH: Not available yet (need day >= 28, current day = ${currentDay})`);
    }
    
    // ===========================================
    // STEP 3: Set default selected month
    // Always default to the first month (previous month)
    // ===========================================
    if (this.months.length > 0) {
      this.selectedMonth = this.months[0].value;
      console.log(`🎯 Default selected: ${this.selectedMonth}`);
    }
    
    console.log(`📊 Total months available: ${this.months.length}`);
    console.log('============================================\n');
  }

  downloadPayslip(): void {
    if (!this.employeeId || !this.selectedMonth) {
      alert('Please select a Month!');
      return;
    }

    console.log('Downloading payslip for:', {
      employeeId: this.employeeId,
      username: this.username,
      month: this.selectedMonth
    });

    this.isDownloading = true;

    this.apiService.downloadPayslip(this.employeeId, this.selectedMonth).subscribe(
      (response: Blob) => {
        this.isDownloading = false;
        
        if (response && response.type === 'application/pdf' && response.size > 0) {
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Payslip_${this.employeeId}_${this.selectedMonth.replace(' ', '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Payslip downloaded successfully');
        } else {
          this.showNoDataPopup();
        }
      },
      (error) => {
        this.isDownloading = false;
        console.error('❌ Error downloading payslip:', error);
        this.showNoDataPopup();
      }
    );
  }

  showNoDataPopup(): void {
    alert(`No salary data found for Employee ${this.employeeId} for the month of ${this.selectedMonth}.`);
  }
}