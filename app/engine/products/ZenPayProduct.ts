import { BN } from "bn.js";
import { toNano } from "ton";
import { Engine } from "../Engine";

export class ZenPayProduct {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    useCard(cardNumber?: string) {
        if (!cardNumber) {
            return null;
        }

        return {
            name: 'ZenPay Card',
            subtitle: 'Virtual Card',
            status: 'active',
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