import { z } from 'zod';
import { baseRecordSchema } from './base.schema';

export const productSchema = baseRecordSchema.extend({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  active: z.boolean().default(true),
});

export type ProductRecord = z.infer<typeof productSchema>;
