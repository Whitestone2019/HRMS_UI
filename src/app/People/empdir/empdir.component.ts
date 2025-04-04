import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-empdir',
  templateUrl: './empdir.component.html',
  styleUrls: ['./empdir.component.css']
})
export class EmpDirComponent implements OnInit {
  employees: any[] = []; // Array to hold employee data
  errorMessage: string | null = null;

  constructor(private employeeService: ApiService) {}

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (error) => {
        this.errorMessage = 'Error fetching employee data';
        console.error(error);
      }
    });
  }
}
