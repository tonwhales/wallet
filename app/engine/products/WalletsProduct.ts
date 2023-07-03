import { useRecoilValue } from "recoil";
import { Engine } from "../Engine";
import { Address } from "ton";
import { WalletV4State } from "../sync/startWalletV4Sync";

export class WalletsProduct {
    engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    useWallet(address: Address): WalletV4State | null {
        return useRecoilValue(this.engine.persistence.wallets.item(address).atom);
    }
}