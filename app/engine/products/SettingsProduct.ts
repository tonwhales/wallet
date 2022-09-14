import BN from "bn.js";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { SpamFilterConfig } from "../../fragments/SpamFilterFragment";
import { CloudValue } from "../cloud/CloudValue";
import { Engine } from "../Engine";

export type AddressContact = { name: string, fields?: { key: string, value: string | null | undefined }[] | null };
export class SettingsProduct {
    readonly engine: Engine;
    readonly #minAmountSelector;
    readonly #dontShowCommentsSelector;
    readonly addressBook: CloudValue<{ denyList: { [key: string]: { reason: string | null } }, contacts: { [key: string]: AddressContact } }>
    readonly #denyAddressSelector;
    readonly #contactSelector;

    constructor(engine: Engine) {
        this.engine = engine;
        this.addressBook = engine.cloud.get('addressbook', (src) => { src.denyList = {}; src.contacts = {} });

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

        this.#denyAddressSelector = selectorFamily<boolean, string>({
            key: 'settings/spam/deny-list',
            get: (address) => ({ get }) => {
                const list = get(this.addressBook.atom).denyList || [];
                const res = !!list[address];
                return res;
            }
        });

        this.#contactSelector = selectorFamily<AddressContact | undefined, string>({
            key: 'settings/contacts',
            get: (address) => ({ get }) => {
                const list = get(this.addressBook.atom).contacts || {};
                return list[address];
            }
        });
    }

    useSpamMinAmount(): BN {
        return useRecoilValue(this.#minAmountSelector);
    }

    useDontShowComments(): boolean {
        return useRecoilValue(this.#dontShowCommentsSelector);
    }

    useDenyList(): { [key: string]: { reason: string | null } } {
        return useRecoilValue(this.addressBook.atom).denyList;
    }

    useDenyAddress(address: Address) {
        return useRecoilValue(this.#denyAddressSelector(address.toFriendly({ testOnly: AppConfig.isTestnet })));
    }

    useSpamfilter(): { minAmount: BN, dontShowComments: boolean } {
        const config = useRecoilValue(this.engine.persistence.spamFilterConfig.item().atom);
        if (!config) {
            return {
                minAmount: toNano('0.05'),
                dontShowComments: true
            }
        }
        return {
            minAmount: config.minAmount ? config.minAmount : toNano('0.05'),
            dontShowComments: config.dontShowComments !== null ? config.dontShowComments : true
        };
    }

    useContacts() {
        return useRecoilValue(this.addressBook.atom).contacts;
    }

    useContact(address: Address) {
        return useRecoilValue(this.#contactSelector(address.toFriendly({ testOnly: AppConfig.isTestnet })))
    }

    setContact(address: Address, contact: AddressContact) {
        this.addressBook.update((doc) => {
            if (!doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })]) {
                doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })] = {
                    name: contact.name,
                    fields: contact.fields
                }
                return;
            }
            doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].name = contact.name;
            doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].fields = contact.fields;
        });
    }

    removeContact(address: Address) {
        this.addressBook.update((doc) => {
            delete doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })];
        });
    }

    addToDenyList(address: Address) {
        this.addressBook.update((doc) => {
            doc.denyList[address.toFriendly({ testOnly: AppConfig.isTestnet })] = { reason: 'spam' };
        });
    }

    removeFromDenyList(address: Address) {
        this.addressBook.update((doc) => {
            delete doc.denyList[address.toFriendly({ testOnly: AppConfig.isTestnet })]
        });
    }

    setSpamFilter(value: SpamFilterConfig) {
        this.engine.persistence.spamFilterConfig.item().update(() => value);
    }
}