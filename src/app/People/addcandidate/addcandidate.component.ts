import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';  // Import Location for navigation
import { ApiService } from '../../api.service';
export interface Role {
  roleid: string;
  rolename: string;
}
export interface Emp {
  empid: string;
  firstname: string;
}
@Component({
  selector: 'app-addcandidate',
  templateUrl: './addcandidate.component.html',
  styleUrls: ['./addcandidate.component.css']
})

export class AddCandidateComponent implements OnInit, AfterViewInit {
  roles: Role[] = [];
  managers : Emp[]=[];
  isEditable: boolean = true; // Default to editable mode
  employeeRole = '';
  reportingManager: string = '';
  selectedRoleId: string = '';

  @ViewChild('candidateForm') candidateDetailsForm!: NgForm;
  @ViewChild('empid', { static: false }) empidElement!: ElementRef<HTMLInputElement>; // Rename ViewChild property to avoid conflict
  form: any;
  empid: string | null = null; // Use a different name or retain the intended purpose
  setFocus: any;
  mobileNumber: any;
  dateofbirth: any;
  bloodgroup: any;
  parentmobnum: any;
  aadhaarnumber: any;
  parentname: any;
  pannumber: any;
  lastName: any;
  emailid: any;
  errorMessage: any;
  onFileChange($event: Event) {
    throw new Error('Method not implemented.');
  }
  states = ['State1', 'State2', 'State3']; // Example states
  educationList = [
    {
      institution: '',
      qualification: '',
      regnum: '',
      percentage: '',
      duration: '',
      fieldofstudy: '',
      yearofgraduation: '',
      additionalnotes: ''
    }
  ];
  experienceList: any[] = [];
  professionalList = [
    {
      organisation: '',
      location: '',
      orgempid: '',
      orgdept: '',
      orgrole: '',
      joiningdate: '',
      relievingdate: '',
      ctc: '',
      additionalinformation: '',
      //   offerLetter: null,
    }
  ];
  skillList = [
    {
      skill: '',
      proficiencylevel: '',
      certification: '',
      yearsExperience: '',
      lastupdated: ''
    }
  ];

  // To store the checkbox state
  sameAsPresentAddress: boolean = false;

  // Present Address fields initialized to empty
  presentAddress = {
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: ''
  };

  candidateForm: any;
  preventFocusLoss(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Permanent Address fields initialized to empty
  permanentAddress = {
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: ''
  };

  successMessage: string = '';  // Variable to hold the success message

  constructor(private apiService: ApiService, private location: Location, private router: Router, private route: ActivatedRoute) { }

  EmployeeID: string = '';

  ngOnInit() {

    this.apiService.getRoles().subscribe((data) => {
      this.roles = data;
    });

    this.apiService.getManagers().subscribe((data) => {
      this.managers = data;
    });
  
    // Fetch the 'mode' query parameter
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode'];
      var empId = params['empId'];
      console.log('mode:', mode); // Debugging the value
      console.log('empId:', empId); // Debugging the value

      if (mode === 'A') {
        this.isEditable = true; // Editable
      } else if (mode === 'B') {
        this.isEditable = false; // Read-only
        this.EmployeeID = empId;
        this.getEmployeeDetails(this.EmployeeID);
      }

      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));  // Forces a reflow
      });
    });

  }
  ngAfterViewInit(): void {

  }

  // This method is called when the "Same as Present Address" checkbox is clicked
  toggleAddress() {
    if (this.sameAsPresentAddress) {
      this.permanentAddress.address1 = this.presentAddress.address1;
      this.permanentAddress.address2 = this.presentAddress.address2;
      this.permanentAddress.city = this.presentAddress.city;
      this.permanentAddress.state = this.presentAddress.state;
      this.permanentAddress.postalCode = this.presentAddress.postalCode;
    } else {
      this.permanentAddress = { address1: '', address2: '', city: '', state: '', postalCode: '' };
    }
  }

  addEducation() {
    this.educationList.push({
      institution: '',
      qualification: '',
      regnum: '',
      percentage: '',
      duration: '',
      fieldofstudy: '',
      yearofgraduation: '',
      additionalnotes: ''
    });
  }

  addProfessional() {
    this.professionalList.push({
      organisation: '',
      location: '',
      orgempid: '',
      orgdept: '',
      orgrole: '',
      joiningdate: '',
      relievingdate: '',
      ctc: '',
      additionalinformation: '',
      // offerLetter: null,
    });
  }

  /* uploadOfferLetter(event: Event, index: number) {
     const fileInput = event.target as HTMLInputElement;
     if (fileInput.files && fileInput.files.length > 0) {
       this.professionalList[index].offerLetter = fileInput.files[0];
     }
   }*/

  addSkill() {
    this.skillList.push({
      skill: '',
      proficiencylevel: '',
      certification: '',
      yearsExperience: '',
      lastupdated: ''
    });
  }

  removeProfessional(index: number) {
    this.professionalList.splice(index, 1);
  }

  removeExp(index: number) {
    this.experienceList.splice(index, 1); // Use the correct array
  }

  removeEdu(index: number) {
    this.educationList.splice(index, 1); // Use the correct array
  }

  removeSkill(index: number) {
    this.skillList.splice(index, 1); // Use the correct array
  }
  candidateDetails: any = {};

  getEmployeeDetails(EmployeeId: string) {
    this.apiService.getEmployeeDetailsById(EmployeeId).subscribe(
      (response) => {
        alert('Employee loaded successfully');
        console.log('Employee loaded successfully', response);

        // Check if response has valid data
        if (response) {
          this.candidateDetails = response; // Bind response to the candidateDetails object
          console.log('Employee Details:', this.candidateDetails);
          const employeeData = response as { education?: any[], professional?: any[],skillSet?: any[] };
          if (employeeData.education && Array.isArray(employeeData.education)) {
            this.educationList = employeeData.education.map((edu: any) => ({
              institution: edu.institution || '',
              qualification: edu.qualification || '',
              regnum: edu.regnum || '',
              percentage: edu.percentage || '',
              duration: edu.duration || '',
              fieldofstudy: edu.fieldofstudy || '',
              yearofgraduation: edu.yearofgraduation || '',
              additionalnotes: edu.additionalnotes || ''
            }));
          } else {
            this.educationList = []; // Reset if no education data found
          }
          if (employeeData.professional && Array.isArray(employeeData.professional)) {
            this.professionalList = employeeData.professional.map((prof: any) => ({
              organisation: prof.organisation || '',
              location: prof.location || '',
              orgempid: prof.orgempid || '',
              orgdept: prof.orgdept || '',
              orgrole: prof.orgrole || '',
              joiningdate: prof.joiningdate || '',
              relievingdate: prof.relievingdate || '',
              ctc: prof.ctc || '',
              additionalinformation: prof.additionalinformation || ''
            }));
          } else {
            this.professionalList = []; // Reset if no education data found
          }
          if (employeeData.skillSet && Array.isArray(employeeData.skillSet)) {
            this.skillList = employeeData.skillSet.map((skill: any) => ({
              skill: skill.skill || '',
              proficiencylevel: skill.proficiencylevel || '',
              certification: skill.certification || '',
              yearsExperience: skill.yearsExperience || '',
              lastupdated: skill.lastupdated || ''

            }));
          } else {
            this.skillList = []; // Reset if no education data found
          }
        }
      },
      (err) => {
        console.error('Error fetching employee details:', err);
      }
    );
  }

  onSubmit1(form: any) {

    if (!this.candidateDetails.empid) {
      alert('Employee ID is required. Please enter.');
      this.empidElement.nativeElement.focus(); // Correct usage of ViewChild
      return;
    }  else if (!this.candidateDetails.mobileNumber) {
      alert('phone number  is required. Please enter ');
      this.setFocus(this.mobileNumber);
    } else if (!this.candidateDetails.dateofbirth) {
      alert('DOB  is required. Please enter');
      this.setFocus(this.dateofbirth);
    } else if (!this.candidateDetails.bloodgroup) {
      alert('blood group  is required. Please enter ');
      this.setFocus(this.bloodgroup);
    } else if (!this.candidateDetails.parentmobnum) {
      alert('Parent mobaile number  is required. Please enter ');
      this.setFocus(this.parentmobnum);
    }else if (!this.candidateDetails.aadhaarnumber) {
      alert('Aadhaar is required. Please enter.');
      this.setFocus(this.aadhaarnumber);
    } else if (!/^[2-9]{1}[0-9]{11}$/.test(this.candidateDetails.aadhaarnumber)) {
      alert('Invalid Aadhaar number. It must be 12 digits and should not start with 0 or 1.');
      this.setFocus(this.aadhaarnumber);
    } else if (!this.candidateDetails.parentname) {
      alert('Parent name is required. Please enter.');
      this.setFocus(this.parentname);
    } else if (!this.candidateDetails.pannumber) {
      alert('PAN number is required. Please enter.');
      this.setFocus(this.pannumber);
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(this.candidateDetails.pannumber)) {
      alert('Invalid PAN number. It must be 10 characters in the format ABCDE1234F.');
      this.setFocus(this.pannumber);
    }  else if (!this.candidateDetails.lastName) {
      alert('lastName is required. Please enter ');
      this.setFocus(this.lastName);
    }else if (!this.candidateDetails.emailid) {
      alert('email is required. Please enter ');
      this.setFocus(this.emailid);
    }
    else {
      alert('Form submitted successfully!');
      // Proceed with further logic here
    }

    console.log('Form data:', form.value);

    const employeeData = {
      emailid: form.value.emailid,
      mobilenumber: form.value.phone,
      empid: form.value.empid,
      uannumber: form.value.uan,
      aadhaarnumber: form.value.aadhaar,
      bloodgroup: form.value.blood_group,
      dateofbirth: form.value.date_of_birth,
      parentmobnum: form.value.parent_mob_num,
      parentname: form.value.parent_name,
      pannumber: form.value.pan,
      firstname: form.value.firstName,
      employeename: form.value.firstName,
      lastname: form.value.lastName,
      officialemail: form.value.officialEmail,
      address: {
        presentaddressline1: form.value.presentAddress1,
        presentaddressline2: form.value.presentAddress2,
        presentcity: form.value.city,
        presentstate: form.value.state,
        presentpostalcode: form.value.postalCode,
        presentcountry: form.value.presentcountry,
        permanentaddressline1: form.value.permanentAddress1,
        permanentaddressline2: form.value.permanentAddress2,
        permanentcity: form.value.permanentCity,
        permanentstate: form.value.permanentState,
        permanentpostalcode: form.value.permanentPostalCode,
        permanentcountry: form.value.permanentcountry,
      },
      education: this.educationList,
      professional: this.professionalList,
      skillSet: this.skillList,
    };
    console.log('Employee JSON data:', JSON.stringify(employeeData, null, 2));
    alert('Employee JSON data:' + JSON.stringify(employeeData, null, 2));

    // Call API service to add the employee
    this.apiService.addEmployee1(employeeData).subscribe(
      response => {
        console.log('Employee added successfully', response);
        this.successMessage = 'Employee added successfully!';  // Set success message
        
        setTimeout(() => {
          this.location.back();  // Navigate to the previous page after 3 seconds
        }, 3000);
      },
      error => {
        console.error('Error adding employee', error);
        if (error.status === 400) {
          // Handle specific error when employee ID already exists
          this.errorMessage = error.error?.error || 'Employee ID already exists.';
        } else {
          // Handle generic error
          this.errorMessage = 'Failed to add employee. Please try again later.';
        }
        alert(this.errorMessage); // Show an alert with the error message
      }
    );
    
  }

  cancelAction() {
    // Reset the form
    if (this.candidateForm) {
      this.candidateForm.reset();  // Resets the form to its initial state
    }
    this.location.back();
    console.log('Form has been reset');
  }


  verify(form: any) {
    const empid = this.candidateDetails.empid;
    const roleid = this.selectedRoleId;
    const managerid = this.reportingManager;
  alert();
    if (empid) {
      // Ensure empid is a string
      const approveemp = { empid: empid.toString() ,roleid: roleid.toString(),managerid:managerid.toString()};  // Convert to string if it's not already
  
      // Create the formatted JSON string and alert it
      const requestPayload = JSON.stringify(approveemp, null, 2);
      alert(requestPayload);  // Displays the request as desired
  
      // Proceed with the API request
      this.apiService.approveEmployee(approveemp).subscribe(
        (response) => {
          alert('Request successful!');
          console.log(response);
          this.successMessage = 'Employee approved successfully!';  // Set success message
         
            this.location.back();  // Navigate to the previous page after 3 seconds
           // Delay to show the success message
        },
        (error) => {
          alert('Request failed!');
          console.error(error);
        }
      );
    } else {
      alert('Employee ID is not provided.');
    }
  }
  
  
   
  }

