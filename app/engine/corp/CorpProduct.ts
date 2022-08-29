import { selector, useRecoilValue } from "recoil";
import { AsyncLock } from "teslabot";
import { AppConfig } from "../../AppConfig";
import { fetchCardToken } from "../api/fetchCardToken";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";

export type CorpStatus =
    | {
        state: 'need-enrolment'
    }
    | {
        state: 'need-phone'
        token: string
    }
    | {
        state: 'need-kyc'
        token: string,
        phone: string
    }

export class CorpProduct {
    readonly engine: Engine;
    readonly #status;
    readonly #lock = new AsyncLock();

    constructor(engine: Engine) {
        this.engine = engine;
        this.#status = selector<{ status: 'need-enrolment' | 'need-phone' | 'ready' }>({
            key: 'corp/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/status',
            get: ({ get }) => {

                // Check status
                let status: CorpStatus = get(this.engine.persistence.corp.item(engine.address).atom) || { state: 'need-enrolment' };

                // Request token
                if (status.state === 'need-enrolment') {
                    return {
                        status: 'need-enrolment'
                    };
                }

                // Request phone
                if (status.state === 'need-phone') {
                    return {
                        status: 'need-phone'
                    };
                }

                return {
                    status: 'ready'
                }
            }
        })
    }

    async enroll() {

        let res = await (async () => {
            let existing = await this.engine.cloud.readKey('corp-token');
            if (existing) {
                return true;
            } else {

                //
                // Create domain key if needed
                //

                let created = await this.engine.products.keys.createDomainKeyIfNeeded('card.whales-api.com');
                if (!created) {
                    return false;
                }

                //
                // Create sign
                //

                let contract = contractFromPublicKey(this.engine.publicKey);
                let signed = this.engine.products.keys.createDomainSignature('card.whales-api.com');
                let token = await fetchCardToken({
                    address: contract.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    walletConfig: contract.source.backup(),
                    walletType: contract.source.type,
                    time: signed.time,
                    signature: signed.signature,
                    subkey: signed.subkey
                });
                await this.engine.cloud.update('corp-token', () => Buffer.from(token));
            }

            return true;
        })();

        // Refetch state
        await this.doSync();

        return res;
    }

    use() {
        return useRecoilValue(this.#status);
    }

    async doSync() {
        await this.#lock.inLock(async () => {
            let target = this.engine.persistence.corp.item(this.engine.address);
            let status: CorpStatus | null = target.value;

            // If not enrolled locally
            if (!status || status.state === 'need-enrolment') {
                const existing = await this.engine.cloud.readKey('corp-token');
                if (existing) {
                    target.update((src) => {
                        if (!src || src.state === 'need-enrolment') {
                            return { state: 'need-phone', token: existing.toString() };
                        }
                        return null;
                    });
                } else {
                    target.update((src) => {
                        if (!src) {
                            return { state: 'need-enrolment' };
                        }
                        return null;
                    });
                }

                status = target.value!;
            }

            // Update state from server
            if (status.state !== 'need-enrolment') {
                // TODO: Implement
            }
        });
    }
}