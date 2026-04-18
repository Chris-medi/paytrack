export interface Payment {
  id?: string;
  loanId: string;
  userId?: string;
  date: Date;
  amount: number;
  receiptUrl?: string;
  note?: string;
}
