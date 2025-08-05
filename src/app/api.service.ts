import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, Timestamp } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SalaryComponent } from './Payroll/models/salary-component.model';
import { Expense, ExpenseStats } from './Expense/shared/models/expense.model';
import { Advance } from './Expense/shared/models/advance.model';
import { Emp, Role } from './People/addcandidate/addcandidate.component';
import { trigger } from '@angular/animations';
import { LoaderService } from './shared/services/loader.service';

// Define interfaces for data structures
interface User {
  token: string;
  username: string;
  employeeId: string; // Assuming employeeId is part of the login response
  role: string;
}

interface Timesheet {
  sno: number;
  employeeId: string;
  members: string;
  effectiveWorkingDays: number;
  present: number;
  absent: number;
  missPunch: number;
}

interface AttendanceEvent {
  title: string;
  date: string;
  backgroundColor: string;
  extendedProps: {
    dayOfWeek: string;
    status: string;
  };
}

interface EmployeeName {
  name: string;
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
  constructor(private http: HttpClient, private dialog: MatDialog,public loaderService: LoaderService) { }
  // Login API call
 
  login(user: { username: string; password: string }): Observable<User> {
    const url = `${this.apiUrl}/login`;
    const key1 = `${this.key}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'apiKey': key1 // Manually passing the API key
    });
    this.loaderService.show();
    return this.http.post<User>(url, JSON.stringify(user), { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error);
        this.openDialog('Error', `Login failed: ${error.error?.message || 'Invalid Credentials'}`);
        return throwError(() => new Error(error.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }



  getCheckInStatus(employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/attendance/status/${employeeId}`;
    this.loaderService.show();
    return this.http.get<any>(url).pipe(
    //  tap(() => this.openDialog('Success', 'Check-in status retrieved successfully.')),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching check-in status:', error);
        this.openDialog('Error', `Failed to retrieve check-in status: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      }), finalize(() => this.loaderService.hide())
    );
  }

  addEmployee1(employeeData: any): Observable<any> {
    const url = `${this.apiUrl}/onboard`;
    this.loaderService.show();
    return this.http.post(url, employeeData).pipe(
      tap((response) => {
        console.log('API Response:', response);
        this.openDialog('Success', 'Employee added successfully!');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding employee:', error);
        this.openDialog('Error', `Failed to add employee: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      }),finalize(() => this.loaderService.hide())
    );
  }

  markAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
    const url = `${this.apiUrl}/checkIn`;
    this.loaderService.show();
    return this.http.post<AttendanceResponse>(url, attendanceData).pipe(
      //tap(() => this.openDialog('Success', 'Attendance marked successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError((error: HttpErrorResponse) => {
        console.error('Error marking attendance:', error);
        this.openDialog('Error', `Failed to mark attendance: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      })
    );
  }

  // Check-Out API call
  checkoutAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
    this.loaderService.show();
    return this.http.post<AttendanceResponse>(`${this.apiUrl}/checkOut`, attendanceData).pipe(
     // tap(() => this.openDialog('Success', 'Check-out successful.')),
      finalize(() => this.loaderService.hide()),
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
    this.loaderService.show();
    return this.http
      .get<AttendanceResponse>(`${this.apiUrl}/attendance/${employeeId}/${date}`)
      .pipe(
        tap(() => this.openDialog('Success', 'Attendance data retrieved successfully.')),
        finalize(() => this.loaderService.hide()),
        catchError(this.handleError.bind(this))
      );
  }

  // Reset Password
  resetPassword(data: { employeeId: string; oldPassword: string; newPassword: string }): Observable<any> {
    const url = `${this.apiUrl}/resetPassword`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(url, JSON.stringify(data), { headers }).pipe(
      tap(() => this.openDialog('Success', 'Password reset successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Fetch attendance data within a date range
  fetchAttendanceData(employeeId: string, startDate: string, endDate: string): Observable<any[]> {
    const url = `${this.apiUrl}/attendance/data?employeeId=${encodeURIComponent(employeeId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    this.loaderService.show();
    return this.http.get<any[]>(url).pipe(
      tap(() => this.openDialog('Success', 'Attendance data fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get all attendance records within a date range
  getAttendanceAll(employeeId: string, startDate: string, endDate: string): Observable<any> {
    const url = `${this.apiUrl}/attendance/data?employeeId=${encodeURIComponent(employeeId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    this.loaderService.show();
    return this.http.get<any[]>(url).pipe(
      tap(() => this.openDialog('Success', 'All attendance records retrieved successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get Employee ID from localStorage
  private getEmployeeId(): string | null {
    return localStorage.getItem('employeeId');
  }


  submitExpense(expenseData: FormData): Observable<any> {
    const apiUrl = `${this.apiUrl}/expenses`;
    this.loaderService.show();
    return this.http.post<any>(apiUrl, expenseData).pipe(
      tap(() => this.openDialog('Success', 'Expense submitted successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getTravelRecords(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/travel-records`).pipe(
      tap(() => this.openDialog('Success', 'Travel records fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  submitTravelRequest(requestData: any): Observable<any> {
    const url = `${this.apiUrl}/travel/addTravelRequest`;
    this.loaderService.show();
    return this.http.post(url, requestData).pipe(
      tap(() => this.openDialog('Success', 'Travel request submitted successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  approveEmployee(employeeData1: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.loaderService.show();
    console.log('employeeData1:', employeeData1);
    return this.http.post(`${this.apiUrl}/approve`, employeeData1, { headers }).pipe(
      tap(() => this.openDialog('Success', 'Employee approved successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  deleteEmployee(empId: string): Observable<any> {
    const url = `${this.apiUrl}/delete/${empId}`;
    this.loaderService.show();
    return this.http.patch(url, {}).pipe(
      tap(() => this.openDialog('Success', 'Employee marked as deleted successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  addEmployee(employeeData: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/employees/email`, employeeData).pipe(
      tap(() => this.openDialog('Success', 'Employee added successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getEmployees(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/employees`).pipe(
      tap(() => this.openDialog('Success', 'Employees fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }


  getEmployeeDetailsById(empId: string): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/employees/${empId}`).pipe(
      tap(() => this.openDialog('Success', 'Employee details fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getUserByEmpId(username: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/user/${username}`).pipe(
      tap(() => this.openDialog('Success', 'User details fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getUsers(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/employees`).pipe(
      tap(() => this.openDialog('Success', 'Users fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  saveProfile(profile: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/saveProfile`, profile).pipe(
      tap(() => this.openDialog('Success', 'Profile saved successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  updateProfile(id: number, profile: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/saveProfile/${id}`, profile).pipe(
      tap(() => this.openDialog('Success', 'Profile updated successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getAllOrganizations(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/orgProfile`).pipe(
      tap(() => this.openDialog('Success', 'Organizations fetched successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }
  deleteProfile(id: number): Observable<any> {
    this.loaderService.show();
    return this.http.delete(`${this.apiUrl}/orgProfile/${id}`).pipe(
      tap(() => {
        // Handle success
        this.openDialog('Success', 'Organization profile deleted successfully.');
      }),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  getLocations(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/getLocation`).pipe(
      tap((locations) => {
        console.log('Successfully fetched locations', locations);
      }),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Add a new location
  addLocation(location: any): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/addLocation`, location).pipe(
      tap((newLocation) => {
        console.log('Location added successfully', newLocation);
        this.openDialog('Success', 'Location added successfully!');
      }),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Update an existing location
  updateLocation(location: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/updateLocation/${location.id}`, location).pipe(
      tap((updatedLocation) => {
        console.log('Location updated successfully', updatedLocation);
        this.openDialog('Success', 'Location updated successfully!');
      }),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  // Delete a location
  deleteLocation(locationId: string): Observable<any> {
    this.loaderService.show();
    return this.http.delete<any>(`${this.apiUrl}/deleteLocation/${locationId}`).pipe(
      tap(() => {
        console.log('Location deleted successfully');
        this.openDialog('Success', 'Location deleted successfully!');
      }),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))  // Handle error globally
    );
  }

  getAllDesignations(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/getdesignations`).pipe(
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getDesignationById(id: number): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/getdesignations/${id}`).pipe(
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  addDesignation(designation: any): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/adddesignations`, designation).pipe(
      tap(() => this.openDialog('Success', 'Designation added successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  updateDesignation(id: number, designation: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/updatedesignations/${id}`, designation).pipe(
      tap(() => this.openDialog('Success', 'Designation updated successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  deleteDesignation(id: number): Observable<void> {
    this.loaderService.show();
    return this.http.delete<void>(`${this.apiUrl}/deldesignations/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Designation deleted successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get all departments
  getDepartments(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/getDepartment`).pipe(
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Save a new department
  saveDepartment(department: any): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/addDepartment`, department).pipe(
      tap(() => this.openDialog('Success', 'Department saved successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Update an existing department
  updateDepartment(id: number, department: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/updateDepartment/${id}`, department).pipe(
      tap(() => this.openDialog('Success', 'Department updated successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Delete a department
  deleteDepartment(id: number): Observable<void> {
    this.loaderService.show();
    return this.http.delete<void>(`${this.apiUrl}/deleteDepartment/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Department deleted successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this)) // Handle errors
    );
  }

  // Get Settings
  getSettings(): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/getsettings`).pipe(
      tap(() => console.log('Fetched settings successfully')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Save Settings
  saveSettings(settings: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/addsettings`, settings).pipe(
      tap(() => this.openDialog('Success', 'Settings saved successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get PT Slabs
  getPTSlabs(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/getpt-slabs`).pipe(
      tap(() => console.log('Fetched PT slabs successfully')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Save PT Slab
  savePTSlab(slab: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/addpt-slabs`, slab).pipe(
      tap(() => this.openDialog('Success', 'PT slab saved successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Delete PT Slab
  deletePTSlab(id: number): Observable<void> {
    this.loaderService.show();
    return this.http.delete<void>(`${this.apiUrl}/delpt-slabs/${id}`).pipe(
      tap(() => this.openDialog('Success', 'PT slab deleted successfully!')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getComponents(): Observable<SalaryComponent[]> {
    this.loaderService.show();
    return this.http.get<SalaryComponent[]>(`${this.apiUrl}/getcomponent`).pipe(
      tap(() => this.openDialog('Success', 'Fetched salary components successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get salary component by ID
  getComponentById(id: string): Observable<SalaryComponent> {
    this.loaderService.show();
    return this.http.get<SalaryComponent>(`${this.apiUrl}/getcomponent/${id}`).pipe(
      tap(() => this.openDialog('Success', `Fetched salary component with ID: ${id}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Add a new salary component
  addComponent(component: SalaryComponent): Observable<SalaryComponent> {
    this.loaderService.show();
    return this.http.post<SalaryComponent>(`${this.apiUrl}/addcomponent`, component).pipe(
      tap(() => this.openDialog('Success', 'Added new salary component successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Update an existing salary component
  updateComponent(id: string, component: SalaryComponent): Observable<SalaryComponent> {
    this.loaderService.show();
    return this.http.put<SalaryComponent>(`${this.apiUrl}/updatecomponent/${id}`, component).pipe(
      tap(() => this.openDialog('Success', `Updated salary component with ID: ${id} successfully.`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Delete a salary component
  deleteComponent(id: string): Observable<void> {
    this.loaderService.show();
    return this.http.delete<void>(`${this.apiUrl}/deletecomponent/${id}`).pipe(
      tap(() => this.openDialog('Success', 'Salary component deleted successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get attendance details by month
  getAttendanceDetailsByMonth(month: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/getAttendanceDetails/${month}`).pipe(
      tap(() => this.openDialog('Success', `Fetched attendance details for month: ${month}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get employee report for a specific month
  getEmployeeReportForMonth(attendanceId: string, month: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/getEmployeeReport/${attendanceId}/${month}`).pipe(
      tap(() => this.openDialog('Success', `Fetched employee report for ID: ${attendanceId} and month: ${month}`)),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  // Get employee leave report
  getEmployeeLeaveReport(): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/generateLeaveReport`).pipe(
      //tap(() => this.openDialog('Success', 'Fetched leave report successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getLeaveCounts(empId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/leave/count?empId=${empId}`).pipe(
     // tap(() => this.openDialog('Success', `Leave counts fetched for Employee ID: ${empId}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  rejectLeaveRequest1(empid: string, leavereason: string): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/rejectLeaveRequest`, { empid, leavereason }).pipe(
     // tap(() => this.openDialog('Success', `Leave request rejected for Employee ID: ${empid}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }


  rejectLeaveRequest(empId: string): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/rejupdateEntityFlag?empid=${empId}`, null).pipe(
     // tap(() => this.openDialog('Success', `Leave request updated for Employee ID: ${empId}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  putLeaveReq(data: any): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequest`; // Adjust if needed
    const headers = { 'Content-Type': 'application/json' };
    this.loaderService.show();
    console.log("data:::"+JSON.stringify(data));
    return this.http.post<any>(endpoint, data, { headers }).pipe(
      tap(() => this.openDialog('Success', 'Leave request submitted successfully.')),finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  getLeaveRequests(empId: string): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequests/get/${empId}`; // Ensure empId is passed in the URL
    this.loaderService.show();
    return this.http.get<any>(endpoint).pipe(
    //  tap(() => this.openDialog('Success', 'Fetched leave requests successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  updateEntityFlag(empId: string, srlnum: string): Observable<any> {
    // Add leaveType as a query parameter
    this.loaderService.show();
    alert(srlnum);
    return this.http.put<any>(`${this.apiUrl}/updateEntityFlag?empid=${empId}&srlnum=${srlnum}`, null).pipe(
    //  tap(() => this.openDialog('Success', `Entity flag updated successfully for Employee ID: ${empId} and Leave Type: ${srlnum}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }


  getUpcomingHolidays(): Observable<any> {
    const endpoint = `${this.apiUrl}/leaveRequests/upcomingHolidays`; // Endpoint to fetch upcoming holidays
    this.loaderService.show();
    return this.http.get<any>(endpoint).pipe(
     // tap(() => this.openDialog('Success', 'Fetched upcoming holidays successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  submitAdvance(advanceObj: any): Observable<any> {
    const apiUrl = `${this.apiUrl}/advances`;
    this.loaderService.show();
    return this.http.post<any>(apiUrl, advanceObj, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
    //  tap((response) => console.log('Response from submitAdvance:', response)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError)
    );
  }
  
  getApproval(employeeId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/expensesbyid/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }



  getExpensesEmp(employeeId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/expensesbyid/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }


  updateExpense2(expenseId: string, formData: FormData): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/del/update/expenses/${expenseId}`, formData, {
      headers: { 'Accept': 'application/json' },
    }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getApprovals(employeeId: any): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/app/expensesbyid/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getExpensesByReportingManager(employeeId: any): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/app/expensesbyreportingmanager/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAllApprovals(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/app/expensesbyid/all`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getApprovedExpensesByEmpId(employeeId: any): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/app/approvedexpenses/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAllApprovedExpenses(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/app/approvedexpenses/all`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }


  updateExpense(expenseId: string, requestData: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/update/expenses/${expenseId}`,requestData).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  updateAdvance(advanceId: string, requestData: any): Observable<any> {
    this.loaderService.show();
    alert(advanceId);
    return this.http.put<any>(`${this.apiUrl}/update/advance/approval/${advanceId}`,requestData).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  updateExpense1(expenseId: string, requestData: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(`${this.apiUrl}/rej/expenses/${expenseId}`, requestData).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }


  getReceiptUrl(expenseId: string): Observable<Blob> {
    this.loaderService.show();
    const url = `${this.apiUrl}/expenses/receipt/${expenseId}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }


  getExpenseById1(expenseId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/expenses/${expenseId}`).pipe(
      tap((response) => {
        console.log('Response from API:', response); // Log the response
      }),finalize(() => this.loaderService.hide())
    );
  }

  saveSalaryTemplate(payload: any) {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/salary-template/save`, payload).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  getTemplates(): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/templates`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  // Get a single template by ID
  getTemplateById(templateId: number): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/templates/${templateId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  // API call to fetch payslip details based on employee ID
  getPayslipDetails(requestPayload: { employeeId: string }): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/payslip`, requestPayload).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  // updateAdvance(advanceId: any, advanceDetails: any) {
  //   throw new Error('Method not implemented.');
  // }
  getAdvanceById1(arg0: string) {
    throw new Error('Method not implemented.');
  }
  getAdvanceById2: any;

  getAdvances(empId: string): Observable<Advance[]> {
    if (!empId) {
      throw new Error('Employee ID is required');
    }

    console.log('Fetching advances for Employee ID:', empId);
    this.loaderService.show();
    return this.http.get<Advance[]>(`${this.apiUrl}/advances/${empId}`).pipe(
      catchError(this.handleError)  // ✅ Error handling
    ).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  deleteExpense: any;

  getExpenseById(expenseId: string) {
    this.loaderService.show();
    return this.http.get<any>(`/edit/expenses/${expenseId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getexpenseform(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/expense-form`).pipe(
      catchError(this.handleError)
    ).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getExpenses(): Observable<any[]> {
    this.loaderService.show();
    console.log('API Call: Fetching all expenses');
    return this.http.get<any[]>(`${this.apiUrl}/expenses`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }



  getAdvanceById3(advanceId: string) {
    this.loaderService.show();
    return this.http.get<{ success: boolean; data: Advance; message?: string }>(
      `${this.apiUrl}/edit/advances/${advanceId}`
    ).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAdvance(employeeId: string): Observable<Advance[]> {
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }
    this.loaderService.show();
    return this.http.get<Advance[]>(`${this.apiUrl}/advances/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAdvancepending(employeeId: string): Observable<Advance[]> {
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }
    this.loaderService.show();
    return this.http.get<Advance[]>(`${this.apiUrl}/advances/advancebyreportingmancger/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  // Fetch employee details by ID
  getEmployeeDetails(employeeId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/payroll/employee/${employeeId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAllEmployeeIds(): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/payroll/employees`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  updateAdvance1(advanceId: string, requestData: any): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(
      `${this.apiUrl}/update/advances/${advanceId}`,
      requestData, // Ensure it's not empty
      {
        headers: { 'Content-Type': 'application/json' }, // JSON headers
      }
    ).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }



  updateAdvanceRej(advanceId: string, requestData: any): Observable<any> {
    this.loaderService.show();
    return this.http.put<any>(
      `${this.apiUrl}/rej/advance/${advanceId}`,
      requestData, // Ensure it's not empty
      {
        headers: { 'Content-Type': 'application/json' }, // JSON headers
      }
    ).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }




  saveOrUpdateEmployeeSalary(employeeSalary: any): Observable<any> {
    const url = `${this.apiUrl}/employeesalarydetail`;
    this.loaderService.show();
    console.log("Final Form Data:", JSON.stringify(employeeSalary, null, 2));
    return this.http.post<any>(url, employeeSalary).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getExpenseStats(): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/expenses/stats`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAllEmployeessalary(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/employeesalarydetail`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  runPayroll(): Observable<any> {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/Payroll`, {}).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getEmployeeSalaryDetails(empId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/salary/${empId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  exportPayrollData(): Observable<Blob> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/exportsalaryupload`, { responseType: 'blob' }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  sendPayslip(employeeId: string, month: string): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/payslips/send`, { employeeId, month }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  sendPayslipsToAll(month: string): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/payslips/send/all`, { month }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  downloadPayslip(employeeId: string, month: string): Observable<Blob> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/payslip/download/${employeeId}/${month}`, {
      responseType: 'blob'
    }).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  getLocationsapi(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/locations`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getAllowanceAmount(locationId: number): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/allowance/${locationId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getRoles(): Observable<Role[]> {
    this.loaderService.show();
    return this.http.get<Role[]>(`${this.apiUrl}/getrole`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getManagers(): Observable<Emp[]> {
    this.loaderService.show();
    return this.http.get<Emp[]>(`${this.apiUrl}/getmanagers`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }

  getManagerEmail(empId: string): Observable<{ email: string }> {
    this.loaderService.show();
    return this.http.get<{ email: string }>(`${this.apiUrl}/manager-email/${empId}`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }


  getAdvanceStats(): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(this.apiUrl + '/advances/stats').pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  getEmployeeName(employeeId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/employees/${employeeId}/name`).pipe(
      tap(() => console.log(`Fetching employee name for ID: ${employeeId}`)),
      catchError(this.handleError.bind(this)),finalize(() => this.loaderService.hide())
    );
  }
  getPendingEmployees(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/approvals/pending-employees`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  getAllExpenses(): Observable<any[]> {
    this.loaderService.show();
    return this.http.get<any[]>(`${this.apiUrl}/expenses`).pipe(
      finalize(() => this.loaderService.hide()) // ✅ ensure loader hides no matter what
    );
  }
  getAllAdvances(): Observable<Advance[]> {
    this.loaderService.show();
    const url = `${this.apiUrl}/advances`; // Adjust the URL if necessary
    return this.http.get<Advance[]>(this.apiUrl).pipe(
      tap(() => console.log('Fetched all advances successfully.')),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }
  getTotalOpenAdvances(): Observable<number> {
    this.loaderService.show();
    return this.http.get<number>(`${this.apiUrl}/advances/open`).pipe(
      tap(openAdvances => console.log('Total Open Advances from API:', openAdvances)),
      catchError(error => {
        console.error('Error fetching total open advances', error);
        return of(0);
      }), finalize(() => this.loaderService.hide())
    );
  }

  getTotalPendingExpenses(): Observable<number> { // Add pending expenses method
    this.loaderService.show();
    return this.http.get<number>(`${this.apiUrl}/expenses/pending`).pipe(tap(pending => console.log('Total Pending Expenses from API:', pending)),
      catchError(error => {
        console.error('Error fetching total pending expenses', error);
        return of(0);
      }), finalize(() => this.loaderService.hide())
    );
  }

  getTotalApprovedExpenses(): Observable<number> {
    this.loaderService.show();
    return this.http.get<number>(`${this.apiUrl}/expenses/approved`).pipe(
      tap(approved => console.log('Total Approved Expenses from API:', approved)),
      catchError(error => {
        console.error('Error fetching total approved expenses', error);
        return of(0);
      }), finalize(() => this.loaderService.hide())
    );
  }
  deleteAdvance(advanceId: string): Observable<any> {
    this.loaderService.show();
    const url = `${this.apiUrl}/delete/advances/${advanceId}`;
    return this.http.delete<any>(url).pipe(
      tap(() => console.log(`Advance with ID ${advanceId} deleted from backend`)), finalize(() => this.loaderService.hide()),
      catchError(this.handleError)
    );
  }
  
  updatePaymentStatus(expenseId: string, requestBody: { paymentStatus: number, requesterEmpId: string }): Observable<any> {
    this.loaderService.show();
    return this.http
      .put<any>(
        `${this.apiUrl}/update/expenses/${expenseId}/payment-status`,
        requestBody,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }
      )
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  updatePaymentStatusadvance(advanceId: string, requestBody: { paymentStatus: number, requesterEmpId: string }): Observable<any> {
    this.loaderService.show();
    return this.http
      .put<any>(
        `${this.apiUrl}/update/advance/Paymentstatus/${advanceId}`,
        requestBody,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }
      )
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }
  
  getAllApprovedAdvances(): Observable<any[]> {
    this.loaderService.show();
    return this.http
      .get<any[]>(`${this.apiUrl}/app/approvedadvances/all`, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      })
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  // Fetch approved advances for a specific employee
  getApprovedAdvancesByEmpId(empId: string): Observable<any[]> {
    this.loaderService.show();
    return this.http
      .get<any[]>(`${this.apiUrl}/app/approvedadvances/${empId}`, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      })
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  // Fetch advance receipt as a Blob
  getAdvanceReceiptUrl(advanceId: string): Observable<Blob> {
    this.loaderService.show();
    return this.http
      .get(`${this.apiUrl}/advances/${advanceId}/receipt`, {
        responseType: 'blob',
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      })
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  // Update advance payment status
  updateAdvancePaymentStatus(advanceId: string, requestBody: { paymentStatus: number, requesterEmpId: string }): Observable<any> {
    this.loaderService.show();
    return this.http
      .put<any>(
        `${this.apiUrl}/rej/advance/${advanceId}`,
        requestBody,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }
      )
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  getTimesheetData(year: number, month: number, repoteTo: string): Observable<Timesheet[]> {
    const url = `${this.apiUrl}/data?year=${year}&month=${month}&repoteTo=${repoteTo}`;
    this.loaderService.show();
    return this.http.get<Timesheet[]>(url, {  headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.openDialog('Error', `Failed to fetch timesheet data: ${error.error?.error || 'Server error'}`);
        return throwError(() => new Error(error.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // Fetch attendance events for an employee
  getAttendanceEvents(employeeId: string, year: number, month: number): Observable<AttendanceEvent[]> {
    const url = `${this.apiUrl}/events/${employeeId}?year=${year}&month=${month}`;
    this.loaderService.show();
    return this.http.get<AttendanceEvent[]>(url, {  headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.openDialog('Error', `Failed to fetch attendance events: ${error.error?.error || 'Server error'}`);
        return throwError(() => new Error(error.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // Fetch employee name by employeeId
  getEmployeeName1(employeeId: string): Observable<EmployeeName> {
    const url = `${this.apiUrl}/employee/${employeeId}`;
    this.loaderService.show();
    return this.http.get<EmployeeName>(url, {  headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.openDialog('Error', `Failed to fetch employee name: ${error.error?.error || 'Server error'}`);
        return throwError(() => new Error(error.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

updateAttendance(data: any): Observable<any> {
  const url = `${this.apiUrl}/attendance/update`;
  this.loaderService.show();

  return this.http.post<any>(url, data, {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }).pipe(
    tap(response => {
      // Show success dialog if response contains a message
      if (response?.message) {
        this.openDialog('Success', response.message);
      } else {
        this.openDialog('Success', 'Attendance updated successfully.');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Backend error response:', error);

      // Handle both string and object error bodies
      let errorMsg = 'Server error';
      if (typeof error.error === 'string') {
        errorMsg = error.error;
      } else if (error.error?.error) {
        errorMsg = error.error.error;
      }

      this.openDialog('Error', `Failed to update attendance: ${errorMsg}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

getAttendancePieData(empId: string, date: string): Observable<any> {
  const url = `${this.apiUrl}/attendance/pie?empId=${empId}&date=${date}`;
  this.loaderService.show();
  return this.http.get<any>(url, {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }).pipe(
    catchError((error: HttpErrorResponse) => {
      this.openDialog('Error', `Failed to fetch attendance pie data: ${error.error?.error || 'Server error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
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

  

}
