import { Component } from '@angular/core';
import { ApiService, UpdateLeavePayload } from '../../api.service';


@Component({
  selector: 'app-update-leave',
  templateUrl: './update-leave.component.html',
  styleUrls: ['./update-leave.component.css']
})
export class UpdateLeaveComponent {

  empId: string = '';
  leaveTaken: number | null = null;
  message: string = '';
  success: boolean = false;

  constructor(private apiService: ApiService) {}

  updateLeave() {
    if (!this.empId || this.leaveTaken === null) return;

    const payload: UpdateLeavePayload = {
      empId: this.empId,
      leaveTaken: this.leaveTaken
    };

    this.apiService.updateLeaveTaken(payload).subscribe({
      next: (res) => {
        this.message = `Leave updated successfully for Employee ID ${this.empId}`;
        this.success = true;
      },
      error: (err) => {
        this.message = err.error?.message || 'Error updating leave';
        this.success = false;
      }
    });
  }
}
