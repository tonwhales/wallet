import { MMKV } from 'react-native-mmkv'
import { Address } from 'ton';
export const storage = new MMKV();

type AppState = {
    address: Address,
    // publicKey: Buffer
}

export function setAppState(state: AppState | null) {
    if (state) {
        storage.set('app_state', JSON.stringify({
            address: state.address.toFriendly(),
            // publicKey: state.publicKey.toString('base64')
        }));
    }
}

export function getAppState(): AppState | null {
    const state = storage.getString('app_state');
    if (!state) {
        return null;
    }
    let jState = JSON.parse(state);
    return {
        address: Address.parseFriendly(jState.address).address,
        // publicKey: global.Buffer.from(jState.publicKey, 'base64')
    };
}