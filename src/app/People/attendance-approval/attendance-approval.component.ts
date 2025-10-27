import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';

interface AttendanceRequest {
  id: number;
  employeeId: string;
  employeeName: string;
  attendanceDate: Date; // Date object for Angular pipe
  requestedStatus: string;
  remarks: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

@Component({
  selector: 'app-attendance-approval',
  templateUrl: './attendance-approval.component.html',
  styleUrls: ['./attendance-approval.component.css']
})
export class AttendanceApprovalComponent implements OnInit {
  requests: AttendanceRequest[] = [];
  message: string = '';
  success: boolean = true;
  managerId: string = ''; // Logged-in manager ID
  processedRequests: Set<number> = new Set(); // Track already acted-on requests

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.managerId = localStorage.getItem('employeeId') || '';
    this.fetchRequests();
  }

  fetchRequests(): void {
    this.apiService.getPendingAttendanceRequests(this.managerId).subscribe({
      next: (res: any) => {
        console.log('Raw API response:', res);

        if (res && Array.isArray(res.data)) {
          this.requests = res.data.map((r: any) => ({
            id: r.id,
            employeeId: r.employeeId,
            employeeName: r.employeeName || 'N/A',
            attendanceDate: r.attendanceDate,
            requestedStatus: r.requestedStatus || '',
            remarks: r.remarks || '',
            status: r.status,
            createdBy: r.createdBy,
            createdAt: r.createdAt,
            approvedBy: r.approvedBy,
            approvedAt: r.approvedAt
          }));
        } else {
          console.error('API response.data is not an array:', res);
          this.requests = [];
        }
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.message = err.message || 'Error fetching requests';
        this.success = false;
      }
    });
  }

  approve(req: AttendanceRequest): void {
    this.updateRequestStatus(req, 'Approved');
  }

  reject(req: AttendanceRequest): void {
    this.updateRequestStatus(req, 'Rejected');
  }

  private updateRequestStatus(req: AttendanceRequest, status: string): void {
    const payload = {
      requestId: req.id,
      action: status, // Backend expects "action"
      managerId: this.managerId
    };

    // Immediately disable further actions for this request
    this.processedRequests.add(req.id);

    this.apiService.updateAttendanceRequestStatus(payload).subscribe({
      next: (res: any) => {
        console.log(`Request ${status} response:`, res);
        this.message = `Attendance request ${status.toLowerCase()} successfully.`;
        this.success = true;
        this.fetchRequests(); // Refresh list
      },
      error: (err) => {
        console.error(`Failed to ${status.toLowerCase()} request:`, err);
        this.message = err.message || `Failed to ${status.toLowerCase()} request.`;
        this.success = false;
        // Re-enable buttons if API fails
        this.processedRequests.delete(req.id);
      }
    });
  }

  private parseDateString(dateStr: string): Date {
    try {
      // Expected format: "29-12-2024 00:00:00"
      const [day, month, year] = dateStr.split(' ')[0].split('-').map(Number);
      const [hour, minute, second] = dateStr.split(' ')[1].split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second);
    } catch (error) {
      console.error('Error parsing date string:', dateStr, error);
      return new Date(); // fallback
    }
  }
}
