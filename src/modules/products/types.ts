import type { BaseRecord } from '@/lib/types';

export interface ProductRecord extends BaseRecord {
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export type ProductInput = Omit<ProductRecord, 'id' | 'createdAt' | 'updatedAt'>;
