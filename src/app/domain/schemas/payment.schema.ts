import { z } from 'zod';

export const paymentSchema = z.object({
  amount: z.number().positive({ message: "El abono debe ser mayor a 0" }),
  date: z.date({ message: "La fecha del abono es requerida" }),
  note: z.string().optional(),
  receiptUrl: z.string().url({ message: "La URL del comprobante no es válida" }).optional().or(z.literal(''))
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
