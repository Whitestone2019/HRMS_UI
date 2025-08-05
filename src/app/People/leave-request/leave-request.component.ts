import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.css']
})
export class LeaveRequestComponent implements OnInit {
  leaveOptions = ['Leave', 'Sick Leave', 'Casual Leave', 'Earned Leave'];
  selectedLeaveType: string = 'Leave';
  hasData: boolean = false;
  leaveRequests: any[] = [];
  currentEmpId: string = ''; // Logged-in user's employee id

  constructor(private router: Router, private apiService: ApiService, private location: Location) {}

  ngOnInit(): void {
    const empId = localStorage.getItem('employeeId'); // Fetch empid from localStorage
    if (empId) {
      this.currentEmpId = empId; // Store for later use in the template
      this.fetchLeaveRequests(empId);
    } else {
      console.error('Employee ID not found');
    }
  }

  fetchLeaveRequests(empId: string): void {
    this.apiService.getLeaveRequests(empId).subscribe(
      (response: any) => {
        console.log('Fetched Leave Requests:', response);
        this.leaveRequests = response.data || [];
        this.hasData = this.leaveRequests.length > 0;
      },
      (error) => {
        console.error('Error fetching leave requests:', error);
        this.hasData = false;
      }
    );
  }

  addRequest(): void {
    this.router.navigate(['/dashboard/apply-leave']);
  }

  deleteRequest(index: number): void {
    if (confirm('Are you sure you want to reject this request?')) {
      const request = this.leaveRequests[index];
      this.apiService.rejectLeaveRequest1(request.empid, request.leavereason).subscribe(
        (response: any) => {
          if (response.status === 'success') {
            // Update the status in the frontend
            this.leaveRequests[index].del_flg = 'Y';
            alert('Leave request rejected successfully!');
            this.location.back(); // Navigate back to the previous page
          } else {
            alert(`Failed to reject leave request: ${response.message}`);
          }
        },
        (error) => {
          console.error('Error rejecting leave request:', error);
          alert('Failed to reject leave request due to a server error.');
        }
      );
    }
  }

  approve(request: any, index: number): void {
    if (confirm('Do you want to approve this leave request?')) {
      console.log("Request Object:", JSON.stringify(request, null, 2)); // Detailed log
      // Pass both empid and leaveType in the API call
      alert("request.leavereason: " + request.srlnum);
      this.apiService.updateEntityFlag(request.empid, request.srlnum).subscribe(
        (response: any) => {
          console.log("API Response:", response); // Log response
          if (response.status === 'success') {
            console.log('Approval Response:', response);
            this.leaveRequests[index] = { ...this.leaveRequests[index], entitycreflg: 'Y' };
            alert('Leave request approved successfully!');
            this.location.back(); // Navigate back to the previous page
          } else {
            console.error('Approval Error:', response.message);
            alert(`Failed to approve leave request: ${response.message}`);
          }
        },
        (error) => {
          console.error('Error approving leave request:', error);
          alert('Failed to approve leave request due to a server error.');
        }
      );
    }
  }
}
