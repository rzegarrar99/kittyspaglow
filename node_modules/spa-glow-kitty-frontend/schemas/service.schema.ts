import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  category: z.string().min(1, 'Debe seleccionar una categoría'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  duration: z.number().min(1, 'La duración debe ser al menos 1 minuto')
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
