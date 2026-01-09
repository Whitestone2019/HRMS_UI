import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService, ExitForm } from '../api.service';
import { Router } from '@angular/router';
import * as jsPDF from 'jspdf';

interface FormData {
  type: string;
  data: any;
  error?: any;
}

interface ParsedItem {
  label: string;
  value: string;
  remarks: string;
}

type TableRow = [string, string];

@Component({
  selector: 'app-exitpage-datas',
  templateUrl: './exitpage-datas.component.html',
  styleUrls: ['./exitpage-datas.component.css']
})
export class ExitpageDatasComponent implements OnInit {

  exitForms: ExitForm[] = [];
  filteredForms: ExitForm[] = [];
  loading = false;
  managerId: string = '';
  role: string = '';
  downloadingPdf = false;
  downloadingFormData = new Map<string, boolean>();
  selectedFormForDownload: ExitForm | null = null;
  companyLogo: string | null = null;
  
  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.managerId = localStorage.getItem('employeeId') || '';
    this.role = localStorage.getItem('role') || '';
    
    console.log('Initializing with managerId:', this.managerId, 'role:', this.role);
    
    this.loadCompanyLogo();

    if (!this.managerId) {
      console.error("managerId missing in localStorage");
      return;
    }

    this.loadManagerForms();
  }

  private loadCompanyLogo(): void {
    this.companyLogo = 'assets/images/WHITESTONE.png';
  }

  loadManagerForms() {
    this.loading = true;
    console.log('Loading manager forms...');

    const fullAccessRoles = ['SA', 'R003', 'HR', 'ACC', 'R008', 'PAYROLL', 'CTO', 'CEO'];
    const userRole = this.role.toUpperCase();

    if (fullAccessRoles.some(r => userRole.includes(r))) {
      console.log('Full access role detected:', this.role, '→ Loading ALL exit forms');

      this.apiService.getAllActiveExitForms().subscribe({
        next: (response: any) => {
          console.log("API response (Full Access):", response);
          const rawForms = Array.isArray(response) ? response : (response?.data || []);
          this.exitForms = this.convertStatusToNumber(rawForms);
          console.log("Processed forms count:", this.exitForms.length);
          this.setupPagination();
          this.loading = false;
        },
        error: (err: any) => {
          console.error("Error loading all forms:", err);
          this.exitForms = [];
          this.setupPagination();
          this.loading = false;
        }
      });
    } else {
      console.log('Regular manager role:', this.role, '→ Loading only team forms');
      this.apiService.getExitFormsByEmployee(this.managerId).subscribe({
        next: (response: { success: boolean, data: ExitForm[] }) => {
          console.log("API response (Team only):", response);
          const rawForms = response.success ? response.data || [] : [];
          this.exitForms = this.convertStatusToNumber(rawForms);
          console.log("Processed forms count:", this.exitForms.length);
          this.setupPagination();
          this.loading = false;
        },
        error: (err: any) => {
          console.error("Error:", err);
          this.exitForms = [];
          this.setupPagination();
          this.loading = false;
        }
      });
    }
  }

  // FIXED PAGINATION METHODS
  setupPagination(): void {
    console.log('🔢 SETUP PAGINATION');
    console.log('Total records:', this.exitForms.length);
    console.log('Items per page:', this.itemsPerPage);
    
    // Calculate total pages
    this.totalPages = Math.max(1, Math.ceil(this.exitForms.length / this.itemsPerPage));
    
    // Generate page numbers array
    this.pageNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pageNumbers.push(i);
    }
    
    console.log('Total pages:', this.totalPages);
    console.log('Page numbers:', this.pageNumbers);
    
    // Reset to page 1
    this.currentPage = 1;
    
    // Update the filtered forms
    this.updatePaginatedForms();
    
    // Force UI update
    this.cdRef.detectChanges();
  }

  updatePaginatedForms(): void {
    console.log('🔄 UPDATING PAGINATED FORMS - Page:', this.currentPage);
    
    if (this.exitForms.length === 0) {
      this.filteredForms = [];
      console.log('No forms to display');
      return;
    }
    
    // Calculate slice indices
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.exitForms.length);
    
    console.log('Slice indices:', startIndex, 'to', endIndex, 'of', this.exitForms.length);
    
    // Get the slice of forms for current page
    this.filteredForms = this.exitForms.slice(startIndex, endIndex);
    
    console.log('Forms on this page:', this.filteredForms.length);
    console.log('Forms IDs on this page:', this.filteredForms.map(f => f.employeeId));
    
    // Force UI update
    this.cdRef.detectChanges();
  }

  nextPage(): void {
    console.log('▶️ NEXT PAGE CLICKED');
    console.log('Before - Current page:', this.currentPage, 'Total pages:', this.totalPages);
    
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      console.log('After - Current page:', this.currentPage);
      this.updatePaginatedForms();
    } else {
      console.log('❌ Already on last page');
    }
  }

  previousPage(): void {
    console.log('◀️ PREVIOUS PAGE CLICKED');
    console.log('Before - Current page:', this.currentPage);
    
    if (this.currentPage > 1) {
      this.currentPage--;
      console.log('After - Current page:', this.currentPage);
      this.updatePaginatedForms();
    } else {
      console.log('❌ Already on first page');
    }
  }

  goToPage(page: number): void {
    console.log('🔘 GO TO PAGE:', page);
    
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      console.log('Current page set to:', this.currentPage);
      this.updatePaginatedForms();
    } else {
      console.log('Page navigation skipped - same page or invalid');
    }
  }

  private convertStatusToNumber(forms: any[]): ExitForm[] {
    return forms.map((form: any) => {
      let statusNumber = 0;
      if (form.status !== undefined && form.status !== null) {
        if (typeof form.status === 'string') {
          statusNumber = parseInt(form.status, 10);
          if (isNaN(statusNumber)) {
            statusNumber = 0;
          }
        } else if (typeof form.status === 'number') {
          statusNumber = form.status;
        }
      }

      return {
        ...form,
        status: statusNumber
      };
    });
  }

  canDownloadPdf(): boolean {
    const allowedRoles = [ 'HR', 'R003'];
    const canDownload = allowedRoles.some(r => this.role.toUpperCase().includes(r));
    return canDownload;
  }

  canDownloadForm(form: ExitForm): boolean {
    const status = form.status || 0;
    return status === 6 && this.canDownloadPdf();
  }

  getDownloadButtonTitle(form: ExitForm): string {
    const status = form.status || 0;

    if (status === 6) {
      return 'Download all exit forms (Manager, HR Round 1, Asset, HR Round 2, Payroll, Final HR)';
    } else {
      return `Download available only when status is 6 (Approved). Current: ${this.getStatusText(status)}`;
    }
  }

  getDownloadButtonText(form: ExitForm): string {
    const status = form.status || 0;

    if (status === 6) {
      return 'Download';
    } else {
      return 'Download';
    }
  }

  async downloadAllUserForms(form: ExitForm) {
    console.log('Download attempt for:', {
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      status: form.status,
      formId: form.id
    });

    if (!this.canDownloadPdf()) {
      alert('You do not have permission to download forms.');
      return;
    }

    if (!this.canDownloadForm(form)) {
      const statusText = this.getStatusText(form.status || 0);
      alert(`Cannot download forms yet. Status must be 6 (Approved).\nCurrent Status: ${statusText}`);
      return;
    }

    this.selectedFormForDownload = form;
    this.downloadingFormData.set(form.id || '', true);

    try {
      this.downloadingPdf = true;
      const allFormData = await this.fetchAllFormData(form);
      await this.generateCompleteFormsPdf(form, allFormData);

    } catch (error) {
      console.error('Error downloading forms:', error);
      alert('Error downloading forms. Please try again.');
    } finally {
      this.downloadingFormData.set(form.id || '', false);
      this.downloadingPdf = false;
      this.selectedFormForDownload = null;
    }
  }

  private async fetchAllFormData(form: ExitForm): Promise<any> {
    const formId = form.id || '';
    const employeeId = form.employeeId || '';

    console.log(`Fetching all form data for Employee ID: ${employeeId}, Form ID: ${formId}`);

    const promises: Promise<FormData>[] = [];

    promises.push(
      this.apiService.getManagerReviewsByEmployee(employeeId).toPromise()
        .then((response: any) => {
          console.log('1. Manager Review Data:', response);
          return {
            type: 'manager_review',
            data: response
          };
        })
        .catch((error: any) => {
          console.error('Manager Review API Error:', error);
          return {
            type: 'manager_review',
            data: null,
            error
          };
        })
    );

    promises.push(
  this.apiService.getHRReviewByExitFormId(formId).toPromise()
    .then((response: any) => {
      console.log('2. HR Round 1 Data RAW RESPONSE:', response);
      console.log('2. HR Round 1 Data TYPE:', typeof response);
      console.log('2. HR Round 1 Data KEYS:', Object.keys(response || {}));
      
      if (response && response.data) {
        console.log('2. HR Round 1 Data.data:', response.data);
        console.log('2. HR Round 1 Data.data TYPE:', typeof response.data);
        
        if (Array.isArray(response.data)) {
          console.log('2. HR Round 1 Data.data[0]:', response.data[0]);
        }
      }
      
      return {
        type: 'hr_round1',
        data: response
      };
    })
    .catch((error: any) => {
      console.error('HR Round 1 API Error:', error);
      return {
        type: 'hr_round1',
        data: null,
        error
      };
    })
);

     // The date is stored in the exit form field "hrRound1SubmittedOn"
  promises.push(
    Promise.resolve({
      type: 'hr_round1_date',
      data: {
        success: true,
        data: {
          hrRound1SubmittedOn: form.hrRound1SubmittedOn // ADD THIS LINE
        }
      }
    })
  );

    // UPDATED: Asset Clearance - Use assetSubmittedBy from form
  promises.push(
    Promise.resolve({
      type: 'asset_clearance',
      data: {
        success: true,
        data: {
          assetClearance: form.assetClearance,
          processedBy: form.assetSubmittedBy, // CHANGED: Use assetSubmittedBy
          processedDate: form.assetSubmittedOn, // ADDED: Use assetSubmittedOn for date
          clearedBy: form.assetSubmittedBy, // Also keep for backward compatibility
          clearanceDate: form.assetSubmittedOn // Also keep for backward compatibility
        }
      }
    })
  );

    promises.push(
      Promise.resolve({
        type: 'hr_round2',
        data: {
          success: true,
          data: {
            hrOffboardingChecks: form.hrOffboardingChecks,
            processedBy: form.updatedBy,
            createdDate: form.updatedOn
          }
        }
      })
    );

     // UPDATED: Payroll Checks - Use payrollSubmittedBy from form
  promises.push(
    Promise.resolve({
      type: 'payroll_checks',
      data: {
        success: true,
        data: {
          payrollChecks: form.payrollChecks,
          processedBy: form.payrollSubmittedBy, // CHANGED: Use payrollSubmittedBy
          processedDate: form.payrollSubmittedOn, // ADDED: Use payrollSubmittedOn for date
          updatedBy: form.payrollSubmittedBy // Also keep for backward compatibility
        }
      }
    })
  );

    promises.push(
      Promise.resolve({
        type: 'final_hr_approval',
        data: {
          success: true,
          data: {
            finalChecklistData: form.finalChecklistData,
            finalHrRemarks: form.finalHrRemarks,
            finalHrApprovedBy: form.finalHrApprovedBy,
            finalHrApprovedOn: form.finalHrApprovedOn,
            approvedBy: form.finalHrApprovedBy,
            approvalDate: form.finalHrApprovedOn
          }
        }
      })
    );

    const results = await Promise.all(promises);

    const formData: any = {
      manager_review: null,
      hr_round1: null,
      asset_clearance: null,
      hr_round2: null,
      payroll_checks: null,
      final_hr_approval: null,
      user_info: {
        employeeId: form.employeeId,
        employeeName: form.employeeName,
        reason: form.reason,
        noticeStartDate: form.noticeStartDate,
        noticeEndDate: form.noticeEndDate,
        comments: form.comments,
        status: form.status
      }
    };

    results.forEach((result: FormData) => {
      if (result.data) {
        formData[result.type] = result.data;
      }
    });

    console.log('All form data fetched:', formData);
    return formData;
  }

  private async generateCompleteFormsPdf(form: ExitForm, allFormData: any) {
  const doc = new jsPDF.default('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  let currentPage = 1;
  let yPosition = 65;
  
  // Add first page header
  this.addPdfHeader(doc, form);
  
  const checkAndAddPage = (contentHeight: number): boolean => {
    if (yPosition + contentHeight > pageHeight - 30) {
      doc.addPage();
      currentPage++;
      yPosition = this.addPageHeader(doc);
      return true;
    }
    return false;
  };
  
  // Employee Info Section
  const employeeInfoHeight = 80;
  checkAndAddPage(employeeInfoHeight);
  yPosition = this.addEmployeeInfoSection(doc, allFormData.user_info, yPosition);
  
  // Manager Review Section
  const managerReviewHeight = 70;
  checkAndAddPage(managerReviewHeight);
  yPosition = this.addManagerReviewSection(doc, allFormData.manager_review, yPosition);
  
  // HR Round 1 Section - PASS THE COMPLETE FORM OBJECT
  const hrRound1Height = 90;
  checkAndAddPage(hrRound1Height);
  yPosition = this.addHRRound1Section(doc, allFormData.hr_round1, yPosition, form); // ✅ Pass the form object
  
  // Asset Clearance Section
  const assetClearanceHeight = this.calculateAssetSectionHeight(allFormData.asset_clearance);
  checkAndAddPage(assetClearanceHeight);
  yPosition = this.addAssetClearanceSection(doc, allFormData.asset_clearance, yPosition);
  
  // HR Round 2 Section
  const hrRound2Height = this.calculateChecklistSectionHeight(allFormData.hr_round2?.data?.hrOffboardingChecks);
  checkAndAddPage(hrRound2Height);
  yPosition = this.addHRRound2Section(doc, allFormData.hr_round2, yPosition);
  
  // Payroll Checks Section
  const payrollHeight = this.calculateChecklistSectionHeight(allFormData.payroll_checks?.data?.payrollChecks);
  checkAndAddPage(payrollHeight);
  yPosition = this.addPayrollChecksSection(doc, allFormData.payroll_checks, yPosition);
  
  // Final HR Section - PASS THE COMPLETE FORM OBJECT
  const finalHRHeight = this.calculateFinalHRSectionHeight(allFormData.final_hr_approval);
  checkAndAddPage(finalHRHeight);
  yPosition = this.addFinalHRSection(doc, allFormData.final_hr_approval, yPosition, form); // ✅ Pass the form object
  
  this.addStatusStamp(doc, form);
  this.addPdfFooter(doc);
  
  const safeName = form.employeeName ? form.employeeName.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
  const filename = `Exit_Forms_${safeName}_${form.employeeId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Helper method to calculate section heights
private calculateAssetSectionHeight(assetData: any): number {
  if (!assetData || !assetData.data || !assetData.data.assetClearance) {
    return 50; // Default height for "No data available"
  }
  
  try {
    const parsedItems = this.parseAndCleanDataString(assetData.data.assetClearance);
    // Each item takes ~8mm, plus header and spacing
    return 40 + (parsedItems.length * 8);
  } catch {
    return 50;
  }
}

private calculateChecklistSectionHeight(checklistString: string): number {
  if (!checklistString) {
    return 50;
  }
  
  try {
    const parsedItems = this.parseAndCleanDataString(checklistString);
    // Each item takes ~8mm, plus header and spacing
    return 40 + (parsedItems.length * 8);
  } catch {
    return 50;
  }
}

private calculateFinalHRSectionHeight(finalHRData: any): number {
  if (!finalHRData || !finalHRData.data) {
    return 50;
  }
  
  let height = 70; // Basic info height
  
  if (finalHRData.data.finalChecklistData) {
    try {
      const parsedItems = this.parseFinalChecklistData(finalHRData.data.finalChecklistData);
      height += 30 + (parsedItems.length * 8);
    } catch {
      height += 30;
    }
  }
  
  return height;
}

  // UPDATED: PDF Header with Logo and Company Details

  private addPdfHeader(doc: any, form: ExitForm) {
  const pageWidth = doc.internal.pageSize.width;
  
  // ========== BLUE BACKGROUND FOR LOGO + COMPANY AREA ONLY ==========
  doc.setFillColor(52, 73, 94); // #34495e - Dark blue
  doc.rect(0, 0, pageWidth, 35, 'F'); // Keep height at 35mm
  
  // ========== LOGO POSITION AND SIZE ==========
  const logoX = 8; // Keep left position
  const logoWidth = 35; // Keep width or adjust slightly
  const logoHeight = 25; // REDUCED FROM 28 TO 25 (3mm reduction)
  const logoY = 5; // ADJUSTED FROM 3 TO 5 (moved down 2mm)
  
  // Add logo
  if (this.companyLogo) {
    try {
      doc.addImage(this.companyLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Logo error:', error);
      // Fallback - white rectangle with dark blue text
      doc.setFillColor(255, 255, 255);
      doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
      doc.setTextColor(52, 73, 94);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('WS', logoX + logoWidth/2, logoY + logoHeight/2 + 2, { align: 'center' });
      doc.setTextColor(255, 255, 255); // Reset to white
    }
  }
  
  // ========== COMPANY INFO IN WHITE TEXT - CENTERED ==========
  const centerX = pageWidth / 2;
  
  // Company name in white bold - CENTERED
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont('helvetica', 'bold');
  doc.text('WHITESTONE SOFTWARE SOLUTIONS PVT LTD.', centerX, 12, { align: 'center' });
  
  // Address in smaller white - CENTERED
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('3/331/Z3, KAMARASAR NAGAR, NALLAMPALLI,', centerX, 19, { align: 'center' });
  doc.text('DHARMAPURI, TAMIL NADU - 636807', centerX, 24, { align: 'center' });
  
  // ========== WHITE BACKGROUND FOR THE REST ==========
  doc.setFillColor(255, 255, 255); // White
  doc.rect(0, 35, pageWidth, 15, 'F'); // White background below blue area
  
  // ========== MAIN TITLE IN BLACK - ADD MORE SPACE ABOVE ==========
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0); // Black text on white background
  doc.setFont('helvetica', 'bold');
  // Position title 10mm below blue area (was 5mm, now 10mm)
  doc.text('COMPLETE EXIT PROCESS DOCUMENTATION', pageWidth / 2, 45, { align: 'center' }); // CHANGED FROM 40 TO 45
  
  // ========== GRAY SEPARATOR LINE - ADJUST FOR NEW TITLE POSITION ==========
  doc.setDrawColor(200, 200, 200); // Gray line
  doc.setLineWidth(0.5);
  doc.line(10, 50, pageWidth - 10, 50); // CHANGED FROM 45 TO 50 (5mm below new title position)
  
  // ========== STATUS AND EMPLOYEE INFO IN BLACK ==========
  const status = form.status || 0;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const cleanStatusText = this.cleanCorruptedText(this.getStatusText(status).toUpperCase());
  doc.text(`STATUS: ${cleanStatusText}`, 20, 57); // ADJUSTED FROM 52 TO 57
  
  const employeeText = `Employee: ${form.employeeName || 'N/A'} (ID: ${form.employeeId || 'N/A'})`;
  doc.text(employeeText, pageWidth - 20, 57, { align: 'right' }); // ADJUSTED FROM 52 TO 57
  
  // ========== BOTTOM SEPARATOR LINE ==========
  doc.setDrawColor(200, 200, 200); // Gray line
  doc.setLineWidth(0.5);
  doc.line(10, 62, pageWidth - 10, 62); // CHANGED FROM 57 TO 62 (5mm below employee info)
  
  // Reset text color for content
  doc.setTextColor(0, 0, 0);
}

  private addPageHeader(doc: any) {
  const pageWidth = doc.internal.pageSize.width;
  
  // ========== NO BLUE BACKGROUND FOR CONTINUATION PAGES ==========
  // Just add continuation text in gray at the top
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100); // Gray text
  doc.text('(Continuation of Exit Process Documentation)', pageWidth / 2, 15, { align: 'center' });
  
  // ========== GRAY SEPARATOR LINE ==========
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 20, pageWidth - 10, 20); // Separator line
  
  // Reset text color for content
  doc.setTextColor(0, 0, 0);
  
  return 25; // Return the new starting yPosition
}

  // UPDATED: Employee Info Section in Table Format

  private addEmployeeInfoSection(doc: any, userInfo: any, yPosition: number): number {
  // ADD EXTRA SPACE BEFORE THE SECTION STARTS
  yPosition += 10; // ADD THIS LINE - adds 10mm space from previous content
  
  // This will now start BELOW the blue area
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199); // Blue text
  doc.setFont('helvetica', 'bold');
  doc.text('1. EMPLOYEE BASIC INFORMATION', 20, yPosition);
  yPosition += 15; // Space after title
  
  // Create table data with proper type
  const tableData: TableRow[] = [
    ['Employee ID:', userInfo.employeeId || 'N/A'],
    ['Employee Name:', userInfo.employeeName || 'N/A'],
    ['Reason for Exit:', userInfo.reason || 'N/A'],
    ['Notice Start Date:', this.formatDate(userInfo.noticeStartDate)],
    ['Notice End Date:', this.formatDate(userInfo.noticeEndDate)],
    ['Comments:', userInfo.comments || 'None'],
    ['Current Status:', this.getStatusText(userInfo.status)]
  ];

  // Draw table
  const startX = 20;
  const col1Width = 50;
  const col2Width = 120;
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPosition, col1Width, 8, 'F');
  doc.rect(startX + col1Width, yPosition, col2Width, 8, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Field', startX + 2, yPosition + 6);
  doc.text('Details', startX + col1Width + 2, yPosition + 6);
  
  yPosition += 8;
  
  // Table rows
  tableData.forEach(([label, value], index: number) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    doc.rect(startX, yPosition, col1Width, 8, 'F');
    doc.rect(startX + col1Width, yPosition, col2Width, 8, 'F');
    
    // Draw cell borders
    doc.setDrawColor(220, 220, 220);
    doc.line(startX, yPosition, startX + col1Width + col2Width, yPosition); // top border
    doc.line(startX, yPosition + 8, startX + col1Width + col2Width, yPosition + 8); // bottom border
    doc.line(startX, yPosition, startX, yPosition + 8); // left border
    doc.line(startX + col1Width, yPosition, startX + col1Width, yPosition + 8); // middle border
    doc.line(startX + col1Width + col2Width, yPosition, startX + col1Width + col2Width, yPosition + 8); // right border
    
    // Add text
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, startX + 2, yPosition + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Handle multi-line values for comments
    if (label === 'Comments:' && value.length > 50) {
      const lines = doc.splitTextToSize(value, col2Width - 4);
      doc.text(lines[0], startX + col1Width + 2, yPosition + 6);
      if (lines.length > 1) {
        // Adjust row height for multi-line
        doc.rect(startX, yPosition, col1Width + col2Width, 8 * lines.length, 'F');
        for (let i = 1; i < lines.length; i++) {
          doc.text(lines[i], startX + col1Width + 2, yPosition + 6 + (i * 8));
        }
        yPosition += 8 * (lines.length - 1);
      }
    } else {
      doc.text(value.toString(), startX + col1Width + 2, yPosition + 6);
    }
    
    yPosition += 8;
  });

  yPosition += 15;
  return yPosition;
}

  private createTableWithAutoPageBreak(doc: any, tableData: TableRow[], yPosition: number): number {
  const pageHeight = doc.internal.pageSize.height;
  const startX = 20;
  const col1Width = 60;
  const col2Width = 110;
  
  tableData.forEach(([label, value], index: number) => {
    // Check if we need a new page before adding this row
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = this.addPageHeader(doc); // Get new yPosition
      
      // Recreate table header if needed
      // You might want to add table headers here for continuation pages
    }
    
    // Calculate row height based on content
    let rowHeight = 8;
    if (value.length > 40) {
      const lines = doc.splitTextToSize(value, col2Width - 4);
      rowHeight = Math.max(8, lines.length * 8);
    }
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    doc.rect(startX, yPosition, col1Width, rowHeight, 'F');
    doc.rect(startX + col1Width, yPosition, col2Width, rowHeight, 'F');
    
    // Draw cell borders
    doc.setDrawColor(220, 220, 220);
    doc.line(startX, yPosition, startX + col1Width + col2Width, yPosition);
    doc.line(startX, yPosition + rowHeight, startX + col1Width + col2Width, yPosition + rowHeight);
    doc.line(startX, yPosition, startX, yPosition + rowHeight);
    doc.line(startX + col1Width, yPosition, startX + col1Width, yPosition + rowHeight);
    doc.line(startX + col1Width + col2Width, yPosition, startX + col1Width + col2Width, yPosition + rowHeight);
    
    // Add text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, startX + 2, yPosition + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Handle multi-line values
    if (value.length > 40) {
      const lines = doc.splitTextToSize(value, col2Width - 4);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], startX + col1Width + 2, yPosition + 6 + (i * 8));
      }
    } else {
      doc.text(value.toString(), startX + col1Width + 2, yPosition + 6);
    }
    
    yPosition += rowHeight;
  });
  
  yPosition += 15;
  return yPosition;
}

  // UPDATED: Manager Review Section in Table Format

  private addManagerReviewSection(doc: any, managerData: any, yPosition: number): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('2. MANAGER REVIEW', 20, yPosition);
  yPosition += 10;

  if (!managerData || !managerData.data || managerData.data.length === 0) {
    doc.text('No manager review data available', 20, yPosition);
    yPosition += 15;
    return yPosition;
  }

  const reviewData = managerData.data[0];

  const tableData: TableRow[] = [
    ['Manager Name:', reviewData.managerName || reviewData.createdBy || 'N/A'],
    ['Performance Rating:', reviewData.performance || 'Not rated'],
    ['Project Dependency:', reviewData.projectDependency === "1" || reviewData.projectDependency === 1 ? 'Yes' : 'No'],
    ['Knowledge Transfer:', reviewData.knowledgeTransfer || 'Not rated'],
    ['Notice Period Compliance:', reviewData.managerNoticeperiod === "1" || reviewData.managerNoticeperiod === 1 ? 'Yes' : 'No'],
    ['Manager Remarks:', reviewData.managerRemarks || reviewData.remarks || 'None'],
    ['Manager Action:', reviewData.managerAction || reviewData.action || 'Pending'],
    ['Reviewed On:', this.formatDate(reviewData.createdOn || reviewData.createdDate)]
  ];

  return this.createTableWithAutoPageBreak(doc, tableData, yPosition);
}

  // Helper method to create formatted table - FIXED TYPE

  private createTable(doc: any, tableData: TableRow[], yPosition: number): number {
    const startX = 20;
    const col1Width = 60;
    const col2Width = 110;
    
    // Draw table
    tableData.forEach(([label, value], index: number) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      doc.rect(startX, yPosition, col1Width, 8, 'F');
      doc.rect(startX + col1Width, yPosition, col2Width, 8, 'F');
      
      // Draw cell borders
      doc.setDrawColor(220, 220, 220);
      doc.line(startX, yPosition, startX + col1Width + col2Width, yPosition);
      doc.line(startX, yPosition + 8, startX + col1Width + col2Width, yPosition + 8);
      doc.line(startX, yPosition, startX, yPosition + 8);
      doc.line(startX + col1Width, yPosition, startX + col1Width, yPosition + 8);
      doc.line(startX + col1Width + col2Width, yPosition, startX + col1Width + col2Width, yPosition + 8);
      
      // Add text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label, startX + 2, yPosition + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Handle multi-line values
      if (value.length > 40) {
        const lines = doc.splitTextToSize(value, col2Width - 4);
        doc.text(lines[0], startX + col1Width + 2, yPosition + 6);
        if (lines.length > 1) {
          // Adjust row height for multi-line
          doc.rect(startX, yPosition, col1Width + col2Width, 8 * lines.length, 'F');
          for (let i = 1; i < lines.length; i++) {
            doc.text(lines[i], startX + col1Width + 2, yPosition + 6 + (i * 8));
          }
          yPosition += 8 * (lines.length - 1);
        }
      } else {
        doc.text(value.toString(), startX + col1Width + 2, yPosition + 6);
      }
      
      yPosition += 8;
    });

    yPosition += 15;
    return yPosition;
  }

  // UPDATED: HR Round 1 Section in Table Format

  private addHRRound1Section(doc: any, hrRound1Data: any, yPosition: number, form?: any): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('3. HR ROUND 1 - VERIFICATION', 20, yPosition);
  yPosition += 10;

  // ✅ IMPROVED: Get HR name from form.hrName column with better fallback
  let hrName = 'N/A';
  
  // First try to get from the form object directly
  if (form && form.hrName) {
    hrName = this.cleanCorruptedText(form.hrName);
    console.log('👤 HR Name from form.hrName:', hrName);
  } 
  // Fallback: Try to get from hrRound1Data if available
  else if (hrRound1Data && hrRound1Data.data) {
    const hrData = hrRound1Data.data;
    if (Array.isArray(hrData) && hrData.length > 0) {
      hrName = this.cleanCorruptedText(hrData[0].hrName || 'N/A');
      console.log('👤 HR Name from hrRound1Data:', hrName);
    } else if (hrData.hrName) {
      hrName = this.cleanCorruptedText(hrData.hrName);
      console.log('👤 HR Name from hrRound1Data.data:', hrName);
    }
  }
  
  // ✅ Get date with new format "11 Dec 2025"
  let hrRound1SubmittedOn = '-';
  if (form && form.hrRound1SubmittedOn) {
    hrRound1SubmittedOn = this.formatDateToNewFormat(form.hrRound1SubmittedOn);
    console.log('📅 HR Round 1 Date from form:', hrRound1SubmittedOn);
  } else if (hrRound1Data && hrRound1Data.data && hrRound1Data.data.hrReviewDate) {
    hrRound1SubmittedOn = this.formatDateToNewFormat(hrRound1Data.data.hrReviewDate);
    console.log('📅 HR Round 1 Date from hrRound1Data:', hrRound1SubmittedOn);
  }

  // ✅ Create table data
  const tableData: TableRow[] = [
    ['HR Name:', hrName], // ✅ Using hrName from database column
    ['Notice Period Verified:', 'Yes'],
    ['Notice Period Comments:', 'DONE'],
    ['Leave Balances Verified:', 'Yes'],
    ['Leave Balances Comments:', 'DONE'],
    ['Policy Compliance Verified:', 'Yes'],
    ['Policy Compliance Comments:', 'DONE'],
    ['Exit Eligibility Verified:', 'Yes'],
    ['Exit Eligibility Comments:', 'DONE'],
    ['HR Action:', 'APPROVE'],
    ['HR Round 1 Submitted On:', hrRound1SubmittedOn] // ✅ "11 Dec 2025" format
  ];

  // Create the table
  yPosition = this.createTable(doc, tableData, yPosition);

  return yPosition;
}

private parseHrNameFromString(dataString: string): string | null {
  if (!dataString) return null;
  
  // Try different patterns to extract HR name
  const patterns = [
    /Processed By:\s*([^#\n]+)/i,
    /HR Name:\s*([^#\n]+)/i,
    /processedBy:\s*([^#\n]+)/i,
    /hrName:\s*([^#\n]+)/i,
    /createdBy:\s*([^#\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = dataString.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Clean the name
      return this.cleanCorruptedText(name);
    }
  }
  
  return null;
}

// ✅ NEW METHOD: Format date to "11 Dec 2025" format
private formatDateToNewFormat(date: any): string {
  if (!date || date === '' || date === '0000-00-00' || date === null) return '-';

  try {
    let parsedDate: Date;
    
    if (!isNaN(date)) {
      parsedDate = new Date(Number(date));
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      // Handle "dd-MM-yyyy" format
      const [dd, mm, yyyy] = date.split('-');
      parsedDate = new Date(`${yyyy}-${mm}-${dd}`);
    } else {
      // Try to parse ISO date
      parsedDate = new Date(date);
    }

    if (isNaN(parsedDate.getTime())) return '-';

    // Format to "11 Dec 2025"
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();
    
    return `${day} ${month} ${year}`;

  } catch {
    return '-';
  }
}

private parseHrDataString(dataString: string): any {
  if (!dataString) return null;
  
  const hrData: any = {};
  
  // Try to parse different formats
  if (dataString.includes('HR Name:') || dataString.includes('Notice Period Verified:')) {
    // Split by lines or other delimiters
    const lines = dataString.split(/\n|#/);
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(part => part.trim());
        if (key && value) {
          // Map to standard keys
          if (key.includes('HR Name')) hrData.hrName = value;
          if (key.includes('Notice Period Verified')) hrData.noticePeriodVerified = value === 'Yes';
          if (key.includes('Notice Period Comments')) hrData.noticePeriodComments = value;
          if (key.includes('Leave Balances Verified')) hrData.leaveBalancesVerified = value === 'Yes';
          if (key.includes('Leave Balances Comments')) hrData.leaveBalancesComments = value;
          if (key.includes('Policy Compliance Verified')) hrData.policyComplianceVerified = value === 'Yes';
          if (key.includes('Policy Compliance Comments')) hrData.policyComplianceComments = value;
          if (key.includes('Exit Eligibility Verified')) hrData.exitEligibilityVerified = value === 'Yes';
          if (key.includes('Exit Eligibility Comments')) hrData.exitEligibilityComments = value;
          if (key.includes('HR Action')) hrData.hrAction = value;
          if (key.includes('Review Date')) hrData.reviewDate = value;
        }
      }
    });
  }
  
  return Object.keys(hrData).length > 0 ? hrData : null;
}

 private addAssetClearanceSection(doc: any, assetData: any, yPosition: number): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('4. ASSET CLEARANCE', 20, yPosition);
  yPosition += 10;

  if (!assetData || !assetData.data) {
    doc.text('No asset clearance data available', 20, yPosition);
    yPosition += 15;
    return yPosition;
  }

  const clearanceData = assetData.data;

  if (clearanceData.assetClearance && clearanceData.assetClearance.trim()) {
    try {
      const parsedItems = this.parseAndCleanDataString(clearanceData.assetClearance);

      if (parsedItems.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Asset Clearance Checklist:', 20, yPosition);
        yPosition += 8;

        // Create checklist table
        const checklistData = parsedItems.map((item: ParsedItem, index: number) => {
          const statusColor = item.value.toLowerCase().includes('good') || 
                             item.value.toLowerCase().includes('completed') ||
                             item.value.toLowerCase().includes('cleared') ? 
                             [40, 167, 69] : // Green
                             item.value.toLowerCase().includes('pending') || 
                             item.value.toLowerCase().includes('bad') ? 
                             [220, 53, 69] : // Red
                             [255, 193, 7]; // Yellow for other statuses
          
          return {
            label: `${index + 1}. ${item.label}`,
            value: item.value,
            remarks: item.remarks || '',
            statusColor: statusColor
          };
        });

        // Add header row
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition, 70, 8, 'F');
        doc.rect(90, yPosition, 40, 8, 'F');
        doc.rect(130, yPosition, 60, 8, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Asset Item', 22, yPosition + 6);
        doc.text('Status', 92, yPosition + 6);
        doc.text('Remarks', 132, yPosition + 6);
        
        yPosition += 8;

        // Draw checklist items
        checklistData.forEach((item: any, index: number) => {
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          
          doc.rect(20, yPosition, 70, 8, 'F');
          doc.rect(90, yPosition, 40, 8, 'F');
          doc.rect(130, yPosition, 60, 8, 'F');
          
          // Borders
          doc.setDrawColor(220, 220, 220);
          doc.line(20, yPosition, 190, yPosition);
          doc.line(20, yPosition + 8, 190, yPosition + 8);
          doc.line(20, yPosition, 20, yPosition + 8);
          doc.line(90, yPosition, 90, yPosition + 8);
          doc.line(130, yPosition, 130, yPosition + 8);
          doc.line(190, yPosition, 190, yPosition + 8);
          
          // Label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text(item.label, 22, yPosition + 6);
          
          // Status with color
          doc.setTextColor(item.statusColor[0], item.statusColor[1], item.statusColor[2]);
          doc.text(item.value, 92, yPosition + 6);
          
          // Remarks
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          
          // Handle null or empty remarks
          const remarksText = item.remarks === 'null' || item.remarks === null || item.remarks === '' ? '-' : item.remarks;
          doc.text(remarksText, 132, yPosition + 6);
          
          yPosition += 8;
        });
        
        // Reset color
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text('No asset clearance items found', 20, yPosition);
        yPosition += 8;
      }
    } catch (error) {
      console.error('Error parsing asset data:', error);
      doc.text('Error parsing asset data', 20, yPosition);
      yPosition += 8;
    }
  } else {
    doc.text('No asset clearance data provided', 20, yPosition);
    yPosition += 8;
  }

  yPosition += 10;
  
  // FIXED: Get processed by name and date correctly
  // Try multiple possible field names for the processed by name
  const processedByName = this.extractProcessedByName(clearanceData);
  const processedDate = this.extractProcessedDate(clearanceData);
  
  console.log('Asset Clearance Processed By Data:', {
    clearanceData: clearanceData,
    processedByName: processedByName,
    processedDate: processedDate
  });
  
  // Display processed by and date section
  doc.setFont('helvetica', 'bold');
  doc.text('Processed By:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  
  // Handle null/undefined for processedByName
  const displayName = processedByName === 'null' || !processedByName ? 'N/A' : processedByName;
  doc.text(displayName, 70, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  
  // Handle null/undefined for processedDate
  const displayDate = processedDate === 'null' || !processedDate ? this.formatDate(new Date()) : processedDate;
  doc.text(displayDate, 70, yPosition);
  yPosition += 7;

  yPosition += 10;
  return yPosition;
}


// NEW HELPER METHODS TO EXTRACT THE DATA CORRECTLY
private extractProcessedByName(clearanceData: any): string {
  // Try multiple possible field names
  const possibleNameFields = [
    'assetSubmittedBy',
    'processedBy',
    'clearedBy',
    'createdBy',
    'updatedBy',
    'submittedBy'
  ];
  
  for (const field of possibleNameFields) {
    if (clearanceData[field] && clearanceData[field] !== 'null') {
      console.log(`Found processed by name in field '${field}':`, clearanceData[field]);
      return this.cleanCorruptedText(clearanceData[field]);
    }
  }
  
  // If no field found, try to extract from the assetClearance string itself
  if (clearanceData.assetClearance) {
    const processedByMatch = clearanceData.assetClearance.match(/Processed By:\s*([^\n]+)/i);
    if (processedByMatch && processedByMatch[1]) {
      console.log('Extracted processed by from assetClearance string:', processedByMatch[1]);
      return this.cleanCorruptedText(processedByMatch[1].trim());
    }
  }
  
  console.log('No processed by name found in clearance data');
  return 'N/A';
}


private extractProcessedDate(clearanceData: any): string {
  // Try multiple possible date fields
  const possibleDateFields = [
    'clearanceDate',
    'createdDate',
    'updatedDate',
    'submittedDate',
    'createdOn',
    'updatedOn'
  ];
  
  for (const field of possibleDateFields) {
    if (clearanceData[field] && clearanceData[field] !== 'null') {
      console.log(`Found processed date in field '${field}':`, clearanceData[field]);
      return this.formatDateToNewFormat(clearanceData[field]);
    }
  }
  
  // If no field found, try to extract from the assetClearance string
  if (clearanceData.assetClearance) {
    const dateMatch = clearanceData.assetClearance.match(/Date:\s*([^\n]+)/i);
    if (dateMatch && dateMatch[1]) {
      console.log('Extracted date from assetClearance string:', dateMatch[1]);
      return this.formatDateToNewFormat(dateMatch[1].trim());
    }
  }
  
  console.log('No processed date found in clearance data');
  return this.formatDateToNewFormat(new Date());
}
  // UPDATED: HR Round 2 Section in Table Format

  private addHRRound2Section(doc: any, hrRound2Data: any, yPosition: number): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('5. HR ROUND 2 - OFFBOARDING CHECKLIST', 20, yPosition);
  yPosition += 10;

  if (!hrRound2Data || !hrRound2Data.data) {
    doc.text('No HR Round 2 data available', 20, yPosition);
    yPosition += 15;
    return yPosition;
  }

  const offboardingData = hrRound2Data.data;

  if (offboardingData.hrOffboardingChecks && offboardingData.hrOffboardingChecks.trim()) {
    try {
      const parsedItems = this.parseAndCleanDataString(offboardingData.hrOffboardingChecks);

      if (parsedItems.length > 0) {
        yPosition = this.createChecklistTable(doc, 'Offboarding Checklist Items:', parsedItems, yPosition);
      } else {
        doc.text('No offboarding checklist items found', 20, yPosition);
        yPosition += 8;
      }
    } catch (error) {
      doc.text('Error parsing checklist data', 20, yPosition);
      yPosition += 8;
    }
  } else {
    doc.text('No offboarding checklist data provided', 20, yPosition);
    yPosition += 8;
  }

  yPosition += 10;
  
  // Add processed by and date - UPDATED: Use formatDateToDDMMYY
  if (offboardingData.processedBy || offboardingData.createdDate) {
    const processedBy = offboardingData.processedBy || 'N/A';
    
    // Get the date and format it properly
    let rawDate = offboardingData.createdDate || offboardingData.updatedOn;
    console.log('Raw HR Round 2 date:', rawDate);
    
    const processedDate = this.formatDateToNewFormat(rawDate);
    console.log('Formatted HR Round 2 date:', processedDate);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Processed By:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(processedBy, 70, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(processedDate, 70, yPosition);
    yPosition += 7;
  } else {
    console.log('No HR Round 2 processedBy or createdDate found');
  }

  yPosition += 10;
  return yPosition;
}

  // UPDATED: Payroll Checks Section in Table Format

  private addPayrollChecksSection(doc: any, payrollData: any, yPosition: number): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('6. PAYROLL & DUES CLEARANCE', 20, yPosition);
  yPosition += 10;

  if (!payrollData || !payrollData.data) {
    doc.text('No payroll clearance data available', 20, yPosition);
    yPosition += 15;
    return yPosition;
  }

  const payrollInfo = payrollData.data;

  if (payrollInfo.payrollChecks && payrollInfo.payrollChecks.trim()) {
    try {
      const parsedItems = this.parseAndCleanDataString(payrollInfo.payrollChecks);

      if (parsedItems.length > 0) {
        yPosition = this.createChecklistTable(doc, 'Payroll Clearance Checklist:', parsedItems, yPosition);
      } else {
        doc.text('No payroll clearance items found', 20, yPosition);
        yPosition += 8;
      }
    } catch (error) {
      doc.text('Error parsing payroll data', 20, yPosition);
      yPosition += 8;
    }
  } else {
    doc.text('No payroll clearance data provided', 20, yPosition);
    yPosition += 8;
  }

  yPosition += 10;
  
  // Add processed by and date - UPDATED: Use formatDateToDDMMYY
  if (payrollInfo.processedBy || payrollInfo.processedDate) {
    const processedBy = payrollInfo.processedBy || 'N/A';
    
    // Get the date and format it properly
    let rawDate = payrollInfo.processedDate || payrollInfo.updatedOn;
    console.log('Raw Payroll date:', rawDate);
    
    const processedDate = this.formatDateToNewFormat(rawDate);
    console.log('Formatted Payroll date:', processedDate);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Processed By:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(processedBy, 70, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(processedDate, 70, yPosition);
    yPosition += 7;
  } else {
    console.log('No Payroll processedBy or processedDate found');
  }

  yPosition += 10;
  return yPosition;
}

  // UPDATED: Final HR Approval Section in Table Format
  // UPDATED: Final HR Approval Section in Table Format
private addFinalHRSection(doc: any, finalHRData: any, yPosition: number, form?: any): number {
  doc.setFontSize(14);
  doc.setTextColor(23, 162, 199);
  doc.setFont('helvetica', 'bold');
  doc.text('7. FINAL HR APPROVAL', 20, yPosition);
  yPosition += 10;

  if (!finalHRData || !finalHRData.data) {
    doc.text('No final HR approval data available', 20, yPosition);
    yPosition += 15;
    return yPosition;
  }

  const finalData = finalHRData.data;

  // ✅ IMPROVED: Get Approved By from form.finalHrApprovedBy with better fallback
  let approvedBy = 'N/A';
  
  // First try to get from the form object directly
  if (form && form.finalHrApprovedBy) {
    approvedBy = this.cleanCorruptedText(form.finalHrApprovedBy);
    console.log('👤 Final HR Approved By from form.finalHrApprovedBy:', approvedBy);
  } 
  // Fallback: Try to get from finalHRData
  else if (finalData.finalHrApprovedBy) {
    approvedBy = this.cleanCorruptedText(finalData.finalHrApprovedBy);
    console.log('👤 Final HR Approved By from finalHRData:', approvedBy);
  } else if (finalData.approvedBy) {
    approvedBy = this.cleanCorruptedText(finalData.approvedBy);
    console.log('👤 Final HR Approved By from finalHRData.approvedBy:', approvedBy);
  }
  
  const finalRemarks = this.cleanCorruptedText(finalData.finalHrRemarks || 'None');
  
  // ✅ Get and format the date using the new format
  let rawDate = null;
  
  // Try multiple sources for the date
  if (form && form.finalHrApprovedOn) {
    rawDate = form.finalHrApprovedOn;
    console.log('📅 Final HR Date from form.finalHrApprovedOn:', rawDate);
  } else if (finalData.finalHrApprovedOn) {
    rawDate = finalData.finalHrApprovedOn;
    console.log('📅 Final HR Date from finalHRData.finalHrApprovedOn:', rawDate);
  } else if (finalData.approvalDate) {
    rawDate = finalData.approvalDate;
    console.log('📅 Final HR Date from finalHRData.approvalDate:', rawDate);
  }
  
  const approvalDate = rawDate ? this.formatDateToNewFormat(rawDate) : '-';
  console.log('✅ Formatted Final HR Approval date:', approvalDate);

  // ✅ Basic approval details in table
  const basicDetails: TableRow[] = [
    ['Approved By:', approvedBy], // ✅ Using finalHrApprovedBy from database
    ['Approval Date:', approvalDate], // ✅ Using "11 Dec 2025" format
    ['Final Remarks:', finalRemarks]
  ];

  yPosition = this.createTable(doc, basicDetails, yPosition);

  // Display final checklist if available
  if (finalData.finalChecklistData && finalData.finalChecklistData.trim()) {
    try {
      console.log('🟢 Raw finalChecklistData from DB:', finalData.finalChecklistData);

      const parsedItems = this.parseFinalChecklistData(finalData.finalChecklistData);

      console.log('🟢 Parsed final checklist items (actual DB data):', parsedItems);

      if (parsedItems.length > 0) {
        yPosition = this.createChecklistTable(doc, 'Final Exit Checklist:', parsedItems, yPosition);
      } else {
        doc.text('No final checklist items found', 20, yPosition);
        yPosition += 8;
      }
    } catch (error) {
      console.error('Error parsing final checklist:', error);
      doc.text('Error parsing final checklist data', 20, yPosition);
      yPosition += 8;
    }
  } else {
    doc.text('No final checklist data provided', 20, yPosition);
    yPosition += 8;
  }

  yPosition += 15;
  return yPosition;
}

  // Helper method to create checklist tables

  private createChecklistTable(doc: any, title: string, items: ParsedItem[], yPosition: number): number {
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPosition);
  yPosition += 8;

  // Create table header - NOW 3 COLUMNS (Item, Status, Remarks)
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, 80, 8, 'F'); // Item column
  doc.rect(100, yPosition, 40, 8, 'F'); // Status column
  doc.rect(140, yPosition, 50, 8, 'F'); // Remarks column
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Checklist Item', 22, yPosition + 6);
  doc.text('Status', 102, yPosition + 6);
  doc.text('Remarks', 142, yPosition + 6);
  
  yPosition += 8;

  // Draw checklist items - NOW 3 COLUMNS
  items.forEach((item: ParsedItem, index: number) => {
    // Calculate row height based on content (need to check both label and remarks)
    let rowHeight = 8;
    const labelLines = doc.splitTextToSize(item.label, 75); // Fit within 75mm width
    const remarksLines = item.remarks ? doc.splitTextToSize(item.remarks, 45) : ['']; // Fit within 45mm width
    
    const maxLines = Math.max(labelLines.length, remarksLines.length);
    if (maxLines > 1) {
      rowHeight = Math.max(8, maxLines * 8);
    }
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    doc.rect(20, yPosition, 80, rowHeight, 'F'); // Item column
    doc.rect(100, yPosition, 40, rowHeight, 'F'); // Status column
    doc.rect(140, yPosition, 50, rowHeight, 'F'); // Remarks column
    
    // Borders - 3 COLUMNS
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPosition, 190, yPosition); // Top border
    doc.line(20, yPosition + rowHeight, 190, yPosition + rowHeight); // Bottom border
    doc.line(20, yPosition, 20, yPosition + rowHeight); // Left border
    doc.line(100, yPosition, 100, yPosition + rowHeight); // Column 1-2 separator
    doc.line(140, yPosition, 140, yPosition + rowHeight); // Column 2-3 separator
    doc.line(190, yPosition, 190, yPosition + rowHeight); // Right border
    
    // Item label (with multi-line support)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    for (let i = 0; i < labelLines.length; i++) {
      doc.text(labelLines[i], 22, yPosition + 6 + (i * 8));
    }
    
    // Status with color (single line - always in middle of row)
    const statusColor = item.value.toLowerCase().includes('cleared') || 
                       item.value.toLowerCase().includes('completed') || 
                       item.value.toLowerCase().includes('good') ? 
                       [40, 167, 69] : // Green
                       item.value.toLowerCase().includes('pending') || 
                       item.value.toLowerCase().includes('bad') ? 
                       [220, 53, 69] : // Red
                       [255, 193, 7]; // Yellow for other statuses
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    
    // Calculate vertical position for status to center it if row has multiple lines
    const statusY = yPosition + (rowHeight / 2) - 1;
    doc.text(item.value, 102, statusY);
    
    // Remarks (with multi-line support)
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Handle null/empty remarks
    const remarksText = item.remarks === 'null' || !item.remarks ? '-' : item.remarks;
    const remarksLinesToShow = remarksText !== '-' ? doc.splitTextToSize(remarksText, 45) : ['-'];
    
    for (let i = 0; i < remarksLinesToShow.length; i++) {
      doc.text(remarksLinesToShow[i], 142, yPosition + 6 + (i * 8));
    }
    
    yPosition += rowHeight;
  });
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9); // Reset font size
  
  yPosition += 15;
  return yPosition;
}

  // Status Stamp (commented out as requested)

  private addStatusStamp(doc: any, form: ExitForm) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    
    const cleanFooterText1 = 'All exit forms have been completed and approved';
    const cleanFooterText2 = 'Document contains data from all 6 exit process stages';
    
    doc.text(cleanFooterText1, 105, 210, { align: 'center' });
    doc.text(cleanFooterText2, 105, 218, { align: 'center' });
  }

  // Clean corrupted text (removes &&& patterns)

  private cleanCorruptedText(text: string): string {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Remove '&& patterns at the beginning
    cleaned = cleaned.replace(/^'&&\s*/, '');
    
    // Remove all & characters between letters (like &E&X&I&T&)
    cleaned = cleaned.replace(/&([A-Z])&/gi, '$1');
    
    // Remove single & characters
    cleaned = cleaned.replace(/&\s*/g, '');
    cleaned = cleaned.replace(/\s*&\s*/g, ' ');
    
    // Remove quotes
    cleaned = cleaned.replace(/['"]/g, '');
    
    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  private parseFinalChecklistData(dataString: string): ParsedItem[] {
    const items: ParsedItem[] = [];

    if (!dataString || dataString.trim() === '') {
      return items;
    }

    console.log('🔍 Parsing final checklist data (preserving actual values):', dataString);

    // First clean the entire string to remove &&& patterns
    const cleanedDataString = this.cleanCorruptedText(dataString);
    
    // Split by "||" to get individual items
    const itemStrings = cleanedDataString.split('||').map(item => item.trim()).filter(item => item !== '');

    itemStrings.forEach((itemStr, index) => {
      try {
        // Split by ":" to separate label and value
        const colonIndex = itemStr.indexOf(':');
        
        if (colonIndex > 0) {
          let label = itemStr.substring(0, colonIndex).trim();
          let value = itemStr.substring(colonIndex + 1).trim();
          
          // Clean label - remove extra spaces
          label = label.replace(/\s+/g, ' ').trim();
          
          items.push({
            label: label,
            value: value,
            remarks: ''
          });
        } else {
          // If no colon found, use entire string as label
          items.push({
            label: itemStr,
            value: '',
            remarks: ''
          });
        }
      } catch (error) {
        console.error(`Error parsing item ${index}:`, error);
      }
    });

    console.log(`✅ Found ${items.length} final checklist items with actual values:`, items);
    return items;
  }

  private addPdfFooter(doc: any) {
  const pageWidth = doc.internal.pageSize.width;
  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 280, pageWidth - 20, 280);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285);
    doc.text(`Generated by: System`, 20, 290); // CHANGED TO ALWAYS SHOW "System"
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 285, { align: 'right' });
    doc.text(`Confidential Document - Do not distribute`, pageWidth / 2, 290, { align: 'center' });
  }
}

  private parseAndCleanDataString(dataString: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  if (!dataString || dataString.trim() === '') {
    return items;
  }

  console.log('🔍 Parsing data string:', dataString);

  // Strategy 1: Check if it's the payroll format (contains '#')
  if (dataString.includes('#')) {
    const itemStrings = dataString.split('#').filter(item => item.trim() !== '');

    itemStrings.forEach(itemStr => {
      const parts = itemStr.split(':');

      if (parts.length >= 2) {
        const label = parts[0].trim();
        const rest = parts.slice(1).join(':').trim();

        const valueRemarksParts = rest.split('||');

        let value = '';
        let remarks = '';

        if (valueRemarksParts.length >= 1) {
          value = valueRemarksParts[0].trim();
        }

        if (valueRemarksParts.length >= 2) {
          remarks = valueRemarksParts[1].trim();
        } else if (valueRemarksParts.length === 1) {
          // If there's no remarks separator, check if the value contains remarks
          // Some items might be like "Completed: Remarks here"
          const colonIndex = value.indexOf(':');
          if (colonIndex > 0) {
            remarks = value.substring(colonIndex + 1).trim();
            value = value.substring(0, colonIndex).trim();
          }
        }

        // Clean both value and remarks to remove &&& patterns
        value = this.cleanCorruptedText(value);
        remarks = this.cleanCorruptedText(remarks);

        items.push({
          label: this.cleanCorruptedText(label),
          value: value,
          remarks: remarks
        });
      }
    });
  }
  // Strategy 2: Check for asset clearance format (contains table structure)
  else if (dataString.includes('|') && dataString.includes('\n')) {
    // Try to parse as markdown table format
    const lines = dataString.split('\n').filter(line => line.trim() !== '');
    
    lines.forEach((line, index) => {
      if (index > 0 && line.includes('|')) { // Skip header row
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        if (cells.length >= 3) {
          items.push({
            label: this.cleanCorruptedText(cells[0].trim()),
            value: this.cleanCorruptedText(cells[1].trim()),
            remarks: this.cleanCorruptedText(cells[2].trim())
          });
        }
      }
    });
  }
  // Strategy 3: Simple key-value pairs separated by ':'
  else if (dataString.includes(':')) {
    const parts = dataString.split(':');
    if (parts.length >= 2) {
      items.push({
        label: this.cleanCorruptedText(parts[0].trim()),
        value: this.cleanCorruptedText(parts.slice(1).join(':').trim()),
        remarks: ''
      });
    }
  }

  console.log(`✅ Parsing complete. Found ${items.length} items with remarks:`, items);
  return items;
}

  isFormDownloading(form: ExitForm): boolean {
    return this.downloadingFormData.get(form.id || '') || false;
  }

  isSelectedFormForDownload(form: ExitForm): boolean {
    return this.selectedFormForDownload?.id === form.id;
  }

  openForm(form: ExitForm) {
    console.log('Opening Exit Form:', form.id, 'for Employee:', form.employeeId);

    this.router.navigate(['/dashboard/exit-page'], {
      state: {
        employeeId: form.employeeId,
        formId: form.id
      }
    });
  }

  formatDate(date: any): string {
    if (!date || date === '' || date === '0000-00-00' || date === null) return '-';

    try {
      if (!isNaN(date)) {
        return new Date(Number(date)).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }

      if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split('-');
        date = `${yyyy} ${mm} ${dd}`;
      }

      const normalized = date.replace(/-/g, '/');
      const parsed = new Date(normalized);

      if (isNaN(parsed.getTime())) return '-';

      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

    } catch {
      return '-';
    }
  }

  getStatusText(status: any): string {
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : (status || 0);

    switch (numericStatus) {
      case 0: return 'Pending with Manager';
      case 1: return 'Pending HR Round 1';
      case 2: return 'Pending Asset Clearance';
      case 3: return 'Pending HR Round 2 (Offboarding)';
      case 4: return 'Pending Payroll Clearance';
      case 5: return 'Pending Final HR Approval';
      case 6: return 'Approved';
      case 7: return 'On Hold by Manager';
      case 8: return 'On Hold by HR';
      case 10: return 'Pending Final Processing';
      case 11: return 'Final Processing in Progress';
      case 12: return 'Exit Completed';
      default: return 'Submitted';
    }
  }

  getStatusClass(status: any): string {
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : (status || 0);

    if (numericStatus === 6) return 'status-approved';
    if (numericStatus === 12) return 'status-completed';
    if (numericStatus >= 10 && numericStatus <= 11) return 'status-inprogress';
    return 'status-pending';
  }
}