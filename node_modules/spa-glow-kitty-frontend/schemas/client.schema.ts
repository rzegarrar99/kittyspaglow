import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  dni: z.string().length(8, 'El DNI debe tener exactamente 8 dígitos').regex(/^\d+$/, 'El DNI solo debe contener números'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  email: z.string().email('Formato de correo inválido').optional().or(z.literal('')),
  status: z.enum(['VIP', 'Activo', 'Inactivo']).default('Activo')
});

export type ClientFormData = z.infer<typeof clientSchema>;

// MIGRACIÓN A FIREBASE:
// Este schema se usará tanto en el frontend (react-hook-form) como en el backend (Cloud Functions)
// para garantizar que los datos que entran a Firestore sean 100% íntegros.
