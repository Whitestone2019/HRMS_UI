import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { ApiService } from '../../../api.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponentPayroll {
  constructor(private apiService: ApiService) {}

  runPayroll() {
    this.apiService.runPayroll().subscribe({
      next: (response) => {
        console.log('Payroll processed successfully:', response);
        alert(`Payroll run successfully! Processed ${response.count} employees.`);
      },
      error: (error) => {
        console.error('Error processing payroll:', error);
        alert(`Payroll processing failed: ${error.message || 'Unknown error'}`);
      }
    });
  }

  exportPayrollData() {
    this.apiService.exportPayrollData().subscribe(response => {
      if (!response) {
        console.error("Received empty response for exportPayrollData.");
        return;
      }
  
      // Get the current month name
      const currentMonth = formatDate(new Date(), 'MMMM', 'en-US'); 
      const fileName = `Bank_Upload_File_${currentMonth}.xlsx`;
  
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Open Save File Dialog (Only works if browser settings allow it)
      const a = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;

      // Ask for location before downloading (depends on browser settings)
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    }, error => {
      console.error("Error exporting payroll data:", error);
      alert("Failed to export payroll data.");
    });
  }
}
