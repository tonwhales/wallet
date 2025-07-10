import { Cell } from "@ton/core";
import { computeExternalMessageFees, computeGasPrices, computeMessageForwardFees, computeStorageFees } from "@ton/ton";
import { ConfigState } from '../engine/types';

function convertToJSONstringifyable(data: any) {
    if (typeof data === 'bigint') {
        return data.toString();
    } else if (typeof data === 'object') {
        let result: any = {};
        for (let key in data) {
            result[key] = convertToJSONstringifyable(data[key]);
        }
        return result;
    } else {
        return data;
    }
}

const gasUsageByOutMsgs: { [key: number]: number } = {
    1: 3308,
    2: 3950,
    3: 4592,
    4: 5234
}

export function estimateFees(
    config: ConfigState,
    inMsg: Cell,
    outMsgs: Cell[],
    storageStats: ({
        lastPaid: number;
        duePayment: string | null;
        used: {
            bits: number;
            cells: number;
            publicCells?: number;
        }
    } | null)[]
) {
    let parsable = convertToJSONstringifyable(config);
    parsable = convertToJSONstringifyable(storageStats);

    // Storage fees
    let storageFees = BigInt(0);
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
                    publicCells: storageStat.used.publicCells ?? 0
                }
            });
            storageFees = storageFees + computed;
        }
    }

    // Calculate import fees
    let importFees = computeExternalMessageFees(config.workchain.message as any, inMsg);

    // Any transaction use this amount of gas
    const gasUsed = gasUsageByOutMsgs[outMsgs.length] ?? 0;
    let gasFees = computeGasPrices(BigInt(gasUsed), { flatLimit: config.workchain.gas.flatLimit, flatPrice: config.workchain.gas.flatGasPrice, price: config.workchain.gas.price });

    // Total
    let total = BigInt(0);
    total += storageFees;
    total += importFees;
    total += gasFees;

    // Forward fees
    for (let outMsg of outMsgs) {
        let fwdFees = computeMessageForwardFees(config.workchain.message as any, outMsg);
        total += fwdFees.fees;
    }
    return total;
}