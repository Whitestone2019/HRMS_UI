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
  // employeeName: string = '';
  username: string = '';
  employeeDisplay: string = '';
  selectedMonth: string = '';
  userRole: string = '';
  isAdmin: boolean = false;
  months: { name: string, value: string, month: number, year: number }[] = [];
  
  // Loading state
  isDownloading: boolean = false;

  constructor(
    private apiService: ApiService, 
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Get user details from localStorage
    this.employeeId = localStorage.getItem('employeeId') || '';
    // this.employeeName = localStorage.getItem('employeeName') || '';
    this.userRole = localStorage.getItem('userRole') || '';
    this.username = localStorage.getItem('username')|| '';
    
    console.log('Logged in user details from localStorage:', {
      employeeId: this.employeeId,
      // employeeName: this.employeeName,
      username: this.username,
      role: this.userRole
    });
    
    // Set the display string in the format "EmployeeID - EmployeeName"
    if (this.employeeId) {
      if (this.username) {
        this.employeeDisplay = `${this.employeeId} - ${this.username}`;
      } else {
        this.employeeDisplay = `${this.employeeId} - No Name`;
      }
    } else {
      this.employeeDisplay = 'No employee details found';
    }

    this.populatePreviousMonthOnly();
  }

  populatePreviousMonthOnly(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.months = [];
    
    // Calculate previous month
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    
    if (previousMonth < 0) {
      previousMonth = 11; // December
      previousYear = currentYear - 1;
    }
    
    const previousMonthName = monthNames[previousMonth];
    const previousMonthValue = `${previousMonthName} ${previousYear}`;
    
    // Add only the previous month
    this.months.push({
      name: previousMonthName,
      value: previousMonthValue,
      month: previousMonth + 1,
      year: previousYear
    });
    
    // Set default selected month
    if (this.months.length > 0) {
      this.selectedMonth = this.months[0].value;
    }
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
        } else {
          this.showNoDataPopup();
        }
      },
      (error) => {
        this.isDownloading = false;
        console.error('Error downloading payslip:', error);
        this.showNoDataPopup();
      }
    );
  }

  showNoDataPopup(): void {
    alert(`No salary data found for Employee ${this.employeeId} for the month of ${this.selectedMonth}.`);
  }
}