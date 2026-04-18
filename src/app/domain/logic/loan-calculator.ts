import { Loan, LoanStatus } from '../models/loan.model';
import { Payment } from '../models/payment.model';

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
}

export class LoanCalculator {

  static calculateTotalPaid(payments: Payment[]): number {
    return Number(payments.reduce((acc, current) => acc + current.amount, 0).toFixed(2));
  }

  /**
   * Total de interés pagado en todos los pagos.
   */
  static calculateTotalInterestPaid(payments: Payment[]): number {
    return Number(payments.reduce((acc, p) => acc + (p.interestAmount || 0), 0).toFixed(2));
  }

  /**
   * Total de capital pagado (abono a principal) en todos los pagos.
   */
  static calculateTotalCapitalPaid(payments: Payment[]): number {
    return Number(payments.reduce((acc, p) => {
      const cap = p.capitalAmount !== undefined && p.capitalAmount !== null ? p.capitalAmount : p.amount;
      return acc + cap;
    }, 0).toFixed(2));
  }

  static calculateRemainingBalance(loan: Loan, payments: Payment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    // the total debt to be paid is totalInstallments * installmentValue
    const totalExpected = loan.totalInstallments * loan.installmentValue;
    return Number((totalExpected - totalPaid).toFixed(2));
  }

  /**
   * Saldo de capital pendiente (principal restante).
   */
  static calculateRemainingCapital(loan: Loan, payments: Payment[]): number {
    const principalAmount = loan.principalAmount || loan.totalAmount;
    const capitalPaid = this.calculateTotalCapitalPaid(payments);
    return Number((principalAmount - capitalPaid).toFixed(2));
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
   * Calcula el interés mensual fijo basado en el capital original.
   * Interés simple: principal × tasa_mensual / 100
   */
  static calculateMonthlyInterestAmount(loan: Loan): number {
    const principalAmount = loan.principalAmount || loan.totalAmount;
    return Number((principalAmount * (loan.monthlyInterest / 100)).toFixed(2));
  }

  /**
   * Calcula la porción de capital por cuota.
   * Capital por cuota = capital_original / total_cuotas
   */
  static calculateMonthlyCapitalAmount(loan: Loan): number {
    const principalAmount = loan.principalAmount || loan.totalAmount;
    return Number((principalAmount / loan.totalInstallments).toFixed(2));
  }

  /**
   * Genera el cronograma completo de cuotas del préstamo.
   * Cada cuota tiene su fecha, monto de interés y monto de capital previstos.
   */
  static generateInstallmentSchedule(loan: Loan, payments: Payment[]): ScheduledInstallment[] {
    const schedule: ScheduledInstallment[] = [];
    const monthlyInterest = this.calculateMonthlyInterestAmount(loan);
    const monthlyCapital = this.calculateMonthlyCapitalAmount(loan);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let interestPool = this.calculateTotalInterestPaid(payments);
    let capitalPool = this.calculateTotalCapitalPaid(payments);

    for (let i = 0; i < loan.totalInstallments; i++) {
      const dueDate = new Date(loan.firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let applyInt = Math.min(interestPool, monthlyInterest);
      let applyCap = Math.min(capitalPool, monthlyCapital);

      // Si es la última cuota, puede absorber el sobrante de capital por redondeos
      if (i === loan.totalInstallments - 1 && capitalPool > applyCap) {
         applyCap = capitalPool;
      }

      applyInt = Number(applyInt.toFixed(2));
      applyCap = Number(applyCap.toFixed(2));

      const installment: ScheduledInstallment = {
        number: i + 1,
        dueDate,
        interestDue: monthlyInterest,
        capitalDue: monthlyCapital,
        totalDue: Number((monthlyInterest + monthlyCapital).toFixed(2)),
        interestPaid: applyInt,
        capitalPaid: applyCap,
        status: 'pending'
      };

      interestPool -= applyInt;
      capitalPool -= applyCap;

      // Determinar estado
      const totalPaidThisInstallment = installment.interestPaid + installment.capitalPaid;
      const dueDateNorm = new Date(dueDate);
      dueDateNorm.setHours(0, 0, 0, 0);

      if (totalPaidThisInstallment >= installment.totalDue - 0.01) {
        installment.status = 'paid';
      } else if (totalPaidThisInstallment > 0.01) {
        installment.status = 'partial';
      } else if (today > dueDateNorm) {
        installment.status = 'overdue';
      } else {
        installment.status = 'pending';
      }

      schedule.push(installment);
    }

    return schedule;
  }

  /**
   * Agrupa el cronograma de cuotas por año.
   */
  static groupScheduleByYear(schedule: ScheduledInstallment[]): Map<number, ScheduledInstallment[]> {
    const grouped = new Map<number, ScheduledInstallment[]>();
    for (const installment of schedule) {
      const year = new Date(installment.dueDate).getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(installment);
    }
    return grouped;
  }

  /**
   * Obtiene los años disponibles en el cronograma.
   */
  static getScheduleYears(schedule: ScheduledInstallment[]): number[] {
    const years = new Set<number>();
    for (const inst of schedule) {
      years.add(new Date(inst.dueDate).getFullYear());
    }
    return Array.from(years).sort();
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
