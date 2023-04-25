import { Address } from "ton";
import { Engine } from "../Engine";

function addToSetArray(src: Address[] | null, value: Address) {
    if (!src) {
        return [value];
    }
    if (src.find((v) => v.equals(value))) {
        return src;
    } else {
        return [...src, value];
    }
}

function removeFromSetArray(src: Address[] | null, value: Address) {
    if (!src) {
        return [];
    }
    const index = src.findIndex((v) => v.equals(value));
    if (index !== -1) {
        const res = src;
        res.splice(index, 1);
        return res;
    } else {
        return src;
    }
}

function mergeSetArrays(src: Address[] | null, dst: Address[]) {

    // Return destination if no source
    if (!src) {
        return { added: dst, res: dst };
    }

    let added = new Set<string>();
    let res: Address[] = [];

    for (let s of src) {
        let f = s.toFriendly();
        if (!added.has(f)) {
            added.add(f);
            res.push(s);
        }
    }
    let addedAddresses: Address[] = [];
    for (let s of dst) {
        let f = s.toFriendly();
        if (!added.has(f)) {
            added.add(f);
            res.push(s);
            addedAddresses.push(s);
        }
    }
    return { added: addedAddresses, res: addedAddresses.length === 0 ? src : res };
}

export function registerKnownJettonMaster(engine: Engine, master: Address) {
    let itm = engine.persistence.knownJettons.item();
    itm.update((src) => addToSetArray(src, master));
}

export function registerKnownJettonWallet(engine: Engine, owner: Address, wallet: Address) {
    let itm = engine.persistence.knownAccountJettons.item(owner);
    itm.update((src) => addToSetArray(src, wallet));
}

export function markJettonDisabled(engine: Engine, master: Address) {
    let itm = engine.cloud.get<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });
    itm.update((src) => src.disabled[master.toFriendly({ testOnly: engine.isTestnet })] = { reason: 'disabled' });
}

export function markJettonActive(engine: Engine, master: Address) {
    let itm = engine.cloud.get<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });
    itm.update((src) => delete src.disabled[master.toFriendly({ testOnly: engine.isTestnet })]);
}

export function requestHintsIfNeeded(address: Address, seqno: number | null, engine: Engine) {

    // Register hint request
    if (seqno !== null) {
        engine.persistence.hintRequest.item(address).update((src) => Math.max(src || 0, seqno));
    }

    // Register account hint
    engine.persistence.accountHints.item(engine.address).update((src) => addToSetArray(src, address));
}

export function requestAllHintsIfNeeded(addresses: Address[], seqno: number | null, engine: Engine) {

    // Ignore on empty input
    if (addresses.length === 0) {
        return;
    }

    // Request seqno update
    if (seqno !== null) {
        for (let a of addresses) {
            engine.persistence.hintRequest.item(a).update((src) => Math.max(src || 0, seqno));
        }
    }

    // Register account hints
    let merged = mergeSetArrays(engine.persistence.accountHints.item(engine.address).value, addresses);
    if (merged.added.length > 0) {
        engine.persistence.accountHints.item(engine.address).update((src) => merged.res);
    }
}