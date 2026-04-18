export interface Payment {
  id?: string;
  loanId: string;
  userId?: string;
  date: Date;
  amount: number;           // Total del pago (interestAmount + capitalAmount)
  interestAmount: number;   // Monto pagado de interés
  capitalAmount: number;    // Monto pagado de capital (abono a principal)
  receiptUrl?: string;
  note?: string;
}
