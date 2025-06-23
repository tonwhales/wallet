import { loadWalletKeys, WalletKeys } from '../storage/walletKeys';
import { SelectedAccount } from '../engine/types';
import { getCurrentAddress } from '../storage/appState';

export async function loadWalletKeysWithDelay(
    secretKeyEnc: Buffer,
    passcode: string,
): Promise<WalletKeys> {
    // We add minimum delay to show 1 circle of the loader
    const delay = new Promise(resolve => setTimeout(resolve, 700));
    const results = await Promise.allSettled([delay, loadWalletKeys(secretKeyEnc, passcode)]);

    const loadKeysResult = results[1];
    if (loadKeysResult.status === 'rejected') {
        throw loadKeysResult.reason;
    }
    
    return loadKeysResult.value;
}

export async function loadCurrentWalletKeysWithDelay(
    passcode: string,
    selectedAccount?: SelectedAccount
): Promise<WalletKeys> {
    const acc = selectedAccount ?? getCurrentAddress();
    return loadWalletKeysWithDelay(acc.secretKeyEnc, passcode);
} 