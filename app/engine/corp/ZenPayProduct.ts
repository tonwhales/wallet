import BN from "bn.js";
import { selector, useRecoilValue } from "recoil";
import { AsyncLock } from "teslabot";
import { AppConfig } from "../../AppConfig";
import { fetchAccountState } from "../api/fetchCardState";
import { fetchAccountToken } from "../api/zenpay/fetchAccountToken";
import { fetchCardList } from "../api/zenpay/fetchCardList";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";

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
};

export type ZenPayState = {
    accounts: ZenPayCard[],
};

export class ZenPayProduct {
    readonly engine: Engine;
    readonly #status;
    readonly #accountsState;
    readonly #lock = new AsyncLock();

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
            let existing = await this.engine.cloud.readKey('zenpay-token');
            console.log('zenpay', { existing });
            if (existing) {
                return true;
            } else {

                //
                // Create domain key if needed
                //

                let created = await this.engine.products.keys.createDomainKeyIfNeeded(domain);
                console.log('zenpay', { created });
                if (!created) {
                    return false;
                }

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
                console.log('zenpay', { token });
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

    async doSync() {
        await this.#lock.inLock(async () => {
            let targetStatus = this.engine.persistence.zenPayStatus.item(this.engine.address);
            let targetAccounts = this.engine.persistence.zenPayState.item(this.engine.address);
            let status: ZenPayAccountStatus | null = targetStatus.value;

            // If not enrolled locally
            if (!status || status.state === 'need-enrolment') {
                const existing = await this.engine.cloud.readKey('zenpay-token');
                console.log({ existing });
                if (existing) {
                    targetStatus.update((src) => {
                        if (!src || src.state === 'need-enrolment') {
                            return { state: 'need-phone', token: existing.toString() };
                        }
                        return src;
                    });
                } else {
                    targetStatus.update((src) => {
                        if (!src) {
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
                console.log({ token });
                let state = await fetchAccountState(token);
                console.log({ state });
                targetStatus.update((src) => {
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
            }

            // Update accounts
            if (status.state === 'ready') {
                const token = status.token;
                console.log({ token });
                try {
                    let listRes = await fetchCardList(token);
                    targetAccounts.update((src) => {
                        return {
                            accounts: listRes.map((account) => ({
                                id: account.id,
                                address: account.address,
                                state: account.state,
                                balance: new BN(account.balance),
                                type: 'virtual'
                            }))
                        };
                    });

                } catch (e) {
                    console.warn(e);
                }
            }
        });
    }
}