import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV();
export const cacheMainnet = new MMKV({ id: 'cache-mainnet' });
export const cacheTestnet = new MMKV({ id: 'cache-testnet' });