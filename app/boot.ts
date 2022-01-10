import { contractFromPublicKey } from "./utils/contractFromPublicKey";
import { setAppState, storage } from "./utils/storage";
import { loadWalletKeys } from "./utils/walletKeys";

export async function boot() {
    const state = storage.getString('app_state');
    if (state) {
        let parsed = JSON.parse(state);
        if (!parsed.publicKey) {
            let keys = await loadWalletKeys();
            let contract = await contractFromPublicKey(keys.keyPair.publicKey);
            setAppState({
                address: contract.address,
                publicKey: keys.keyPair.publicKey
            });
        }
    }
}