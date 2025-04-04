export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earnings' | 'deductions' | 'reimbursements';
  amount: number;
  calculationType: 'fixed' | 'percentage';
  taxable: boolean;
  active: boolean;
  description?: string;
}