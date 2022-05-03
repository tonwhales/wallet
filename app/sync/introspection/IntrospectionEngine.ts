import { Address } from "ton";
import { Engine } from "../Engine";

export class IntrospectionEngine {
    readonly engine: Engine;
    private _cache = new Map<string, string[]>();

    constructor(engine: Engine) {
        this.engine = engine;
    }

    // async prepareIntrospection(seqno: number, address: Address) {
    //     let interfaces = await this.engine.client4.runMethod(seqno, address, 'supported_interfaces');
    //     if (interfaces.
    // }

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