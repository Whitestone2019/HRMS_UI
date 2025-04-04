import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from '../../api.service';


@Component({
  selector: 'app-travel-request-view',
  templateUrl: './travel-request-view.component.html',
  styleUrls: ['./travel-request-view.component.css']
})
export class TravelRequestViewComponent {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';

  travelRequest = {
    employeeId: '',
    department: '',
    departureDate: '',
    purpose: '',
    billable: null,
    placevisit: '',
    arrivalDate: '',
    expdurdays: '',
    custname: '',
    travelId: ''
  };

  errors: any = {};
  departments = ['Sales', 'Engineering', 'Marketing']; // Example departments

  constructor(private apiService: ApiService,private location: Location) {}

  calculateDuration(): void {
    const departureDate = new Date(this.travelRequest.departureDate);
    const arrivalDate = new Date(this.travelRequest.arrivalDate);
  
    if (departureDate && arrivalDate && !isNaN(departureDate.getTime()) && !isNaN(arrivalDate.getTime())) {
      const timeDiff = arrivalDate.getTime() - departureDate.getTime();
      if (timeDiff >= 0) {
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        this.travelRequest.expdurdays = daysDiff.toString();
      } else {
        this.travelRequest.expdurdays = ''; // Clear the field if arrival is earlier than departure
        alert('Arrival date cannot be earlier than departure date.');
      }
    } else {
      this.travelRequest.expdurdays = ''; // Clear the field if any date is invalid
    }
  }
  

  ngOnInit(): void {
   
      this.travelRequest.employeeId=this.employeeId; // Call the method to fetch data
    }
 // Submit the travel request form
 submit() {
  this.errors = {}; // Clear previous errors

  // Validate fields and focus on the first invalid field
  const invalidField = this.validateFields();
  if (invalidField) {
    alert(this.errors[invalidField]);
    document.getElementById(invalidField)?.focus();
  } else {
    // Prepare the request data object, mapping frontend fields to backend fields
    const requestData = {
      userId: this.travelRequest.employeeId,              // Mapping to backend field
      empId: this.travelRequest.employeeId,              // Assuming employeeId maps to both userId and empId
      employeeDepartment: this.travelRequest.department,
      placeOfVisit: this.travelRequest.placevisit,
      expectedDateOfDeparture: this.travelRequest.departureDate,
      expectedDateOfArrival: this.travelRequest.arrivalDate,
      purposeOfVisit: this.travelRequest.purpose,
      expectedDurationInDays: this.travelRequest.expdurdays,
      isBillableToCustomer: this.travelRequest.billable,
      customerName: this.travelRequest.custname,
      rcreUserId: '',                                     // Add values for metadata fields
      rmodUserId: '',                                     // Or handle them based on business logic
      rvfyUserId: '',                                     // For now, set them to empty or default
    };

    // Log and alert the JSON data
    console.log('Travel request JSON:', JSON.stringify(requestData, null, 2));
    alert('Travel request: ' + JSON.stringify(requestData, null, 2)); // Show in alert

    // Send the request to the backend
    this.apiService.submitTravelRequest(requestData).subscribe(
      response => {
        alert('Travel request submitted successfully!');
        console.log('Travel request response:', response);
        this.resetForm();
      this.location.back(); // This will navigate back to the previous page
      },
      error => {
        alert('Failed to submit the travel request. Please try again.');
        console.error('Error submitting travel request:', error);
      }
    );
  }
}



  // Validate form fields
  validateFields(): string | null {
    const { employeeId, department, departureDate, purpose, billable, placevisit, arrivalDate, expdurdays } = this.travelRequest;

    if (!employeeId) {
      this.errors.employeeId = 'Employee ID is required.';
      return 'employeeId';
    }
    if (!placevisit) {
      this.errors.placevisit = 'Place of Visit is required.';
      return 'placevisit';
    }
    if (!department) {
      this.errors.department = 'Employee Department is required.';
      return 'department';
    }
    if (!arrivalDate) {
      this.errors.arrivalDate = 'Expected Date of Arrival is required.';
      return 'arrivalDate';
    }
    if (!departureDate) {
      this.errors.departureDate = 'Expected Date of Departure is required.';
      return 'departureDate';
    }
    if (!expdurdays) {
      this.errors.expdurdays = 'Expected Duration in Days is required.';
      return 'expdurdays';
    }
    if (!purpose) {
      this.errors.purpose = 'Purpose of Visit is required.';
      return 'purpose';
    }
    if (billable === null) {
      this.errors.billable = 'Billable field is required.';
      return 'billable';
    }

    return null;
  }

  // Reset form fields
  resetForm() {
    this.travelRequest = {
      employeeId: '',
      department: '',
      departureDate: '',
      purpose: '',
      billable: null,
      placevisit: '',
      arrivalDate: '',
      expdurdays: '',
      custname: '',
      travelId: ''
    };
    this.errors = {};
  }

  // Reset the form on cancel
  cancel() {
    this.resetForm();
    alert('Form has been reset.');
    this.location.back(); 
  }
}
