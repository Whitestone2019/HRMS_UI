import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';

interface Project {
  id?: number;
  empId: string;
  projectName: string;
  projectStartDate: string;
  projectEndDate?: string;
  location: string;
  clientInfo: string;
  vendorDetails: string;
  techParkName: string;
  vendorName: string;
  modeOfWork: string;
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
  editMode = false; // add/edit toggle

  loggedInEmpId = localStorage.getItem('employeeId') || '';
  error: string | null = null;

  formData: Project = {
    id: 0,
    empId: '',
    projectName: '',
    projectStartDate: '',
    projectEndDate: '',
    location: '',
    clientInfo: '',
    vendorDetails: '',
    techParkName: '',
    vendorName: '',
    modeOfWork: 'Onsite',
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchReportingEmployees();
  }

  fetchReportingEmployees(): void {
    this.apiService.getReportingEmployees(this.loggedInEmpId).subscribe({
      next: (response: Employee[]) => {
        // Ensure manager is first
        const managerIndex = response.findIndex(emp => emp.empid === this.loggedInEmpId);
        if (managerIndex !== -1) {
          const manager = response.splice(managerIndex, 1)[0];
          this.reportingEmployees = [manager, ...response];
        } else {
          this.reportingEmployees = response;
        }

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
      next: (response: any) => {
        const list = response.data;
        if (list && list.length > 0) {
          this.latestProjects[empId] = list[0]; // assuming first is latest
        }
      }
    });
  }

  openAddProjectForm(emp: Employee): void {
    if (emp.empid === this.loggedInEmpId) {
      alert("You cannot add a project for yourself.");
      return;
    }

    this.selectedEmployee = emp;
    this.resetForm();
    this.formData.empId = emp.empid;
    this.editMode = false;
    this.showAddModal = true;
  }

  openEditProjectForm(project: Project): void {
    alert(project.empId);
    alert(this.loggedInEmpId);
    if (project.empId === this.loggedInEmpId) {
       this.editMode = false;
      alert("You cannot edit your own projects.");
      return;
    }

    this.showProjectListModal = false;
    this.formData = { ...project }; // pre-fill form
    this.editMode = true;
    this.showAddModal = true;
  }

  closeAddProjectForm(): void {
    this.showAddModal = false;
    this.resetForm();
  }

  openProjectList(emp: Employee): void {
    this.selectedEmployee = emp;
    this.apiService.getProjectHistory(emp.empid).subscribe({
      next: (response: any) => {
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
    if (this.editMode) {
        if (this.formData.empId === this.loggedInEmpId) {
      alert("You cannot edit your own projects.");
      return;
    }
      this.apiService.updateProject(this.formData).subscribe({
        next: () => {
          this.fetchLatestProject(this.formData.empId);
          this.openProjectList(this.selectedEmployee!); // refresh list
          this.closeAddProjectForm();
        },
        error: (err) => {
          this.error = 'Failed to update project';
          console.error(err);
        }
      });
    } else {
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
  }

  resetForm(): void {
    this.formData = {
      id: 0,
      empId: '',
      projectName: '',
      projectStartDate: '',
      projectEndDate: '',
      location: '',
      clientInfo: '',
      vendorDetails: '',
      techParkName: '',
      vendorName: '',
      modeOfWork: 'Onsite',
    };
  }
}
