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

function mergeSetArrays(src: Address[] | null, dst: Address[] | null) {
    let added = new Set<string>();
    let res: Address[] = [];
    if (src) {
        for (let s of src) {
            let f = s.toFriendly();
            if (!added.has(f)) {
                added.add(f);
                res.push(s);
            }
        }
    }
    if (dst) {
        for (let s of dst) {
            let f = s.toFriendly();
            if (!added.has(f)) {
                added.add(f);
                res.push(s);
            }
        }
    }
    return res;
}

export function registerKnownJettonMaster(engine: Engine, master: Address) {
    let itm = engine.persistence.knownJettons.item();
    itm.update((src) => addToSetArray(src, master));
}

export function registerKnownJettonWallet(engine: Engine, owner: Address, wallet: Address) {
    let itm = engine.persistence.knownAccountJettons.item(owner);
    itm.update((src) => addToSetArray(src, wallet));
}

export function requestHintsIfNeeded(address: Address, seqno: number | null, engine: Engine) {

    // Register hint request
    if (seqno !== null) {
        engine.persistence.hintRequest.item(address).update((src) => Math.max(src || 0, seqno));
    }

    // Register account hint
    engine.persistence.accountHints.item(engine.address).update((src) => addToSetArray(src, address));
}

export function requestAllHintsIfNeeded(addresses: Address[], engine: Engine) {

    // Register account hints
    engine.persistence.accountHints.item(engine.address).update((src) => mergeSetArrays(src, addresses));

    // state.update((s) => {
    //     if (s) {

    //         // Result array
    //         let res = [...s];

    //         // Existing
    //         let ex = new Set<string>();
    //         for (let a of s) {
    //             ex.add(a.toFriendly({ testOnly: AppConfig.isTestnet }));
    //         }

    //         // New
    //         for (let m of hints) {
    //             if (!ex.has(m.toFriendly({ testOnly: AppConfig.isTestnet }))) {
    //                 res.push(m);
    //                 log('[hints]: ' + m.toFriendly({ testOnly: AppConfig.isTestnet }));
    //             }
    //         }

    //         return res;
    //     } else {
    //         return hints;
    //     }
    // });


    // // Register hint request
    // if (seqno !== null) {
    //     engine.persistence.hintRequest.item(address).update((src) => Math.max(src || 0, seqno));
    // }

    // // Register account hint
    // engine.persistence.accountHints.item(engine.address).update((src) => addToSetArray(src, address));
}