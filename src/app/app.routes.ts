import { Routes } from '@angular/router';
import { LoginComponent } from './People/login/login.component';
import { DashboardComponent } from './People/dashboard/dashboard.component';
import { AddEmployeeComponent } from './People/addemployee/addemployee.component';
import { EmpDirComponent } from './People/empdir/empdir.component';
import { OverviewComponent } from './People/overview/overview.component';
import { WidgetComponent } from './People/widget/widget.component';
import { AttendanceComponent } from './People/attendance/attendance.component';
import { CalendarComponent } from './People/calendar/calendar.component';
import { OperationsComponent } from './People/operations/operations.component';
import { LeaveSummaryComponent } from './People/leave-summary/leave-summary.component';
import { LeaveBalanceComponent } from './People/leave-balance/leave-balance.component';
import { LeaveRequestComponent } from './People/leave-request/leave-request.component';
import { ApplyLeaveComponent } from './People/apply-leave/apply-leave.component';
import { OnboardingComponent } from './People/onboarding/onboarding.component';
import { UserinfoComponent } from './People/operations/userinfo/userinfo.component';
import { CreateempComponent } from './People/operations/userinfo/add-emp/createemp/createemp.component';
import { TriggerComponent } from './People/operations/userinfo/add-emp/createemp/trigger/trigger.component';
import { AddEmpComponent } from './People/operations/userinfo/add-emp/add-emp.component';
import { ResetPasswordComponent } from './People/reset-password/reset-password.component';
import { AuthGuard } from './auth.guard';
import { EmployeeAttendanceSummaryComponent } from './People/employee-attendance-summary/employee-attendance-summary.component';
import { AddCandidateComponent } from './People/addcandidate/addcandidate.component';
import { ExpdashboardComponent } from './Expense/pages/expdashboard/expdashboard.component';
import { TravelComponent } from './People/travel/travel.component';
import { TravelRequestViewComponent } from './People/travel-request-view/travel-request-view.component';
import { EmployeeComponent } from './Payroll/components/employees/employee.component';
import { PayrollComponent } from './Payroll/components/payroll/payroll.component';
import { TimeTrackingComponent } from './Payroll/components/time-tracking/time-tracking.component';
import { SalaryComponent } from './Payroll/components/compensation/salary.component';
import { BenefitsComponent } from './Payroll/components/compensation/benefits.component';
import { PayrollSummaryComponent } from './Payroll/components/reports/payroll-summary.component';
import { TaxReportsComponent } from './Payroll/components/reports/tax-reports.component';
import { OrganizationProfileComponent } from './Payroll/components/settings/organization-profile.component';
import { CompanySettingsComponent } from './Payroll/components/settings/company-settings.component';
import { WorkLocationsComponent } from './Payroll/components/settings/work-locations/work-locations.component';
import { DepartmentsComponent } from './Payroll/components/settings/departments/departments.component';
import { DesignationsComponent } from './Payroll/components/settings/designations/designations.component';
import { StatutoryComponentsComponent } from './Payroll/components/settings/statutory-components/statutory-components.component';
import { SalaryComponentsListComponent } from './Payroll/components/settings/Salary-Component/salary-components-list/salary-components-list.component';
import { SalaryTemplateComponent } from './Payroll/components/settings/salary-template/salary-template.component';
import { PayslipComponent } from './Payroll/components/settings/payslip/payslip.component';

import { PayScheduleComponent } from './Payroll/components/settings/pay-schedule/pay-schedule.component';
import { DashboardComponentPayroll } from './Payroll/components/dashboard/dashboard.component';
import { OverviewComponentPayroll } from './Payroll/components/overview/overview.component';
import { ReportComponent } from './People/report/report.component';
import { ExpensesComponent } from './Expense/pages/expenses/expenses.component';
import { ExpenseFormComponent } from './Expense/pages/expense-form/expense-form.component';
import { ApprovalsComponent } from './Expense/pages/approvals/approvals.component';
import { AdvanceComponent } from './Expense/pages/advances/advances.component';
import { DashboardComponentExp } from './Expense/pages/dashboard/dashboard.component';
import { EmployeeListComponent } from './Payroll/components/employees/employee-list.component';
import { RoleGuard } from './guards/role.guard';
import { TimesheetComponent } from './People/timesheet/timesheet.component';
import { TimesheetCalendarDialogComponent } from './People/timesheet-calendar-dialog/timesheet-calendar-dialog.component';
import { UserTraineeComponent } from './People/user-trainee/user-trainee.component';
import { LocationAllowanceComponent } from './Payroll/components/settings/location-allowance/location-allowance.component';
import { UserManagementComponent } from './People/user-management/user-management.component';
import { EmployeeProjectHistoryComponent } from './People/employee-history/employee-history.component';
import { IdCardPhotoComponent } from './People/overview/id-card-photo/id-card-photo.component';
import { UpdateLeaveComponent } from './People/update-leave/update-leave.component';
import { AttendanceApprovalComponent } from './People/attendance-approval/attendance-approval.component';
import { FingerprintComponent } from './People/fingerprint/fingerprint.component';
import { PayrollAdjustmentComponent } from './People/payroll-adjustment/payroll-adjustment.component';
import { CalendarsPageComponent } from './calendars-page/calendars-page.component';

import { ExitFormComponent } from './exit-form/exit-form.component';
import {ExitPageComponent} from './exit-page/exit-page.component';
import { ManagerReviewComponent } from './manager-review/manager-review.component';
import { ExitpageDatasComponent } from './exitpage-datas/exitpage-datas.component';
import { HrVerificationComponent } from './hr-verification/hr-verification.component';
import { AssetClearanceComponent } from './asset-clearance/asset-clearance.component';
import { FinalExitApprovalComponent } from './final-exit-approval/final-exit-approval.component';
import { PayrollChecksComponent } from './payroll-checks/payroll-checks.component';
import { HrOffboardingChecklistComponent } from './hr-offboarding-checklist/hr-offboarding-checklist.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
   { path: 'fingerprint', component: FingerprintComponent },
  {
    path: 'expences/dashboardexp', component: ExpdashboardComponent, canActivate: [AuthGuard],
    children: [
      {
        path: 'exp',
        loadComponent: () => import('./Expense/pages/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./Expense/pages/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
      },
      {
        path: 'approval',
        loadComponent: () => import('./Expense/pages/approvals/approvals.component').then(m => m.ApprovalsComponent)
      },

      {
        path: 'advances',
        loadComponent: () => import('./Expense/pages/advances/advances.component').then(m => m.AdvanceComponent)
      },

      {
        path: 'payment-status',
        loadComponent: () => import('./Expense/pages/payment-status/payment-status.component').then(m => m.PaymentStatusComponent)
      },

      {
        path: 'dashboard',
        loadComponent: () => import('./Expense/pages/dashboard/dashboard.component').then(m => m.DashboardComponentExp)
      },

      {
        path: 'reports',
        loadComponent: () => import('./Expense/pages/reports/reports.component').then(m => m.ExpensesReportComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Default child route for expenses dashboard
    ]
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['HR', 'AS', 'TL','ACC'] },
    children: [
      { path: 'trigger', component: TriggerComponent },
      { path: 'createemp', component: CreateempComponent },
      { path: 'userinfo', component: UserinfoComponent },
      { path: 'add-emp', component: AddEmpComponent },
      { path: 'addcandidate', component: AddCandidateComponent },
      { path: 'onboarding', component: OnboardingComponent },
       { path: 'EmpDetails', component: UserManagementComponent },
      { path: 'report', component: ReportComponent },
      { path: 'leave-summary', component: LeaveSummaryComponent },
      { path: 'apply-leave', component: ApplyLeaveComponent },
      { path: 'leave-balance', component: LeaveBalanceComponent },
      { path: 'leave-request', component: LeaveRequestComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'attendanceAll', component: EmployeeAttendanceSummaryComponent },
      { path: 'overview', component: OverviewComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'widgets', component: WidgetComponent },
      { path: 'Employee_Management/addemp', component: AddEmployeeComponent },
      { path: 'Employee_Management/empdir', component: EmpDirComponent },
      { path: 'operations', component: OperationsComponent },
      { path: 'travel', component: TravelComponent },
      { path: 'timesheet', component: TimesheetComponent },
      { path: 'timesheet1/:employeeId/:employeeName',component: TimesheetCalendarDialogComponent},
      { path: 'travel-request-view', component: TravelRequestViewComponent },
      { path: 'useradd', component: UserTraineeComponent },
      { path: 'project', component: EmployeeProjectHistoryComponent },
      { path: 'iddetails', component: IdCardPhotoComponent },
       { path: 'updateleave', component: UpdateLeaveComponent },
        { path: 'attendanceApproval', component: AttendanceApprovalComponent },
       { path: 'payrollAdjustment', component: PayrollAdjustmentComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }, // Default child route set to Overview
      { path: 'calendar-page', component: CalendarsPageComponent},
        { path: 'exit-form', component: ExitFormComponent },
          { path: 'exit-page', component: ExitPageComponent },
          {path: 'exitpage-data', component: ExitpageDatasComponent},

          {path: 'manager', component: ManagerReviewComponent},
          { path: 'hrverify', component: HrVerificationComponent}, //hr round 1 
          { path: 'asset-clear', component: AssetClearanceComponent},
          { path: 'final-round', component: FinalExitApprovalComponent},//final hr round
          { path: 'payroll-check', component: PayrollChecksComponent},
          { path: 'hr-offboard', component: HrOffboardingChecklistComponent},//hr round 2
    ]
  },
  {
    path: 'payroll/overview',
    component: OverviewComponentPayroll,
    children: [
      { path: '', component: DashboardComponentPayroll }, // Default route for dashboard
      { path: 'employees', component: EmployeeComponent },
      { path: 'list', component: EmployeeListComponent },
      { path: 'payroll', component: PayrollComponent },
      { path: 'time-tracking', component: TimeTrackingComponent },
      { path: 'salary', component: SalaryComponent },
      { path: 'benefits', component: BenefitsComponent },
      { path: 'payroll-summary', component: PayrollSummaryComponent },
      { path: 'tax-reports', component: TaxReportsComponent },
      {
        path: 'settings',
        children: [
          { path: '', component: CompanySettingsComponent },
          { path: 'organization-profile', component: OrganizationProfileComponent },
          { path: 'work-locations', component: WorkLocationsComponent },
          { path: 'departments', component: DepartmentsComponent },
          { path: 'designations', component: DesignationsComponent },
          { path: 'statutory-components', component: StatutoryComponentsComponent },
          { path: 'salary-components', component: SalaryComponentsListComponent },
          { path: 'salary-templates', component: SalaryTemplateComponent },
          { path: 'payslip', component: PayslipComponent },
          { path: 'pay-schedule', component: PayScheduleComponent },
          { path: 'location-allowance', component: LocationAllowanceComponent }
        ]
      }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } // Wildcard route to handle undefined paths
];
