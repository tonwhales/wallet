import BN from "bn.js";
import { selector, useRecoilValue } from "recoil";
import { AsyncLock } from "teslabot";
import { AppConfig } from "../../AppConfig";
import { fetchAccountState } from "../api/zenpay/fetchAccountState";
import { fetchAccountToken } from "../api/zenpay/fetchAccountToken";
import { fetchCardList } from "../api/zenpay/fetchCardList";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";
import { watchZenPayAccountUpdates } from "./watchZenPayAccountUpdates";

// export const zenPayEndpoint = AppConfig.isTestnet ? 'card-staging.whales-api.com' : 'card.whales-api.com';
export const zenPayEndpoint = 'card-staging.whales-api.com';

export type ZenPayAccountStatus =
    | {
        state: 'need-enrolment'
    }
    | {
        state: 'need-phone'
        token: string
    }
    | {
        state: 'need-kyc'
        token: string
    }
    | {
        state: 'ready'
        token: string
    }

export type ZenPayCard = {
    id: string,
    address: string,
    state: string,
    balance: BN,
    type: 'virtual' | 'physical',
    card: {
        lastFourDigits: string | null | undefined,
    }
};

export type ZenPayState = {
    accounts: ZenPayCard[],
};

export class ZenPayProduct {
    readonly engine: Engine;
    readonly #status;
    readonly #accountsState;
    readonly #lock = new AsyncLock();
    watcher: null | (() => void) = null;

    constructor(engine: Engine) {
        this.engine = engine;
        this.#status = selector<ZenPayAccountStatus>({
            key: 'zenpay/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/status',
            get: ({ get }) => {
                // Check status
                let status: ZenPayAccountStatus = get(this.engine.persistence.zenPayStatus.item(engine.address).atom) || { state: 'need-enrolment' };

                return status;
            }
        });
        this.#accountsState = selector<ZenPayState>({
            key: 'zenpay/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/state',
            get: ({ get }) => {
                // Get state
                let state: ZenPayState = get(this.engine.persistence.zenPayState.item(engine.address).atom) || { accounts: [] };
                return state;
            }
        })
    }

    async enroll(domain: string) {
        let res = await (async () => {
            //
            // Create domain key if needed
            //

            let created = await this.engine.products.keys.createDomainKeyIfNeeded(domain);
            if (!created) {
                return false;
            }

            // 
            // Check zenpay token cloud value
            // 

            let existing = await this.engine.cloud.readKey('zenpay-token');
            if (existing && existing.toString().length > 0) {
                return true;
            } else {
                //
                // Create sign
                //

                let contract = contractFromPublicKey(this.engine.publicKey);
                let signed = this.engine.products.keys.createDomainSignature(domain);
                let token = await fetchAccountToken({
                    address: contract.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    walletConfig: contract.source.backup(),
                    walletType: contract.source.type,
                    time: signed.time,
                    signature: signed.signature,
                    subkey: signed.subkey
                });
                await this.engine.cloud.update('zenpay-token', () => Buffer.from(token));
            }

            return true;
        })();

        // Refetch state
        await this.doSync();

        return res;
    }

    useStatus() {
        return useRecoilValue(this.#status);
    }

    useCards() {
        return useRecoilValue(this.#accountsState).accounts;
    }

    // Update accounts
    async syncAccounts() {
        let targetAccounts = this.engine.persistence.zenPayState.item(this.engine.address);
        let status: ZenPayAccountStatus = this.engine.persistence.zenPayStatus.item(this.engine.address).value || { state: 'need-enrolment' };
        if (status.state === 'ready') {
            const token = status.token;
            try {
                let listRes = await fetchCardList(token);

                if (!listRes) {
                    targetAccounts.update((src) => {
                        return {
                            accounts: []
                        };
                    });
                    return;
                }

                targetAccounts.update((src) => {
                    return {
                        accounts: listRes!.map((account) => ({
                            id: account.id,
                            address: account.address,
                            state: account.state,
                            balance: new BN(account.balance),
                            card: account.card,
                            type: 'virtual'
                        }))
                    };
                });

            } catch (e) {
                console.warn(e);
            }
        }
    }

    stopWatching() {
        if (this.watcher) {
            this.watcher();
            this.watcher = null;
        }
    }

    watch(token: string) {
        this.watcher = watchZenPayAccountUpdates(token, () => {
            this.syncAccounts();
        });
    }

    async doSync() {
        await this.#lock.inLock(async () => {
            let targetStatus = this.engine.persistence.zenPayStatus.item(this.engine.address);
            let status: ZenPayAccountStatus | null = targetStatus.value;

            // If not enrolled locally
            if (!status || status.state === 'need-enrolment') {
                const existing = await this.engine.cloud.readKey('zenpay-token');
                if (existing && existing.toString().length > 0) {
                    targetStatus.update((src) => {
                        if (!src || src.state === 'need-enrolment') {
                            return { state: 'need-phone', token: existing.toString() };
                        }
                        return src;
                    });
                } else {
                    targetStatus.update((src) => {
                        if (!src) {
                            this.stopWatching();
                            return { state: 'need-enrolment' };
                        }
                        return src;
                    });
                }

                status = targetStatus.value!;
            }

            // Update state from server
            if (status.state !== 'need-enrolment') {
                const token = status.token;

                if (token && token.length > 0) {
                    let state = await fetchAccountState(token);

                    // Clear token if no-ref
                    if (state.state === 'no-ref') {
                        await this.engine.cloud.update('zenpay-token', () => Buffer.from(''));
                        this.stopWatching();
                        this.engine.persistence.zenPayState.item(this.engine.address).update((src) => {
                            return null;
                        });
                    }

                    targetStatus.update((src) => {
                        if (state.state === 'no-ref') {
                            return { state: 'need-enrolment' };
                        }
                        if (state.state === 'need-phone') {
                            if (src!.state !== 'need-phone') {
                                return { state: 'need-phone', token: token };
                            }
                        }
                        if (state.state === 'need-kyc') {
                            if (src!.state !== 'need-kyc') {
                                return { state: 'need-kyc', token: token };
                            }
                        }
                        if (state.state === 'ok') {
                            if (src!.state !== 'ready') {
                                return { state: 'ready', token: token };
                            }
                        }
                        return src;
                    });
                } else {
                    targetStatus.update(() => {
                        return { state: 'need-enrolment' };
                    });
                }
            }

            // Initial sync
            if (targetStatus.value?.state === 'ready') {
                await this.syncAccounts();
            }

            // Start watcher if ready
            if (targetStatus.value?.state === 'ready' && !this.watcher) {
                this.watch(targetStatus.value.token);
            }
        });
    }
}