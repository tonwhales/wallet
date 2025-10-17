import { Address, Cell } from "@ton/core";
import Url from 'url-parse';
import { warn } from "../log";
import { SupportedDomains } from "../SupportedDomains";
import isValid from 'is-valid-domain';
import { parseURL } from "@solana/pay";
import { ConnectQrQuery, setLastReturnStrategy } from "../../engine/tonconnect";
import { resolveTransferUrl } from "./resolveTransferUrl";
import { ResolvedUrl, ResolveUrlError } from "./types";


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
        const path = decodeURIComponent(url.query.path);
        delete url.query.path;

        return {
            type: 'holders-path',
            path,
            query: url.query
        }
    }

    const isInvite = url.pathname.startsWith('/holders/invite');
    const inviteId = url.pathname.split('holders/invite/')[1]

    if (isInvite && inviteId) {
        return {
            type: 'holders-invite',
            inviteId: inviteId,
        }
    }

    const isInvitation = url.pathname.startsWith('/holders/i');
    const invitationId = url.pathname.split('holders/i')[1]

    if (isInvitation && invitationId) {
        return {
            type: 'holders-invitation',
            invitationId: invitationId
        }
    }

    return { type: 'error', error: ResolveUrlError.InvalidHoldersPath };
}

export function resolveSolanaTransferUrl(url: string): ResolvedUrl {
    const parsed = parseURL(url);
    if (!parsed) {
        return { type: 'error', error: ResolveUrlError.InvalidSolanaTransferUrl };
    }

    return {
        type: 'solana-transfer',
        request: parsed
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
            stateInit: null,
            isBounceable: res.isBounceable
        };
    } catch (e) {
        // Ignore
    }

    // Parse url
    try {
        const url = new Url(src, true);

        if (url.protocol.toLowerCase() === 'solana:') {
            return resolveSolanaTransferUrl(src);
        }

        const isTonUrl = url.protocol.toLowerCase() === 'ton:' || url.protocol.toLowerCase() === 'ton-test:';
        const isHttpUrl = url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:';
        const isTonhubUrl = url.protocol.toLowerCase() === 'tonhub:' || url.protocol.toLowerCase() === 'tonhub-test:';

        if (isTonhubUrl && url.host.toLowerCase() === 'holders') {
            return resolveHoldersUrl(url);
        }

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
            } else if (isTonhubHost && url.pathname.toLowerCase().startsWith('/changelly/transaction')) { // open changelly transaction
                const transactionId = url.pathname.slice('/changelly/transaction/'.length)
                
                if (url.query && url.query.address && transactionId) {
                    return {
                        type: 'changelly-transaction',
                        transactionId,
                        address: url.query.address
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
        warn(`resolveUrl error: ${e}`);
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