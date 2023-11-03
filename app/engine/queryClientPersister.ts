import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { storageQuery } from '../storage/storage';

const clientStorage = {
  setItem: (key: string, value: string) => {
    storageQuery.set(key, value);
  },
  getItem: (key: string) => {
    const value = storageQuery.getString(key);
    return value === undefined ? null : value;
  },
  removeItem: (key: string) => {
    storageQuery.delete(key);
  },
};

export const clientPersister = createSyncStoragePersister({ storage: clientStorage });