export type LoanStatus = 'active' | 'paid' | 'late';

export interface Loan {
  id?: string; // Optional because when creating it might not have an ID yet
  borrowerName: string;
  borrowerDocument: string;
  totalAmount: number;
  monthlyInterest: number;
  annualInterest: number;
  totalInstallments: number;
  installmentValue: number;
  startDate: Date;
  firstDueDate: Date;
  nextDueDate: Date;
  status: LoanStatus;
  createdAt: Date;
}
