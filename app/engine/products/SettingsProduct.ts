import BN from "bn.js";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { Address, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { SpamFilterConfig } from "../../fragments/SpamFilterFragment";
import { storagePersistence } from "../../storage/storage";
import { CloudValue } from "../cloud/CloudValue";
import { Engine } from "../Engine";

const version = 1;

export type AddressContact = { name: string, fields?: { key: string, value: string | null | undefined }[] | null };
export class SettingsProduct {
    readonly engine: Engine;
    readonly #minAmountSelector;
    readonly #dontShowCommentsSelector;
    readonly addressBook: CloudValue<{ denyList: { [key: string]: { reason: string | null } }, contacts: { [key: string]: AddressContact }, fields: { [key: string]: string } }>
    readonly #denyAddressSelector;
    readonly #contactSelector;

    constructor(engine: Engine) {
        this.engine = engine;
        this.addressBook = engine.cloud.get(`addressbook-v${version}`, (src) => { src.denyList = {}; src.contacts = {}; src.fields = {} });

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

    useContactFields() {
        return useRecoilValue(this.addressBook.atom).fields;
    }

    useContactField(key: string) {
        return useRecoilValue(this.addressBook.atom).fields[key];
    }

    setContactField(key: string, label: string) {
        this.addressBook.update((doc) => {
            doc.fields[key] = label;
        });
    }

    removeContactField(key: string) {
        this.addressBook.update((doc) => {
            delete doc.fields[key];
        });
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

            if (!doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].fields) {
                doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].fields = [];
            }

            if (!!contact.fields) {
                for (let i = 0; i < contact.fields.length; i++) {
                    doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].fields![i] = contact.fields![i];
                }
            } else {
                doc.contacts[address.toFriendly({ testOnly: AppConfig.isTestnet })].fields = [];
            }
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