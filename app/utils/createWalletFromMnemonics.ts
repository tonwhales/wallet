import { mnemonicToWalletKey } from '@ton/crypto';
import { contractFromPublicKey } from '../engine/contractFromPublicKey';
import { deriveUtilityKey } from '../storage/utilityKeys';
import { encryptData, PasscodeState, getPasscodeState, BiometricsState, getBiometricsState } from '../storage/secureStorage';
import { SelectedAccount, WalletVersions } from '../engine/types';

/**
 * Create a wallet account from mnemonics
 * This function encrypts the mnemonics and creates the necessary account data
 * 
 * @param mnemonics - Array of mnemonic words
 * @param isTestnet - Whether this is for testnet
 * @param version - Wallet version to use
 * @param passcode - Optional passcode for encryption (uses biometrics if not provided)
 * @returns SelectedAccount ready to be added to app state
 */
export async function createWalletFromMnemonics(
    mnemonics: string[],
    isTestnet: boolean,
    version: WalletVersions = WalletVersions.v5R1,
    passcode?: string
): Promise<SelectedAccount> {
    // Resolve key from mnemonics
    const key = await mnemonicToWalletKey(mnemonics);

    // Resolve utility key
    const utilityKey = await deriveUtilityKey(mnemonics);

    // Encrypt mnemonics
    const mnemonicsString = mnemonics.join(' ');
    let secretKeyEnc: Buffer;

    const passcodeState = getPasscodeState();
    const biometricsState = getBiometricsState();
    const useBiometrics = biometricsState === BiometricsState.InUse;

    if (passcode) {
        // Encrypt with provided passcode
        secretKeyEnc = await encryptData(Buffer.from(mnemonicsString), passcode);
    } else if (useBiometrics) {
        // Encrypt with biometrics
        secretKeyEnc = await encryptData(Buffer.from(mnemonicsString));
    } else if (passcodeState === PasscodeState.Set) {
        // This case requires passcode but none was provided
        throw new Error('Passcode required for encryption');
    } else {
        throw new Error('No encryption method available');
    }

    // Resolve contract
    const contract = await contractFromPublicKey(key.publicKey, version, isTestnet);

    return {
        address: contract.address,
        publicKey: key.publicKey,
        secretKeyEnc,
        utilityKey,
        addressString: contract.address.toString({ testOnly: isTestnet }),
        version,
    };
}

