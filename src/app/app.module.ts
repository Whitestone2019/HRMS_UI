import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FullCalendarModule } from '@fullcalendar/angular'; // For FullCalendar in TimesheetComponent
import { AppRoutingModule } from './app-routing.module';
import { APP_BASE_HREF } from '@angular/common';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card'; // Added for calendar card UI

// Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './People/header/header.component';
import { FooterComponent } from './People/footer/footer.component';
import { LoginComponent } from './People/login/login.component';
import { AdminMenuComponent } from './People/adminmenu/adminmenu.component';
import { DashboardComponent } from './People/dashboard/dashboard.component';
import { AddEmployeeComponent } from './People/addemployee/addemployee.component';
import { EmpDirComponent } from './People/empdir/empdir.component';
import { SidebarComponent } from './People/sidebar/sidebar.component';
import { HomeHeaderComponent } from './People/home-header/home-header.component';
import { OverviewComponent } from './People/overview/overview.component';
import { WidgetComponent } from './People/widget/widget.component';
import { AttendanceComponent } from './People/attendance/attendance.component';
import { CalendarComponent } from './People/calendar/calendar.component';
import { CheckInDialogComponent } from './People/check-in-dialog/check-in-dialog.component';
import { CheckOutDialogComponent } from './People/check-out-dialog/check-out-dialog.component';
import { ProfileComponent } from './People/overview/profile/profile.component';
import { WorkscheduleComponent } from './People/overview/workschedule/workschedule.component';
import { OperationsComponent } from './People/operations/operations.component';
import { LeaveSummaryComponent } from './People/leave-summary/leave-summary.component';
import { LeaveBalanceComponent } from './People/leave-balance/leave-balance.component';
import { LeaveRequestComponent } from './People/leave-request/leave-request.component';
import { ApplyLeaveComponent } from './People/apply-leave/apply-leave.component';
import { OnboardingComponent } from './People/onboarding/onboarding.component';
import { TriggerComponent } from './People/operations/userinfo/add-emp/createemp/trigger/trigger.component';
import { CreateempComponent } from './People/operations/userinfo/add-emp/createemp/createemp.component';
import { UserinfoComponent } from './People/operations/userinfo/userinfo.component';
import { AddEmpComponent } from './People/operations/userinfo/add-emp/add-emp.component';
import { ResetPasswordComponent } from './People/reset-password/reset-password.component';
import { EmployeeAttendanceSummaryComponent } from './People/employee-attendance-summary/employee-attendance-summary.component';
import { AddCandidateComponent } from './People/addcandidate/addcandidate.component';
import { TravelComponent } from './People/travel/travel.component';
import { TravelRequestViewComponent } from './People/travel-request-view/travel-request-view.component';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { PayslipComponent } from './Payroll/components/settings/payslip/payslip.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { TimesheetComponent } from './People/timesheet/timesheet.component';

// Services and Interceptors
import { ApiService } from './api.service';
import { TimeFormatInterceptor } from './People/interceptors/time-format.interceptor';
import { ApiKeyInterceptor } from './interceptors/api-key.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TimesheetCalendarDialogComponent } from './People/timesheet-calendar-dialog/timesheet-calendar-dialog.component';
import { MatOption } from "@angular/material/core";
import { EditAttendanceDialogComponent } from './People/edit-attendance-dialog/edit-attendance-dialog.component';
import { NoCacheInterceptor } from './no-cache.interceptor';
import { AttendancePieChartComponent } from './People/overview/attendance-pie-chart/attendance-pie-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    AdminMenuComponent,
    DashboardComponent,
    AddEmployeeComponent,
    EmpDirComponent,
    SidebarComponent,
    HomeHeaderComponent,
    OverviewComponent,
    WidgetComponent,
    AttendanceComponent,
    CalendarComponent,
    CheckInDialogComponent,
    CheckOutDialogComponent,
    ProfileComponent,
    WorkscheduleComponent,
    OperationsComponent,
    LeaveSummaryComponent,
    LeaveBalanceComponent,
    LeaveRequestComponent,
    ApplyLeaveComponent,
    OnboardingComponent,
    TriggerComponent,
    CreateempComponent,
    UserinfoComponent,
    AddEmpComponent,
    ResetPasswordComponent,
    EmployeeAttendanceSummaryComponent,
    AddCandidateComponent,
    TravelComponent,
    TravelRequestViewComponent,
    AlertDialogComponent,
    PayslipComponent,
    LoaderComponent,
    TimesheetComponent,
    TimesheetCalendarDialogComponent,
    EditAttendanceDialogComponent,
    AttendancePieChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FullCalendarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule // Added for card-based UI
    ,
    MatOption
],
  exports: [
    AdminMenuComponent // For external use in other modules
  ],
  providers: [
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiKeyInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeFormatInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NoCacheInterceptor,
      multi: true
    },
    { provide: APP_BASE_HREF, useValue: '/HRMS' },
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}