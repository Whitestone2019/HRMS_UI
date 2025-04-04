import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalaryComponentFormComponent } from '../salary-component-form/salary-component-form.component';
import { SalaryComponent } from '../../../../models/salary-component.model';
import { SalaryComponentService } from '../../../../services/salary-component.service';
import { ApiService } from '../../../../../api.service';

@Component({
  selector: 'app-salary-components-list',
  standalone: true,
  imports: [CommonModule, SalaryComponentFormComponent],
  template: `
    <div class="container">
      <h2>Salary Components</h2>
      <div class="tab-container">
        <div class="tab-buttons">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab"
            [class.active]="activeTab === tab"
            class="tab-button">
            {{ tab }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="toggleForm()">
            {{ showForm ? 'Cancel' : 'Add Component' }}
          </button>
        </div>

        <div class="component-list">
          <div *ngFor="let component of filteredComponents" class="component-item">
            <div>
              <h3>{{ component.name }}</h3>
              <p>{{ component.calculationType === 'fixed' ? '₹' + component.amount : component.amount + '%' }}</p>
              <p>{{ component.description }}</p>
            </div>
            <div>
              <span [class]="'status-badge ' + (component.active ? 'status-active' : 'status-inactive')">
                {{ component.active ? 'Active' : 'Inactive' }}
              </span>
              <button class="btn btn-danger" (click)="deleteComponent(component.id)">Delete</button>
            </div>
          </div>
        </div>

        <div class="card" *ngIf="showForm">
          <h2>Add New {{ activeTab }}</h2>
          <app-salary-component-form
            [component]="emptyComponent"
            (save)="handleFormSave($event)">
          </app-salary-component-form>
        </div>
      </div>
    </div>
  `,
})
export class SalaryComponentsListComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  tabs = ['Earnings', 'Deductions', 'Reimbursements'];
  activeTab = 'Earnings';
  showForm = false;
  components: SalaryComponent[] = [];
   
  @Input() component: SalaryComponent = {
    id: '',
    name: '',
    type: 'earnings',
    amount: 0,
    calculationType: 'fixed',
    taxable: false,
    active: true,
  };

  emptyComponent: SalaryComponent = {
    id: '',
    name: '',
    type: 'earnings',
    amount: 0,
    calculationType: 'fixed',
    taxable: false,
    active: true,
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadComponents();
  }

  // Fetch all salary components
  loadComponents() {
    this.apiService.getComponents().subscribe(
      (components) => {
        this.components = components;
      },
      (error) => {
        console.error('Error loading components', error);
      }
    );
  }

  get filteredComponents() {
    return this.components.filter(c => c.type.toLowerCase() === this.activeTab.toLowerCase());
  }

  addComponent(component: SalaryComponent) {
    const componentWithUserId = { ...component, rCreUserId: this.employeeId }; // Add employee ID
    this.apiService.addComponent(componentWithUserId).subscribe(
      (savedComponent) => {
        this.components.push(savedComponent);
      },
      (error) => {
        console.error('Error adding component', error);
      }
    );
  }
  
  deleteComponent(id: string) {
    this.apiService.deleteComponent(id).subscribe(
      () => {
        this.components = this.components.filter(c => c.id !== id);
      },
      (error) => {
        console.error('Error deleting component', error);
      }
    );
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  handleFormSave(component: SalaryComponent) {
    this.addComponent(component);
    this.showForm = false; // Hide form after saving
  }
}
