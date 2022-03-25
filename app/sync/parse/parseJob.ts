import { Cell, Slice } from "ton";
import { signVerify } from "ton-crypto";
import { Job } from "./Job";

function parseString(slice: Slice) {
    let res = slice.readBuffer(Math.floor(slice.remaining / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.readRef();
        res += rr.readBuffer(Math.floor(rr.remaining / 8)).toString();
    }
    return res;
}

export function parseJob(src: Slice): { expires: number, key: Buffer, appPublicKey: Buffer, job: Job } | null {

    // Extract public key and signature
    let signature = src.readBuffer(64);
    let key = src.readBuffer(32);
    let data = src.readCell();
    let hash = data.hash();
    if (!signVerify(hash, signature, key)) {
        return null;
    }

    // Parse basic info
    let sc = data.beginParse();
    let appPublicKey = sc.readBuffer(32);
    let expires = sc.readUintNumber(32) * 1000;
    let kind = sc.readCoins().toNumber();

    // Simple Transfer
    if (kind === 0) {
        let ds = sc.readRef();

        // Read destination
        let dest = ds.readAddress();
        if (!dest) {
            return null;
        }

        // Amount
        let amount = ds.readCoins();

        // Text
        let text: string = parseString(ds.readRef());

        // Payload
        let payload: Cell = ds.readCell();

        // Payload hint
        let payloadHint: string | null = null;
        if (ds.readBit()) {
            payloadHint = parseString(ds.readRef());
        }

        // Loaded result
        return {
            expires,
            key,
            appPublicKey,
            job: {
                type: 'transaction',
                target: dest,
                amount,
                text,
                payload,
                payloadHint
            }
        };
    }

    // Sign
    if (kind === 1) {
        let ds = sc.readRef();

        // Text
        let text: string = parseString(ds.readRef());

        // Payload
        let payload: Cell = ds.readCell();

        // Payload hint
        let payloadHint: string | null = null;
        if (ds.readBit()) {
            payloadHint = parseString(ds.readRef());
        }

        // Loaded result
        return {
            expires,
            key,
            appPublicKey,
            job: {
                type: 'sign',
                text,
                payload,
                payloadHint
            }
        };
    }

    return null;
}