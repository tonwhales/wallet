import BN from "bn.js";
import { Address, Cell } from "ton";
import Url from 'url-parse';
import { warn } from "./log";
import { SupportedDomains } from "./SupportedDomains";
import isValid from 'is-valid-domain';
import { ConnectQrQuery } from "../engine/tonconnect/types";

export type ResolvedUrl = {
    type: 'transaction',
    address: Address,
    comment: string | null,
    amount: BN | null,
    payload: Cell | null,
    stateInit: Cell | null,
} | {
    type: 'jetton-transaction',
    address: Address,
    jettonMaster: Address,
    comment: string | null,
    amount: BN | null
} | {
    type: 'connect',
    session: string,
    endpoint: string | null
} | {
    type: 'install',
    url: string,
    customTitle: string | null,
    customImage: { url: string, blurhash: string } | null
} | {
    type: 'tonconnect',
    query: ConnectQrQuery
}

export function resolveUrl(src: string, testOnly: boolean): ResolvedUrl | null {


    // Try address parsing
    try {
        let res = Address.parseFriendly(src);
        return {
            type: 'transaction',
            address: res.address,
            comment: null,
            amount: null,
            payload: null,
            stateInit: null
        };
    } catch (e) {
        // Ignore
    }

    // Parse url
    try {
        const url = new Url(src, true);

        // ton url
        if ((url.protocol.toLowerCase() === 'ton:' || url.protocol.toLowerCase() === 'ton-test:') && url.host.toLowerCase() === 'transfer' && url.pathname.startsWith('/')) {
            let address = Address.parseFriendly(url.pathname.slice(1)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = new BN(url.query[key]!, 10);
                    }
                    if (key.toLowerCase() === 'bin') {
                        payload = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'init') {
                        stateInit = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'jetton') {
                        try {
                            jettonMaster = Address.parseFriendly(url.query[key]!).address;
                        } catch (e) {
                            warn('Invalid jetton master address');
                        }
                    }
                }
            }
            if (jettonMaster) {
                return {
                    type: 'jetton-transaction',
                    address,
                    jettonMaster,
                    comment,
                    amount
                }
            }
            return {
                type: 'transaction',
                address,
                comment,
                amount,
                payload,
                stateInit
            }
        }

        // ton url connect
        if ((url.protocol.toLowerCase() === 'ton:' || url.protocol.toLowerCase() === 'ton-test:') && url.host.toLowerCase() === 'connect' && url.pathname.startsWith('/')) {
            let session = url.pathname.slice(1);
            let endpoint: string | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'endpoint') {
                        endpoint = url.query[key]!;
                    }
                }
            }
            return {
                type: 'connect',
                session,
                endpoint
            }
        }

        // HTTP(s) url
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = new BN(url.query[key]!, 10);
                    }
                    if (key.toLowerCase() === 'bin') {
                        payload = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'init') {
                        stateInit = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'jetton') {
                        try {
                            jettonMaster = Address.parseFriendly(url.query[key]!).address;
                        } catch (e) {
                            warn('Invalid jetton master address');
                        }
                    }
                }
            }
            if (jettonMaster) {
                return {
                    type: 'jetton-transaction',
                    address,
                    jettonMaster,
                    comment,
                    amount
                }
            }
            return {
                type: 'transaction',
                address,
                comment,
                amount,
                payload,
                stateInit
            }
        }

        // Tokeeper url support for QR
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = new BN(url.query[key]!, 10);
                    }
                    if (key.toLowerCase() === 'bin') {
                        payload = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'init') {
                        stateInit = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                    }
                    if (key.toLowerCase() === 'jetton') {
                        try {
                            jettonMaster = Address.parseFriendly(url.query[key]!).address;
                        } catch (e) {
                            warn('Invalid jetton master address');
                        }
                    }
                }
            }
            if (jettonMaster) {
                return {
                    type: 'jetton-transaction',
                    address,
                    jettonMaster,
                    comment,
                    amount
                }
            }
            return {
                type: 'transaction',
                address,
                comment,
                amount,
                payload,
                stateInit
            }
        }

        // HTTP(s) Sign Url
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().startsWith('/connect/'))) {
            let session = url.pathname.slice('/connect/'.length);
            let endpoint: string | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'endpoint') {
                        endpoint = url.query[key]!;
                    }
                }
            }
            return {
                type: 'connect',
                session,
                endpoint
            }
        }

    } catch (e) {
        // Ignore
        warn(e);
    }

    // Parse apps
    try {
        const url = new Url(src, true);
        if ((url.protocol.toLowerCase() === 'https:')
            && ((testOnly ? 'test.tonhub.com' : 'tonhub.com') === url.host.toLowerCase())
            && (url.pathname.toLowerCase().startsWith('/app/'))) {
            let id = url.pathname.slice('/app/'.length);
            let slice = Cell.fromBoc(Buffer.from(id, 'base64'))[0].beginParse();
            let endpoint = slice.readRef().readRemainingBytes().toString();
            let extras = slice.readBit(); // For future compatibility
            let customTitle: string | null = null;
            let customImage: { url: string, blurhash: string } | null = null;
            if (!extras) {
                if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                    throw Error('Invalid endpoint');
                }
            } else {
                if (slice.readBit()) {
                    customTitle = slice.readRef().readRemainingBytes().toString()
                    if (customTitle.trim().length === 0) {
                        customTitle = null;
                    }
                }
                if (slice.readBit()) {
                    let imageUrl = slice.readRef().readRemainingBytes().toString();
                    let imageBlurhash = slice.readRef().readRemainingBytes().toString();
                    new Url(imageUrl, true); // Check url
                    customImage = { url: imageUrl, blurhash: imageBlurhash };
                }

                // Future compatibility
                extras = slice.readBit(); // For future compatibility
                if (!extras) {
                    if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                        throw Error('Invalid endpoint');
                    }
                }
            }

            // Validate endpoint
            let parsedEndpoint = new Url(endpoint, true);
            if (parsedEndpoint.protocol !== 'https:') {
                throw Error('Invalid endpoint');
            }
            if (!isValid(parsedEndpoint.hostname)) {
                throw Error('Invalid endpoint');
            }

            return {
                type: 'install',
                url: endpoint,
                customTitle,
                customImage
            };
        }

        // Tonconnect
        if ((url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().indexOf('/ton-connect') !== -1)) {
            if (!!url.query.r && !!url.query.v && !!url.query.id) {
                return {
                    type: 'tonconnect',
                    query: url.query as unknown as ConnectQrQuery
                };
            }
        }

    } catch (e) {
        // Ignore
        warn(e);
    }


    return null;
}