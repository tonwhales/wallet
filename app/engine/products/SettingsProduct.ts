import BN from "bn.js";
import { useRecoilValue } from "recoil";
import { toNano } from "ton";
import { SpamFilterConfig } from "../../fragments/SpamFilterFragment";
import { Engine } from "../Engine";

export class SettingsProduct {
    readonly engine: Engine;
    constructor(engine: Engine) {
        this.engine = engine;
    }

    useSpamfilter(): { minAmount: BN, dontShowComments: boolean } {
        const config = useRecoilValue(this.engine.persistence.spamFilterConfig.item().atom);
        if (!config) {
            return {
                minAmount: toNano('0.05'),
                dontShowComments: true,
            }
        }
        return {
            minAmount: config.minAmount ? config.minAmount : toNano('0.05'),
            dontShowComments: config.dontShowComments !== null ? config.dontShowComments : true
        };
    }

    setSpamFilter(value: SpamFilterConfig) {
        this.engine.persistence.spamFilterConfig.item().update(() => value);
    }
}