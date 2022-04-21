import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV();
export function passcodeStorage(passcode: string) {
    return new MMKV(
        {
            id: passcode,
            encryptionKey: passcode
        }
    );
}
export const storageCache = new MMKV({ id: 'cache' });