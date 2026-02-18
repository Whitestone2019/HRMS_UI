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
  reportTo:string;
  managerName:string;
   email?: string;        // ADD THIS LINE
  dateOfBirth?: string;  // ADD THIS LINE
  dateOfJoining?: string; 
}

export interface PayrollAdjustment {
  id: number;
  empId: string;
  employeeName:string;
  month: string;
  allowanceDays: number;
  lopDays: number;
  otherDeductions: number;
  managerId: string;
  otherDeductionsRemarks: string |null ;   // ← NEW
  payrollRejectRemarks: string|null;
  effectiveWorkingDays:string;
  approvalStatus: string;
  createdDate: string;
  updatedDate: string;
}

export interface UpdateLeavePayload {
  empId: string;
  leaveTaken: number;
}

interface Project {
  empId: string;
  name: string;
  projectName: string;
  projectDuration: string;
  location: string;
  clientInfo: string;
  vendorDetails: string;
  techParkName: string;
  vendorName: string;
  modeOfWork: string;
}
export interface TraineeMaster {
  userid: string;
  trngid: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
  empType:string;
  emailid: string;
  phonenumber: string;
  roleid: string;
  repoteTo: string;
  status: string;
  lastlogin: Date;
  disablefromdate: Date;
  disabletodate: Date;
  rcreuserid: string;
  rcretime: Date;
  rmoduserid: string;
  rmodtime: Date;
  rvfyuserid: string;
  rvfytime: Date;
}
export interface Usermaintenance {
  userid: string;
  empid: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
  emailid: string;
  phonenumber: string;
  empType:string;
  roleid: string;
  repoteTo: string;
  status: string;
  lastlogin: Date;
  disablefromdate: Date;
  disabletodate: Date;
  rcreuserid: string;
  rcretime: Date;
  rmoduserid: string;
  rmodtime: Date;
  rvfyuserid: string;
  rvfytime: Date;
}

// src/app/models/timesheet.model.ts
export interface Timesheet {
  sno: number;
  employeeId: string;
  members: string;
  effectiveWorkingDays: number;
  present: number;
  absent: number;
  missPunch: number;
  od: number;
  compoff: number;
  holiday: number;
  weekoff: number;
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
  srlnum?:number;
}

interface AttendanceResponse {
  id: number;
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
}

export interface LocationAllowance {
  id?: number;
  locationName: string;
  type: string;
  amount: number;
}

export interface CalendarEvent {
  calenderId?: number;
  eventName: string;
  eventDate: string; // Format: yyyy-MM-dd
  eventType: string;
  description?: string;
  isPublic?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
}

export interface ChecklistPayloadItem {
  label: string;
  checked: boolean;
  comment: string;
}

export interface FinalHrData {
  finalHrRemarks: string;
  finalHrApprovedBy: string;
  finalHrApprovedOn: string;
  finalChecklistData: string;
  isSubmitted: boolean;
  status: string;
  parsedChecklist?: ChecklistPayloadItem[];
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  [key: string]: any;
}

// In your api.service.ts file, update the ExitForm interface:

export interface ExitForm {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  noticeStartDate?: string;
  reason?: string;
  comments?: string;
  status?: any; // string or number
  noticePeriod?: number;
  noticeEndDate?: string;
  attachment?: string | null;
  withdrawPurpose?: string | null;
  withdrawDate?: string | null;
  withdrawBy?: string | null;
  
  // Manager Review fields
  performance?: string;
  managerNoticeperiod?: string;
  projectDependency?: string;
  knowledgeTransfer?: string;
  managerRemarks?: string | null;
  managerAction?: string;
  managerName?: string;
  purposeOfChange?: string | null;
  
  // HR Round 1 fields
  hrNoticePeriod?: boolean;
  hrLeaveBalances?: boolean;
  hrPolicyCompliance?: boolean;
  hrExitEligibility?: boolean;
  hrNoticePeriodComments?: string;
  hrLeaveBalancesComments?: string;
  hrPolicyComplianceComments?: string;
  hrExitEligibilityComments?: string;
  hrGeneralComments?: string | null;
  hrAction?: string;
  hrReviewDate?: string;
  
  // Asset Clearance field
  assetClearance?: string;
  assetSubmittedBy?: string; // ADD THIS LINE
  
  // HR Round 2 (Offboarding) field
  hrOffboardingChecks?: string;
  
  // Payroll Checks field
  payrollChecks?: string;
  payrollSubmittedBy?: string; // ADD THIS LINE
  
  // Final HR Approval fields
  finalHrRemarks?: string;
  finalHrApprovedBy?: string;
  finalHrApprovedOn?: string;
  finalChecklistData?: string;
  
  // Audit fields
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  delFlag?: string;

  userSubmittedOn?: any; // Can be string, Date, or LocalDateTime object
  managerSubmittedOn?: any;
  hrRound1SubmittedOn?: any;
  assetSubmittedOn?: any;
  hrRound2SubmittedOn?: any;
  payrollSubmittedOn?: any;
  finalHrSubmittedOn?: any;
}


export interface ManagerReview {
  id?: string;
  employeeId: string;
  employeeName?: string;
  
  // Frontend form fields
  performance: string;
  projectDependency: number; // Frontend uses number
  knowledgeTransfer: string;
  noticePeriod: number; // Frontend uses number
  remarks: string; // Frontend field name
  
  // Backend field names (for mapping)
  managerRemarks?: string; // Backend field name
  managerAction?: string; // Backend field name
  
  purposeOfChange?: string | null;
  action?: string; // Frontend field name
  managerName: string;
  
  // Audit fields
  createdDate?: string;
  updatedDate?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Checklist {
  noticePeriod: boolean;
  leaveBalances: boolean;
  policyCompliance: boolean;
  exitEligibility: boolean;
}

export interface Comments {
  noticePeriod: string;
  leaveBalances: string;
  policyCompliance: string;
  exitEligibility: string;
  general: string;
}

export interface HRReview {
  id?: string;
  checklist: Checklist;
  comments: Comments;
  hrAction: string;
  hrName: string;
  hrReviewDate?: Date;
}

export interface HRReviewResponse {
  success: boolean;
  message: string;
  data?: HRReview;
  reviews?: HRReview[];
}

export interface AssetClearanceData {
  assets: Array<{
    name: string;
    condition: string;
    comments: string;
  }>;
  extraAssetName: string;
}

// Add these interfaces with your other interfaces at the top
export interface HrLeaveApproval {
  id?: number;
  employeeId: string;
  leaveType: string;
  requestedDate?: string | Date;
  status?: string;
  delFlag?: string;
  createdOn?: string | Date;
  createdBy?: string;
  updatedOn?: string | Date;
  updatedBy?: string;
  hrName?: string;
  managerName?: string;
  remarks?: string;
}

export interface HrLeaveApprovalResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: HrLeaveApproval | HrLeaveApproval[];
  error?: string;
  employeeId?: string;
}

// In your models/user-role.model.ts or similar
// In api.service.ts
export interface Designation {
  designationid?: string;
  designationname: string;
  roleId?: string;        // Add this
  roleName?: string;      // Add this
  description?: string;   // Add this
  department: string;
  status: string;
  salaryrange: string;
  rcreuserid: string;
}

export interface CelebrationEmailRequest {
  employeeEmail: string;
  employeeName: string;
  employeeId: string;
  senderEmail: string;
  senderName: string;
  type: 'birthday' | 'anniversary';
  years?: number;
}

export interface CelebrationEmailResponse {
  status: string;
  message: string;
  timestamp: string;
  time: string;
  from?: string;
  to?: string;
  type?: string;
}

export interface Person {
  id: string;
  name: string;
  type: 'Employee' | 'Trainee';
  employeeId?: string;
  employeeName?: string;
  traineeId?: string;
  traineeName?: string;
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
   // alert("Api"+employeeId);
    const url = `${this.apiUrl}/attendance/status/${employeeId}`;
    this.loaderService.show();
  return this.http.get<any>(url).pipe(
  tap((response) => {
    console.log('Check-in status response:', response); // This will print to the browser console
    //this.openDialog('Success', 'Check-in status retrieved successfully.');
  }),
  catchError((error: HttpErrorResponse) => {
    console.error('Error fetching check-in status:', error);
    this.openDialog('Error', `Failed to retrieve check-in status: ${error.error?.message || 'Unknown error'}`);
    return throwError(() => new Error(error.message));
  }),
  finalize(() => this.loaderService.hide())
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

  // markAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
  //   const url = `${this.apiUrl}/checkIn`;
  //   this.loaderService.show();
  //   return this.http.post<AttendanceResponse>(url, attendanceData).pipe(
  //     //tap(() => this.openDialog('Success', 'Attendance marked successfully.')),
  //     finalize(() => this.loaderService.hide()),
  //     catchError((error: HttpErrorResponse) => {
  //       console.error('Error marking attendance:', error);
  //       this.openDialog('Error', `Failed to mark attendance: ${error.error?.message || 'Unknown error'}`);
  //       return throwError(() => new Error(error.message));
  //     })
  //   );
  // }

  markAttendance(attendanceData: AttendancePayload): Observable<AttendanceResponse> {
  const url = `${this.apiUrl}/checkIn`;
  this.loaderService.show();
  return this.http.post<AttendanceResponse>(url, attendanceData).pipe(
    finalize(() => this.loaderService.hide()),
    catchError((error) => this.handleError(error))
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
  checkOut(status: string, locationName: string, checkOutDuration: number, srlnum: number): Observable<AttendanceResponse> {
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
      srlnum,
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

   sendOtp(employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/sendOtp?employeeId=${employeeId}`;
    return this.http.get<any>(url);
  }
 changePasswordWithOtp(data: { employeeId: string; otp: string; newPassword: string }): Observable<any> {
    const url = `${this.apiUrl}/changePasswordWithOtp`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.loaderService.show();

    return this.http.post<any>(url, JSON.stringify(data), { headers }).pipe(
      tap(() => console.log('Password changed via OTP')),
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

  // In api.service.ts - Add this new method
rejectLeaveRequest1(empid: string, startdate: string): Observable<any> {
  this.loaderService.show();
  
  const payload = {
    empid: empid,
    startdate: startdate  // Correct field name
  };
  
  console.log('Sending leave rejection:', payload);
  
  return this.http.post<any>(`${this.apiUrl}/rejectLeaveRequest`, payload).pipe(
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
  //  alert(srlnum);
    return this.http.put<any>(`${this.apiUrl}/updateEntityFlag?empid=${empId}&srlnum=${srlnum}`, null).pipe(
    //  tap(() => this.openDialog('Success', `Entity flag updated successfully for Employee ID: ${empId} and Leave Type: ${srlnum}`)),
      finalize(() => this.loaderService.hide()),
      catchError(this.handleError.bind(this))
    );
  }

  withdrawLeaveRequest(empId: string, srlnum: string, currentStatus: string): Observable<any> {
  this.loaderService.show();
  return this.http.put<any>(
    `${this.apiUrl}/withdrawLeaveRequest?empid=${empId}&srlnum=${srlnum}&status=${currentStatus}`, 
    null
  ).pipe(
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
   // alert(advanceId);
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
  runPayroll() {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/Payroll`, {})
      .pipe(finalize(() => this.loaderService.hide()));
  }

  /** ✅ Save Edited Payroll */
  savePayrollData(payrollData: any[]) {
    this.loaderService.show();
    return this.http.post<any>(`${this.apiUrl}/PayrollUpdate`, payrollData)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  /** ✅ Get Payroll Preview */
  previewPayroll() {
    this.loaderService.show();
    return this.http.get<any>(`${this.apiUrl}/PayrollPreview`, {})
      .pipe(finalize(() => this.loaderService.hide()));
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

// CREATE - Create new calendar event
createCalendarEvent(eventData: CalendarEvent): Observable<any> {
  const url = `${this.apiUrl}/api/calendar`;
  this.loaderService.show();
  return this.http.post<any>(url, eventData).pipe(
    tap((response) => {
      console.log('Calendar event created:', response);
      if (response.success) {
        this.openDialog('Success', response.message || 'Event created successfully!');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error creating calendar event:', error);
      this.openDialog('Error', error.error?.message || 'Failed to create event');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get all calendar events
getAllCalendarEvents(): Observable<any> {
  const url = `${this.apiUrl}/api/getall/calendar`;
  this.loaderService.show();
  return this.http.get<any>(url).pipe(
    tap((response) => {
      console.log('Calendar events fetched:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching calendar events:', error);
      this.openDialog('Error', 'Failed to fetch calendar events');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get calendar event by ID
getCalendarEventById(id: number): Observable<any> {
  const url = `${this.apiUrl}/api/calendar/${id}`;
  this.loaderService.show();
  return this.http.get<any>(url).pipe(
    tap((response) => {
      console.log('Calendar event fetched:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching calendar event:', error);
      this.openDialog('Error', 'Failed to fetch calendar event');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// UPDATE - Update calendar event
updateCalendarEvent(id: number, eventData: CalendarEvent): Observable<any> {
  const url = `${this.apiUrl}/api/update/calendar/${id}`;
  this.loaderService.show();
  return this.http.put<any>(url, eventData).pipe(
    tap((response) => {
      console.log('Calendar event updated:', response);
      if (response.success) {
        this.openDialog('Success', response.message || 'Event updated successfully!');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error updating calendar event:', error);
      this.openDialog('Error', error.error?.message || 'Failed to update event');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// DELETE - Delete calendar event
deleteCalendarEvent(id: number): Observable<any> {
  const url = `${this.apiUrl}/api/delete/calendar/${id}`;
  this.loaderService.show();
  return this.http.delete<any>(url).pipe(
    tap((response) => {
      console.log('Calendar event deleted:', response);
      if (response.success) {
        this.openDialog('Success', response.message || 'Event deleted successfully!');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error deleting calendar event:', error);
      this.openDialog('Error', error.error?.message || 'Failed to delete event');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

   // ✅ Save user
  saveUser(user: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/usermaintenance-save`, user)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Save trainee
  saveTrainee(user: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/trng-save`, user)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Get allowances
  getAllAllowances(): Observable<LocationAllowance[]> {
    this.loaderService.show();
    return this.http.get<LocationAllowance[]>(`${this.apiUrl}/location-allowances`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Create allowance
  createAllowance(allowance: LocationAllowance): Observable<LocationAllowance> {
    this.loaderService.show();
    return this.http.post<LocationAllowance>(`${this.apiUrl}/location-allowances`, allowance)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Delete allowance
  deleteAllowance(id: number): Observable<void> {
    this.loaderService.show();
    return this.http.delete<void>(`${this.apiUrl}/location-allowances/${id}`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Update allowance
  updateAllowance(id: number, allowance: LocationAllowance): Observable<LocationAllowance> {
    this.loaderService.show();
    return this.http.put<LocationAllowance>(`${this.apiUrl}/location-allowances/${id}`, allowance)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Get permission requests
  getPermissionRequests(empId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/permissionRequests/get/${empId}`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Create permission request
  putPermissionReq(formData: any): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/permissionRequest`, formData)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Approve permission request
  approvePermissionRequest(empid: string, srlnum: string): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/approvePermissionRequest`, { empid, srlnum })
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Reject permission request
  rejectPermissionRequest(empid: string, srlnum: string): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/rejectPermissionRequest`, { empid, srlnum })
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Get employees
  getEmployees1(): Observable<Usermaintenance[]> {
    this.loaderService.show();
    return this.http.get<Usermaintenance[]>(`${this.apiUrl}/employeesdetails`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Get trainees
  getTrainees(): Observable<TraineeMaster[]> {
    this.loaderService.show();
    return this.http.get<TraineeMaster[]>(`${this.apiUrl}/trainees`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  getAllEmployeesAndTrainees(): Observable<Person[]> {
    this.loaderService.show();
    return this.http.get<Person[]>(`${this.apiUrl}/payroll/employees-trainees`).pipe(
      finalize(() => this.loaderService.hide())
    );
  }
  
  getTraineeDetails(traineeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payroll/trainee/${traineeId}`);
  }

  // ✅ Update employee status
  updateEmployeeStatus(userId: string, status: string): Observable<void> {
    this.loaderService.show();
    return this.http.put<void>(`${this.apiUrl}/employee/${userId}/status`, { status })
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Update trainee status
  updateTraineeStatus(userId: string, status: string): Observable<void> {
    this.loaderService.show();
    return this.http.put<void>(`${this.apiUrl}/trainee/${userId}/status`, { status })
      .pipe(finalize(() => this.loaderService.hide()));
  }

 // ✅ Fetch project history for an employee
  getProjectHistory(managerEmpId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/projects/${managerEmpId}`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Add project
  addProject(projectData: any): Observable<any> {
    this.loaderService.show();
    const headers = new HttpHeaders().set('LoggedInEmpId', projectData.rcreUserId || '');
   // alert(projectData);
    return this.http.post(`${this.apiUrl}/projects`, projectData, { headers })
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Fetch employees reporting to the manager
  getReportingEmployees(managerEmpId: string): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/employees/reporting-to/${managerEmpId}`)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ✅ Update project
 uploadPhoto(formData: FormData): Observable<any> {
    this.loaderService.show();
    return this.http.post(`${this.apiUrl}/upload`, formData)
      .pipe(
        finalize(() => this.loaderService.hide()),
        catchError(err => this.handleError(err))
      );
  }

  updateProject(project: any): Observable<any> {
    this.loaderService.show();
    return this.http.put(`${this.apiUrl}/project/${project.id}`, project)
      .pipe(
        finalize(() => this.loaderService.hide()),
        catchError(err => this.handleError(err))
      );
  }

  getEmployeeById(empid: string): Observable<Usermaintenance> {
    this.loaderService.show();
    return this.http.get<Usermaintenance>(`${this.apiUrl}/employeesforEdit/${empid}`)
      .pipe(
        finalize(() => this.loaderService.hide()),
        catchError(err => this.handleError(err))
      );
  }

  updateEmployee(empid: string, user: Usermaintenance): Observable<any> {
    this.loaderService.show();
    return this.http.put(`${this.apiUrl}/employees/${empid}`, user)
      .pipe(
        finalize(() => this.loaderService.hide()),
        catchError(err => this.handleError(err))
      );
  }

  getTraineeById(trngid: string): Observable<TraineeMaster> {
    this.loaderService.show();
    return this.http.get<TraineeMaster>(`${this.apiUrl}/trainees/${trngid}`)
      .pipe(
        finalize(() => this.loaderService.hide()),
        catchError(err => this.handleError(err))
      );
  }

  updateTrainee(trngid: string, trainee: TraineeMaster): Observable<any> {
    this.loaderService.show();
    return this.http.put(`${this.apiUrl}/trainees/${trngid}`, trainee)
      .pipe(
        finalize(() => this.loaderService.hide()),
       // catchError(err => this.handleError(err))
      );
  }

  getPhotoByEmpId(empId: string): Observable<Blob> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/photo/${empId}`, { responseType: 'blob' })
      .pipe(
        finalize(() => this.loaderService.hide())
        //catchError(err => this.handleError(err))
      );
  }

  getAllPhotos(): Observable<any> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/list`)
      .pipe(
        finalize(() => this.loaderService.hide())
       // catchError(err => this.handleError(err))
      );
  }

  downloadPhoto(id: number): Observable<Blob> {
    this.loaderService.show();
    return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' })
      .pipe(
        finalize(() => this.loaderService.hide())
        //catchError(err => this.handleError(err))
      );
  }

  updateLeaveTaken(payload: UpdateLeavePayload): Observable<any> {
    this.loaderService.show();
    return this.http.put(`${this.apiUrl}/updateLeaveTaken`, payload).pipe(
        finalize(() => this.loaderService.hide()));
  }

submitAttendanceChangeRequest(payload: any) {
  console.log(payload);
  this.loaderService.show();
  return this.http.post(`${this.apiUrl}/attendance/requestChange`, payload).pipe(
        finalize(() => this.loaderService.hide()),catchError(err => this.handleError(err)));
}

// Fetch pending requests for manager
getPendingAttendanceRequests(managerId: string) {
  this.loaderService.show();
  return this.http.get(`${this.apiUrl}/requests/pending/${managerId}`).pipe(
        finalize(() => this.loaderService.hide()));
}

// Approve or reject request
updateAttendanceRequestStatus(payload: any) {
  this.loaderService.show();
  return this.http.post(`${this.apiUrl}/requests/approve`, payload).pipe(
        finalize(() => this.loaderService.hide()));
}

getCheckInEligibility(employeeId: string): Observable<any> {
  this.loaderService.show();
  return this.http.get(`${this.apiUrl}/attendance/checkin/eligibility/${employeeId}`).pipe(
    finalize(() => this.loaderService.hide()),
    catchError(err => this.handleError(err))
  );
}

downloadEmployeeExcel(): Observable<Blob> {
  this.loaderService.show();
  return this.http.get(`${this.apiUrl}/download/employees/excel`, { responseType: 'blob' }).pipe(
    finalize(() => this.loaderService.hide()),
    catchError(err => this.handleError(err))
  );
}

downloadTraineeExcel(): Observable<Blob> {
  this.loaderService.show();
  return this.http.get(`${this.apiUrl}/download/trainees/excel`, { responseType: 'blob' }).pipe(
    finalize(() => this.loaderService.hide()),
    catchError(err => this.handleError(err))
  );
}

saveFingerprint(employeeId: string, fingerData: string): Observable<any> {
    const body = { employeeId, fingerData };
    return this.http.post(`${this.apiUrl}/save`, body);
  }

  fingerprintLogin(employeeId: string, fingerData: string) {
  return this.http.post(`${this.apiUrl}/validatefinger`, {
    employeeId,
    fingerData
  });
}

generateAdjustments(): Observable<any> {
    return this.http.post(`${this.apiUrl}/payroll-adjustments/generate`, {});
  }

  getForManager(managerId: string, month: string): Observable<PayrollAdjustment[]> {
    return this.http.get<PayrollAdjustment[]>(`${this.apiUrl}/payroll-adjustments/manager/${managerId}/${month}`);
  }

  update(id: number, adjustment: Partial<PayrollAdjustment>): Observable<PayrollAdjustment> {
    return this.http.put<PayrollAdjustment>(`${this.apiUrl}/payroll-adjustments/${id}`, adjustment);
  }

  approve(id: number): Observable<PayrollAdjustment> {
    return this.http.post<PayrollAdjustment>(`${this.apiUrl}/payroll-adjustments/approve/${id}`, {});
  }

  reject(id: number): Observable<PayrollAdjustment> {
    return this.http.post<PayrollAdjustment>(`${this.apiUrl}/payroll-adjustments/reject/${id}`, {});
  }

  getAllPayrollAdjustments(): Observable<PayrollAdjustment[]> {
  return this.http.get<PayrollAdjustment[]>(`${this.apiUrl}/payroll-adjustments/all`);
}

adminApproveAdjustment(id: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/payroll-adjustments/admin-approve/${id}`, {});
}

adminRejectAdjustment(id: number, remarks: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/payroll-adjustments/admin-reject/${id}`, { remarks });
}


// private handleError(error: HttpErrorResponse): Observable<never> {
//     const message = error.error?.message || 'An unknown error occurred.';
//     console.error('Error occurred:', error);
//     this.openDialog('Error', message);
//     return throwError(() => new Error(message));
//   }

  private handleError(error: HttpErrorResponse): Observable<never> {
  let message = 'An unknown error occurred.';

  if (error.error) {
    if (typeof error.error === 'string') {
      // Backend might return a JSON string like "{\"error\":\"Already checked in for today\"}"
      try {
        const parsed = JSON.parse(error.error);
        message = parsed.error || parsed.message || message;
      } catch {
        message = error.error; // fallback if it’s just plain text
      }
    } else if (error.error.error) {
      message = error.error.error;
    } else if (error.error.message) {
      message = error.error.message;
    }
  }

  console.error('Error occurred:', error);
  this.openDialog('Error', message);
  return throwError(() => new Error(message));
}

uploadEmployeeWithDocuments(formData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/onboard`, formData).pipe(
        finalize(() => this.loaderService.hide()));
}

getOverallMonthlyAttendanceSummary() {
  return this.http.get(`${this.apiUrl}/overall-monthly-attendance-summary`);
}
// api.service.ts
getPendingCounts(managerId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/notifications/pending-counts/${managerId}`)
    .pipe(
      catchError(err => {
        console.error('Failed to load notification counts', err);
        return of({ counts: { total: 0 } }); // fallback
      })
    );
}

 // Create new exit form
createExitForm(exitFormData: ExitForm): Observable<ExitForm> {
  const url = `${this.apiUrl}/api/create/exit-form`;
  this.loaderService.show();
  return this.http.post<ExitForm>(url, exitFormData).pipe(
    tap((response) => {
      console.log('Exit form created successfully:', response);
      setTimeout(() => window.location.reload(), 1000);
      this.openDialog('Success', 'Exit form created successfully!');
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error creating exit form:', error);
      this.openDialog('Error', `Failed to create exit form: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Get all active exit forms
getAllActiveExitForms(): Observable<ExitForm[]> {
  const url = `${this.apiUrl}/api/all/exit-form`;
  this.loaderService.show();
  return this.http.get<ExitForm[]>(url).pipe(
    tap((response) => {
      console.log('Active exit forms retrieved:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching exit forms:', error);
      this.openDialog('Error', `Failed to fetch exit forms: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Get exit form by ID
getExitFormById(id: string): Observable<ExitForm> {
  const url = `${this.apiUrl}/api/exit-from/${id}`;
  this.loaderService.show();
  return this.http.get<ExitForm>(url).pipe(
    tap((response) => {
      console.log('Exit form retrieved:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching exit form:', error);
      this.openDialog('Error', `Failed to fetch exit form: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Update exit form
updateExitForm(id: string, exitFormData: ExitForm): Observable<ExitForm> {
  const url = `${this.apiUrl}/api/update/exit-form/${id}`;
  this.loaderService.show();
  return this.http.put<ExitForm>(url, exitFormData).pipe(
    tap((response) => {
      console.log('Exit form updated successfully:', response);
      this.openDialog('Success', 'Exit form updated successfully!');
      setTimeout(() => window.location.reload(), 1000);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error updating exit form:', error);
      this.openDialog('Error', `Failed to update exit form: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Soft delete exit form
softDeleteExitForm(id: string): Observable<string> {
  const url = `${this.apiUrl}/api/delete/exit-from/${id}`;
  this.loaderService.show();
  return this.http.put<string>(url, {}).pipe(
    tap((response) => {
      console.log('Exit form deleted successfully:', response);
      this.openDialog('Success', 'Exit form deleted successfully!');
      setTimeout(() => window.location.reload(), 1000);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error deleting exit form:', error);
      this.openDialog('Error', `Failed to delete exit form: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// updateExitFormStatus(exitFormId: string, statusCode: string): Observable<any> {
//   const url = `${this.apiUrl}/api/exit-form/${exitFormId}/status`;
//   return this.http.put(url, { statusCode: statusCode });
// }

// In your ApiService class
// getReportsByManager(managerId: string): Observable<any> {
//   return this.http.get(`${this.apiUrl}/api/employees/reports/${managerId}`);
// }

//this is for repot to api

 // FIXED: Get exit forms by employee ID
getExitFormsByEmployee(employeeId: string): Observable<any> {
  console.log('🟢 Calling getExitFormsByEmployee for:', employeeId);
  const url = `${this.apiUrl}/api/exitForms/get/${employeeId}`;
  this.loaderService.show();
  
  return this.http.get<any>(url).pipe(
    tap(response => {
      console.log('🟢 getExitFormsByEmployee Response:', response);
      if (response?.data && Array.isArray(response.data)) {
        console.log('🟢 First form data keys:', Object.keys(response.data[0] || {}));
        console.log('🟢 First form timestamp fields:', {
          userSubmittedOn: response.data[0]?.userSubmittedOn,
          managerSubmittedOn: response.data[0]?.managerSubmittedOn,
          hrRound1SubmittedOn: response.data[0]?.hrRound1SubmittedOn,
          assetSubmittedOn: response.data[0]?.assetSubmittedOn,
          hrRound2SubmittedOn: response.data[0]?.hrRound2SubmittedOn,
          payrollSubmittedOn: response.data[0]?.payrollSubmittedOn,
          finalHrSubmittedOn: response.data[0]?.finalHrSubmittedOn
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Error in getExitFormsByEmployee:', error);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}


getExitFormByEmployee(employeeId: string) {
  return this.http.get<any[]>(`${this.apiUrl}/api/exit-form/employee/${employeeId}`);
}

withdrawExitForm(formId: string, withdrawPurpose?: string): Observable<any> {
  const url = `${this.apiUrl}/api/exit-form/${formId}/withdraw`;
  console.log('🔄 Calling withdraw API:', url);
  
  const body = withdrawPurpose ? { withdrawPurpose } : {};
  setTimeout(() => window.location.reload(), 1000);
  
  return this.http.put(url, body).pipe(
    tap(response => console.log('✅ Withdraw API response:', response)),
    catchError(error => {
      console.error('❌ Withdraw API error:', error);
      return throwError(error);
    })
  );
}


  // ---------------- Get all non-deleted manager reviews ----------------
  getAllManagerReviews(): Observable<ManagerReview[]> {
    const url = `${this.apiUrl}/api/getallmanager`;
    this.loaderService.show();
    return this.http.get<ManagerReview[]>(url).pipe(
      tap(res => console.log('All Manager Reviews:', res)),
      catchError((err: HttpErrorResponse) => {
        console.error('Error fetching manager reviews:', err);
        return throwError(() => new Error(err.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

// In your api.service.ts, update these methods:

// ---------------- Create or Update Manager Review ----------------
submitManagerReview(payload: ManagerReview): Observable<any> {
  const url = `${this.apiUrl}/api/manager/create`;
  const headers = new HttpHeaders({ 'username': payload.managerName || 'Unknown' });

  this.loaderService.show();
  return this.http.post<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log('Review submitted:', res);
      if (res.success) {
        // this.openDialog('Success', res.message);
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error submitting review:', err);
      this.openDialog('Error', err.error?.message || 'Failed to submit review');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// ---------------- Update Manager Review ----------------
updateManagerReview(id: string, payload: ManagerReview): Observable<any> {
  const url = `${this.apiUrl}/api/manager/update/${id}`;
  const headers = new HttpHeaders({
    'username': payload.managerName || 'Unknown'
  });

  this.loaderService.show();

  console.log("Sending update payload:", payload);
  setTimeout(() => window.location.reload(), 1000);

  return this.http.put<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log('Review updated:', res);
      if (res.success) {
        this.openDialog('Success', res.message);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error updating review:', err);
      this.openDialog('Error', err.error?.message || 'Failed to update review');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}



  // ---------------- Logical Delete of Manager Review ----------------
  deleteManagerReview(id: string, currentUser: string): Observable<any> {
    const url = `${this.apiUrl}/api/deletemanager/${id}`;
    const headers = new HttpHeaders({ 'username': currentUser });

    this.loaderService.show();
    return this.http.delete(url, { headers }).pipe(
      tap(res => console.log('Review deleted:', res)),
      catchError((err: HttpErrorResponse) => {
        console.error('Error deleting review:', err);
        setTimeout(() => window.location.reload(), 1000);
        return throwError(() => new Error(err.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // ---------------- Get Reviews by Employee ID ----------------
  // getManagerReviewsByEmployee(employeeId: string): Observable<ManagerReview[]> {
  //   const url = `${this.apiUrl}/api/manager/employee/${employeeId}`;
  //   this.loaderService.show();
  //   return this.http.get<ManagerReview[]>(url).pipe(
  //     tap(res => console.log(`Reviews for employee ${employeeId}:`, res)),
  //     catchError((err: HttpErrorResponse) => {
  //       console.error('Error fetching reviews by employee:', err);
  //       return throwError(() => new Error(err.message));
  //     }),
  //     finalize(() => this.loaderService.hide())
  //   );
  // }

  // Get manager reviews by employee ID
  getManagerReviewsByEmployee(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/manager/employee/${employeeId}`);
  }

  //HR PAGE
  updateHRVerification(payload: any) {
  return this.http.post(`${this.apiUrl}/api/hr/verify-exit`, payload);
  setTimeout(() => window.location.reload(), 1000);
}
// HR REVIEW API METHODS - SIMPLIFIED VERSION

// Create or Update HR Review (POST) - CORRECTED
submitHRReview(payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/hr/review`;
  
  // Get username from localStorage for header (if needed by backend)
  const currentUser = localStorage.getItem('username') || 'HR User';
  
  const headers = new HttpHeaders({
    username: currentUser, // Still send username in header if backend needs it
    'Content-Type': 'application/json'
  });

  console.log("🚀 API Service - Sending HR Review:");
  console.log("Header username:", currentUser);
  console.log("Payload hrName (for DB column):", payload.hrName);
  console.log("Payload hrGeneralComments (for DB column):", payload.hrGeneralComments);

  this.loaderService.show();

  return this.http.post<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log("✅ Backend Response:", res);
      console.log("✅ Saved hrName in DB:", res.data?.hrName);
      console.log("✅ Saved hrGeneralComments in DB:", res.data?.hrGeneralComments);
      if (res.success) {
        this.openDialog('Success', res.message);
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error("❌ Error:", error);
      this.openDialog('Error', error.error?.message || 'Failed to submit HR Review.');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Get HR Review by Exit Form ID (NOT HR Review ID)
getHRReviewByExitFormId(exitFormId: string): Observable<any> {
  const url = `${this.apiUrl}/api/hr/review/${exitFormId}`;
  this.loaderService.show();

  return this.http.get<any>(url).pipe(
    tap(res => {
      console.log("HR Review Data:", res);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error("Error fetching HR Review:", error);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// DELETE HR Review (clears HR data from exit form)
deleteHRReview(exitFormId: string): Observable<any> {
  const url = `${this.apiUrl}/api/hr/review/${exitFormId}`;

  this.loaderService.show();

  return this.http.delete<any>(url).pipe(
    tap(res => {
      console.log("HR Review Deleted:", res);
      if (res.success) {
        this.openDialog('Success', res.message);
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error("Error deleting HR Review:", error);
      this.openDialog('Error', 'Failed to delete HR Review.');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Get all forms pending HR review (Optional - if needed)
getPendingHRReviews(): Observable<any> {
  const url = `${this.apiUrl}/api/hr/review/pending`;

  this.loaderService.show();

  return this.http.get<any>(url).pipe(
    tap(res => {
      console.log("Pending HR Reviews:", res);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error("Error fetching pending HR reviews:", error);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Update existing HR Review (PUT) - CORRECTED
updateHRReview(payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/hr/review/update`;
  
  // Get username from localStorage for header
  const currentUser = localStorage.getItem('username') || 'HR User';
  
  const headers = new HttpHeaders({
    username: currentUser,
    'Content-Type': 'application/json'
  });

  console.log("🚀 API Update - Sending to backend:");
  console.log("Payload hrName (for DB column):", payload.hrName);
  console.log("Payload hrGeneralComments (for DB column):", payload.hrGeneralComments);

  this.loaderService.show();
  setTimeout(() => window.location.reload(), 1000);

  return this.http.put<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log("✅ Update Response:", res);
      console.log("✅ Updated hrName in DB:", res.data?.hrName);
      console.log("✅ Updated hrGeneralComments in DB:", res.data?.hrGeneralComments);
      if (res.success) {
        this.openDialog('Success', res.message);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error("❌ Error updating:", error);
      this.openDialog('Error', error.error?.message || 'Failed to update HR Review.');
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}
  // ==================== ASSET CLEARANCE ENDPOINTS ====================

  // ---------------- Submit Asset Clearance ----------------
submitAssetClearance(exitFormId: string, payload: AssetClearanceData): Observable<any> {
  const url = `${this.apiUrl}/api/asset-clearance/${exitFormId}`;
  const currentUser = localStorage.getItem('username') || 'Asset-Manager'; // Get logged-in user
  const headers = new HttpHeaders({ 'username': currentUser });

  this.loaderService.show();
  return this.http.post<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log('Asset clearance submitted:', res);
      if (res.success) {
        this.openDialog('Success', res.message);
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error submitting asset clearance:', err);
      this.openDialog('Error', err.error?.message || 'Failed to submit asset clearance');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

  // ---------------- Get Asset Clearance by Exit Form ID ----------------
  getAssetClearance(exitFormId: string): Observable<any> {
        const url = `${this.apiUrl}/api/asset-clearance/${exitFormId}`;
    this.loaderService.show();
    return this.http.get<any>(url).pipe(
      tap(res => {
        console.log('Asset clearance fetched:', res);
        if (res.success) {
          console.log('Asset clearance data:', res.assetClearance);
          // setTimeout(() => window.location.reload(), 1000);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error fetching asset clearance:', err);
        return throwError(() => new Error(err.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // ==================== UTILITY METHODS ====================

  // ---------------- Parse Asset Clearance String ----------------
  parseAssetClearanceString(assetString: string): any[] {
    if (!assetString || assetString.trim() === '') {
      return [];
    }

    try {
      const assets = assetString.split(' # ');
      return assets.map(asset => {
        const parts = asset.split(' : ');
        if (parts.length === 2) {
          const conditionRemarks = parts[1].split(' || ');
          return {
            name: parts[0].trim(),
            condition: conditionRemarks[0].trim(),
            comments: conditionRemarks[1] === 'null' ? '' : conditionRemarks[1].trim()
          };
        }
        return null;
      }).filter(asset => asset !== null);
    } catch (error) {
      console.error('Error parsing asset clearance string:', error);
      return [];
    }
  }

  // ---------------- Format Asset Clearance for Display ----------------
  formatAssetClearanceForDisplay(assetString: string): string {
    if (!assetString || assetString.trim() === '') {
      return 'No assets submitted';
    }

    try {
      const assets = assetString.split(' # ');
      return assets.map(asset => {
        const parts = asset.split(' : ');
        if (parts.length === 2) {
          const conditionRemarks = parts[1].split(' || ');
          let formatted = `${parts[0].trim()} - ${conditionRemarks[0].trim()}`;
          if (conditionRemarks[1] && conditionRemarks[1] !== 'null') {
            formatted += ` (${conditionRemarks[1].trim()})`;
          }
          return formatted;
        }
        return asset;
      }).join('\n');
    } catch (error) {
      console.error('Error formatting asset clearance:', error);
      return assetString;
    }
  }

// ---------------- Update Asset Clearance ----------------
updateAssetClearance(exitFormId: string, payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/asset-clearance/${exitFormId}`;
  const currentUser = localStorage.getItem('username') || 'Asset-Manager'; // Get logged-in user
  const headers = new HttpHeaders({ 'username': currentUser });

  this.loaderService.show();
  return this.http.put<any>(url, payload, { headers }).pipe(
    tap((res: any) => {
      console.log('Asset clearance updated:', res);
      if (res.success) {
        this.openDialog('Success', res.message);
        // setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error updating asset clearance:', err);
      this.openDialog('Error', err.error?.message || 'Failed to update asset clearance');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// ---------------- Submit or Update Asset Clearance (Smart method) ----------------
saveAssetClearance(exitFormId: string, payload: any, isUpdate: boolean = false): Observable<any> {
  if (isUpdate) {
    return this.updateAssetClearance(exitFormId, payload);
  } else {
    return this.submitAssetClearance(exitFormId, payload);
  }
}

  // ---------------- Submit Payroll Checks (After Payroll Team fills) ----------------
submitPayrollChecks(exitFormId: string, payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/payroll/submit/${exitFormId}`;
  const currentUser = localStorage.getItem('username') || 'Payroll-User'; // Already getting from localStorage
  const headers = new HttpHeaders({
    'username': currentUser, // This will be sent to backend
    'Content-Type': 'application/json'
  });


  this.loaderService.show();
  return this.http.post<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log('Payroll Checks Submitted:', res);
      if (res.success) {
        this.openDialog('Success', 'Payroll submitted! Now pending Final HR Approval.');
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error submitting payroll:', err);
      this.openDialog('Error', err.error?.message || 'Failed to submit payroll checks');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

  // ---------------- Get Payroll Checks (Load existing data) ----------------
  getPayrollChecks(exitFormId: string): Observable<any> {
    const url = `${this.apiUrl}/api/payroll/get/${exitFormId}`;

    this.loaderService.show(); 
    return this.http.get<any>(url).pipe(
      tap(res => {
        console.log('Payroll Data Loaded:', res);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error loading payroll data:', err);
        return throwError(() => new Error(err.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

// ---------------- UPDATE Payroll Checks (Using PUT - Correct REST) ----------------
updatePayrollChecks(exitFormId: string, payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/payroll/update/${exitFormId}`;
  const currentUser = localStorage.getItem('username') || 'Payroll-User'; // Get logged-in user
  const headers = new HttpHeaders({
    'username': currentUser, // This will be sent to backend
    'Content-Type': 'application/json'
  });

  this.loaderService.show();
  return this.http.put<any>(url, payload, { headers }).pipe(
    tap(res => {
      console.log('Payroll Updated (PUT):', res);
      if (res.success) {
        this.openDialog('Success', res.message || 'Payroll updated successfully!');
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error updating payroll:', err);
      this.openDialog('Error', err.error?.message || 'Failed to update payroll');
      return throwError(() => err);
    }),
    finalize(() => this.loaderService.hide())
  );
}

// ---------------- Final HR Approval → EXIT CLOSED ----------------
finalHrApproval(exitFormId: string, finalRemarks: string, finalChecklistData: string): Observable<ApiResponse> {
  const url = `${this.apiUrl}/api/final-hr/approve/${exitFormId}`;
  
  // Prepare payload with finalChecklistData
  const payload = {
    finalRemarks: finalRemarks,
    finalChecklistData: finalChecklistData  // This will go to your new column
  };
  
  console.log('Sending payload with finalChecklistData:', payload);
  
  const headers = new HttpHeaders({
    'username': localStorage.getItem('username') || 'HR-Final',
    'Content-Type': 'application/json'
  });

  this.loaderService.show();
  return this.http.post<ApiResponse>(url, payload, { headers }).pipe(
    tap((res: ApiResponse) => {
      console.log('Final HR Approval Response:', res);
      if (res.success) {
        this.openDialog('SUCCESS', 'Exit Closed Successfully!');
        setTimeout(() => window.location.reload(), 1000);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error in final approval:', err);
      this.openDialog('Error', err.error?.message || 'Failed to close exit');
      return throwError(() => new Error(err.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Remove or modify the prepareChecklistPayload method since we're now sending finalChecklistData directly

// ADD THIS METHOD IN ApiService
getFinalHrApprovalData(exitFormId: string): Observable<ApiResponse> {
  const url = `${this.apiUrl}/api/final-hr/get/${exitFormId}`;

  this.loaderService.show();
  return this.http.get<ApiResponse>(url).pipe(
    tap((res: ApiResponse) => {
      console.log('Final HR Data:', res);
      if (res.success && res.data) {
        console.log('Checklist data:', res.data.finalChecklistData);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      console.error('Error loading Final HR data:', err);
      return throwError(() => err);
    }),
    finalize(() => this.loaderService.hide())
  );
}

// SUBMIT HR OFFBOARDING
// api.service.ts — FINAL VERSION
submitHrOffboarding(exitFormId: string, payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/hr-offboarding/submit/${exitFormId}`;

  this.loaderService.show();
  setTimeout(() => window.location.reload(), 1000);
  return this.http.post<any>(url, payload).pipe(  // Just send { offboarding_checks: "..." }
    tap(res => console.log('Success:', res)),
    catchError(err => {
      console.error('Error:', err);
      return throwError(() => err);
    }),
    finalize(() => this.loaderService.hide())
  );
}

// GET HR OFFBOARDING DATA
getHrOffboardingData(exitFormId: string): Observable<any> {
  const url = `${this.apiUrl}/api/hr-offboarding/get/${exitFormId}`;
  this.loaderService.show();
  return this.http.get<any>(url).pipe(
    finalize(() => this.loaderService.hide())
  );
}

// UPDATE HR OFFBOARDING (uses same endpoint as submit)
updateHrOffboarding(exitFormId: string, payload: any): Observable<any> {
  const url = `${this.apiUrl}/api/hr-offboarding/submit/${exitFormId}`;

  this.loaderService.show();
  setTimeout(() => window.location.reload(), 1000);
  return this.http.post<any>(url, payload).pipe(
    tap(res => console.log('Update Success:', res)),
    catchError(err => {
      console.error('Update Error:', err);
      return throwError(() => err);
    }),
    finalize(() => this.loaderService.hide())
  );
}

 openDialog(title: string, message: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: { title, message },
    });
  }

  // ==================== HR LEAVE APPROVAL METHODS ====================

// CREATE - Create new HR leave approval
createHrLeaveApproval(approval: HrLeaveApproval): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/create`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  // Prepare the request body
  const requestBody = {
    employeeId: approval.employeeId,
    leaveType: approval.leaveType,
    status: approval.status || 'pending',
    hrName: approval.hrName,
    managerName: approval.managerName
  };
  
  this.loaderService.show();
  return this.http.post<HrLeaveApprovalResponse>(url, requestBody, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'createHrLeaveApproval')),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get all HR leave approvals
getAllHrLeaveApprovals(): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/all`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  this.loaderService.show();
  return this.http.get<HrLeaveApprovalResponse>(url, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'getAllHrLeaveApprovals')),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get HR leave approvals by employee ID
getHrLeaveApprovalsByEmployee(employeeId: string): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/employee/${employeeId}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  this.loaderService.show();
  return this.http.get<HrLeaveApprovalResponse>(url, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'getHrLeaveApprovalsByEmployee')),
    finalize(() => this.loaderService.hide())
  );
}

// UPDATE - Update HR leave approval
updateHrLeaveApproval(id: number, approvalData: Partial<HrLeaveApproval>): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/update/${id}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  // Only send fields that can be updated
  const requestBody: any = {};
  if (approvalData.leaveType !== undefined) requestBody.leaveType = approvalData.leaveType;
  if (approvalData.status !== undefined) requestBody.status = approvalData.status;
  if (approvalData.hrName !== undefined) requestBody.hrName = approvalData.hrName;
  if (approvalData.managerName !== undefined) requestBody.managerName = approvalData.managerName;
  
  this.loaderService.show();
  return this.http.put<HrLeaveApprovalResponse>(url, requestBody, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'updateHrLeaveApproval')),
    finalize(() => this.loaderService.hide())
  );
}

// DELETE - Delete HR leave approval (soft delete)
deleteHrLeaveApproval(id: number): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/delete/${id}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  this.loaderService.show();
  return this.http.delete<HrLeaveApprovalResponse>(url, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'deleteHrLeaveApproval')),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get single HR leave approval by ID (optional)
getHrLeaveApprovalById(id: number): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/${id}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  this.loaderService.show();
  return this.http.get<HrLeaveApprovalResponse>(url, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'getHrLeaveApprovalById')),
    finalize(() => this.loaderService.hide())
  );
}

// READ - Get HR leave approvals by status (optional)
getHrLeaveApprovalsByStatus(status: string): Observable<HrLeaveApprovalResponse> {
  const url = `${this.apiUrl}/api/${status}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'apiKey': this.key
  });
  
  this.loaderService.show();
  return this.http.get<HrLeaveApprovalResponse>(url, { headers }).pipe(
    catchError((error) => this.handleHttpError(error, 'getHrLeaveApprovalsByStatus')),
    finalize(() => this.loaderService.hide())
  );
}

// Designation CRUD Operations
getAllDesignation(): Observable<Designation[]> {
  const url = `${this.apiUrl}/api/designations`; // This is correct
  this.loaderService.show();
  return this.http.get<Designation[]>(url).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching designations:', error);
      this.openDialog('Error', `Failed to fetch designations: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

addDesignations(designation: any): Observable<any> {
  const url = `${this.apiUrl}/api/designations`; // This is correct
  this.loaderService.show();
  
  // Prepare data for backend
  const requestData = {
    roleId: designation.roleId,
    roleName: designation.roleName,
    description: designation.description || '',
    rcreuserid: designation.rcreuserid || 'SYSTEM'
  };
  
  console.log('Sending to backend:', requestData);
  
  return this.http.post<any>(url, requestData).pipe(
    tap((response) => {
      console.log('API Response:', response);
      this.openDialog('Success', 'Designation added successfully!');
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error adding designation:', error);
      const errorMsg = error.error?.error || error.error?.message || 'Unknown error';
      this.openDialog('Error', `Failed to add designation: ${errorMsg}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

updateDesignations(designationId: string, designation: any): Observable<any> {
  const url = `${this.apiUrl}/api/designations/${designationId}`;
  this.loaderService.show();
  
  const requestData = {
    roleName: designation.roleName,
    description: designation.description || '',
    rcreuserid: designation.rcreuserid || 'SYSTEM'
  };
  
  return this.http.put<any>(url, requestData).pipe(
    tap((response) => {
      console.log('API Response:', response);
      this.openDialog('Success', 'Designation updated successfully!');
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error updating designation:', error);
      const errorMsg = error.error?.error || error.error?.message || 'Unknown error';
      this.openDialog('Error', `Failed to update designation: ${errorMsg}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

deleteDesignations(designationId: string): Observable<any> {
  const url = `${this.apiUrl}/api/designations/${designationId}`;
  this.loaderService.show();
  return this.http.delete(url).pipe(
    tap((response) => {
      console.log('API Response:', response);
      this.openDialog('Success', 'Designation deleted successfully!');
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error deleting designation:', error);
      const errorMsg = error.error?.error || error.error?.message || 'Unknown error';
      this.openDialog('Error', `Failed to delete designation: ${errorMsg}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

getDesignationsById(designationId: string): Observable<Designation> {
  const url = `${this.apiUrl}/api/designations/${designationId}`;
  this.loaderService.show();
  return this.http.get<Designation>(url).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error fetching designation:', error);
      this.openDialog('Error', `Failed to fetch designation: ${error.error?.message || 'Unknown error'}`);
      return throwError(() => new Error(error.message));
    }),
    finalize(() => this.loaderService.hide())
  );
}

  // Upload file
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    this.loaderService.show();
    
    return this.http.post(`${this.apiUrl}/api/file/upload`, formData).pipe(
      tap((response: any) => {
        console.log('File uploaded successfully:', response);
        this.showNotification('Success', 'File uploaded successfully!', 'success');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error uploading file:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Upload failed';
        this.showNotification('Error', errorMsg, 'error');
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // Get list of files
  getFiles(): Observable<any[]> {
    this.loaderService.show();
    
    return this.http.get<any[]>(`${this.apiUrl}/api/file/list`).pipe(
      tap((response) => {
        console.log('Files retrieved successfully:', response.length);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching files:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Failed to fetch files';
        this.showNotification('Error', errorMsg, 'error');
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // Delete file
  deleteFile(filename: string): Observable<any> {
    this.loaderService.show();
    
    return this.http.delete(`${this.apiUrl}/api/file/delete/${filename}`).pipe(
      tap((response: any) => {
        console.log('File deleted successfully:', response);
        this.showNotification('Success', 'File deleted successfully!', 'success');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting file:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Delete failed';
        this.showNotification('Error', errorMsg, 'error');
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // Edit/update file
  editFile(oldFilename: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    this.loaderService.show();
    
    return this.http.put(`${this.apiUrl}/api/file/edit/${oldFilename}`, formData).pipe(
      tap((response: any) => {
        console.log('File updated successfully:', response);
        this.showNotification('Success', 'File updated successfully!', 'success');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating file:', error);
        const errorMsg = error.error?.error || error.error?.message || 'Update failed';
        this.showNotification('Error', errorMsg, 'error');
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  // View file (inline)
  // View file (inline - NO NEW TAB)
viewFile(fileName: string): Observable<Blob> {
  this.loaderService.show();
  
  return this.http.get(`${this.apiUrl}/api/file/view/${fileName}`, { 
    responseType: 'blob' 
  }).pipe(
    tap((blob) => {
      console.log('File retrieved for viewing:', fileName);
      // DO NOT open in new tab - just return the blob
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error viewing file:', error);
      const errorMsg = error.error?.error || error.error?.message || 'Failed to view file';
      this.showNotification('Error', errorMsg, 'error');
      return throwError(() => new Error(errorMsg));
    }),
    finalize(() => this.loaderService.hide())
  );
}

// Download file
downloadFile(fileName: string): Observable<Blob> {
  this.loaderService.show();
  
  return this.http.get(`${this.apiUrl}/api/file/download/${fileName}`, { 
    responseType: 'blob' 
  }).pipe(
    tap((blob) => {
      console.log('File downloaded:', fileName);
      
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Error downloading file:', error);
      const errorMsg = error.error?.error || error.error?.message || 'Download failed';
      this.showNotification('Error', errorMsg, 'error');
      return throwError(() => new Error(errorMsg));
    }),
    finalize(() => this.loaderService.hide())
  );
}

  // Get file info
  getFileInfo(fileName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/file/info/${fileName}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error getting file info:', error);
        return throwError(() => new Error('Failed to get file info'));
      })
    );
  }

  private showNotification(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
    // Implement your notification logic here
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    // You can use Angular Material Snackbar, Toastr, or custom notification
  }

  
  // ==============================
  // ADD THESE CELEBRATION METHODS
  // ==============================

  /**
   * Send celebration email
   */
  sendCelebrationEmail(request: CelebrationEmailRequest): Observable<CelebrationEmailResponse> {
    const url = `${this.apiUrl}/api/celebration/send-email`;
    const key1 = `${this.key}`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'apiKey': key1
    });

    this.loaderService.show();
    
    return this.http.post<CelebrationEmailResponse>(url, request, { headers }).pipe(
      tap((response) => {
        console.log('Celebration email sent successfully:', response);
        this.openDialog('Success', 'Celebration wish sent successfully!');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error sending celebration email:', error);
        this.openDialog('Error', `Failed to send celebration email: ${error.error?.message || 'Unknown error'}`);
        return throwError(() => new Error(error.message));
      }),
      finalize(() => this.loaderService.hide())
    );
  }

  /**
   * Send birthday wish
   */
  sendBirthdayWish(
    celebrantEmail: string,
    celebrantName: string,
    celebrantId: string,
    years?: number
  ): Observable<CelebrationEmailResponse> {
    const request = this.prepareBirthdayRequest(celebrantEmail, celebrantName, celebrantId, years);
    
    if (!request) {
      return throwError(() => new Error('Failed to prepare birthday request. Please check if you are logged in.'));
    }

    return this.sendCelebrationEmail(request);
  }

  /**
   * Send anniversary wish
   */
  sendAnniversaryWish(
    celebrantEmail: string,
    celebrantName: string,
    celebrantId: string,
    years: number
  ): Observable<CelebrationEmailResponse> {
    if (!years || years <= 0) {
      return throwError(() => new Error('Years completed must be greater than 0'));
    }

    const request = this.prepareAnniversaryRequest(celebrantEmail, celebrantName, celebrantId, years);
    
    if (!request) {
      return throwError(() => new Error('Failed to prepare anniversary request. Please check if you are logged in.'));
    }

    return this.sendCelebrationEmail(request);
  }

  /**
   * Prepare birthday email request
   */
  private prepareBirthdayRequest(
    celebrantEmail: string,
    celebrantName: string,
    celebrantId: string,
    years?: number
  ): CelebrationEmailRequest | null {
    const userData = this.getUserData();
    
    if (!userData) {
      this.openDialog('Error', 'Please log in to send birthday wishes');
      return null;
    }

    if (!celebrantEmail || !celebrantName) {
      this.openDialog('Error', 'Celebrant information is missing');
      return null;
    }

    return {
      employeeEmail: celebrantEmail,
      employeeName: celebrantName,
      employeeId: celebrantId || '',
      senderEmail: userData.email || '',
      senderName: userData.username || 'Colleague',
      type: 'birthday',
      years: years
    };
  }

  /**
   * Prepare anniversary email request
   */
  private prepareAnniversaryRequest(
    celebrantEmail: string,
    celebrantName: string,
    celebrantId: string,
    years: number
  ): CelebrationEmailRequest | null {
    const userData = this.getUserData();
    
    if (!userData) {
      this.openDialog('Error', 'Please log in to send anniversary wishes');
      return null;
    }

    if (!celebrantEmail || !celebrantName) {
      this.openDialog('Error', 'Celebrant information is missing');
      return null;
    }

    return {
      employeeEmail: celebrantEmail,
      employeeName: celebrantName,
      employeeId: celebrantId || '',
      senderEmail: userData.email || '',
      senderName: userData.username || 'Colleague',
      type: 'anniversary',
      years: years
    };
  }

  /**
   * Get user data from localStorage
   */
  getUserData(): any {
    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        console.warn('No auth token found');
        return null;
      }

      // Try consolidated userData
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (this.isValidUserData(userData)) {
          return userData;
        }
      }

      // Fallback to individual keys
      return this.getUserDataFromIndividualKeys();
      
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Validate user data structure
   */
  private isValidUserData(userData: any): boolean {
    return userData && 
           (userData.username || userData.name) && 
           (userData.email || userData.employeeId);
  }

  /**
   * Get user data from individual localStorage keys
   */
  private getUserDataFromIndividualKeys(): any {
    const username = localStorage.getItem('username') || '';
    const employeeId = localStorage.getItem('employeeId') || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('name') || username;

    if (!username && !employeeId && !userEmail) {
      return null;
    }

    return {
      username: username,
      name: name,
      email: userEmail,
      employeeId: employeeId,
      role: localStorage.getItem('userRole') || '',
      reportTo: localStorage.getItem('reportTo') || '',
      managerName: localStorage.getItem('managerName') || '',
      dateOfBirth: localStorage.getItem('dateOfBirth') || null,
      dateOfJoining: localStorage.getItem('dateOfJoining') || null
    };
  }

  /**
   * Get celebration dates for current user
   */
  getCurrentUserCelebrationDates(): { dateOfBirth: string | null; dateOfJoining: string | null } {
    try {
      const userData = this.getUserData();
      if (userData?.dateOfBirth || userData?.dateOfJoining) {
        return {
          dateOfBirth: userData.dateOfBirth || null,
          dateOfJoining: userData.dateOfJoining || null
        };
      }

      const datesDataStr = localStorage.getItem('employeeDates');
      if (datesDataStr) {
        const datesData = JSON.parse(datesDataStr);
        return {
          dateOfBirth: datesData.dateOfBirth || null,
          dateOfJoining: datesData.dateOfJoining || null
        };
      }

      return { dateOfBirth: null, dateOfJoining: null };
    } catch (error) {
      console.error('Error getting celebration dates:', error);
      return { dateOfBirth: null, dateOfJoining: null };
    }
  }

  /**
   * Check if today is a celebration day for current user
   */
  checkTodaysCelebration(): { isBirthday: boolean; isAnniversary: boolean; yearsCompleted?: number } {
    const dates = this.getCurrentUserCelebrationDates();
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    let isBirthday = false;
    let isAnniversary = false;
    let yearsCompleted = 0;

    // Check birthday
    if (dates.dateOfBirth) {
      const birthdayMatch = this.checkDateMatch(dates.dateOfBirth, todayDay, todayMonth);
      isBirthday = birthdayMatch.match;
    }

    // Check anniversary
    if (dates.dateOfJoining) {
      const anniversaryMatch = this.checkAnniversaryMatch(dates.dateOfJoining, todayDay, todayMonth, todayYear);
      isAnniversary = anniversaryMatch.match;
      yearsCompleted = anniversaryMatch.years || 0;
    }

    return { isBirthday, isAnniversary, yearsCompleted };
  }

  /**
   * Check if a date matches today
   */
  private checkDateMatch(dateString: string, todayDay: number, todayMonth: number): { match: boolean; years?: number } {
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

  /**
   * Check anniversary match
   */
  private checkAnniversaryMatch(dateString: string, todayDay: number, todayMonth: number, todayYear: number): { match: boolean; years?: number } {
    try {
      const datePart = dateString.split(' ')[0];
      const parts = datePart.split('-');
      
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (month === todayMonth && day === todayDay) {
          const yearsCompleted = todayYear - year;
          if (yearsCompleted > 0) {
            return { match: true, years: yearsCompleted };
          }
        }
      }
    } catch (error) {}
    return { match: false };
  }


// HR Leave Approval specific error handler
private handleHttpError(error: HttpErrorResponse, operation = 'operation'): Observable<never> {
  let message = 'An unknown error occurred.';
  
  if (error.error) {
    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        message = parsed.error || parsed.message || message;
      } catch {
        message = error.error;
      }
    } else if (error.error.error) {
      message = error.error.error;
    } else if (error.error.message) {
      message = error.error.message;
    }
  }
  
  console.error(`${operation} failed:`, error);
  this.openDialog('Error', message);
  return throwError(() => new Error(message));
}

 // Add this method to get leave summary
  getLeaveSummary(empId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getLeaveSummary/${empId}`);
  }


}
