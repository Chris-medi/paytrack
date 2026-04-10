import { z } from 'zod';

export const loanSchema = z.object({
  borrowerName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  borrowerDocument: z.string().min(5, { message: "El documento debe tener al menos 5 caracteres" }),
  totalAmount: z.number().positive({ message: "El monto debe ser positivo" }),
  monthlyInterest: z.number().min(0, { message: "El interés mensual no puede ser negativo" }),
  totalInstallments: z.number().positive({ message: "Las cuotas deben ser un número positivo" }),
  installmentValue: z.number().positive({ message: "El valor de la cuota debe ser positivo" }),
  startDate: z.date({ message: "La fecha de inicio es requerida" }),
  firstDueDate: z.date({ message: "La primera fecha de pago es requerida" }),
});

export type LoanFormData = z.infer<typeof loanSchema>;
