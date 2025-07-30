import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';  // Import RouterModule
import { CommonModule } from '@angular/common';  // Import CommonModule
import { FormsModule } from '@angular/forms';    // Import FormsModule

@Component({
  selector: 'app-createemp',
  //imports: [RouterModule, CommonModule, FormsModule],  // Add CommonModule and FormsModule here
  templateUrl: './createemp.component.html',
  styleUrls: ['./createemp.component.css']
})
export class CreateempComponent {
  educationDetails: Array<{ degree: string, institution: string, year: string }> = [
    { degree: '', institution: '', year: '' }
  ];

  educationDetails1: Array<{ company: string, job: string, fyear: string, tyear: string, description: string }> = [
    { company: '', job: '', fyear: '', tyear: '', description: '' }
  ];

  educationDetails2: Array<{ dname: string, relation: string, dobyear: string }> = [
    { dname: '', relation: '', dobyear: '' }
  ];

  constructor(private router: Router) {}

  // Method to go back to the previous page
  goBack(): void {
    this.router.navigate(['/operations/userinfo/add-emp']);
  }

  loadComponent(route: string) {
    this.router.navigate([route]); // Navigate to the passed route
  }

  // Method to add a new row in the education details
  addRow(): void {
    this.educationDetails.push({ degree: '', institution: '', year: '' });
  }

  addRow1(): void {
    this.educationDetails1.push({ company: '', job: '', fyear: '', tyear: '', description: '' });
  }

  addRow2(): void {
    this.educationDetails2.push({ dname: '', relation: '', dobyear: '' });
  }

  // Method to remove a row
  removeRow(index: number): void {
    if (this.educationDetails.length > 1) {
      this.educationDetails.splice(index, 1);
    }

    if (this.educationDetails1.length > 1) {
      this.educationDetails1.splice(index, 1);
    }

    if (this.educationDetails2.length > 1) {
      this.educationDetails2.splice(index, 1);
    }
  }

  validateForm(): void {
    const formData = {
      employeeId: (document.getElementById('employee-id') as HTMLInputElement)?.value || '',
      nickName: (document.getElementById('nick-name') as HTMLInputElement)?.value || '',
      firstName: (document.getElementById('first-name') as HTMLInputElement)?.value || '',
      lastName: (document.getElementById('last-name') as HTMLInputElement)?.value || '',
      emailAddress: (document.getElementById('email-address') as HTMLInputElement)?.value || '',
      department: (document.getElementById('department') as HTMLSelectElement)?.value || '',
      location: (document.getElementById('location') as HTMLSelectElement)?.value || '',
      designation: (document.getElementById('designation') as HTMLSelectElement)?.value || '',
      zohoRole: (document.getElementById('zohoRole') as HTMLSelectElement)?.value || '',
      employmentType: (document.getElementById('employmentType') as HTMLSelectElement)?.value || '',
      employeeStatus: (document.getElementById('employeeStatus') as HTMLSelectElement)?.value || '',
      sourceOfHire: (document.getElementById('sourceOfHire') as HTMLSelectElement)?.value || '',
      dateOfJoining: (document.getElementById('dateOfJoining') as HTMLInputElement)?.value || '',
      currentExperience: (document.getElementById('currentExperience') as HTMLInputElement)?.value || '',
      totalExperience: (document.getElementById('totalExperience') as HTMLInputElement)?.value || '',
      reportingManager: (document.getElementById('reportingManager') as HTMLSelectElement)?.value || '',
      dateOfBirth: (document.getElementById('dateOfBirth') as HTMLInputElement)?.value || '',
      gender: (document.getElementById('gender') as HTMLSelectElement)?.value || '',
      maritalStatus: (document.querySelector('input[name="maritalStatus"]:checked') as HTMLInputElement)?.value || '',
      aboutMe: (document.getElementById('aboutMe') as HTMLTextAreaElement)?.value || '',
      expertise: (document.getElementById('expertise') as HTMLTextAreaElement)?.value || '',
      uan: (document.getElementById('uan') as HTMLInputElement)?.value || '',
      pan: (document.getElementById('pan') as HTMLInputElement)?.value || '',
      aadhaar: (document.getElementById('aadhaar') as HTMLInputElement)?.value || '',
      workPhone: (document.getElementById('workPhone') as HTMLInputElement)?.value || '',
      extension: (document.getElementById('extension') as HTMLInputElement)?.value || '',
      seatingLocation: (document.getElementById('seatingLocation') as HTMLInputElement)?.value || '',
      tags: (document.getElementById('tags') as HTMLTextAreaElement)?.value || '',
      presentAddress: {
        line1: (document.querySelector('input[placeholder="Address line 1"]') as HTMLInputElement)?.value || '',
        line2: (document.querySelector('input[placeholder="Address line 2"]') as HTMLInputElement)?.value || '',
        city: (document.querySelector('input[placeholder="City"]') as HTMLInputElement)?.value || '',
        country: (document.querySelector('select') as HTMLSelectElement)?.value || '',
        state: (document.querySelector('select') as HTMLSelectElement)?.value || '',
        postalCode: (document.querySelector('input[placeholder="Postal Code"]') as HTMLInputElement)?.value || ''
      },
      permanentAddress: {
        sameAsPresent: (document.getElementById('sameAddress') as HTMLInputElement)?.checked || false,
        line1: (document.querySelector('input[placeholder="Address line 1"]') as HTMLInputElement)?.value || '',
        line2: (document.querySelector('input[placeholder="Address line 2"]') as HTMLInputElement)?.value || '',
        city: (document.querySelector('input[placeholder="City"]') as HTMLInputElement)?.value || '',
        country: (document.querySelector('select') as HTMLSelectElement)?.value || '',
        state: (document.querySelector('select') as HTMLSelectElement)?.value || '',
        postalCode: (document.querySelector('input[placeholder="Postal Code"]') as HTMLInputElement)?.value || ''
      },
      personalMobile: (document.getElementById('personalMobile') as HTMLInputElement)?.value || '',
      personalEmail: (document.getElementById('personalEmail') as HTMLInputElement)?.value || '',
      dateOfExit: (document.getElementById('dateOfExit') as HTMLInputElement)?.value || '',
      educationDetails1: this.educationDetails1,
      educationDetails: this.educationDetails,
      educationDetails2: this.educationDetails2,
    };

    console.log('Form Data:', formData);
    const alertMessage = JSON.stringify(formData, null, 2);
    const userConfirmed = confirm(`Form Data:\n${alertMessage}`);

    if (userConfirmed) {
      this.router.navigate(['./trigger']);
    }
  }
}
