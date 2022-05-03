import { Address } from "ton";
import { Engine } from "../Engine";
import { tryFetchJettonMaster } from "./introspections/tryFetchJettonMaster";
import { tryFetchJettonWallet } from "./introspections/tryFetchJettonWallet";
import { tryGetJettonWallet } from "./introspections/tryGetJettonWallet";

export class IntrospectionEngine {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    async fetchSupportedInterfaces(seqno: number, address: Address) {

        // Hardcoded
        if (address.equals(Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'))) {
            return ['256184278959413194623484780286929323492'];
        }
        if (address.equals(Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs'))) {
            return ['256184278959413194623484780286929323492'];
        }

        // Fetch from blockchain
        let interfaces = await this.engine.client4.runMethod(seqno, address, 'supported_interfaces');
        if (interfaces.exitCode !== 0 && interfaces.exitCode !== 1) {
            return [];
        }
        if (interfaces.result.length < 2) {
            return [];
        }
        if (interfaces.result[0].type !== 'int') {
            return [];
        }
        if (interfaces.result[0].value.toString(10) !== '123515602279859691144772641439386770278') {
            return [];
        }
        let res: string[] = [];
        for (let i = 1; i < interfaces.result.length; i++) {
            let itm = interfaces.result[i];
            if (itm.type !== 'int') {
                return [];
            }
            res.push(itm.value.toString(10));
        }
        return res;
    }

    async fetchJettonWallet(seqno: number, address: Address) {

        // Fetch wallet
        let jettonWallet = await tryFetchJettonWallet(this.engine.client4, seqno, address);

        // Check that wallet is correct jetton wallet
        if (jettonWallet) {
            let wallet = await tryGetJettonWallet(this.engine.client4, seqno, { address: jettonWallet.owner, master: jettonWallet.master });
            if (!wallet) {
                return null;
            }
            if (!wallet.equals(address)) {
                return null;
            }
        }

        return jettonWallet;
    }

    async fetchJettonMaster(seqno: number, address: Address) {
        return await tryFetchJettonMaster(this.engine.client4, seqno, address);
    }

    async introspect(seqno: number, address: Address) {
        let [
            interfaces,
            jettonWallet,
            jettonMaster
        ] = await Promise.all([
            this.fetchSupportedInterfaces(seqno, address),
            this.fetchJettonWallet(seqno, address),
            this.fetchJettonMaster(seqno, address)
        ]);
        // if (interfaces.
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