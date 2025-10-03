import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-user-trainee',
  templateUrl: './user-trainee.component.html',
  styleUrls: ['./user-trainee.component.css']
})
export class UserTraineeComponent implements OnInit {
  selectedForm: string = 'user';
  userForm!: FormGroup;
  traineeForm!: FormGroup;
  message: string = '';
  isEdit: boolean = false;
  empid: string = '';
  trngid: string = '';

  employees: any[] = [];   // for Repote To dropdown
  roles: any[] = [];       // for Role dropdown

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();

    // load dropdowns
    this.api.getAllEmployeeIds().subscribe({
      next: (data) => this.employees = data,
      error: () => console.error("Failed to load employees")
    });

    this.api.getRoles().subscribe({
      next: (data) => this.roles = data,
      error: () => console.error("Failed to load roles")
    });

    // if moved from trainee → prefill employee form
    const traineeData = history.state.traineeData;
    if (traineeData) {
      this.selectedForm = 'user';
      this.userForm.patchValue({
        firstname: traineeData.firstname,
        lastname: traineeData.lastname,
        username: traineeData.username,
        emailid: traineeData.emailid,
        phonenumber: traineeData.phonenumber,
        roleid: traineeData.roleid,
        empType: 'Full Time'
      });
    }

    // handle edit case
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'employee' && params['empid']) {
        this.isEdit = true;
        this.selectedForm = 'user';
        this.empid = params['empid'];
        this.loadEmployee(this.empid);
      } else if (params['type'] === 'trainee' && params['trngid']) {
        this.isEdit = true;
        this.selectedForm = 'trainee';
        this.trngid = params['trngid'];
        this.loadTrainee(this.trngid);
      }
    });
  }

  initForms(): void {
    this.userForm = this.fb.group({
      empid: ['', Validators.required],
      password: ['', Validators.required],
      username: ['', Validators.required],
      firstname: ['', Validators.required],
      repoteTo: [''],
      lastname: ['', Validators.required],
      emailid: ['', [Validators.required, Validators.email]],
      phonenumber: ['', Validators.required],
      roleid: ['', Validators.required],
      empType: ['', Validators.required],
      status: ['Active']
    });

    this.traineeForm = this.fb.group({
      trngid: ['', Validators.required],
      password: ['', Validators.required],
      username: ['', Validators.required],
      firstname: ['', Validators.required],
      repoteTo: [''],
      lastname: ['', Validators.required],
      emailid: ['', [Validators.required, Validators.email]],
      phonenumber: ['', Validators.required],
      roleid: ['', Validators.required],
      empType: ['', Validators.required],
      status: ['Active']
    });
  }

  loadEmployee(empid: string): void {
    this.api.getEmployeeById(empid).subscribe({
      next: (data) => this.userForm.patchValue(data),
      error: () => this.message = 'Error loading employee'
    });
  }

  loadTrainee(trngid: string): void {
    this.api.getTraineeById(trngid).subscribe({
      next: (data) => this.traineeForm.patchValue(data),
      error: () => this.message = 'Error loading trainee'
    });
  }

  submitUser(): void {
    if (this.userForm.valid) {
      if (this.isEdit) {
        this.api.updateEmployee(this.empid, this.userForm.value).subscribe({
          next: () => {
            this.message = 'Employee updated successfully!';
            this.router.navigate(['/dashboard/EmpDetails']);
          },
          error: () => this.message = 'Error updating employee'
        });
      } else {
        this.api.saveUser(this.userForm.value).subscribe({
          next: () => {
            this.message = 'Employee added successfully!';
            this.router.navigate(['/dashboard/EmpDetails']);
          },
          error: () => this.message = 'Error saving employee'
        });
      }
    }
  }

  submitTrainee(): void {
    if (this.traineeForm.valid) {
      if (this.isEdit) {
        this.api.updateTrainee(this.trngid, this.traineeForm.value).subscribe({
          next: () => {
            this.message = 'Trainee updated successfully!';
            this.router.navigate(['/dashboard/EmpDetails']);
          },
          error: () => this.message = 'Error updating trainee'
        });
      } else {
        this.api.saveTrainee(this.traineeForm.value).subscribe({
          next: () => {
            this.message = 'Trainee added successfully!';
            this.router.navigate(['/dashboard/EmpDetails']);
          },
          error: () => this.message = 'Error saving trainee'
        });
      }
    }
  }

  closeForm(type: 'user' | 'trainee'): void {
    if (type === 'user') {
      this.userForm.reset();
    } else {
      this.traineeForm.reset();
    }
    this.router.navigate(['/user-management']);
  }
}
