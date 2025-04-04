

export interface Expense {
  rejectreason: string;
  file: any;
  rejectReason: any;
  expenseId(expenseId: any): unknown;
  empId : string;
  receiptUrl: string | ArrayBuffer | null;
  receipt: any;
  id: string; // Unique identifier for the expense
  date: Date; // Expense date
  category: string; // Category of the expense
  description: string; // Description or details
  amount: number; // Amount of the expense
  currency: string; // Currency (e.g., USD, EUR)
  status: string; // Status (e.g., Pending, Approved)
   
}

export interface ExpenseStats {
  totalExpenses: number;
  pendingReports: number;
  approvedExpenses: number;
  openAdvances: number;
}



export interface Expense {
  id: string; // Unique identifier
  date: Date;
  empId : string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  receipt: any;
  receiptUrl: string | ArrayBuffer | null;
  
}