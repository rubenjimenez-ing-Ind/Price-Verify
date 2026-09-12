export interface CollectionMeta {
  version: number;
  lastModified: string;
  description: string;
}

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionFile<T extends BaseRecord = BaseRecord> {
  _meta: CollectionMeta;
  records: T[];
}

export type CreateInput<T extends BaseRecord> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T extends BaseRecord> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
