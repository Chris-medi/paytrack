export type LoanStatus = 'active' | 'paid' | 'late';

export interface Loan {
  id?: string; // Optional because when creating it might not have an ID yet
  userId?: string;
  borrowerName: string;
  borrowerLocation: string;
  borrowerPhone?: string;
  principalAmount: number;  // Capital prestado original
  totalAmount: number;      // Total a pagar (capital + intereses)
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

/**
 * Representa una cuota programada del cronograma del préstamo.
 */
export interface ScheduledInstallment {
  number: number;          // Cuota #1, #2, etc.
  dueDate: Date;
  interestDue: number;     // Interés que corresponde a esta cuota
  capitalDue: number;      // Capital que corresponde a esta cuota
  totalDue: number;        // Suma (interestDue + capitalDue)
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  interestPaid: number;    // Cuánto interés se pagó realmente
  capitalPaid: number;     // Cuánto capital se pagó realmente
  paidDate?: Date;
}
