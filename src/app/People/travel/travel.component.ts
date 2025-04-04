import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';


interface TravelRecord {
  employeeId: string;
  travelId: string;
  department: string;
  placeOfVisit: string;
  departureDate: Date;
  arrivalDate: Date;
  purpose: string;
  expdur: Date;
  billcust: string;
  custname: string;
  status: string;
  addedTime: Date;
 
}

@Component({
  selector: 'app-travel-request',
  templateUrl: './travel.component.html',
  styleUrls: ['./travel.component.css']
})
export class TravelComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  records: TravelRecord[] = []; // Array to hold travel records

  constructor(
    private router: Router,
    private apiService: ApiService // Inject ApiService
  ) {}

  // Fetch travel records when the component initializes
  ngOnInit(): void {
  
    this.getTravelRecords(); // Call the method to fetch data
  }

  // Method to get travel records from the API
  getTravelRecords(): void {
    this.apiService.getTravelRecords().subscribe(
      (data) => {
        this.records = data; // Assign the fetched data to the records array
      },
      (error) => {
        console.error('Error fetching travel records:', error);
      }
    );
  }

  // Method to add a new record
  addRecord() {
    this.router.navigate(['/dashboard/travel-request-view']); // Navigate to the travel request view
  }
}
