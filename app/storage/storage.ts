import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV();
// export const storageCache = new MMKV({ id: 'cache' });
export const storagePersistence = new MMKV({ id: 'persistence' });
export const storageQuery = new MMKV({ id: 'react-query' });
export const sharedStoragePersistence = new MMKV({ id: 'sharedPersistence' });