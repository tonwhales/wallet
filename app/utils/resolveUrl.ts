import BN from "bn.js";
import { Address } from "ton";
import Url from 'url-parse';

export function resolveUrl(src: string): {
    address: Address,
    comment: string | null,
    amount: BN | null
} | null {

    // Try address parsing
    try {
        let res = Address.parseFriendly(src);
        return {
            address: res.address,
            comment: null,
            amount: null
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
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = new BN(url.query[key]!, 10);
                    }
                }
            }
            return {
                address,
                comment,
                amount
            }
        }

        // HTTP(s) url
        if ((url.protocol.toLowerCase() === 'http:' || url.protocol.toLowerCase() === 'https:')
            && (url.host.toLowerCase() === 'tonhub.com' || url.host.toLowerCase() === 'www.tonhub.com')
            && (url.pathname.toLowerCase().startsWith('/transfer/'))) {
            let address = Address.parseFriendly(url.pathname.slice('/transfer/'.length)).address;
            let comment: string | null = null;
            let amount: BN | null = null;
            if (url.query) {
                for (let key in url.query) {
                    if (key.toLowerCase() === 'text') {
                        comment = url.query[key]!;
                    }
                    if (key.toLowerCase() === 'amount') {
                        amount = new BN(url.query[key]!, 10);
                    }
                }
            }
            return {
                address,
                comment,
                amount
            }
        }

    } catch (e) {
        // Ignore
    }

    return null;
}