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

export function registerKnownJettonMaster(engine: Engine, master: Address) {
    let itm = engine.persistence.knownJettons.item();
    itm.update((src) => addToSetArray(src, master));
}

export function registerKnownJettonWallet(engine: Engine, owner: Address, wallet: Address) {
    let itm = engine.persistence.knownAccountJettons.item(owner);
    itm.update((src) => addToSetArray(src, wallet));
}