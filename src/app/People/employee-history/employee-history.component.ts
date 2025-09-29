import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';

interface Project {
  empId: string;
  projectName: string;
  projectDuration: string;
  location: string;
  clientInfo: string;
  vendorDetails: string;
  techParkName: string;
  vendorName: string;
  modeOfWork: string;
  time: number;
}
interface Employee {
  empid: string;
  firstname: string;
  lastname: string;
}

@Component({
  selector: 'app-employee-project-history',
  templateUrl: './employee-history.component.html',
  styleUrls: ['./employee-history.component.css']
})
export class EmployeeProjectHistoryComponent implements OnInit {
  projects: Project[] = [];
  reportingEmployees: Employee[] = [];
  latestProjects: { [empId: string]: Project } = {};

  selectedEmployee: Employee | null = null;
  showAddModal = false;
  showProjectListModal = false;

  loggedInEmpId = localStorage.getItem('employeeId') || '';
  error: string | null = null;

  formData = {
    empId: '',
    projectName: '',
    projectDuration: '',
    location: '',
    clientInfo: '',
    vendorDetails: '',
    techParkName: '',
    vendorName: '',
    modeOfWork: 'Onsite',
    time: 0,
    rcreUserId: this.loggedInEmpId
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchReportingEmployees();
  }

  fetchReportingEmployees(): void {
    this.apiService.getReportingEmployees(this.loggedInEmpId).subscribe({
      next: (response) => {
        this.reportingEmployees = response;
        this.reportingEmployees.forEach(emp => this.fetchLatestProject(emp.empid));
      },
      error: (err) => {
        this.error = 'Failed to fetch employees';
        console.error(err);
      }
    });
  }

  fetchLatestProject(empId: string): void {
    this.apiService.getProjectHistory(empId).subscribe({
      next: (response) => {
        const list = response.data;
        if (list.length > 0) {
          this.latestProjects[empId] = list[0]; // assuming first is latest
        }
      }
    });
  }

  openAddProjectForm(emp: Employee): void {
    this.selectedEmployee = emp;
    this.formData.empId = emp.empid;
    this.showAddModal = true;
  }

  closeAddProjectForm(): void {
    this.showAddModal = false;
    this.resetForm();
  }

  openProjectList(emp: Employee): void {
    this.selectedEmployee = emp;
    this.apiService.getProjectHistory(emp.empid).subscribe({
      next: (response) => {
        this.projects = response.data;
        this.showProjectListModal = true;
      }
    });
  }

  closeProjectList(): void {
    this.showProjectListModal = false;
    this.projects = [];
  }

  onSubmit(): void {
    this.apiService.addProject(this.formData).subscribe({
      next: () => {
        this.fetchLatestProject(this.formData.empId);
        this.closeAddProjectForm();
      },
      error: (err) => {
        this.error = 'Failed to add project';
        console.error(err);
      }
    });
  }

  resetForm(): void {
    this.formData = {
      empId: '',
      projectName: '',
      projectDuration: '',
      location: '',
      clientInfo: '',
      vendorDetails: '',
      techParkName: '',
      vendorName: '',
      modeOfWork: 'Onsite',
      time: 0,
      rcreUserId: this.loggedInEmpId
    };
  }
}
