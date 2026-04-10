export interface Payment {
  id?: string;
  loanId: string;
  date: Date;
  amount: number;
  receiptUrl?: string; // Optional url to firebase storage
  note?: string;
}
