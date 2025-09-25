import { Component, OnInit } from '@angular/core';
import { ApiService,LocationAllowance } from '../../../../api.service';

@Component({
  selector: 'app-location-allowance',
  templateUrl: './location-allowance.component.html',
  styleUrls: ['./location-allowance.component.css']
})
export class LocationAllowanceComponent implements OnInit {
  allowances: LocationAllowance[] = [];
  newAllowance: LocationAllowance = { locationName: '', type: 'PER_DAY_ALLOWANCE', amount: 0 };
  types: string[] = ['PER_DAY_ALLOWANCE', 'PG_RENT'];
  
  editingId: number | null = null; // Track which row is being edited
  tempAllowance: LocationAllowance = {} as LocationAllowance; // Store temporary editable copy

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAllowances();
  }

  loadAllowances() {
    this.apiService.getAllAllowances().subscribe(data => this.allowances = data);
  }

  addAllowance() {
    if (!this.newAllowance.locationName || this.newAllowance.amount <= 0) {
      alert('Please enter valid data!');
      return;
    }
    this.apiService.createAllowance(this.newAllowance).subscribe(() => {
      this.loadAllowances();
      this.newAllowance = { locationName: '', type: 'PER_DAY_ALLOWANCE', amount: 0 };
    });
  }

  editAllowance(allowance: LocationAllowance) {
    this.editingId = allowance.id!;
    this.tempAllowance = { ...allowance }; // make a copy to edit
  }

  saveAllowance(id: number) {
    this.apiService.updateAllowance(id, this.tempAllowance).subscribe(() => {
      this.editingId = null;
      this.loadAllowances();
    });
  }

  cancelEdit() {
    this.editingId = null;
  }

  deleteAllowance(id: number) {
    if (confirm('Are you sure you want to delete this allowance?')) {
      this.apiService.deleteAllowance(id).subscribe(() => this.loadAllowances());
    }
  }
}
