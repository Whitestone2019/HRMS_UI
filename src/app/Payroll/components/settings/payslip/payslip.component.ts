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
  selectedMonth: string = ''; 
  userRole: string = '';
  employeeList: any[] = [];
  months: string[] = []; 
  isAdmin: boolean = false; 



  constructor(private apiService: ApiService, private userService: UserService) {}


  ngOnInit(): void {
    console.log("test");
    
    this.userRole = this.userService.role || '';
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.isAdmin = this.userService.isAdmin();
    if (this.userService.isAdmin()) {
      alert(this.isAdmin);
      this.loadAllEmployees();
    }

    this.populateMonths();
  }

  loadAllEmployees() {
    this.apiService.getAllEmployeeIds().subscribe(
      (data: any[]) => {
        this.employeeList = data;
      },
      (error) => {
        console.error('Error fetching employee IDs:', error);
      }
    );
  }

  populateMonths() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.months = monthNames.map((month, index) => `${month} ${currentYear}`);
    this.selectedMonth = this.months[currentDate.getMonth()];
  }

  sendPayslipToAll() {
    this.apiService.sendPayslipsToAll(this.selectedMonth).subscribe(
      (response) => {
        alert('Payslips sent to all employees successfully!');
      },
      (error) => {
        console.error('Error sending payslips:', error);
        alert('Failed to send payslips.');
      }
    );
  }

  sendPayslipByEmpId() {
    if (!this.employeeId || !this.selectedMonth) {
      alert('Please select an Employee ID and Month!');
      return;
    }

    this.apiService.sendPayslip(this.employeeId, this.selectedMonth).subscribe(
      (response) => {
        alert(`Payslip sent to Employee ID: ${this.employeeId} for ${this.selectedMonth}`);
      },
      (error) => {
        console.error('Error sending payslip:', error);
        alert('Failed to send payslip.');
      }
    );
  }

  downloadPayslip() {
    if (!this.employeeId || !this.selectedMonth) {
      alert('Please select an Employee ID and Month!');
      return;
    }

    this.apiService.downloadPayslip(this.employeeId, this.selectedMonth).subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${this.employeeId}_${this.selectedMonth}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      (error) => {
        console.error('Error downloading payslip:', error);
        alert('Failed to download payslip.');
      }
    );
  }
}
