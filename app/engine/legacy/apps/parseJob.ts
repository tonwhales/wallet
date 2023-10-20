import { Cell, safeSignVerify, Slice } from "@ton/core";
import { Job } from "./Job";

function parseString(slice: Slice) {
    let res = slice.loadBuffer(Math.floor(slice.remainingBits / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.loadRef().asSlice();
        res += rr.loadBuffer(Math.floor(rr.remainingBits / 8)).toString();
    }
    return res;
}

export function parseJob(src: Slice): { expires: number, key: Buffer, appPublicKey: Buffer, job: Job } | null {
    // Extract public key and signature
    let signature = src.loadBuffer(64);
    let key = src.loadBuffer(32);
    let data = src.loadRef();

    if (!safeSignVerify(data, signature, key)) {
        return null;
    }

    // Parse basic info
    let sc = data.beginParse();
    let appPublicKey = sc.loadBuffer(32);
    let expires = sc.loadUint(32) * 1000;
    let kind = Number(sc.loadCoins());

    // Simple Transfer
    if (kind === 0) {
        let ds = sc.loadRef().asSlice();

        // Read destination
        let dest = ds.loadMaybeAddress();
        if (!dest) {
            return null;
        }

        // Amount
        let amount = ds.loadCoins();

        // Text
        let text: string = parseString(ds.loadRef().asSlice());

        // Payload
        let payload: Cell | null = null;
        if (ds.loadBit()) {
            payload = ds.loadRef();
        }

        // StateInit
        let stateInit: Cell | null = null;
        if (ds.loadBit()) {
            stateInit = ds.loadRef();
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
        let ds = sc.loadRef();
        
        // Text
        let textCell = ds.asSlice().loadRef();
        let text: string = parseString(textCell.beginParse());
        
        // Payload
        let payloadCell: Cell = ds;

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