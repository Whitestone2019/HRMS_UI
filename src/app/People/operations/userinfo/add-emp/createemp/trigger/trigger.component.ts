import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trigger',
  templateUrl: './trigger.component.html',
  styleUrls: ['./trigger.component.css']
})
export class TriggerComponent {

  constructor(private router: Router) {}

  // This method is triggered when the Finish button is clicked
  finish() {
    // Get the selected radio button value
   

    // Format data as JSON
   

    // Log the JSON data to the console
   
    // Navigate to the next page after showing the alert
    setTimeout(() => {
      this.router.navigate(['./dashboard/onboarding']);
    }, 100); // Small delay to allow the alert to be visible
  }

}
