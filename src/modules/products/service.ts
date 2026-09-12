import { create, getAll } from '@/lib/json-db';
import type { ProductInput, ProductRecord } from './types';

export const PRODUCTS_COLLECTION = 'products';

export async function getProducts(): Promise<ProductRecord[]> {
  return getAll<ProductRecord>(PRODUCTS_COLLECTION);
}

export async function addProduct(input: ProductInput): Promise<ProductRecord> {
  return create<ProductRecord>(PRODUCTS_COLLECTION, input);
}
