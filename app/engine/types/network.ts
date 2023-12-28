import { StoragePrices } from '@ton/ton';

export type ConfigState = {
    storage: StoragePrices[],
    masterchain: {
        gas: {
            flatLimit: bigint,
            flatGasPrice: bigint,
            price: bigint
        },
        message: {
            lumpPrice: bigint;
            bitPrice: bigint;
            cellPrice: bigint;
            firstFrac: number;
        }
    },
    rootDnsAddress: string,
    workchain: {
        gas: {
            flatLimit: bigint,
            flatGasPrice: bigint,
            price: bigint
        },
        message: {
            lumpPrice: bigint;
            bitPrice: bigint;
            cellPrice: bigint;
            firstFrac: number;
        }
    }
};