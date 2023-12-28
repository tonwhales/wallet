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

(BigInt.prototype as any).toJSON = function () {
  return 'bn=' + this.toString();
};

export const clientPersister = createSyncStoragePersister({ 
  storage: clientStorage,
  deserialize: (cachedString) => {
    let restored = JSON.parse(cachedString, (key, value) => {
      if (typeof value === 'string' && value.startsWith('bn=')) {
        let numericPart = value.slice(3);
        return BigInt(numericPart);
      }
      return value;
    });

    return restored;
  },
  retry: (e) => {
    console.error('Persist retry', e);
    return e.persistedClient;
  }
});