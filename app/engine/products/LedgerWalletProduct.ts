import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import * as FileSystem from 'expo-file-system';
import { t } from "../../i18n/t";
import { JettonsState } from "./WalletProduct";
import { LiteAccount } from "../sync/startAccountLiteSync";

export class LedgerWalletProduct {

    readonly engine: Engine;
    readonly address: Address;

    // State
    #atom: RecoilValueReadOnly<LiteAccount | null>;
    #jettons: RecoilValueReadOnly<JettonsState>;

    constructor(engine: Engine, address: Address) {
        this.engine = engine;
        this.address = address;
        this.#atom = engine.persistence.liteAccounts.item(address).atom;
        this.#jettons = selector({
            key: 'wallet/' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/jettons',
            get: ({ get }) => {

                // Load known jettons
                let knownJettons = get(engine.persistence.knownAccountJettons.item(address).atom) || [];

                // Load disabled jeetons
                let disabledJettons = get(engine.persistence.disabledJettons.item(address).atom) || [];

                // Load wallets
                let jettonWallets: { wallet: Address, master: Address, balance: BN }[] = [];
                for (let w of knownJettons) {
                    let jw = get(engine.persistence.jettonWallets.item(w).atom);
                    if (jw && jw.master) {
                        jettonWallets.push({ wallet: w, balance: jw.balance, master: jw.master });
                    }
                }

                // Load masters
                let jettonWalletsWithMasters: {
                    wallet: Address,
                    master: Address,
                    balance: BN,
                    name: string,
                    symbol: string,
                    description: string,
                    icon: string | null,
                    decimals: number | null,
                    disabled?: boolean
                }[] = [];
                for (let w of jettonWallets) {
                    let jm = get(engine.persistence.jettonMasters.item(w.master).atom);

                    if (jm && !jm.description) {
                        jm.description = `$${jm.symbol} ${t('jetton.token')}`;
                    }

                    if (jm && jm.name && jm.symbol && jm.description) {

                        // Image path
                        let icon: string | null = null;
                        if (jm.image) {
                            let downloaded;
                            if (typeof jm.image === 'string') {
                                downloaded = get(engine.persistence.downloads.item(jm.image).atom);
                            } else {
                                downloaded = get(engine.persistence.downloads.item(jm.image.preview256).atom);
                            }
                            if (downloaded) {
                                icon = FileSystem.cacheDirectory + downloaded;
                            }
                        }

                        const disabled = !!disabledJettons.find((m) => m.equals(w.master));

                        jettonWalletsWithMasters.push({
                            ...w,
                            name: jm.name,
                            symbol: jm.symbol,
                            description: jm.description,
                            icon,
                            decimals: jm.decimals,
                            disabled
                        });
                    }
                }

                return { jettons: jettonWalletsWithMasters }
            },
            dangerouslyAllowMutability: true
        });
    }

    useAccount() {
        return useRecoilValue(this.#atom);
    }

    useJettons() {
        return useRecoilValue(this.#jettons).jettons;
    }
}