import BN from "bn.js";
import { Address, Cell } from "@ton/core";
import Url from 'url-parse';
import { warn } from "./log";
import { SupportedDomains } from "./SupportedDomains";
import isValid from 'is-valid-domain';
import { ConnectQrQuery } from "../engine/tonconnect/types";

export type ResolvedUrl = {
    type: 'transaction',
    address: Address,
    comment: string | null,
    amount: bigint | null,
    payload: Cell | null,
    stateInit: Cell | null,
} | {
    type: 'jetton-transaction',
    address: Address,
    jettonMaster: Address,
    comment: string | null,
    amount: bigint | null
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
} | {
    type: 'tx',
    address: string,
    hash: string,
    lt: string
}

export function isUrl(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

export function resolveUrl(src: string, testOnly: boolean): ResolvedUrl | null {

    console.log('resolveUrl', src);


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
            let rawAddress = url.pathname.slice(1).endsWith('/') ? url.pathname.slice(1, -1) : url.pathname.slice(1);
            let address = Address.parseFriendly(rawAddress).address;
            let comment: string | null = null;
            let amount: bigint | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = BigInt(url.query[key]!);
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

        console.log({
            url: url.toString(),
            protocol: url.protocol,
            host: url.host,
            pathname: url.pathname,
            query: url.query
        })

        if ((url.protocol.toLowerCase() === 'ton:' || url.protocol.toLowerCase() === 'ton-test:') && url.host.toLowerCase() === 'tx' && url.pathname.startsWith('/')) {
            // `${test ? 'ton-test://' : 'ton://'}tx/${to}/${t.lt}_${encodeURIComponent(t.hash)}`
            const address = decodeURIComponent(url.pathname.slice(1).split('/')[0]);
            const txId = url.pathname.slice(1).split('/')[1].split('_');
            const lt = txId[0];
            const hash = decodeURIComponent(txId[1]);

            return {
                type: 'tx',
                address,
                hash,
                lt
            }
        }

        // HTTP(s) url
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: bigint | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = BigInt(url.query[key]!);
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

        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (SupportedDomains.find((d) => d === url.host.toLowerCase()))
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: bigint | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
            let jettonMaster: Address | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = BigInt(url.query[key]!);
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
            let endpointSlice = slice.loadRef().beginParse();
            let endpoint = endpointSlice.loadBuffer(endpointSlice.remainingBits / 8).toString();
            let extras = slice.loadBit(); // For future compatibility
            let customTitle: string | null = null;
            let customImage: { url: string, blurhash: string } | null = null;
            if (!extras) {
                if (slice.remainingBits !== 0 || slice.remainingRefs !== 0) {
                    throw Error('Invalid endpoint');
                }
            } else {
                if (slice.loadBit()) {
                    let customTitleSlice = slice.loadRef().beginParse();
                    customTitle = customTitleSlice.loadBuffer(customTitleSlice.remainingBits / 8).toString();
                    if (customTitle.trim().length === 0) {
                        customTitle = null;
                    }
                }
                if (slice.loadBit()) {
                    let imageUrlSlice = slice.loadRef().beginParse();
                    let imageUrl = imageUrlSlice.loadBuffer(imageUrlSlice.remainingBits / 8).toString();
                    let imageBlurhashSlice = slice.loadRef().beginParse();
                    let imageBlurhash = imageBlurhashSlice.loadBuffer(imageBlurhashSlice.remainingBits / 8).toString();
                    new Url(imageUrl, true); // Check url
                    customImage = { url: imageUrl, blurhash: imageBlurhash };
                }

                // Future compatibility
                extras = slice.loadBit(); // For future compatibility
                if (!extras) {
                    if (slice.remainingBits !== 0 || slice.remainingRefs !== 0) {
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
        // Tonconnect
        if (url.protocol.toLowerCase() === 'tc:') {
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