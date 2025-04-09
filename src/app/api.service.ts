import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, Timestamp } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SalaryComponent } from './Payroll/models/salary-component.model';
import { Expense, ExpenseStats } from './Expense/shared/models/expense.model';
import { Advance } from './Expense/shared/models/advance.model';
import { Emp, Role } from './People/addcandidate/addcandidate.component';
import { trigger } from '@angular/animations';

// Define interfaces for data structures
interface User {
  token: string;
  username: string;
  employeeId: string; // Assuming employeeId is part of the login response
  role: string;
}

interface AttendancePayload {
  attendanceid: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  checkinlocation?: string;
  checkOutDuration?: number;
}

interface AttendanceResponse {
  id: number;
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private apiUrl = environment.backendUrl; // Your backend API URL 
  private key = environment.apiKey;
  constructor(private http: HttpClient, private dialog: MatDialog) { }
  // Login API call
  login(user: { username: string; password: string }): Observable<User> {
    const url = `${this.apiUrl}/login`;
    const key1 = `${this.key}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'apiKey': key1 // Manually passing the API key
    });

    return this.http.post<User>(url, JSON.stringify(user), { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error);
        this.openDialog('Error', `Login failed: ${error.error?.message || 'Invalid Credentials'}`);
        return throwError(() => new Error(error.message));
      })
    );
  }



  getCheckInStatus(employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/attendance/status/${employeeId}`;
    return this.http.get<any>(url).pipe(
      tap(() => this.openDialog('Success', 'Check-in status retrieved successfully.')),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching check-in status:', error);
        this.openDialog('Error', `Failed to retrieve check-in status: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      })
    );
  }

  addEmployee1(employeeData: any): Observable<any> {
    const url = `${this.apiUrl}/onboard`;
    return this.http.post(url, employeeData).pipe(
      tap((response) => {
        console.log('API Response:', response);
        this.openDialog('Success', 'Employee added successfully!');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding employee:', error);
        this.openDialog('Error', `Failed to add employee: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      })
    );
  }

  markAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
    const url = `${this.apiUrl}/checkIn`;
    return this.http.post<AttendanceResponse>(url, attendanceData).pipe(
      tap(() => this.openDialog('Success', 'Attendance marked successfully.')),
      catchError((error: HttpErrorResponse) => {
        console.error('Error marking attendance:', error);
        this.openDialog('Error', `Failed to mark attendance: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      })
    );
  }

  // Check-Out API call
  checkoutAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(`${this.apiUrl}/checkOut`, attendanceData).pipe(
      tap(() => this.openDialog('Success', 'Check-out successful.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Check-In API call
  checkIn(status: string, locationName: string): Observable<AttendanceResponse> {
    const attendanceid = this.getEmployeeId();
    if (!attendanceid) {
      const error = 'Employee ID not found. Please log in again.';
      this.openDialog('Error', error);
      throw new Error(error);
    }

    const attendanceData: AttendancePayload = {
      status,
      checkinlocation: locationName,
      attendanceid,
    };

    console.log('Check-In Request Payload:', JSON.stringify(attendanceData, null, 2));
    return this.markAttendance(attendanceData);
  }

  // Check-Out API call
  checkOut(status: string, locationName: string, checkOutDuration: number): Observable<AttendanceResponse> {
    const attendanceid = this.getEmployeeId();
    if (!attendanceid) {
      const error = 'Employee ID not found. Please log in again.';
      this.openDialog('Error', error);
      throw new Error(error);
    }

    const attendanceData: AttendancePayload = {
      status,
      checkinlocation: locationName,
      checkOutDuration,
      attendanceid,
    };

    return this.checkoutAttendance(attendanceData);
  }

  // Get attendance for a specific date
  getAttendanceForDate(employeeId: string, date: string): Observable<AttendanceResponse | null> {
    return this.http
      .get<AttendanceResponse>(`${this.apiUrl}/attendance/${employeeId}/${date}`)
      .pipe(
        tap(() => this.openDialog('Success', 'Attendance data retrieved successfully.')),
        catchError(this.handleError.bind(this))
      );
  }

  // Reset Password
  resetPassword(data: { employeeId: string; oldPassword: string; newPassword: string }): Observable<any> {
    const url = `${this.apiUrl}/resetPassword`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(url, JSON.stringify(data), { headers }).pipe(
      tap(() => this.openDialog('Success', 'Password reset successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Fetch attendance data within a date range
  fetchAttendanceData(employeeId: string, startDate: string, endDate: string): Observable<any[]> {
    const url = `${this.apiUrl}/attendance/data?employeeId=${encodeURIComponent(employeeId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    return this.http.get<any[]>(url).pipe(
      tap(() => this.openDialog('Success', 'Attendance data fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get all attendance records within a date range
  getAttendanceAll(employeeId: string, startDate: string, endDate: string): Observable<any> {
    const url = `${this.apiUrl}/attendance/data?employeeId=${encodeURIComponent(employeeId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    return this.http.get<any[]>(url).pipe(
      tap(() => this.openDialog('Success', 'All attendance records retrieved successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get Employee ID from localStorage
  private getEmployeeId(): string | null {
    return localStorage.getItem('employeeId');
  }


  submitExpense(expenseData: FormData): Observable<any> {
    const apiUrl = `${this.apiUrl}/expenses`;
    return this.http.post<any>(apiUrl, expenseData).pipe(
      tap(() => this.openDialog('Success', 'Expense submitted successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getTravelRecords(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/travel-records`).pipe(
      tap(() => this.openDialog('Success', 'Travel records fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  submitTravelRequest(requestData: any): Observable<any> {
    const url = `${this.apiUrl}/travel/addTravelRequest`;
    return this.http.post(url, requestData).pipe(
      tap(() => this.openDialog('Success', 'Travel request submitted successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  approveEmployee(employeeData1: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/approve`, employeeData1, { headers }).pipe(
      tap(() => this.openDialog('Success', 'Employee approved successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  deleteEmployee(empId: string): Observable<any> {
    const url = `${this.apiUrl}/delete/${empId}`;

    return this.http.patch(url, {}).pipe(
      tap(() => this.openDialog('Success', 'Employee marked as deleted successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  addEmployee(employeeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees/email`, employeeData).pipe(
      tap(() => this.openDialog('Success', 'Employee added successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees`).pipe(
      tap(() => this.openDialog('Success', 'Employees fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }


  getEmployeeDetailsById(empId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees/${empId}`).pipe(
      tap(() => this.openDialog('Success', 'Employee details fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getUserByEmpId(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${username}`).pipe(
      tap(() => this.openDialog('Success', 'User details fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees`).pipe(
      tap(() => this.openDialog('Success', 'Users fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  saveProfile(profile: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/saveProfile`, profile).pipe(
      tap(() => this.openDialog('Success', 'Profile saved successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  updateProfile(id: number, profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/saveProfile/${id}`, profile).pipe(
      tap(() => this.openDialog('Success', 'Profile updated successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getAllOrganizations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orgProfile`).pipe(
      tap(() => this.openDialog('Success', 'Organizations fetched successfully.')),
      catchError(this.handleError.bind(this))
    );
  }
  deleteProfile(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orgProfile/${id}`).pipe(
      tap(() => {
        // Handle success
        this.openDialog('Success', 'Organization profile deleted successfully.');
      }),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getLocation`).pipe(
      tap((locations) => {
        console.log('Successfully fetched locations', locations);
      }),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Add a new location
  addLocation(location: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addLocation`, location).pipe(
      tap((newLocation) => {
        console.log('Location added successfully', newLocation);
        this.openDialog('Success', 'Location added successfully!');
      }),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Update an existing location
  updateLocation(location: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateLocation/${location.id}`, location).pipe(
      tap((updatedLocation) => {
        console.log('Location updated successfully', updatedLocation);
        this.openDialog('Success', 'Location updated successfully!');
      }),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Delete a location
  deleteLocation(locationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deleteLocation/${locationId}`).pipe(
      tap(() => {
        console.log('Location deleted successfully');
        this.openDialog('Success', 'Location deleted successfully!');
      }),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  getAllDesignations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getdesignations`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getDesignationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getdesignations/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  addDesignation(designation: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/adddesignations`, designation).pipe(
      tap(() => this.openDialog('Success', 'Designation added successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  updateDesignation(id: number, designation: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updatedesignations/${id}`, designation).pipe(
      tap(() => this.openDialog('Success', 'Designation updated successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  deleteDesignation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deldesignations/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Designation deleted successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get all departments
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getDepartment`).pipe(
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Save a new department
  saveDepartment(department: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addDepartment`, department).pipe(
      tap(() => this.openDialog('Success', 'Department saved successfully!')),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Update an existing department
  updateDepartment(id: number, department: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateDepartment/${id}`, department).pipe(
      tap(() => this.openDialog('Success', 'Department updated successfully!')),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Delete a department
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteDepartment/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Department deleted successfully!')),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Get Settings
  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getsettings`).pipe(
      tap(() => console.log('Fetched settings successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  // Save Settings
  saveSettings(settings: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addsettings`, settings).pipe(
      tap(() => this.openDialog('Success', 'Settings saved successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get PT Slabs
  getPTSlabs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getpt-slabs`).pipe(
      tap(() => console.log('Fetched PT slabs successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  // Save PT Slab
  savePTSlab(slab: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addpt-slabs`, slab).pipe(
      tap(() => this.openDialog('Success', 'PT slab saved successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  // Delete PT Slab
  deletePTSlab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delpt-slabs/${id}`).pipe(
      tap(() => this.openDialog('Success', 'PT slab deleted successfully!')),
      catchError(this.handleError.bind(this))
    );
  }

  getComponents(): Observable<SalaryComponent[]> {
    return this.http.get<SalaryComponent[]>(`${this.apiUrl}/getcomponent`).pipe(
      tap(() => this.openDialog('Success', 'Fetched salary components successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get salary component by ID
  getComponentById(id: string): Observable<SalaryComponent> {
    return this.http.get<SalaryComponent>(`${this.apiUrl}/getcomponent/${id}`).pipe(
      tap(() => this.openDialog('Success', `Fetched salary component with ID: ${id}`)),
      catchError(this.handleError.bind(this))
    );
  }

  // Add a new salary component
  addComponent(component: SalaryComponent): Observable<SalaryComponent> {
    return this.http.post<SalaryComponent>(`${this.apiUrl}/addcomponent`, component).pipe(
      tap(() => this.openDialog('Success', 'Added new salary component successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Update an existing salary component
  updateComponent(id: string, component: SalaryComponent): Observable<SalaryComponent> {
    return this.http.put<SalaryComponent>(`${this.apiUrl}/updatecomponent/${id}`, component).pipe(
      tap(() => this.openDialog('Success', `Updated salary component with ID: ${id} successfully.`)),
      catchError(this.handleError.bind(this))
    );
  }

  // Delete a salary component
  deleteComponent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletecomponent/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Salary component deleted successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  // Get attendance details by month
  getAttendanceDetailsByMonth(month: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getAttendanceDetails/${month}`).pipe(
      tap(() => this.openDialog('Success', `Fetched attendance details for month: ${month}`)),
      catchError(this.handleError.bind(this))
    );
  }

  // Get employee report for a specific month
  getEmployeeReportForMonth(attendanceId: string, month: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getEmployeeReport/${attendanceId}/${month}`).pipe(
      tap(() => this.openDialog('Success', `Fetched employee report for ID: ${attendanceId} and month: ${month}`)),
      catchError(this.handleError.bind(this))
    );
  }

  // Get employee leave report
  getEmployeeLeaveReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/generateLeaveReport`).pipe(
      tap(() => this.openDialog('Success', 'Fetched leave report successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getLeaveCounts(empId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/leave/count?empId=${empId}`).pipe(
      tap(() => this.openDialog('Success', `Leave counts fetched for Employee ID: ${empId}`)),
      catchError(this.handleError.bind(this))
    );
  }

  rejectLeaveRequest1(empid: string, leavereason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rejectLeaveRequest`, { empid, leavereason }).pipe(
      tap(() => this.openDialog('Success', `Leave request rejected for Employee ID: ${empid}`)),
      catchError(this.handleError.bind(this))
    );
  }


  rejectLeaveRequest(empId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rejupdateEntityFlag?empid=${empId}`, null).pipe(
      tap(() => this.openDialog('Success', `Leave request updated for Employee ID: ${empId}`)),
      catchError(this.handleError.bind(this))
    );
  }

  putLeaveReq(data: any): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequest`; // Adjust if needed
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<any>(endpoint, data, { headers }).pipe(
      tap(() => this.openDialog('Success', 'Leave request submitted successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  getLeaveRequests(empId: string): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequests/get/${empId}`; // Ensure empId is passed in the URL
    return this.http.get<any>(endpoint).pipe(
      tap(() => this.openDialog('Success', 'Fetched leave requests successfully.')),
      catchError(this.handleError.bind(this))
    );
  }

  updateEntityFlag(empId: string, leavereason: string): Observable<any> {
    // Add leaveType as a query parameter
    return this.http.put<any>(`${this.apiUrl}/updateEntityFlag?empid=${empId}&leavereason=${leavereason}`, null).pipe(
      tap(() => this.openDialog('Success', `Entity flag updated successfully for Employee ID: ${empId} and Leave Type: ${leavereason}`)),
      catchError(this.handleError.bind(this))
    );
  }


  getUpcomingHolidays(): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequests/upcomingHolidays`; // Endpoint to fetch upcoming holidays
    return this.http.get<any>(endpoint).pipe(
      tap(() => this.openDialog('Success', 'Fetched upcoming holidays successfully.')),
      catchError(this.handleError.bind(this))
    );
  }


  /// sowmiya

  submitAdvance(formData: FormData): Observable<any> {
    const apiUrl = `${this.apiUrl}/advances`; // Construct the URL dynamically
    return this.http.post<any>(apiUrl, formData).pipe(
      tap((response) => {
        console.log('Response from submitAdvance:', response);
      }),
      catchError(this.handleError) // Handle errors
    );
  }



  // submitExpense(expenseDetails: any): Observable<any> {
  //   const apiUrl = 'http://localhost:8088/HRMS/expenses';  // Correct back-end endpoint
  //   return this.http.post<any>(apiUrl, expenseDetails);
  // }


  getApproval(employeeId: string): Observable<any> {

    return this.http.get<any>(`${this.apiUrl}/expensesbyid/${employeeId}`);
  }



  getExpensesEmp(employeeId: string): Observable<any> {

    return this.http.get<any>(`${this.apiUrl}/expensesbyid/${employeeId}`);
  }


  updateExpense2(expenseId: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/del/update/expenses/${expenseId}`, formData, {
      headers: { 'Accept': 'application/json' },
    });
  }


  getApprovals(employeeId: any): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/app/expensesbyid/${employeeId}`);
  }

  getAllApprovals(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/app/expensesbyid/all`);
  }

  updateExpense(expenseId: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/expenses/${expenseId}`, {});
  }

  updateExpense1(expenseId: string, requestData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rej/expenses/${expenseId}`, requestData);
  }


  getReceiptUrl(expenseId: string): Observable<Blob> {
    const url = `${this.apiUrl}/expenses/receipt/${expenseId}`;
    return this.http.get(url, { responseType: 'blob' });
  }


  getExpenseById1(expenseId: string): Observable<any> {

    return this.http.get<any>(`${this.apiUrl}/expenses/${expenseId}`).pipe(
      tap((response) => {
        console.log('Response from API:', response); // Log the response
      })
    );
  }

  saveSalaryTemplate(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/salary-template/save`, payload);
  }
  getTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates`);
  }

  // Get a single template by ID
  getTemplateById(templateId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates/${templateId}`);
  }

  // API call to fetch payslip details based on employee ID
  getPayslipDetails(requestPayload: { employeeId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/payslip`, requestPayload);
  }

  updateAdvance(advanceId: any, advanceDetails: any) {
    throw new Error('Method not implemented.');
  }
  getAdvanceById1(arg0: string) {
    throw new Error('Method not implemented.');
  }
  getAdvanceById2: any;

  getAdvances(empId: string): Observable<Advance[]> {
    if (!empId) {
      throw new Error('Employee ID is required');
    }

    console.log('Fetching advances for Employee ID:', empId);

    return this.http.get<Advance[]>(`${this.apiUrl}/advances/${empId}`).pipe(
      catchError(this.handleError)  // ✅ Error handling
    );
  }

  deleteExpense: any;

  getExpenseById(expenseId: string) {
    return this.http.get<any>(`/edit/expenses/${expenseId}`);
  }

  getexpenseform(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/expense-form`).pipe(
      catchError(this.handleError)
    );
  }

  getExpenses(): Observable<any[]> {
    console.log('API Call: Fetching all expenses');
    return this.http.get<any[]>(`${this.apiUrl}/expenses`);
  }



  getAdvanceById3(advanceId: string) {
    return this.http.get<{ success: boolean; data: Advance; message?: string }>(
      `${this.apiUrl}/edit/advances/${advanceId}`
    );
  }

  getAdvance(employeeId: string): Observable<Advance[]> {
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }
    return this.http.get<Advance[]>(`${this.apiUrl}/advances/${employeeId}`);
  }


  // Fetch employee details by ID
  getEmployeeDetails(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payroll/employee/${employeeId}`);
  }

  getAllEmployeeIds(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payroll/employees`);
  }

  updateAdvance1(advanceId: string, requestData: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/update/advances/${advanceId}`,
      requestData, // Ensure it's not empty
      {
        headers: { 'Content-Type': 'application/json' }, // JSON headers
      }
    );
  }


  saveOrUpdateEmployeeSalary(employeeSalary: any): Observable<any> {
    const url = `${this.apiUrl}/employeesalarydetail`;
    console.log("Final Form Data:", JSON.stringify(employeeSalary, null, 2));
    return this.http.post<any>(url, employeeSalary);
  }

  getExpenseStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/expenses/stats`);
  }

  getAllEmployeessalary(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employeesalarydetail`);
  }
  runPayroll(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Payroll`, {});
  }

  getEmployeeSalaryDetails(empId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/salary/${empId}`);
  }

  exportPayrollData(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportsalaryupload`, { responseType: 'blob' });
  }

  sendPayslip(employeeId: string, month: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payslips/send`, { employeeId, month });
  }

  sendPayslipsToAll(month: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payslips/send/all`, { month });
  }

  downloadPayslip(employeeId: string, month: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payslip/download/${employeeId}/${month}`, {
      responseType: 'blob'
    });
  }
  getLocationsapi(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/locations`);
  }

  getAllowanceAmount(locationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/allowance/${locationId}`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/getrole`);
  }

  getManagers(): Observable<Emp[]> {
    return this.http.get<Emp[]>(`${this.apiUrl}/getmanagers`);
  }

  getManagerEmail(empId: string): Observable<{ email: string }> {
    return this.http.get<{ email: string }>(`${this.apiUrl}/manager-email/${empId}`);
  }


  getAdvanceStats(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/advances/stats');
  }
  getEmployeeName(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employees/${employeeId}/name`).pipe(
      tap(() => console.log(`Fetching employee name for ID: ${employeeId}`)),
      catchError(this.handleError.bind(this))
    );
  }
  getPendingEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/approvals/pending-employees`);
  }
  getAllExpenses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/expenses`);
  }
  getAllAdvances(): Observable<Advance[]> {
    const url = `${this.apiUrl}/advances`; // Adjust the URL if necessary
    return this.http.get<Advance[]>(this.apiUrl).pipe(
      tap(() => console.log('Fetched all advances successfully.')),
      catchError(this.handleError.bind(this))
    );
  }
  getTotalOpenAdvances(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/advances/open`).pipe(
      tap(openAdvances => console.log('Total Open Advances from API:', openAdvances)),
      catchError(error => {
        console.error('Error fetching total open advances', error);
        return of(0);
      })
    );
  }

  getTotalPendingExpenses(): Observable<number> { // Add pending expenses method
    return this.http.get<number>(`${this.apiUrl}/expenses/pending`).pipe(tap(pending => console.log('Total Pending Expenses from API:', pending)),
      catchError(error => {
        console.error('Error fetching total pending expenses', error);
        return of(0);
      })
    );
  }

  getTotalApprovedExpenses(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/expenses/approved`).pipe(
      tap(approved => console.log('Total Approved Expenses from API:', approved)),
      catchError(error => {
        console.error('Error fetching total approved expenses', error);
        return of(0);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'An unknown error occurred.';
    console.error('Error occurred:', error); // Log error for debugging
    this.openDialog('Error', message); // Open dialog with error message
    return throwError(() => new Error(message));
  }

  openDialog(title: string, message: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: { title, message },
    });
  }

  updatePaymentStatus(expenseId: string, payment_status: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/update/expenses/${expenseId}/payment-status`, {
      paymentStatus: payment_status
    });
  }

}
