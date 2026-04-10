import { Loan, LoanStatus } from '../models/loan.model';
import { Payment } from '../models/payment.model';

export class LoanCalculator {
  
  static calculateTotalPaid(payments: Payment[]): number {
    return payments.reduce((acc, current) => acc + current.amount, 0);
  }

  static calculateRemainingBalance(loan: Loan, payments: Payment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    // Here we consider totalAmount as the total amount to be paid including interest, 
    // or as the principal amount. Based on standard fixed installment loans:
    // the total debt to be paid is totalInstallments * installmentValue
    const totalExpected = loan.totalInstallments * loan.installmentValue;
    return totalExpected - totalPaid;
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
    if (currentDate > nextDue) {
      return 'late';
    }

    return 'active';
  }
}
