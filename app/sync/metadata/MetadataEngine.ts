import EventEmitter from "events";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { MapAsyncLock } from "../../utils/MapAsyncLock";
import { Engine } from "../Engine";
import { fetchMetadata } from "./fetchMetadata";
import { ContractMetadata } from "./Metadata";

export class MetadataEngine extends EventEmitter {
    readonly engine: Engine;
    #lock = new MapAsyncLock();
    #cache = new Map<string, ContractMetadata>();

    constructor(engine: Engine) {
        super();
        this.engine = engine;
    }

    async prepareMetadata(seqno: number, address: Address) {

        // Check in cache
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (this.#cache.has(key)) {
            return;
        }

        // Check existing
        let existing = this.engine.persistence.metadata.getValue(address);
        if (existing) {
            this.#cache.set(key, existing);
            return;
        }

        // Fetch new metadata
        await this.updateMetadata(seqno, address);
    }

    async updateMetadata(seqno: number, address: Address) {
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });

        // Check existing
        await this.#lock.inLock(key, async () => {

            // Fetch
            let metadata = await fetchMetadata(this.engine.client4, seqno, address);

            // Check if not updated
            let ex = this.engine.persistence.metadata.getValue(address);
            if (ex && ex.seqno > seqno) {
                return;
            }

            // Persist
            this.engine.persistence.metadata.setValue(address, metadata);
            this.#cache.set(key, metadata);

            // Notify
            this.emit('changed:' + key);
        });
    }

    getMetadata(address: Address) {
        let key = address.toFriendly({ testOnly: AppConfig.isTestnet });
        let ch = this.#cache.get(key);
        if (ch) {
            return ch;
        }
        let ex = this.engine.persistence.metadata.getValue(address);
        if (ex) {
            return ex;
        } else {
            return null;
        }
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