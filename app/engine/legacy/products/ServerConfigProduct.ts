import { selectorFamily, useRecoilValue } from "recoil";
import { Engine } from "../Engine";

export class ServerConfigProduct {
    readonly engine: Engine;
    readonly selector;
    constructor(engine: Engine) {
        this.engine = engine;
        this.selector = selectorFamily<boolean, string>({
            key: 'server-config',
            get: (address) => ({ get }) => {
                const spamWallets = get(this.engine.persistence.serverConfig.item().atom)
                    ?.wallets
                    .spam;
    
                const res = spamWallets?.findIndex((addr) => addr === address) != -1;
    
                return res;
            }
        });
    }

    useServerConfig() {
        return useRecoilValue(this.engine.persistence.serverConfig.item().atom);
    }

    useIsSpamWallet(address: string) {
        return useRecoilValue(this.selector(address));
    }
}