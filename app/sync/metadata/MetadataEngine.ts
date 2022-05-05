import { InvalidateSync } from "teslabot";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { MapAsyncLock } from "../../utils/MapAsyncLock";
import { Engine } from "../Engine";
import { ReactSync } from "../react/ReactSync";
import { fetchMetadata } from "./fetchMetadata";
import { ContractMetadata } from "./Metadata";

export class MetadataEngine {
    readonly engine: Engine;
    #lock = new MapAsyncLock();
    #cache = new Map<string, ReactSync<ContractMetadata>>();
    #pending = new Map<string, number>();
    #sync: InvalidateSync;

    constructor(engine: Engine) {
        this.engine = engine;
        let ex = this.engine.persistence.metadataPending.getValue(undefined);
        if (ex) {
            for (let k in ex) {
                let v = ex[k];
                this.#pending.set(k, v);
            }
        }
        this.#sync = new InvalidateSync(async () => {
            while (true) {
                // Fetch first task
                if (this.#pending.size === 0) {
                    return;
                }
                let task = Array.from(this.#pending)[0];
                let address = Address.parseFriendly(task[0]).address;
                let seqno = task[1];

                // Update metadata
                await this.#updateMetadata(seqno, address);

                // Persist pending
                let e = this.#pending.get(task[0]);
                if (!e) {
                    continue;
                }
                if (e >= seqno) {
                    continue;
                }
                this.#pending.delete(task[0]);
                this.#persistPending();
            }
        });
        if (this.#pending.size > 0) {
            this.#sync.invalidate();
        }
    }

    //
    // Sync
    //

    async prepareMetadata(seqno: number, address: Address) {

        // Check existing or invalidate
        let sync = this.#getMetadata(address);
        if (sync.value.seqno > 0) {
            if (sync.value.seqno < seqno) {
                this.#invalidateAddress(seqno, address);
            }
            return;
        }

        // Fetch new metadata
        await this.#updateMetadata(seqno, address);
    }

    async #updateMetadata(seqno: number, address: Address) {
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });

        // Check existing
        return await this.#lock.inLock(key, async () => {
            console.log(`[${address.toFriendly({ testOnly: AppConfig.isTestnet })}]: Downloading metadata`);

            // Fetch
            let metadata = await fetchMetadata(this.engine.client4, seqno, address);

            // Check if updated
            let sync = this.#getMetadata(address);
            if (sync.value.seqno > seqno) {
                console.log(`[${address.toFriendly({ testOnly: AppConfig.isTestnet })}]: Better metadata already exist`);
                return sync.value.seqno; // Existing seqno
            }

            console.log(`[${address.toFriendly({ testOnly: AppConfig.isTestnet })}]: Metadata ready`);

            // Update metadata
            this.engine.persistence.metadata.setValue(address, metadata);
            sync.value = metadata;

            // Updated seqno
            return metadata.seqno;
        });
    }

    #invalidateAddress(seqno: number, address: Address) {
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });
        let e = this.#pending.get(key);
        if (e === undefined || e < seqno) {
            this.#pending.set(key, seqno);
            this.#persistPending();
            this.#sync.invalidate();
        }
    }

    #persistPending() {
        let p: { [key: string]: number } = {};
        for (let e of this.#pending) {
            p[e[0]] = p[1];
        }
        this.engine.persistence.metadataPending.setValue(undefined, p);
    }

    //
    // Get
    //

    #getMetadata(address: Address) {
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });
        let ch = this.#cache.get(key);
        if (ch) {
            return ch;
        }
        let ex = this.engine.persistence.metadata.getValue(address);
        let sync = new ReactSync<ContractMetadata>();
        this.#cache.set(key, sync);

        if (ex) {
            sync.value = ex;
        } else {
            sync.value = { seqno: -1, interfaces: [], jettonMaster: undefined, jettonWallet: undefined };
        }

        return sync;
    }

    getMetadata(address: Address) {
        return this.#getMetadata(address).value;
    }

    useMetadata(address: Address) {
        return this.#getMetadata(address).use();
    }

    getSupportedInterfaces = (address: Address) => {
        if (address.equals(Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'))) {
            return ['256184278959413194623484780286929323492'];
        }
        if (address.equals(Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs'))) {
            return ['256184278959413194623484780286929323492'];
        }
        return [];
    }
}