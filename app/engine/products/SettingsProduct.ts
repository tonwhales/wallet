import BN from "bn.js";
import { selector, useRecoilValue } from "recoil";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { SpamFilterConfig } from "../../fragments/SpamFilterFragment";
import { Engine } from "../Engine";

function addToSetArray(src: string[] | null, value: string) {
    if (!src) {
        return [value];
    }
    if (src.find((v) => v === value)) {
        return src;
    } else {
        return [...src, value];
    }
}

function  removeFromSetArray(src: string[] | null, value: string) {
    if (!src) {
        return [];
    }
    const index = src.findIndex((v) => v === value);
    if (index !== -1) {
        const res = src;
        res.splice(index, 1);
        return res;
    } else {
        return src;
    }
}

export class SettingsProduct {
    readonly engine: Engine;
    readonly #minAmountSelector;
    readonly #dontShowCommentsSelector;
    readonly #denyListSelector;

    constructor(engine: Engine) {
        this.engine = engine;

        this.#minAmountSelector = selector({
            key: 'settings/spam/min-amount',
            get: ({ get }) => {
                let config = get(this.engine.persistence.spamFilterConfig.item().atom);
                if (!config) {
                    return toNano('0.05');
                }
                return config.minAmount ? config.minAmount : toNano('0.05')
            },
            dangerouslyAllowMutability: true
        });

        this.#dontShowCommentsSelector = selector({
            key: 'settings/spam/comments',
            get: ({ get }) => {
                let config = get(this.engine.persistence.spamFilterConfig.item().atom);
                if (!config) {
                    return true;
                }
                return config.dontShowComments !== null ? config.dontShowComments : true;
            },
            dangerouslyAllowMutability: true
        });

        this.#denyListSelector = selector({
            key: 'settings/spam/deny-lsit',
            get: ({ get }) => {
                let config = get(this.engine.persistence.spamFilterConfig.item().atom);
                if (!config) {
                    return [];
                }
                return config.denyList ? config.denyList : [];
            },
            dangerouslyAllowMutability: true
        });
    }

    useSpamMinAmount(): BN {
        return useRecoilValue(this.#minAmountSelector);
    }

    useDontShowComments(): boolean {
        return useRecoilValue(this.#dontShowCommentsSelector);
    }

    useDenyList(): string[] {
        return useRecoilValue(this.#denyListSelector);
    }

    useSpamfilter(): { minAmount: BN, dontShowComments: boolean, denyList: string[] } {
        const config = useRecoilValue(this.engine.persistence.spamFilterConfig.item().atom);
        if (!config) {
            return {
                minAmount: toNano('0.05'),
                dontShowComments: true,
                denyList: []
            }
        }
        return {
            minAmount: config.minAmount ? config.minAmount : toNano('0.05'),
            dontShowComments: config.dontShowComments !== null ? config.dontShowComments : true,
            denyList: config.denyList ? config.denyList : []
        };
    }

    addToDenyList(address: Address) {
        const item = this.engine.persistence.spamFilterConfig.item();
        item.update((src) => {
            return {
                minAmount: src?.minAmount ? src.minAmount : toNano('0.05'),
                dontShowComments: (src?.dontShowComments !== null && src?.dontShowComments !== undefined) ? src.dontShowComments : true,
                denyList: addToSetArray(src?.denyList || [], address.toFriendly({ testOnly: AppConfig.isTestnet }))
            }
        });
    }

    removeFromDenyList(address: Address) {
        const item = this.engine.persistence.spamFilterConfig.item();
        item.update((src) => {
            return {
                minAmount: src?.minAmount ? src.minAmount : toNano('0.05'),
                dontShowComments: (src?.dontShowComments !== null && src?.dontShowComments !== undefined) ? src.dontShowComments : true,
                denyList: removeFromSetArray(src?.denyList || [], address.toFriendly({ testOnly: AppConfig.isTestnet }))
            }
        });
    }

    setSpamFilter(value: SpamFilterConfig) {
        this.engine.persistence.spamFilterConfig.item().update(() => value);
    }
}