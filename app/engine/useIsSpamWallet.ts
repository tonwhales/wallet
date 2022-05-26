import { selectorFamily, useRecoilValue } from "recoil";
import { Engine } from "./Engine";

export function useIsSpamWallet(engine: Engine, address: string) {
    const selector = selectorFamily<boolean, string>({
        key: 'server-config',
        get: (address) => ({ get }) => {
            const spamWallets = get(engine.persistence.serverConfig.item().atom)
                ?.wallets
                .spam;

            const res = spamWallets?.findIndex((addr) => addr === address) != -1;

            return res;
        }
    });

    return useRecoilValue(selector(address));
}