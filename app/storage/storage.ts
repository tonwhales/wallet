import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV();
export const storageMainnet = new MMKV({ id: 'cache-mainnet' });
export const storageTestnet = new MMKV({ id: 'cache-testnet' });