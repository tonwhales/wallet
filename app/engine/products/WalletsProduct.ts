import { selectorFamily, useRecoilValue } from "recoil";
import { Engine } from "../Engine";
import { Address } from "ton";
import { WalletV4State } from "../sync/startWalletV4Sync";
import { warn } from "../../utils/log";

export class WalletsProduct {
    engine: Engine;
    #walletSelector;

    constructor(engine: Engine) {
        this.engine = engine;
        this.#walletSelector = selectorFamily<WalletV4State | null, string>({
            key: 'settings/spam/deny-list',
            get: (addr) => ({ get }) => {
                let state = null;
                try {
                    const address = Address.parse(addr);
                    state = get(this.engine.persistence.wallets.item(address).atom);
                } catch (e) {
                    warn(`Failed to parse address: ${addr}`);
                }
                return state;
            }
        });
    }

    // Getting WalletV4State by address
    useWallet(address: Address) {
        return useRecoilValue(this.#walletSelector(address.toFriendly({ testOnly: this.engine.isTestnet })));
    }
}