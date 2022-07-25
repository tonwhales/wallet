import { Address } from 'ton';
import { storage } from './storage';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { AppConfig } from '../AppConfig';
import { getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto';
import { warn } from '../utils/log';
import { loadWalletKeys } from './walletKeys';
import { deriveUtilityKey } from './utilityKeys';

export type AppState = {
    addresses: {
        address: Address,
        publicKey: Buffer,
        secretKeyEnc: Buffer,
        utilityKey: Buffer
    }[],
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

function serializeAppState(state: AppState): t.TypeOf<typeof latestVersion> {
    return {
        version: 2,
        selected: state.selected,
        addresses: state.addresses.map((v) => ({
            address: v.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            publicKey: v.publicKey.toString('base64'),
            secretKeyEnc: v.secretKeyEnc.toString('base64'),
            utilityKey: v.utilityKey.toString('base64')
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
    } catch (e) {
        warn(e);
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

export async function doUpgrade() {
    // Read from store
    const state = storage.getString('app_state');
    if (!state) {
        return;
    }

    // Parse JSON from value
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch (e) {
        warn(e);
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
                    publicKey,
                    secretKeyEnc,
                    utilityKey
                };
            }))
        }
        setAppState(res);
        return;
    }
}

export function setAppState(state: AppState | null) {
    if (state) {
        const serialized = serializeAppState(state);
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
    } catch (e) {
        warn(e);
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
            publicKey: global.Buffer.from(v.publicKey, 'base64'),
            secretKeyEnc: global.Buffer.from(v.secretKeyEnc, 'base64'),
            utilityKey: global.Buffer.from(v.utilityKey, 'base64')
        }))
    };
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
    } catch (e) {
        warn(e);
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
    storage.set('backup_' + src.toFriendly({ testOnly: AppConfig.isTestnet }), true);
}

export function isAddressSecured(src: Address) {
    return storage.getBoolean('backup_' + src.toFriendly({ testOnly: AppConfig.isTestnet }));
}

export function markAsTermsAccepted() {
    storage.set('terms_accepted', true);
}

export function isTermsAccepted() {
    return storage.getBoolean('terms_accepted');
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