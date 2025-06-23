import { Address, Cell, toNano } from "@ton/core";
import Url from 'url-parse';
import { ResolvedUrl, ResolveUrlError } from "./types";

export function resolveTransferUrl(url: Url<Record<string, string | undefined>>): ResolvedUrl {
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

    let target: { type: 'address', address: Address } | { type: 'domain', domain: string };
    let isBounceable = true;
    try {
        const addr = Address.parseFriendly(rawAddress);
        target = { type: 'address', address: addr.address };
        isBounceable = addr.isBounceable;
    } catch {
        // check DNS .ton domain
        const isTonDomain = rawAddress.endsWith('.ton');
        if (isTonDomain) {
            target = { type: 'domain', domain: rawAddress };
        } else {
            try {
                target = { type: 'address', address: Address.parse(rawAddress) };
            } catch (error) {
                return { type: 'error', error: ResolveUrlError.InvalidAddress };
            }
        }
    }

    let comment: string | null = null;
    let amount: bigint | null = null;
    let payload: Cell | null = null;
    let stateInit: Cell | null = null;
    let jettonMaster: Address | null = null;
    let feeAmount: bigint | null = null;
    let forwardAmount: bigint | null = null;
    let expiresAt: number | undefined;

    if (url.query) {
        const keys = Object.keys(url.query);
        for (let key in url.query) {
            if (key.toLowerCase() === 'text') {
                comment = url.query[key]!;
            }
            if (key.toLowerCase() === 'amount') {
                try {
                    if (keys.find((p) => p.toLowerCase() === 'jetton') !== undefined) {
                        // if the amount is float number (which is incorrect), we set it to 0n to avoid crashes
                        amount = url.query[key]!.includes('.') ? 0n : toNano(url.query[key]!.replace(',', '.').replaceAll(' ', ''));

                    } else {
                        // if the amount is float number (which is incorrect), we set it to 0n to avoid crashes
                        amount = url.query[key]!.includes('.') ? 0n : BigInt(url.query[key]!);
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
            if (key.toLowerCase() === 'exp') {
                try {
                    expiresAt = parseInt(url.query[key]!);
                } catch {
                    return { type: 'error', error: ResolveUrlError.InvalidExpiresAt };
                }
            }
        }
    }

    if (target.type === 'domain') {

        if (jettonMaster) {
            if (!!feeAmount && !!forwardAmount && feeAmount < forwardAmount) {
                return { type: 'error', error: ResolveUrlError.InvalidJettonAmounts };
            }

            return {
                type: 'domain-jetton-transfer',
                domain: target.domain,
                jettonMaster,
                comment,
                amount,
                payload,
                feeAmount,
                forwardAmount,
                expiresAt
            }
        }

        return {
            type: 'domain-transfer',
            domain: target.domain,
            comment,
            amount,
            payload,
            stateInit,
            expiresAt
        }
    }

    if (jettonMaster) {
        if (!!feeAmount && !!forwardAmount && feeAmount < forwardAmount) {
            return { type: 'error', error: ResolveUrlError.InvalidJettonAmounts };
        }

        return {
            type: 'jetton-transaction',
            address: target.address,
            isBounceable,
            jettonMaster,
            comment,
            amount,
            payload,
            feeAmount,
            forwardAmount,
            expiresAt
        }
    }

    return {
        type: 'transaction',
        address: target.address,
        isBounceable,
        comment,
        amount,
        payload,
        stateInit,
        expiresAt
    }
}