import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Expense, ExpenseStats } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private mockExpenses: Expense[] = [
  
    // Add more mock data as needed
  ];

  getExpenses(): Observable<Expense[]> {
    return of(this.mockExpenses);
  }

  getExpenseStats(): Observable<ExpenseStats> {
    return of({
      totalExpenses: 4523.65,
      pendingReports: 8,
      approvedExpenses: 2845.30,
      openAdvances: 1200.00
    });
  }

  addExpense(expense: Omit<Expense, 'id' | 'status'>): Observable<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      status: 'pending'
    };
    this.mockExpenses.push(newExpense);
    return of(newExpense);
  }
}