import BN from "bn.js";
import { Address, Cell } from "ton";
import Url from 'url-parse';

export function resolveUrl(src: string): {
    address: Address,
    comment: string | null,
    amount: BN | null,
    payload: Cell | null,
    stateInit: Cell | null,
} | null {

    // Try address parsing
    try {
        let res = Address.parseFriendly(src);
        return {
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
        if (url.protocol.toLowerCase() === 'ton:' && url.host.toLowerCase() === 'transfer' && url.pathname.startsWith('/')) {
            let address = Address.parseFriendly(url.pathname.slice(1)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
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
                }
            }
            return {
                address,
                comment,
                amount,
                payload,
                stateInit
            }
        }

        // HTTP(s) url
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (url.host.toLowerCase() === 'tonhub.com' || url.host.toLowerCase() === 'www.tonhub.com')
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            let payload: Cell | null = null;
            let stateInit: Cell | null = null;
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
                }
            }
            return {
                address,
                comment,
                amount,
                payload,
                stateInit
            }
        }

    } catch (e) {
        // Ignore
    }

    return null;
}