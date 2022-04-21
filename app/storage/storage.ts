import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV();
export const storageCache = new MMKV({ id: 'cache' });