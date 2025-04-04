export interface Advance {
    id: any;
    expenseId: any;
    advanceId: any;
    advanceDate: string; // Date of the advance
    amount: number; // Amount requested
    paidThrough: string; // Payment method (e.g., Cash, Bank Transfer, Credit Card)
    applyToTrip?: string; // Optional field for trip association
    status?: string;
    rejectreason?: string; // Optional field for rejection reason (if applicable)
    employeeName?: string; // Name of the employee (if applicable)
    empId?: string; // ID of the employee (if applicable)
    
  }
  

