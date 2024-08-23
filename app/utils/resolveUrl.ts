import { Address, Cell, toNano } from "@ton/core";
import Url from 'url-parse';
import { warn } from "./log";
import { SupportedDomains } from "./SupportedDomains";
import isValid from 'is-valid-domain';
import { ConnectPushQuery, ConnectQrQuery } from "../engine/tonconnect/types";
import { setLastReturnStrategy } from "../engine/tonconnect/utils";

export enum ResolveUrlError {
    InvalidAddress = 'InvalidAddress',
    InvalidPayload = 'InvalidPayload',
    InvalidStateInit = 'InvalidStateInit',
    InvalidJetton = 'InvalidJetton',
    InvalidAmount = 'InvalidAmount',
    InvalidJettonFee = 'InvalidJettonFee',
    InvalidJettonForward = 'InvalidJettonForward',
    InvalidJettonAmounts = 'InvalidJettonAmounts',
    InvalidInappUrl = 'InvalidInappUrl',
    InvalidExternalUrl = 'InvalidExternalUrl',
    InvalidHoldersPath = 'InvalidHoldersPath'
}

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
    amount: bigint | null,
    payload: Cell | null,
    feeAmount: bigint | null,
    forwardAmount: bigint | null
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
    type: 'tonconnect-request',
    query: ConnectPushQuery
} | {
    type: 'tx',
    address: string,
    hash: string,
    lt: string
} | {
    type: 'in-app-url',
    url: string,
} | {
    type: 'external-url',
    url: string,
} | {
    type: 'error',
    error: ResolveUrlError
} | {
    type: 'holders-transactions',
    query: { [key: string]: string | undefined }
} | {
    type: 'holders-path',
    path: string,
    query: { [key: string]: string | undefined }
}

export function isUrl(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

function resolveHoldersUrl(url: Url<Record<string, string | undefined>>): ResolvedUrl {
    const isTransactions = url.pathname.toLowerCase().split('holders/')[1] === 'transactions';

    if (isTransactions && url.query) {
        return {
            type: 'holders-transactions',
            query: url.query
        }
    } else if (!!url.query && url.query.path) {
        return {
            type: 'holders-path',
            path: decodeURIComponent(url.query.path),
            query: url.query
        }
    }

    return { type: 'error', error: ResolveUrlError.InvalidHoldersPath };
}

function resolveTransferUrl(url: Url<Record<string, string | undefined>>): ResolvedUrl {
    let rawAddress = url.pathname;

    if (rawAddress.startsWith('/transfer/')) {
        rawAddress = rawAddress.slice('/transfer/'.length);
    } else if (rawAddress.startsWith('/TRANSFER/')) {
        rawAddress = rawAddress.slice('/TRANSFER/'.length);
    }

    if (rawAddress.slice(1).endsWith('/')) {
        rawAddress = rawAddress.slice(1, -1);
    } else if (rawAddress.startsWith('/')) {
        rawAddress = rawAddress.slice(1);
    }

    let address: Address;
    try {
        address = Address.parseFriendly(rawAddress).address;
    } catch (e) {
        return { type: 'error', error: ResolveUrlError.InvalidAddress };
    }
    let comment: string | null = null;
    let amount: bigint | null = null;
    let payload: Cell | null = null;
    let stateInit: Cell | null = null;
    let jettonMaster: Address | null = null;
    let feeAmount: bigint | null = null;
    let forwardAmount: bigint | null = null;

    if (url.query) {
        const keys = Object.keys(url.query);
        for (let key in url.query) {
            if (key.toLowerCase() === 'text') {
                comment = url.query[key]!;
            }
            if (key.toLowerCase() === 'amount') {
                try {
                    if (keys.find((p) => p.toLowerCase() === 'jetton') !== undefined) {
                        amount = toNano(url.query[key]!.replace(',', '.').replaceAll(' ', ''));
                    } else {
                        amount = BigInt(url.query[key]!);
                    }
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidAmount };
                }
            }
            if (key.toLowerCase() === 'bin') {
                try {
                    payload = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidPayload };
                }
            }
            if (key.toLowerCase() === 'init') {
                try {
                    stateInit = Cell.fromBoc(Buffer.from(url.query[key]!, 'base64'))[0];
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidStateInit };
                }
            }
            if (key.toLowerCase() === 'jetton') {
                try {
                    jettonMaster = Address.parseFriendly(url.query[key]!).address;
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidJetton };
                }
            }
            if (key.toLowerCase() === 'fee-amount') {
                try {
                    feeAmount = BigInt(url.query[key]!);
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidJettonFee };
                }
            }
            if (key.toLowerCase() === 'forward-amount') {
                try {
                    forwardAmount = BigInt(url.query[key]!);
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidJettonForward };
                }
            }
        }
    }

    if (jettonMaster) {
        if (!!feeAmount && !!forwardAmount && feeAmount < forwardAmount) {
            return { type: 'error', error: ResolveUrlError.InvalidJettonAmounts };
        }

        return {
            type: 'jetton-transaction',
            address,
            jettonMaster,
            comment,
            amount,
            payload,
            feeAmount,
            forwardAmount
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

        const isTonUrl = url.protocol.toLowerCase() === 'ton:' || url.protocol.toLowerCase() === 'ton-test:';
        const isHttpUrl = url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:';

        // ton url
        if (isTonUrl) {

            if (url.host.toLowerCase() === 'transfer' && url.pathname.startsWith('/')) {

                return resolveTransferUrl(url);

            } else if (url.host.toLowerCase() === 'connect' && url.pathname.startsWith('/')) {

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

            } else if (url.host.toLowerCase() === 'tx' && url.pathname.startsWith('/')) {

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

            } else if (url.host.toLowerCase() === 'tx' && url.pathname.startsWith('/')) {
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

        }

        if (isHttpUrl) {
            const isSupportedDomain = SupportedDomains.find((d) => d === url.host.toLowerCase());
            const isTonhubHost = (testOnly ? 'test.tonhub.com' : 'tonhub.com') === url.host.toLowerCase();

            // Transfer
            if (isSupportedDomain && url.pathname.toLowerCase().startsWith('/transfer/')) {
                return resolveTransferUrl(url);
            } else if (isSupportedDomain && url.pathname.toLowerCase().startsWith('/connect/')) { // Ton-x app connect
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
            } else if (isSupportedDomain && url.pathname.toLowerCase().indexOf('/ton-connect') !== -1) { // Tonconnect connect query
                if (!!url.query.r && !!url.query.v && !!url.query.id) {
                    return {
                        type: 'tonconnect',
                        query: url.query as unknown as ConnectQrQuery
                    };
                } else if (!!url.query.ret) { // store tonconnect return strategy to be used in transfer requests
                    setLastReturnStrategy(url.query.ret);
                }
            } else if (isTonhubHost && url.pathname.toLowerCase().startsWith('/app/')) { // Ton-x app install
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
            } else if (isTonhubHost && url.pathname.toLowerCase() === '/inapp') { // open url with in-app browser
                if (url.query && url.query.url) {
                    return {
                        type: 'in-app-url',
                        url: decodeURIComponent(url.query.url)
                    };
                }
            } else if (isTonhubHost && url.pathname.toLowerCase() === '/external') { // open url with external browser
                if (url.query && url.query.url) {
                    return {
                        type: 'external-url',
                        url: decodeURIComponent(url.query.url)
                    };
                }
            } else if (isSupportedDomain && url.pathname.toLowerCase().startsWith('/holders')) { // holders path with address
                return resolveHoldersUrl(url);
            }
        }

        // Tonconnect
        if (url.protocol.toLowerCase() === 'tc:') {
            if (
                url.host === 'sendtransaction'
                && !!url.query.message
                && !!url.query.from
                && !!url.query.validUntil
                && !!url.query.to
            ) {
                const validUntil = parseInt(decodeURIComponent(url.query.validUntil));
                const from = decodeURIComponent(url.query.from);
                const to = decodeURIComponent(url.query.to);
                const message = decodeURIComponent(url.query.message);
                return {
                    type: 'tonconnect-request',
                    query: { validUntil, from, to, message }
                };
            } else if (!!url.query.r && !!url.query.v && !!url.query.id) {
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

export function normalizeUrl(url: string) {
    if (!url) {
        return null;
    }

    let trimmedURL = url.trim();

    // check if scheme is present
    if (trimmedURL.startsWith('//')) {
        trimmedURL = `https:${trimmedURL}`;
    } else if (!trimmedURL.includes('://')) {
        trimmedURL = `https://${trimmedURL}`;
    }

    // normalize domain and scheme
    let normalizedURL = '';
    try {
        let parsedUrl = new URL(trimmedURL);
        let scheme = parsedUrl.protocol.toLowerCase();
        let host = parsedUrl.host.toLowerCase(); // with port
        let pathname = parsedUrl.pathname;
        let search = parsedUrl.search;
        let hash = parsedUrl.hash;
        normalizedURL = `${scheme}//${host}${pathname}${search}${hash}`;
    } catch (error) {
        console.warn('Failed to normalize URL', error);
    }

    if (!isUrl(normalizedURL)) {
        return null;
    }

    return normalizedURL;
}