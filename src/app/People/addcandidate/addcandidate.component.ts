import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface Role { roleid: string; rolename: string; }
export interface Emp { empid: string; firstname: string; lastname?: string; }

@Component({
  selector: 'app-addcandidate',
  templateUrl: './addcandidate.component.html',
  styleUrls: ['./addcandidate.component.css']
})
export class AddCandidateComponent implements OnInit {
  mode: 'add' | 'edit' | 'approve' = 'add';
  isEditable = true;

  EmployeeID = '';
  showDocModal = false;
  currentDocUrl: SafeResourceUrl | null = null;
  currentDocTitle = '';

  roles: Role[] = [];
  managers: Emp[] = [];
  states: string[] = ['Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi', 'Others'];

  candidateDetails: any = {
    empid: '', firstName: '', lastName: '', emailid: '', mobileNumber: '', dateofbirth: '', bloodgroup: '',
    aadhaarnumber: '', pannumber: '', uannumber: '', officialemail: '', gender: '', maritalstatus: '',
    nationality: 'Indian', dateofjoining: '', designation: '', department: '', worklocation: '',
    reportingmanager: '', emergencycontactname: '', emergencycontactnumber: '', emergencycontactrelation: '',
    alternatemobilenumber: '', passportnumber: '', drivinglicense: '', esinumber: '',
    presentaddressline1: '', presentaddressline2: '', presentcity: '', presentstate: '', presentpostalcode: '', presentcountry: 'India',
    permanentaddressline1: '', permanentaddressline2: '', permanentcity: '', permanentstate: '', permanentpostalcode: '', permanentcountry: 'India'
  };

  educationList: any[] = [this.emptyEducation()];
  professionalList: any[] = [this.emptyProfessional()];
  skillList: any[] = [this.emptySkill()];

  photoFile: File | null = null;
  aadharFile: File | null = null;
  panFile: File | null = null;
  tenthFile: File | null = null;
  twelfthFile: File | null = null;
  degreeFile: File | null = null;

  reportingManager = '';
  selectedRoleId = '';
  successMessage = '';
  sameAsPresentAddress = false;

  existingFiles: {
    photo?: string; aadhar?: string; pan?: string;
    tenth?: string; twelfth?: string; degree?: string;
  } = {};

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.apiService.getRoles().subscribe(data => this.roles = data);
    this.apiService.getManagers().subscribe(data => this.managers = data);

    this.route.queryParams.subscribe(params => {
      const empIdFromUrl = params['empId'];
      const urlMode = params['mode'];

      let targetEmpId: string | null = null;

      if (empIdFromUrl) {
        targetEmpId = empIdFromUrl;
      } else {
        const loggedInId = localStorage.getItem('employeeId') || localStorage.getItem('empId');
        if (loggedInId) {
          targetEmpId = loggedInId;
        }
      }

      if (targetEmpId) {
        this.EmployeeID = targetEmpId;
        this.candidateDetails.empid = targetEmpId;

        if (urlMode === 'B' || urlMode === 'approve') {
          this.mode = 'approve';
          this.isEditable = false;
        } else {
          this.mode = 'edit';
          this.isEditable = true;
        }

        this.loadEmployeeData(targetEmpId);
      } else {
        this.mode = 'add';
        this.isEditable = true;
      }
    });
  }

  loadEmployeeData(empId: string): void {
    this.apiService.getEmployeeDetailsById(empId).subscribe({
      next: (res: any) => {
        Object.assign(this.candidateDetails, res);

        this.educationList = res.education?.length ? res.education : [this.emptyEducation()];
        this.professionalList = res.professional?.length ? res.professional : [this.emptyProfessional()];
        this.skillList = res.skillSet?.length ? res.skillSet : [this.emptySkill()];

        if (res.documents) {
          this.processDocumentsForPreview(res.documents);
          this.existingFiles = {
            photo: res.documents.photo?.originalname || res.documents.photo?.name,
            aadhar: res.documents.aadhar?.originalname || res.documents.aadhar?.name,
            pan: res.documents.pan?.originalname || res.documents.pan?.name,
            tenth: res.documents.tenth?.originalname || res.documents.tenth?.name,
            twelfth: res.documents.twelfth?.originalname || res.documents.twelfth?.name,
            degree: res.documents.degree?.originalname || res.documents.degree?.name,
          };
        }
      },
      error: () => alert('Failed to load employee data')
    });
  }

  processDocumentsForPreview(documents: any): void {
    const keys = ['photo', 'aadhar', 'pan', 'tenth', 'twelfth', 'degree'];
    keys.forEach(key => {
      const doc = documents[key];
      if (doc?.data && doc?.mime) {
        try {
          const binary = atob(doc.data);
          const array = Uint8Array.from(binary, c => c.charCodeAt(0));
          const blob = new Blob([array], { type: doc.mime });
          documents[key].url = URL.createObjectURL(blob);
          documents[key].name = doc.name || `${key} document`;
        } catch (e) {
          console.error('Blob error:', e);
        }
      }
    });
  }

  onFileSelected(event: any, type: string): void {
    const file = event.target.files[0];
    if (file) {
      switch (type) {
        case 'photo': this.photoFile = file; break;
        case 'aadhar': this.aadharFile = file; break;
        case 'pan': this.panFile = file; break;
        case 'tenth': this.tenthFile = file; break;
        case 'twelfth': this.twelfthFile = file; break;
        case 'degree': this.degreeFile = file; break;
      }
    }
  }

  toggleAddress(): void {
    if (this.sameAsPresentAddress) {
      this.candidateDetails.permanentaddressline1 = this.candidateDetails.presentaddressline1;
      this.candidateDetails.permanentaddressline2 = this.candidateDetails.presentaddressline2;
      this.candidateDetails.permanentcity = this.candidateDetails.presentcity;
      this.candidateDetails.permanentstate = this.candidateDetails.presentstate;
      this.candidateDetails.permanentpostalcode = this.candidateDetails.presentpostalcode;
      this.candidateDetails.permanentcountry = this.candidateDetails.presentcountry;
    } else {
      this.clearPermanentAddress();
    }
  }

  clearPermanentAddress(): void {
    this.candidateDetails.permanentaddressline1 = '';
    this.candidateDetails.permanentaddressline2 = '';
    this.candidateDetails.permanentcity = '';
    this.candidateDetails.permanentstate = '';
    this.candidateDetails.permanentpostalcode = '';
    this.candidateDetails.permanentcountry = 'India';
  }

  emptyEducation() { return { institution: '', qualification: '', regnum: '', percentage: '', duration: '', fieldofstudy: '', yearofgraduation: '', additionalnotes: '' }; }
  emptyProfessional() { return { organisation: '', location: '', orgempid: '', orgdept: '', orgrole: '', joiningdate: '', relievingdate: '', ctc: '', additionalinformation: '' }; }
  emptySkill() { return { skill: '', proficiencylevel: '', certification: '', yearsExperience: '', lastupdated: '' }; }

  addEducation() { this.educationList.push(this.emptyEducation()); }
  addProfessional() { this.professionalList.push(this.emptyProfessional()); }
  addSkill() { this.skillList.push(this.emptySkill()); }
  removeEdu(i: number) { if (this.educationList.length > 1) this.educationList.splice(i, 1); }
  removeProfessional(i: number) { if (this.professionalList.length > 1) this.professionalList.splice(i, 1); }
  removeSkill(i: number) { if (this.skillList.length > 1) this.skillList.splice(i, 1); }

  onSubmit1(form: NgForm): void {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });

    if (!form.valid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (this.mode === 'add') {
      const required = [this.photoFile, this.aadharFile, this.panFile, this.tenthFile, this.twelfthFile, this.degreeFile];
      if (required.some(f => !f)) {
        alert('All documents are required when adding a new employee.');
        return;
      }
    }

    const payload = {
      empid: this.candidateDetails.empid,
      firstname: this.candidateDetails.firstName,
      lastname: this.candidateDetails.lastName || null,
      emailid: this.candidateDetails.emailid,
      mobilenumber: this.candidateDetails.mobileNumber,
      alternatemobilenumber: this.candidateDetails.alternatemobilenumber || null,
      dateofbirth: this.candidateDetails.dateofbirth,
      bloodgroup: this.candidateDetails.bloodgroup,
      aadhaarnumber: this.candidateDetails.aadhaarnumber,
      pannumber: this.candidateDetails.pannumber,
      uannumber: this.candidateDetails.uannumber || null,
      officialemail: this.candidateDetails.officialemail || null,
      gender: this.candidateDetails.gender,
      maritalstatus: this.candidateDetails.maritalstatus,
      nationality: this.candidateDetails.nationality || 'Indian',
      passportnumber: this.candidateDetails.passportnumber || null,
      drivinglicense: this.candidateDetails.drivinglicense || null,
      esinumber: this.candidateDetails.esinumber || null,
      emergencycontactname: this.candidateDetails.emergencycontactname,
      emergencycontactnumber: this.candidateDetails.emergencycontactnumber,
      emergencycontactrelation: this.candidateDetails.emergencycontactrelation,
      dateofjoining: this.candidateDetails.dateofjoining,
      designation: this.candidateDetails.designation,
      department: this.candidateDetails.department,
      worklocation: this.candidateDetails.worklocation,
      reportingmanager: this.candidateDetails.reportingmanager,
      address: {
        presentaddressline1: this.candidateDetails.presentaddressline1,
        presentaddressline2: this.candidateDetails.presentaddressline2 || null,
        presentcity: this.candidateDetails.presentcity,
        presentstate: this.candidateDetails.presentstate,
        presentpostalcode: this.candidateDetails.presentpostalcode,
        presentcountry: this.candidateDetails.presentcountry || 'India',
        permanentaddressline1: this.candidateDetails.permanentaddressline1,
        permanentaddressline2: this.candidateDetails.permanentaddressline2 || null,
        permanentcity: this.candidateDetails.permanentcity,
        permanentstate: this.candidateDetails.permanentstate,
        permanentpostalcode: this.candidateDetails.permanentpostalcode,
        permanentcountry: this.candidateDetails.permanentcountry || 'India'
      },
      education: this.educationList.filter(e => e.institution?.trim()),
      professional: this.professionalList.filter(p => p.organisation?.trim()),
      skillSet: this.skillList.filter(s => s.skill?.trim())
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (this.photoFile) formData.append('photo', this.photoFile);
    if (this.aadharFile) formData.append('aadharDoc', this.aadharFile);
    if (this.panFile) formData.append('panDoc', this.panFile);
    if (this.tenthFile) formData.append('tenthMarksheet', this.tenthFile);
    if (this.twelfthFile) formData.append('twelfthOrDiploma', this.twelfthFile);
    if (this.degreeFile) formData.append('degreeCertificate', this.degreeFile);

    this.apiService.uploadEmployeeWithDocuments(formData).subscribe({
      next: () => {
        alert(this.mode === 'add' ? 'Employee added successfully!' : 'Employee updated successfully!');
        this.location.back();
      },
      error: (err) => alert(err.error?.error || 'Operation failed')
    });
  }

  verify(): void {
    if (!this.reportingManager || !this.selectedRoleId) {
      alert('Please select Reporting Manager and Role');
      return;
    }

    const payload = { empid: this.EmployeeID, roleid: this.selectedRoleId, managerid: this.reportingManager };
    this.apiService.approveEmployee(payload).subscribe({
      next: () => {
        alert('Employee approved successfully!');
        this.location.back();
      },
      error: () => alert('Approval failed')
    });
  }

  openDocument(doc: any) {
    if (doc?.url) {
      this.currentDocUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
      this.currentDocTitle = doc.name || 'Document';
      this.showDocModal = true;
    }
  }

  closeDocumentModal() {
    this.showDocModal = false;
    this.currentDocUrl = null;
    this.currentDocTitle = '';
  }

  cancelAction() {
    this.location.back();
  }
}