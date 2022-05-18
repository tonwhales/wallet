import { RecoilValueReadOnly, selector } from "recoil";
import { AppConfig } from "../AppConfig";
import { WalletV4State } from "./sync/WalletV4Sync";
import { Engine } from "./Engine";

export class Selectors {

    readonly engine: Engine;
    readonly home: RecoilValueReadOnly<{
        wallet: WalletV4State
    } | null>;

    constructor(engine: Engine) {
        this.engine = engine;
        this.home = selector({
            key: 'selector/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/account',
            get: ({ get }) => {
                let wallet = get(engine.model.wallet(engine.address).atom);
                if (!wallet) {
                    return null;
                }
                return { wallet };
            }
        });
    }
}