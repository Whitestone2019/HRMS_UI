import { Component, OnInit } from '@angular/core';
import { ApiService, PayrollAdjustment } from '../../api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payroll-adjustment',
  templateUrl: './payroll-adjustment.component.html',
  styleUrls: ['./payroll-adjustment.component.css']
})
export class PayrollAdjustmentComponent implements OnInit {
  adjustments: PayrollAdjustment[] = [];
  filteredAdjustments: PayrollAdjustment[] = [];
  searchText: string = '';
  
  managerId: string = localStorage.getItem('employeeId') || '';
  month: string = new Date().toISOString().slice(0, 7);

  pendingCount = 0;
  approvedCount = 0;

  constructor(private service: ApiService) { }

  ngOnInit(): void {
    this.loadAdjustments();
  }

  loadAdjustments(): void {
    this.service.getForManager(this.managerId, this.month).subscribe({
      next: (data) => {
        this.adjustments = data;
        this.applyFilter();
        this.updateSummary();
      },
      error: () => Swal.fire('Error', 'Failed to load adjustments', 'error')
    });
  }

  applyFilter(): void {
    const query = this.searchText.trim().toLowerCase();
    this.filteredAdjustments = query
      ? this.adjustments.filter(adj =>
          adj.empId.toLowerCase().includes(query) ||
          adj.employeeName.toLowerCase().includes(query)
        )
      : [...this.adjustments];
    this.updateSummary();
  }

  updateSummary(): void {
    this.pendingCount = this.filteredAdjustments.filter(a => a.approvalStatus === 'PENDING').length;
    this.approvedCount = this.filteredAdjustments.filter(a => a.approvalStatus === 'APPROVED').length;
  }

  // Check if remarks are required
  isRemarksRequired(adj: PayrollAdjustment): boolean {
    return (adj.otherDeductions ?? 0) > 0;
  }

  updateAdjustment(adjustment: PayrollAdjustment): void {
    if (adjustment.approvalStatus === 'APPROVED') return;

    const payload = {
      allowanceDays: adjustment.allowanceDays,
      effectiveWorkingDays:adjustment.effectiveWorkingDays,
      lopDays: adjustment.lopDays,
      otherDeductions: adjustment.otherDeductions,
      otherDeductionsRemarks: adjustment.otherDeductionsRemarks?.trim() || ''
    };

    this.service.update(adjustment.id, payload).subscribe({
      next: () => console.log('Saved'),
      error: (err) => {
        Swal.fire('Error', err.error?.error || 'Update failed', 'error');
        this.loadAdjustments();
      }
    });
  }

  confirmApprove(adjustment: PayrollAdjustment): void {
    const deduction = adjustment.otherDeductions ?? 0;
    const hasRemarks = adjustment.otherDeductionsRemarks?.trim();

    if (deduction > 0 && !hasRemarks) {
      Swal.fire({
        icon: 'warning',
        title: 'Remarks Required',
        html: `
          <strong>${adjustment.employeeName}</strong> has <strong>₹${deduction}</strong> Other Deduction.<br><br>
          <span style="color:#e74c3c;">Please enter a remark (e.g., Loan EMI, Fine, Advance)</span>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#e67e22'
      });
      return;
    }

    Swal.fire({
      title: 'Approve Adjustment?',
      html: `
        <strong>${adjustment.employeeName}</strong> (${adjustment.empId})<br><br>
        Effective working Days: <strong>${adjustment.effectiveWorkingDays}</strong><br>
        Allowance Days: <strong>${adjustment.allowanceDays}</strong><br>
        LOP Days: <strong>${adjustment.lopDays}</strong><br>
        Other Deductions: <strong>₹${deduction}</strong><br>
        ${hasRemarks ? '<em style="color:#27ae60;">' + adjustment.otherDeductionsRemarks + '</em>' : '<em>No deduction</em>'}
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.approve(adjustment.id).subscribe({
          next: () => {
            Swal.fire('Approved!', `${adjustment.employeeName} approved successfully.`, 'success');
            this.loadAdjustments();
          },
          error: () => Swal.fire('Error', 'Approval failed', 'error')
        });
      }
    });
  }
}