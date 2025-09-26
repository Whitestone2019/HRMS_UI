import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {
  // Delete a user by Employee ID
  deleteUser(empid: string): void {
    const confirmDelete = confirm('Are you sure you want to delete this user?');

    if (confirmDelete) {
      // Call the backend API to delete the user
      this.apiService.deleteEmployee(empid).subscribe({
        next: (response: any) => {
          // Update the UI after successful deletion
          this.users = this.users.filter(user => user.empid !== empid);
          this.updateTotalRecords(); // Update the total records count
          alert('User deleted successfully!');
        },
        error: (err: any) => {
          // Handle errors from the backend
          console.error('Error deleting user:', err);
          alert('Failed to delete the user. Please try again.');
        }
      });
    }
  }
  users: any[] = []; // Array to store the users' list
  totalRecords: number = 0; // Variable to store the total record count

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.fetchUsers(); // Fetch users when the component is initialized
  }

  // Fetch users' data from the API
  fetchUsers(): void {
    this.apiService.getUsers().subscribe(
      (response) => {
        console.log('Users fetched:', response);
        this.users = response; // Store the fetched users' data
        this.updateTotalRecords(); // Update the total record count
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  // Update the total record count
  updateTotalRecords(): void {
    this.totalRecords = this.users.length;
  }

  // Navigate to the Add Candidate page
  navigateToAddCandidate(mode: string): void {
    this.router.navigate(['/dashboard/addcandidate', { queryParams: { mode: 'A' } }]); // Replace with the correct path
  }

  LoadEmployeeDetails(mode: string,empId:string) {
    this.router.navigate(['/dashboard/addcandidate'], { queryParams: { mode,empId } });
  }
  
  AddEmployeeDetails(mode: string) {
    this.router.navigate(['/dashboard/useradd'], { queryParams: { mode } });
  }
}
