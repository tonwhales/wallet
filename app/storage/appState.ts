import { Address } from 'ton';
import { storage } from './storage';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';

export type AppState = {
    address: Address,
    publicKey: Buffer,
    testnet: boolean,
    backupCompleted: boolean
}

const stateStorage = t.union([
    t.type({
        version: t.undefined,
        address: t.string,
        publicKey: t.string
    }),
    t.type({
        version: t.literal(1),
        address: t.string,
        publicKey: t.string,
        testnet: t.boolean,
        backupCompleted: t.boolean
    })
]);

const latestState = t.type({
    version: t.literal(1),
    address: t.string,
    publicKey: t.string,
    testnet: t.boolean,
    backupCompleted: t.boolean
});

function parseAppState(src: any): t.TypeOf<typeof latestState> | null {
    const parsed = stateStorage.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    if (stored.version === undefined) {
        return {
            version: 1,
            address: stored.address,
            publicKey: stored.publicKey,
            testnet: false,
            backupCompleted: false
        };
    }
    if (stored.version === 1) {
        return stored;
    }

    return null;
}

function serializeAppState(state: AppState): t.TypeOf<typeof latestState> {
    return {
        version: 1,
        address: state.address.toFriendly(),
        publicKey: state.publicKey.toString('base64'),
        testnet: state.testnet,
        backupCompleted: state.backupCompleted
    };
}

export function setAppState(state: AppState | null) {
    if (state) {
        const serialized = serializeAppState(state);
        storage.set('app_state', JSON.stringify(serialized));
    } else {
        storage.delete('app_state');
    }
}

export function getAppState(): AppState | null {
    const state = storage.getString('app_state');
    if (!state) {
        return null;
    }
    let jstate: any = null;
    try {
        jstate = JSON.parse(state);
    } catch (e) {
        console.warn(e);
        return null;
    }
    const parsed = parseAppState(jstate);
    if (!parsed) {
        return null;
    }
    return {
        address: Address.parseFriendly(parsed.address).address,
        publicKey: global.Buffer.from(parsed.publicKey, 'base64'),
        testnet: parsed.testnet,
        backupCompleted: parsed.backupCompleted
    };
}