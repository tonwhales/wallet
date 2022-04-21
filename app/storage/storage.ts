import { MMKV } from 'react-native-mmkv'
import { TOKEN_KEY } from './secureStorage';

export const storage = new MMKV();
export function passcodeStorage(passcode: string) {
    return new MMKV(
        {
            id: TOKEN_KEY,
            encryptionKey: passcode
        }
    );
}
export const storageCache = new MMKV({ id: 'cache' });