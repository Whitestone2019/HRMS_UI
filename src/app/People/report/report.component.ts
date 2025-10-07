import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  viewMode: 'list' | 'calendar' = 'list';

  // Calendar
  calendarDays: any[] = [];
  daysOfWeek: string[] = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  currentCalendarDate: Date = new Date();

  constructor(private apiService: ApiService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.initializeMonths();
    this.selectedMonth = this.getCurrentMonth();
    this.fetchMonthlyEmployeeData(this.selectedMonth);
  }

  initializeMonths(): void {
    const currentDate = new Date();
    this.months = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        label: this.datePipe.transform(date, 'MMMM yyyy'),
        value: this.datePipe.transform(date, 'MM-yyyy')
      };
    });
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
      data => this.employees = data.map((item: any) => ({
        name: item.employeeName,
        id: item.attendanceId,
        department: 'N/A',
        daysPresent: item.distinctAttendanceCount,
        leavesTaken: item.leavesTaken
      })),
      error => console.error(error)
    );
  }

  viewEmployeeReport(employee: any): void {
    this.selectedEmployee = employee;
    this.showSingleReport = true;
    this.currentCalendarDate = new Date(); // reset month
    this.fetchEmployeeReport(employee.id, this.selectedMonth);
  }

  fetchEmployeeReport(employeeId: string, month: string): void {
    this.apiService.getEmployeeReportForMonth(employeeId, month).subscribe(
      data => {
        this.employeeReportData = data.map((record: any) => ({
          ...record,
          checkin: this.datePipe.transform(record.checkin,'yyyy-MM-dd hh:mm:ss a'),
          checkout: this.datePipe.transform(record.checkout,'yyyy-MM-dd hh:mm:ss a')
        }));
        this.generateCalendarView(this.employeeReportData);
      },
      error => console.error(error)
    );
  }

  // Calendar Methods
  prevMonth(): void {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.generateCalendarView(this.employeeReportData);
  }

  nextMonth(): void {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.generateCalendarView(this.employeeReportData);
  }

  generateCalendarView(data: any[]): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth(); 
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [];

    // empty slots
    for (let i = 0; i < firstDayOfWeek; i++) this.calendarDays.push({ date:'', status:'', isSunday:false });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.datePipe.transform(new Date(year, month, day), 'yyyy-MM-dd');
      const record = data.find(r => r.attendanceDate === dateStr);
      const isSunday = (firstDayOfWeek + day - 1) % 7 === 0;
      this.calendarDays.push({
        date: day,
        status: record ? record.status : 'Absent',
        isSunday
      });
    }
  }

  // Download Reports
  downloadReport(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.employees.map(emp => ({
      Name: emp.name,
      ID: emp.id,
      Department: emp.department,
      Days_Present: emp.daysPresent,
      Leaves_Taken: emp.leavesTaken
    })));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Report');
    XLSX.writeFile(wb,'Monthly_Employee_Report.xlsx');
  }

  downloadSingleEmployeeReport(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.employeeReportData.map(record => ({
      Date: record.attendanceDate,
      Attendance_Status: record.status,
      Check_In: record.checkin,
      Check_Out: record.checkout,
      Worked_Hours: record.totalHoursWorked
    })));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${this.selectedEmployee.name}_Report`);
    XLSX.writeFile(wb, `${this.selectedEmployee.name}_Employee_Report.xlsx`);
  }

  generateLeaveReport(): void {
    this.apiService.getEmployeeLeaveReport().subscribe(
      data => {
        const leaveData = data.map((record: any) => ({
          Month: record.month,
          Total_Days_Worked: record.totalDaysWorked,
          Total_Hours_Worked: record.totalHoursWorked,
          Remaining_Days: record.remainingDays
        }));
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(leaveData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');
        XLSX.writeFile(wb,'Employee_Leave_Report.xlsx');
      },
      error => console.error(error)
    );
  }

  backToMainPage(): void {
    this.showSingleReport = false;
  }
}
