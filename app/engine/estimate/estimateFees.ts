import { BN } from "bn.js";
import { Cell, computeExternalMessageFees, computeGasPrices, computeMessageForwardFees, computeStorageFees } from "ton";
import { ConfigState } from "../sync/startConfigSync";

export function estimateV4Fees(config: ConfigState, inMsg: Cell, outMsgs: Cell[], storageStats: ({
    lastPaid: number;
    duePayment: string | null;
    used: {
        bits: number;
        cells: number;
        publicCells: number;
    }
} | null)[]) {

    // Storage fees
    let storageFees = new BN(0);
    for (let storageStat of storageStats) {
        if (storageStat) {
            const computed = computeStorageFees({
                lastPaid: storageStat.lastPaid,
                masterchain: false,
                now: Math.floor(Date.now() / 1000),
                special: false,
                storagePrices: config.storage,
                storageStat: {
                    bits: storageStat.used.bits,
                    cells: storageStat.used.cells,
                    publicCells: storageStat.used.publicCells
                }
            });
            storageFees = storageFees.add(computed);
        }
    }

    // Calculate import fees
    let importFees = computeExternalMessageFees(config.workchain.message as any, inMsg);

    // Any transaction use this amount of gas
    const gasUsed = 3308;
    let gasFees = computeGasPrices(new BN(gasUsed), { flatLimit: config.workchain.gas.flatLimit, flatPrice: config.workchain.gas.flatGasPrice, price: config.workchain.gas.price });


    // Total
    let total = new BN(0);
    total = total.add(storageFees);
    total = total.add(importFees);
    total = total.add(gasFees);

    // Forward fees
    for (let outMsg of outMsgs) {
        let fwdFees = computeMessageForwardFees(config.workchain.message as any, outMsg);
        total = total.add(fwdFees.fees);
    }
    return total;
}

export function estimateFees(config: ConfigState, inMsg: Cell, outMsg: Cell, storageStat: {
    lastPaid: number;
    duePayment: string | null;
    used: {
        bits: number;
        cells: number;
        publicCells: number;
    }
} | null) {

    // Storage fees
    let storageFees = storageStat ? computeStorageFees({
        lastPaid: storageStat.lastPaid,
        masterchain: false,
        now: Math.floor(Date.now() / 1000),
        special: false,
        storagePrices: config.storage,
        storageStat: {
            bits: storageStat.used.bits,
            cells: storageStat.used.cells,
            publicCells: storageStat.used.publicCells
        }
    }) : new BN(0);

    // Calculate import fees
    let importFees = computeExternalMessageFees(config.workchain.message as any, inMsg);

    // Any transaction use this amount of gas
    const gasUsed = 3308;
    let gasFees = computeGasPrices(new BN(gasUsed), { flatLimit: config.workchain.gas.flatLimit, flatPrice: config.workchain.gas.flatGasPrice, price: config.workchain.gas.price });

    // Forward fees
    let fwdFees = computeMessageForwardFees(config.workchain.message as any, outMsg);

    // Total
    let total = new BN(0);
    total = total.add(storageFees);
    total = total.add(importFees);
    total = total.add(gasFees);
    total = total.add(fwdFees.fees);
    return total;
}