import { Loan, LoanStatus } from '../models/loan.model';
import { Payment } from '../models/payment.model';

export class LoanCalculator {

  static calculateTotalPaid(payments: Payment[]): number {
    return Number(payments.reduce((acc, current) => acc + current.amount, 0).toFixed(2));
  }

  static calculateRemainingBalance(loan: Loan, payments: Payment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    // Here we consider totalAmount as the total amount to be paid including interest, 
    // or as the principal amount. Based on standard fixed installment loans:
    // the total debt to be paid is totalInstallments * installmentValue
    const totalExpected = loan.totalInstallments * loan.installmentValue;
    return Number((totalExpected - totalPaid).toFixed(2));
  }

  static calculatePaidInstallments(loan: Loan, payments: Payment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    return Math.floor(totalPaid / loan.installmentValue);
  }

  static calculatePendingInstallments(loan: Loan, payments: Payment[]): number {
    const paidInstallments = this.calculatePaidInstallments(loan, payments);
    return loan.totalInstallments - paidInstallments;
  }

  /**
   * Next due date based on how many full installments have been paid.
   */
  static getNextDueDate(loan: Loan, payments: Payment[]): Date {
    const paidInstallments = this.calculatePaidInstallments(loan, payments);
    if (paidInstallments >= loan.totalInstallments) {
      return loan.nextDueDate; // Or we could return a null/undefined logic
    }

    // Simplification: assume installments are exactly monthly
    const nextDate = new Date(loan.firstDueDate);
    nextDate.setMonth(nextDate.getMonth() + paidInstallments);
    return nextDate;
  }

  /**
   * Determine the current status of the loan based on payments and current date.
   */
  static determineStatus(loan: Loan, payments: Payment[], currentDate: Date = new Date()): LoanStatus {
    const balance = this.calculateRemainingBalance(loan, payments);

    if (balance <= 0) {
      return 'paid';
    }

    const nextDue = this.getNextDueDate(loan, payments);

    // Normalizar fechas para comparar solo día, mes y año
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const due = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());

    if (today > due) {
      return 'late';
    }

    return 'active';
  }

  /**
   * Version simplificada para usar en listas donde no tenemos todos los pagos cargados.
   * Calcula el estado basándose enteramente en fechas y el plan de pagos.
   */
  static getDynamicStatus(loan: Loan, currentDate: Date = new Date()): LoanStatus {
    // Calculamos cuántas cuotas se han pagado según la fecha de próximo pago
    const firstDue = new Date(loan.firstDueDate);
    const nextDue = new Date(loan.nextDueDate);

    // Diferencia en meses aproximada
    const monthsPaid = (nextDue.getFullYear() - firstDue.getFullYear()) * 12 + (nextDue.getMonth() - firstDue.getMonth());

    // Si ya se pagaron todas las cuotas (o más), es 'paid'
    if (monthsPaid >= loan.totalInstallments) {
      return 'paid';
    }

    // Normalizar fechas para comparar solo día, mes y año
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const due = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());

    if (today > due) {
      return 'late';
    }
    return loan.status;
  }
}
