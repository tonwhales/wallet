import { BN } from "bn.js";
import { Cell, computeExternalMessageFees, computeGasPrices, computeMessageForwardFees, computeStorageFees, fromNano } from "ton";
import { ConfigState } from "../sync/startConfigSync";

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
    // console.log('storage_fees: ' + fromNano(storageFees));

    // Calculate import fees
    let importFees = computeExternalMessageFees(config.workchain.message as any, inMsg);
    // console.log('import_fees: ' + fromNano(importFees));

    // Any transaction use this amount of gas
    const gasUsed = 3308;
    let gasFees = computeGasPrices(new BN(gasUsed), { flatLimit: config.workchain.gas.flatLimit, flatPrice: config.workchain.gas.flatGasPrice, price: config.workchain.gas.price });
    // console.log('gas_fees: ' + fromNano(gasFees));

    // Forward fees
    let fwdFees = computeMessageForwardFees(config.workchain.message as any, outMsg);
    // console.log('fwd_fees: ' + fromNano(fwdFees.fees.add(fwdFees.remaining)));

    // Total
    let total = new BN(0);
    total = total.add(storageFees);
    total = total.add(importFees);
    total = total.add(gasFees);
    total = total.add(fwdFees.fees);
    return total;
}