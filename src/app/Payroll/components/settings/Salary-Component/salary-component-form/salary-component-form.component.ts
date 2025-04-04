import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalaryComponent } from '../../../../models/salary-component.model';



@Component({
  selector: 'app-salary-component-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" class="card">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-control" [(ngModel)]="component.name" name="name" required>
      </div>

      <div class="form-group">
        <label class="form-label">Type</label>
        <select  (click)="$event.stopPropagation()"  class="form-control" [(ngModel)]="component.type" name="type" required>
          <option value="earnings">Earnings</option>
          <option value="deductions">Deductions</option>
          <option value="reimbursements">Reimbursements</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Calculation Type</label>
        <select  (click)="$event.stopPropagation()" class="form-control" [(ngModel)]="component.calculationType" name="calculationType" required>
          <option value="fixed">Fixed Amount</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Amount</label>
        <input type="number" class="form-control" [(ngModel)]="component.amount" name="amount" required>
      </div>

      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" [(ngModel)]="component.taxable" name="taxable">
          Taxable
        </label>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-control" [(ngModel)]="component.description" name="description"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" [(ngModel)]="component.active" name="active">
          Active
        </label>
      </div>

      <button type="submit" class="btn btn-primary">{{ component.id ? 'Update' : 'Add' }} Component</button>
    </form>
  `
})
export class SalaryComponentFormComponent {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  @Input() component: SalaryComponent = {
    id: '',
    name: '',
    type: 'earnings',
    amount: 0,
    calculationType: 'fixed',
    taxable: false,
    active: true,
    
  };

  @Output() save = new EventEmitter<SalaryComponent>();

  onSubmit() {
    this.save.emit(this.component);
  }
}