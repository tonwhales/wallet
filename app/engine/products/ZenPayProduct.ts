import BN from "bn.js";
import { toNano } from "ton";
import { Engine } from "../Engine";

export type ZenPayCard = {
    name: string,
    status: 'active' | 'inactive',
    type: 'virtual' | 'debit',
    number: string,
    value: BN,
    colors: string[],
}

export class ZenPayProduct {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    useCard(cardNumber?: string): ZenPayCard | null {
        if (!cardNumber) {
            return null;
        }

        return {
            name: 'ZenPay Card',
            status: 'active',
            type: 'virtual',
            number: cardNumber,
            value: toNano(3325),
            colors: ['#EA7509', '#E9A904'],
        }
    }

    useCards() {
        return [
            '1234 5678 9012 4226',
        ]
    }
}