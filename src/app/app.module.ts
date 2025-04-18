import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';
providers: [{ provide: APP_BASE_HREF, useValue: '/HRMS' }]

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


// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

// Services and Interceptors
import { ApiService } from './api.service';
import { TimeFormatInterceptor } from './People/interceptors/time-format.interceptor';
import { ResetPasswordComponent } from './People/reset-password/reset-password.component';
import { EmployeeAttendanceSummaryComponent } from './People/employee-attendance-summary/employee-attendance-summary.component';
import { AddCandidateComponent } from './People/addcandidate/addcandidate.component';
import { RouterModule } from '@angular/router';
//import { ExpenseListItemComponent } from './Expense/pages/expenses/expense-list-item.component';
import { TravelComponent } from './People/travel/travel.component';
import { TravelRequestViewComponent } from './People/travel-request-view/travel-request-view.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { PayslipComponent } from './Payroll/components/settings/payslip/payslip.component';
import { ApiKeyInterceptor } from './interceptors/api-key.interceptor';
import { LoaderComponent } from './shared/loader/loader.component';
//import { HeaderComponent } from './Payroll/components/layout/header/header.component';




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
    AddCandidateComponent,
    AddEmpComponent,
    UserinfoComponent,
    ResetPasswordComponent,
    EmployeeAttendanceSummaryComponent,
    OnboardingComponent,
    TravelComponent,
    TravelRequestViewComponent,
    AddCandidateComponent,
    AddEmpComponent,
    UserinfoComponent,
    AddEmpComponent,
    AlertDialogComponent,
    PayslipComponent,
    LoaderComponent
  
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule, // Replaced `provideAnimationsAsync()` with this
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule
  ],
  exports: [
    AdminMenuComponent, // Export AdminMenuComponent if used outside AppModule
  ],
  providers: [
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiKeyInterceptor, // Register the interceptor
      multi: true,
    },
    { provide: APP_BASE_HREF, useValue: '/HRMS' },
      provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
