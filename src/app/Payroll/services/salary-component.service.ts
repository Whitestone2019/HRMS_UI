import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SalaryComponent } from '../models/salary-component.model';

@Injectable({
  providedIn: 'root'
})
export class SalaryComponentService {
  private components = new BehaviorSubject<SalaryComponent[]>([]);

  getComponents(): Observable<SalaryComponent[]> {
    return this.components.asObservable();
  }

  addComponent(component: SalaryComponent) {
    const currentComponents = this.components.getValue();
    this.components.next([...currentComponents, { ...component, id: this.generateId() }]);
  }

  updateComponent(updatedComponent: SalaryComponent) {
    const currentComponents = this.components.getValue();
    const index = currentComponents.findIndex(c => c.id === updatedComponent.id);
    if (index !== -1) {
      currentComponents[index] = updatedComponent;
      this.components.next([...currentComponents]);
    }
  }

  deleteComponent(id: string) {
    const currentComponents = this.components.getValue();
    this.components.next(currentComponents.filter(c => c.id !== id));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}