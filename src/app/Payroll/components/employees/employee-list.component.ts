import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddEmployeeFormComponent } from '../forms/add-employee-form.component';
import { ApiService } from '../../../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEmployeeFormComponent],
  template: `
    <div class="employee-list">
      <div class="list-header">
        <h4>Employees</h4>
        <div class="actions">
          <div class="search-box">
            <input type="text" placeholder="Search employees..." [(ngModel)]="searchTerm">
          </div>
        </div>
      </div>

      <table class="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Annual CTC</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let employee of filteredEmployees" (click)="selectEmployee(employee)">
            <td>{{ employee.empid }}</td>
            <td>{{ employee.firstname }} {{ employee.lastname }}</td>
            <td>{{ employee.emailid }}</td>
            <td>{{ employee.department }}</td>
            <td>{{ employee.annualCTC | currency: 'INR' }}</td>
           <td>
  <button class="btn view" (click)="viewSalaryDetails(employee); $event.stopPropagation();">
    View Salary
  </button>
  <button class="btn edit" (click)="editEmployee(employee); $event.stopPropagation();">
    Edit
  </button>
</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="selectedEmployee" class="salary-details">
        <h4>Salary Details for {{ selectedEmployee.firstname }} {{ selectedEmployee.lastname }}</h4>
        <p><strong>Annual CTC:</strong> {{ selectedEmployee.annualCTC | currency: 'INR' }}</p>

        <h4>Earnings</h4>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Percentage</th>
              <th>Monthly Amount</th>
              <th>Annual Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let earning of parsedEarnings">
              <td>{{ earning.name }}</td>
              <td>{{ earning.type }}</td>
              <td>{{ earning.percentage }}%</td>
              <td>{{ earning.monthlyAmount | currency: 'INR' }}</td>
              <td>{{ earning.annualAmount | currency: 'INR' }}</td>
            </tr>
          </tbody>
        </table>

        <h4>Deductions</h4>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Monthly Amount</th>
              <th>Annual Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let deduction of parsedDeductions">
              <td>{{ deduction.name }}</td>
              <td>{{ deduction.type }}</td>
              <td>{{ deduction.amount }}</td>
              <td>{{ deduction.monthlyAmount | currency: 'INR' }}</td>
              <td>{{ deduction.annualAmount | currency: 'INR' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-add-employee-form></app-add-employee-form>
    </div>
  `,
  styles: [`
    .employee-list {
      font-family: 'Zoho Sans', Arial, sans-serif;
      font-size: 14px;
      color: #333;
    }
    .employee-table, .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background: #fff;
    }
    .employee-table th, .employee-table td,
    .salary-table th, .salary-table td {
      padding: 12px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .employee-table th, .salary-table th {
      background-color: #f1f3f6;
      font-weight: 600;
    }
    .salary-details {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ccc;
      background: #fafafa;
      border-radius: 5px;
    }
    .salary-details h4 {
      margin-top: 15px;
      font-size: 14px;
      font-weight: 600;
    }
    .btn.view {
      background-color: #0066cc;
      color: white;
      border: none;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
    }
    .btn.view:hover {
      background-color: #004999;
    }
    .search-box input {
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 200px;
      font-size: 13px;
    }
      .btn.edit {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  margin-left: 5px;
}
.btn.edit:hover {
  background-color: #218838;
}
  `]
})
export class EmployeeListComponent implements OnInit {
  @ViewChild(AddEmployeeFormComponent) addEmployeeForm!: AddEmployeeFormComponent;
  employees: any[] = [];
  selectedEmployee: any = null;
  searchTerm = '';
  parsedEarnings: any[] = [];
  parsedDeductions: any[] = [];

  constructor(private apiService: ApiService,private router:Router) {}

  ngOnInit() {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.apiService.getAllEmployeessalary().subscribe(
      (data) => {
        this.employees = data;
        console.log('Fetched Employees:', this.employees);
      },
      (error) => console.error('Error fetching employees', error)
    );
  }

  get filteredEmployees() {
    return this.employees.filter(emp =>
      (emp.empid?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
      (emp.firstname?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
      (emp.lastname?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
      (emp.emailid?.toLowerCase() || '').includes(this.searchTerm.toLowerCase())
    );
  }

  selectEmployee(employee: any) {
    this.viewSalaryDetails(employee);
  }

  editEmployee(employee: any) {
    this.router.navigate(['/payroll/overview/employees'], { state: { employee } });
  }

  viewSalaryDetails(employee: any) {
    this.selectedEmployee = employee;
    this.parsedEarnings = this.parseJsonArray(employee.earnings);
    this.parsedDeductions = this.parseJsonArray(employee.deductions);
  }

  private parseJsonArray(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      const parsedData = JSON.parse(data);
      return typeof parsedData === "string" ? JSON.parse(parsedData) : parsedData;
    } catch (error) {
      console.warn("Invalid JSON format:", data, error);
      return [];
    }
  }
  
}
