import BN from "bn.js";
import { AppState } from "react-native";
import { Cell, configParse18, configParseGasLimitsPrices, configParseMsgPrices, parseDictRefs } from "ton";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export type ConfigState = {
    storage: {
        utime_since: BN;
        bit_price_ps: BN;
        cell_price_ps: BN;
        mc_bit_price_ps: BN;
        mc_cell_price_ps: BN;
    }[],
    masterchain: {
        gas: {
            flatLimit: BN,
            flatGasPrice: BN,
            price: BN
        },
        message: {
            lumpPrice: BN;
            bitPrice: BN;
            cellPrice: BN;
            firstFrac: BN;
        }
    },
    workchain: {
        gas: {
            flatLimit: BN,
            flatGasPrice: BN,
            price: BN
        },
        message: {
            lumpPrice: BN;
            bitPrice: BN;
            cellPrice: BN;
            firstFrac: BN;
        }
    }
};

export function startConfigSync(engine: Engine) {

    // Sync
    let sync = createEngineSync('config', engine, async () => {
        let block = await engine.client4.getLastBlock();
        let configRaw = await engine.client4.getConfig(block.last.seqno);
        let config = parseDictRefs(Cell.fromBoc(Buffer.from(configRaw.config.cell, 'base64'))[0].beginParse(), 32);

        // Config values
        const storagePrices = configParse18(config.get('18'));
        let gasPrices = {
            masterchain: configParseGasLimitsPrices(config.get('20')),
            workchain: configParseGasLimitsPrices(config.get('21')),
        };
        let msgPrices = {
            masterchain: configParseMsgPrices(config.get('24')),
            workchain: configParseMsgPrices(config.get('25')),
        };

        let newState: ConfigState = {
            storage: storagePrices,
            workchain: {
                gas: {
                    flatLimit: gasPrices.workchain.flatLimit,
                    flatGasPrice: gasPrices.workchain.flatGasPrice,
                    price: gasPrices.workchain.other.gasPrice
                },
                message: {
                    lumpPrice: msgPrices.workchain.lumpPrice,
                    bitPrice: msgPrices.workchain.bitPrice,
                    cellPrice: msgPrices.workchain.cellPrice,
                    firstFrac: msgPrices.workchain.firstFrac,
                }
            },
            masterchain: {
                gas: {
                    flatLimit: gasPrices.masterchain.flatLimit,
                    flatGasPrice: gasPrices.masterchain.flatGasPrice,
                    price: gasPrices.masterchain.other.gasPrice
                },
                message: {
                    lumpPrice: msgPrices.masterchain.lumpPrice,
                    bitPrice: msgPrices.masterchain.bitPrice,
                    cellPrice: msgPrices.masterchain.cellPrice,
                    firstFrac: msgPrices.masterchain.firstFrac,
                }
            }
        };
        engine.persistence.config.item().update(() => newState);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}