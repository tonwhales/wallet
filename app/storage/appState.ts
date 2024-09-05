import { Address } from '@ton/core';
import { storage } from './storage';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { getSecureRandomBytes, keyPairFromSeed } from '@ton/crypto';
import { warn } from '../utils/log';
import { loadWalletKeys } from './walletKeys';
import { deriveUtilityKey } from './utilityKeys';
import { SelectedAccount, WalletVersions } from '../engine/types';

export type AppState = {
    addresses: SelectedAccount[],
    selected: number
}

const stateStorage_v1 = t.type({
    version: t.literal(1),
    addresses: t.array(t.type({
        address: t.string,
        publicKey: t.string,
        secretKeyEnc: t.string,
    })),
    selected: t.number
});

const stateStorage_v2 = t.type({
    version: t.literal(2),
    addresses: t.array(t.type({
        address: t.string,
        publicKey: t.string,
        secretKeyEnc: t.string,
        utilityKey: t.string,
        version: t.union([t.literal(WalletVersions.v4R2), t.literal(WalletVersions.v5R1), t.undefined])
    })),
    selected: t.number
});

const latestVersion = stateStorage_v2;

function parseAppState(src: any): t.TypeOf<typeof latestVersion> | null {
    const parsed = stateStorage_v2.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    if (stored.version === 2) {
        return stored;
    }
    return null;
}

function serializeAppState(state: AppState, isTestnet: boolean): t.TypeOf<typeof latestVersion> {
    return {
        version: 2,
        selected: state.selected,
        addresses: state.addresses.map((v) => ({
            address: v.address.toString({ testOnly: isTestnet }),
            publicKey: v.publicKey.toString('base64'),
            secretKeyEnc: v.secretKeyEnc.toString('base64'),
            utilityKey: v.utilityKey.toString('base64'),
            version: v.version
        }))
    };
}

export function canUpgradeAppState(): boolean {

    // Read from store
    const state = storage.getString('app_state');
    if (!state) {
        return false;
    }

    // Parse JSON from value
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch {
        warn('Failed to parse app state');
        return false;
    }

    // Already on latest version
    if (latestVersion.is(jstate)) {
        return false;
    }

    // Matches previous version
    if (stateStorage_v1.is(jstate)) {
        return true;
    }

    return false;
}

export async function doUpgrade(isTestnet: boolean) {
    // Read from store
    const state = storage.getString('app_state');
    if (!state) {
        return;
    }

    // Parse JSON from value
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch {
        return;
    }

    // Already on latest version
    if (latestVersion.is(jstate)) {
        return;
    }

    // Upgrade from v1
    if (stateStorage_v1.is(jstate)) {
        let res: AppState = {
            selected: jstate.selected,
            addresses: await Promise.all(jstate.addresses.map(async (a) => {
                let address = Address.parse(a.address);
                let publicKey = Buffer.from(a.publicKey, 'base64');
                let secretKeyEnc = Buffer.from(a.secretKeyEnc, 'base64');
                let wallet = await loadWalletKeys(secretKeyEnc);
                let utilityKey = await deriveUtilityKey(wallet.mnemonics);
                return {
                    address,
                    addressString: a.address,
                    publicKey,
                    secretKeyEnc,
                    utilityKey,
                    version: WalletVersions.v4R2
                };
            }))
        }
        setAppState(res, isTestnet);
        return;
    }
}

export function setAppState(state: AppState | null, isTestnet: boolean) {
    if (state) {
        const serialized = serializeAppState(state, isTestnet);
        storage.set('app_state', JSON.stringify(serialized));
    } else {
        storage.delete('app_state');
    }
}

export function getAppState(): AppState {

    // Deserialize state
    const state = storage.getString('app_state');
    if (!state) {
        return { addresses: [], selected: -1 };
    }
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch {
        warn('Failed to parse app state');
        return { addresses: [], selected: -1 };
    }
    const parsed = parseAppState(jstate);
    if (!parsed) {
        return { addresses: [], selected: -1 };
    }

    // Check if empty
    if (parsed.addresses.length === 0) {
        return { addresses: [], selected: -1 };
    }

    // Fix is cursor became invalid
    let selected = parsed.selected;
    if (selected < 0 || selected >= parsed.addresses.length) {
        selected = 0;
    }

    return {
        selected,
        addresses: parsed.addresses.map((v) => ({
            address: Address.parseFriendly(v.address).address,
            addressString: v.address,
            publicKey: global.Buffer.from(v.publicKey, 'base64'),
            secretKeyEnc: global.Buffer.from(v.secretKeyEnc, 'base64'),
            utilityKey: global.Buffer.from(v.utilityKey, 'base64'),
            version: v.version || WalletVersions.v4R2
        }))
    };
}

export function getCurrentAddressNullable() {
    const state = getAppState();
    if (state.selected < 0) {
        return null;
    }
    return state.addresses[state.selected];
}

export function getCurrentAddress() {
    const state = getAppState();
    if (state.selected < 0) {
        throw Error('No active addresses');
    }
    return state.addresses[state.selected];
}

export function getBackup(): { address: Address, secretKeyEnc: Buffer } {
    // Read from store
    const state = storage.getString('app_state');
    if (!state) {
        throw Error('No keys');
    }

    // Parse JSON from value
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch {
        warn('Failed to parse app state');
        throw Error('No keys');
    }


    // Storages
    if (stateStorage_v1.is(jstate) || stateStorage_v2.is(jstate)) {
        let addr = jstate.addresses[jstate.addresses.length - 1];
        return { address: Address.parse(addr.address), secretKeyEnc: Buffer.from(addr.secretKeyEnc, 'base64') };
    }

    throw Error('No keys');
}

export function markAddressSecured(src: Address) {
    storage.set('backup_' + src.toString({ testOnly: true }), true);
    storage.set('backup_' + src.toString({ testOnly: false }), true);
}

export function isAddressSecured(src: Address, isTestnet: boolean) {
    return storage.getBoolean('backup_' + src.toString({ testOnly: isTestnet }));
}

export async function getAppKey() {
    let uid = storage.getString('app_key');
    if (!uid) {
        uid = (await getSecureRandomBytes(64)).toString('base64');
        storage.set('app_key', uid);
        return uid;
    }
    return uid;
}

export async function getAppInstanceKeyPair() {
    let key = storage.getString('app_instance_key');
    if (!key) {
        let seed = await getSecureRandomBytes(32);
        let keypair = keyPairFromSeed(seed);
        storage.set('app_instance_key', seed.toString('base64'));
        return keypair;
    }
    let seed = Buffer.from(key, 'base64');
    let keypair = keyPairFromSeed(seed);
    return keypair;
}

//
// Connection References
//

export function getConnectionReferences(): { key: string, name: string, url: string, date: number }[] {
    let key = storage.getString('app_references');
    if (key) {
        return JSON.parse(key);
    }
    return [];
}

export function addConnectionReference(key: string, name: string, url: string, date: number) {
    let refs = getConnectionReferences();
    if (refs.find((v) => v.key === key)) {
        return;
    }
    refs = [...refs, { key, name, url, date }];
    storage.set('app_references', JSON.stringify(refs));
}

export function removeConnectionReference(key: string) {
    let refs = getConnectionReferences();
    if (!refs.find((v) => v.key === key)) {
        return;
    }
    storage.set('app_references', JSON.stringify(refs.filter((v) => v.key !== key)));
}

export function getPendingGrant() {
    let pendingGrantRaw = storage.getString('app_references_grant');
    let pendingGrant: string[] = [];
    if (pendingGrantRaw) {
        pendingGrant = JSON.parse(pendingGrantRaw);
    }
    return pendingGrant;
}

export function addPendingGrant(key: string) {
    let pendingGrant: string[] = getPendingGrant();
    if (pendingGrant.find((v) => v === key)) {
        return;
    }
    pendingGrant.push(key);
    storage.set('app_references_grant', JSON.stringify(pendingGrant));
}

export function removePendingGrant(key: string) {
    let pendingGrant: string[] = getPendingGrant();
    if (!pendingGrant.find((v) => v === key)) {
        return;
    }
    storage.set('app_references_grant', JSON.stringify(pendingGrant.filter((v) => v !== key)));
}

export function getPendingRevoke() {
    let pendingGrantRaw = storage.getString('app_references_revoke');
    let pendingGrant: string[] = [];
    if (pendingGrantRaw) {
        pendingGrant = JSON.parse(pendingGrantRaw);
    }
    return pendingGrant;
}

export function addPendingRevoke(key: string) {
    let pendingGrant: string[] = getPendingRevoke();
    if (pendingGrant.find((v) => v === key)) {
        return;
    }
    pendingGrant.push(key);
    storage.set('app_references_revoke', JSON.stringify(pendingGrant));
}

export function removePendingRevoke(key: string) {
    let pendingGrant: string[] = getPendingRevoke();
    if (!pendingGrant.find((v) => v === key)) {
        return;
    }
    storage.set('app_references_revoke', JSON.stringify(pendingGrant.filter((v) => v !== key)));
}

//
// Ledger
//

export function getLedgerEnabled() {
    let ledgerEnabled = storage.getBoolean('app_ledger_enabled') || false;
    return ledgerEnabled;
}

export function setLedgerEnabled(enabled: boolean) {
    storage.set('app_ledger_enabled', enabled);
}