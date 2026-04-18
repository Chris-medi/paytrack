import { z } from 'zod';

export const paymentSchema = z.object({
  interestAmount: z.number().min(0, { message: "El interés no puede ser negativo" }),
  capitalAmount: z.number().min(0, { message: "El capital no puede ser negativo" }),
  date: z.date({ message: "La fecha del abono es requerida" }),
  note: z.string().optional(),
  receiptUrl: z.string().url({ message: "La URL del comprobante no es válida" }).optional().or(z.literal(''))
}).refine(data => data.interestAmount + data.capitalAmount > 0, {
  message: "Debe pagar al menos interés o capital",
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
