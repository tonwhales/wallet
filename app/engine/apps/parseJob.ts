import { Cell, safeSignVerify, Slice } from "ton";
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
    if (!safeSignVerify(data, signature, key)) {
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
        let payload: Cell | null = null;
        if (ds.readBit()) {
            payload = ds.readCell();
        }

        // StateInit
        let stateInit: Cell | null = null;
        if (ds.readBit()) {
            stateInit = ds.readCell();
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
                stateInit
            }
        };
    }

    // Sign
    if (kind === 1) {
        let ds = sc.readRef();

        // Text
        let textCell = ds.readCell();
        let text: string = parseString(textCell.beginParse());

        // Payload
        let payloadCell: Cell = ds.readCell();

        // Loaded result
        return {
            expires,
            key,
            appPublicKey,
            job: {
                type: 'sign',
                text,
                textCell,
                payloadCell
            }
        };
    }

    return null;
}