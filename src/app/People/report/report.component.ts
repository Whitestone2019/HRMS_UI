import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  providers: [DatePipe]
})
export class ReportComponent implements OnInit {
  employees: any[] = [];
  selectedEmployee: any = null;
  employeeReportData: any[] = [];
  months: any[] = [];
  selectedMonth: string = '';
  showSingleReport: boolean = false;

  constructor(private apiService: ApiService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.initializeMonths();
    this.selectedMonth = this.getCurrentMonth();
    this.fetchMonthlyEmployeeData(this.selectedMonth);
  }

  initializeMonths(): void {
    const currentDate = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthValue = this.datePipe.transform(date, 'MM-yyyy');
      months.push({ label: this.datePipe.transform(date, 'MMMM yyyy'), value: monthValue });
    }
    this.months = months;
  }

  getCurrentMonth(): string {
    return this.datePipe.transform(new Date(), 'MM-yyyy')!;
  }

  onMonthChange(event: any): void {
    this.selectedMonth = event.target.value;
    this.fetchMonthlyEmployeeData(this.selectedMonth);
  }

  fetchMonthlyEmployeeData(month: string): void {
    this.apiService.getAttendanceDetailsByMonth(month).subscribe(
      (data) => {
        this.employees = data.map((item: any) => ({
          name: item.employeeName,
          id: item.attendanceId,
          department: 'N/A',
          daysPresent: item.distinctAttendanceCount,
          leavesTaken: item.leavesTaken
        }));
      },
      (error) => {
        console.error('Error fetching monthly data:', error);
      }
    );
  }

  viewEmployeeReport(employee: any): void {
    this.selectedEmployee = employee;
    this.fetchEmployeeReport(employee.id, this.selectedMonth); // Pass the selected month
    this.showSingleReport = true;
  }

  fetchEmployeeReport(employeeId: string, month: string): void {
    this.apiService.getEmployeeReportForMonth(employeeId, month).subscribe(
      (data) => {
        this.employeeReportData = data.map((record: any) => ({
          ...record,
          checkin: this.datePipe.transform(record.checkin, 'yyyy-MM-dd hh:mm:ss.SSS a'),
          checkout: this.datePipe.transform(record.checkout, 'yyyy-MM-dd hh:mm:ss.SSS a')
        }));
      },
      (error) => {
        console.error('Error fetching employee report:', error);
      }
    );
  }

  downloadReport(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.employees.map(emp => ({
        Name: emp.name,
        ID: emp.id,
        Department: emp.department,
        Days_Present: emp.daysPresent,
        Leaves_Taken: emp.leavesTaken
      }))
    );
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Report');
    XLSX.writeFile(workbook, 'Monthly_Employee_Report.xlsx');
  }

  downloadSingleEmployeeReport(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.employeeReportData.map(record => ({
        Date: record.attendanceDate,
        Attendance_Status: record.status,
        CHECK_IN_TIME: record.checkin,
        CHECK_OUT_TIME: record.checkout,
        Worked_Hours: record.totalHoursWorked,
        ID: record.attendanceId
      }))
    );
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${this.selectedEmployee.name}_Report`);
    XLSX.writeFile(workbook, `${this.selectedEmployee.name}_Employee_Report.xlsx`);
  }

  generateLeaveReport(): void {
    // Call the updated API method to fetch all leave reports
    this.apiService.getEmployeeLeaveReport().subscribe(
      (data) => {
        // Prepare the leave report data (month, totalDaysWorked, totalHoursWorked, remainingDays)
        const leaveReportData = data.map((record: any) => ({
          attendanceId: record.attendanceId,
          month: record.month,
          totalDaysWorked: record.totalDaysWorked,
          totalHoursWorked: record.totalHoursWorked,
          remainingDays: record.remainingDays
        }));

        // Create a new workbook
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();

        // Create the leave report worksheet
        const leaveReportWorksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(leaveReportData, {
          header: ['month', 'totalDaysWorked', 'totalHoursWorked', 'remainingDays']
        });

        // Add column headers starting from row 1
        XLSX.utils.sheet_add_aoa(leaveReportWorksheet, [['Month', 'Total Days Worked', 'Total Hours Worked', 'Remaining Days']], { origin: 'A1' });

        // Append the leave report data, starting from row 2
        XLSX.utils.sheet_add_json(leaveReportWorksheet, leaveReportData, {
          header: ['month', 'totalDaysWorked', 'totalHoursWorked', 'remainingDays'],
          skipHeader: true,
          origin: 'A2'
        });

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, leaveReportWorksheet, 'Employee Leave Report');

        // Write the Excel file
        XLSX.writeFile(workbook, 'Employee_Leave_Report.xlsx');
      },
      (error) => {
        console.error('Error generating leave report:', error);
      }
    );
  }

  backToMainPage(): void {
    this.showSingleReport = false;
  }
}
