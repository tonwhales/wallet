import { Engine } from "../Engine";
import Transport from "@ledgerhq/hw-transport";
import { Address } from "ton";
import { useRecoilValue } from "recoil";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };

export class LedgerProduct {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    useLedgerWallet(address?: Address) {
        if (!address) {
            return null;
        }
        return useRecoilValue(this.engine.persistence.wallets.item(address).atom);
    }
}