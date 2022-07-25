import * as React from 'react';
import * as t from 'io-ts';
import { InjectEngine } from './InjectEngine';
import { AppConfig } from '../../../../AppConfig';
import * as c from '../../../../engine/utils/codecs';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { Cell, Slice } from 'ton';

const transCodec = t.type({
    network: t.union([t.literal('sandbox'), t.literal('mainnet')]),
    to: c.address,
    value: c.bignum,
    stateInit: t.union([c.cell, t.null, t.undefined]),
    text: t.union([t.string, t.null, t.undefined]),
    payload: t.union([c.cell, t.null, t.undefined])
});

const transactionResponse = t.type({
    state: t.union([t.literal('sent'), t.literal('rejected')]),
    result: t.union([c.cell, t.null])
});

const signCodec = t.type({
    network: t.union([t.literal('sandbox'), t.literal('mainnet')]),
    textCell: c.cell,
    payloadCell: c.cell
});

const signResponseCodec = t.type({
    state: t.union([t.literal('sent'), t.literal('rejected')]),
    result: t.union([c.cell, t.null])
});

function parseString(slice: Slice) {
    let res = slice.readBuffer(Math.floor(slice.remaining / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.readRef();
        res += rr.readBuffer(Math.floor(rr.remaining / 8)).toString();
    }
    return res;
}

export function useInjectEngine(name: string) {
    const navigation = useTypedNavigation();
    return React.useMemo(() => {
        const inj = new InjectEngine();
        inj.registerMethod('tx', transCodec, transactionResponse, async (src) => {

            // Check network
            if (AppConfig.isTestnet && src.network !== 'sandbox') {
                throw Error('Invalid network');
            }
            if (!AppConfig.isTestnet && src.network !== 'mainnet') {
                throw Error('Invalid network');
            }

            // Callback
            let callback: (ok: boolean, res: Cell | null) => void;
            let future = new Promise<{ state: 'sent' | 'rejected', result: Cell | null }>((resolve) => {
                callback = (ok, res) => {
                    resolve({ state: ok ? 'sent' : 'rejected', result: res });
                };
            });

            // Navigation
            if (src.payload) {
                navigation.navigateTransfer({
                    order: {
                        target: src.to.toFriendly({ testOnly: AppConfig.isTestnet }),
                        amount: src.value,
                        amountAll: false,
                        payload: src.payload,
                        stateInit: src.stateInit ? src.stateInit : null,
                    },
                    text: src.text ? src.text : null,
                    job: null,
                    callback: callback!,
                    back: 1
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: src.to.toFriendly({ testOnly: AppConfig.isTestnet }),
                    amount: src.value,
                    stateInit: src.stateInit ? src.stateInit : null,
                    comment: src.text ? src.text : null,
                    job: null,
                    jetton: null,
                    callback: callback!,
                    back: 1
                });
            }

            return await future;
        });
        inj.registerMethod('sign', signCodec, signResponseCodec, async (src) => {

            // Check network
            if (AppConfig.isTestnet && src.network !== 'sandbox') {
                throw Error('Invalid network');
            }
            if (!AppConfig.isTestnet && src.network !== 'mainnet') {
                throw Error('Invalid network');
            }

            // Callback
            let callback: (ok: boolean, res: Cell | null) => void;
            let future = new Promise<{ state: 'sent' | 'rejected', result: Cell | null }>((resolve) => {
                callback = (ok, res) => {
                    resolve({ state: ok ? 'sent' : 'rejected', result: res });
                };
            });

            // Navigation
            navigation.navigateSign({
                textCell: src.textCell,
                payloadCell: src.payloadCell,
                text: parseString(src.textCell.beginParse()),
                job: null,
                callback: callback!,
                name
            });

            return await future;
        });
        return inj;
    }, []);
}